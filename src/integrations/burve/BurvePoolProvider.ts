import { Decimal } from 'decimal.js';
import {
    type Address,
    type WatchContractEventOnLogsParameter,
    erc4626Abi
} from "viem";
import { BasePoolStateProvider } from "../../base/BasePoolProvider";
import { AddressMap } from "../../helpers/AddressMap";
import { iBurveMultiEventsAbi } from "./abi/iBurveMultiEventsAbi";
import { iBurveMultiSwapAbi } from "./abi/iBurveMultiSwapAbi";
import { mixedAdjustorEventsAbi } from './abi/mixedAdjustorEventsAbi';
import { AdjustorAPI } from './api/Adjustor';
import { ERC20API } from './api/ERC20';
import { ERC4626API } from './api/ERC4626';
import { CreateMultiPool, GetContracts } from './api/GetContracts';
import { MultiPoolAPI } from './api/MultiPool';
import { Closure, type ClosureMetadata } from "./types/Closure";
import { MultiPool } from "./types/MultiPool";
import { OffchainAdjustor } from './types/OffchainAdjustor';
import { MAX_TOKENS, type Token } from "./types/Token";
import { X128 } from './utils';

export class BurvePoolProvider extends BasePoolStateProvider<Closure> {
    readonly abi = [...iBurveMultiEventsAbi, ...erc4626Abi, ...mixedAdjustorEventsAbi];
    readonly multiPools = new AddressMap<MultiPool>();

    async getAllPools(): Promise<Closure[]> {
        // Get multi pool addresses
        const multiPoolAddresses: Address[] = await GetContracts();

        // Fetch data and create multi pools
        const multiPoolApis: MultiPoolAPI[] = multiPoolAddresses.map((poolAddress: Address) => new MultiPoolAPI(poolAddress, this.client));
        const multiPools: MultiPool[] = await Promise.all(multiPoolApis.map(async (multiPoolApi: MultiPoolAPI) => {
            return await CreateMultiPool(multiPoolApi);
        }));

        // Cache multi pools
        for (const multiPool of multiPools) {
            this.multiPools.set(multiPool.address, multiPool);
        }

        // Fetch data and create closures
        const closures: Closure[] = (await Promise.all(multiPools.map(async (multiPool: MultiPool, idx: number) => {
            const closuresMetadata: ClosureMetadata[] = await multiPoolApis[idx]!.getClosures(multiPool.tokens.length);
            return closuresMetadata.map((closureMetadata: ClosureMetadata) => {
                return new Closure({ pool: multiPool, ...closureMetadata });
            });
        }))).flat();

        // Init offchain adjustors
        await this._updateOffchainAdjustors();

        // Refresh offchain adjustors every 15 minutes
        setInterval(async () => {
                await this._updateOffchainAdjustors();
        }, 15 * 60 * 1000);

        return closures;
    }

    // @param tokenIn: Address of token to swap in
    // @param tokenOut: Address of token to swap out
    // @param amountSpecified: Exact in when positive, exact out when negative. In real terms.
    // @param amountLimit: Minimum amount out when exact in, maximum amount in when exact out. No limit enforced when 0. In real terms.
    async swap_(
        closure: Closure,
        recipient: Address,
        tokenIn: Address,
        tokenOut: Address,
        amountSpecified: bigint,
        amountLimit: bigint
    ): Promise<void> {
        await this.client.simulateContract({
            address: closure.pool.address,
            abi: iBurveMultiSwapAbi,
            functionName: "swap",
            args: [recipient, tokenIn, tokenOut, amountSpecified, amountLimit, closure.cid],
        });
    }

    async handleEvent(
        log: WatchContractEventOnLogsParameter<typeof this.abi>[number],
    ): Promise<void> {
        // Burve events
        const multiPool: MultiPool | undefined = this.multiPools.get(log.address)
        if (multiPool) {
            await this._handleMultiPoolEvent(multiPool, log)
            return;
        }

        const allMultiPools: MultiPool[] = Array.from(this.multiPools.values());

        // ERC4626 events
        for (const vaultMultiPool of allMultiPools) {
            const vaultIdx: number = vaultMultiPool.getVaultIdx(log.address)

            // Multi pool does not use this vault
            if (vaultIdx === -1) {
                continue;
            }

            // Refresh vault max withdraw limit when there is a balance change
            if (log.eventName === "Deposit" || log.eventName === "Withdraw") {
                const erc4626Api: ERC4626API = new ERC4626API(log.address, this.client);
                const maxWithdraw: bigint = await erc4626Api.getMaxWithdraw(vaultMultiPool.address);
                vaultMultiPool.vaults[vaultIdx]!.maxWithdraw = maxWithdraw;
            }
        }

        // Mixed Adjustor events
        const adjustorMultiPool: MultiPool | undefined = allMultiPools.find((mp: MultiPool) => mp.adjustorAddress.toLowerCase() === log.address.toLowerCase())
        if (adjustorMultiPool) {
            // Note: for simplicity refresh all tokens on AdjustorChanged to avoid token validation
            if (log.eventName === "AdjustorChanged" || log.eventName === "DefaultAdjustorChanged") {
                await this._updateOffchainAdjustor(adjustorMultiPool);
            }
        }
    }

    async _handleMultiPoolEvent(multiPool: MultiPool, log: WatchContractEventOnLogsParameter<typeof this.abi>[number]): Promise<void> {
        const multiPoolApi: MultiPoolAPI = new MultiPoolAPI(multiPool.address, this.client);

        if (log.eventName === "VertexAdded") {
            const { token: tokenAddress } = log.args as { token: Address };

            const erc20Api: ERC20API = new ERC20API(tokenAddress, this.client);

            // fetch token decimals and refresh edge fees
            // we don't update es because that is fetched with a set default given the MAX_TOKENS size
            const [decimals, edgeFees] = await Promise.all([
                erc20Api.getDecimals(),
                multiPoolApi.getEdgeFees(multiPool.tokens.length + 1)
            ]);

            const token: Token = {
                address: tokenAddress,
                decimals: decimals
            }

            const adjustor: AdjustorAPI = new AdjustorAPI(multiPool.adjustorAddress, this.client);
            const realPerNominalRatio: Decimal = await adjustor.realPerNominalRatio(token);

            // update multi pool
            multiPool.tokens.push(token)
            multiPool.taxes = edgeFees;
            multiPool.offchainAdjustor.registerToken(token.address, realPerNominalRatio);
        }

        if (log.eventName === "NewClosureBalances") {
            const { cid, targetX128, balances } = log.args as { cid: number; targetX128: bigint; balances: readonly bigint[] };

            const key: Address = `${log.address}-${cid}`

            let closure: Closure | undefined = this.pools.get(key);

            // happens when a closure is added
            if (!closure) {
                // balance and target are set below
                closure = new Closure({ pool: multiPool, cid, balances: [], target: new Decimal(0) });
                this.pools.set(key, closure)
            }

            closure.target = new Decimal(targetX128.toString()).div(new Decimal(2).toPower(128));
            closure.balances = balances.map((amount) => new Decimal(amount.toString())) as Decimal[] & {
                length: typeof MAX_TOKENS;
            };
        }

        if (log.eventName === "EdgeFeeSet") {
            const { i, j, edgeFeeX128 } = log.args as { i: number; j: number; edgeFeeX128: bigint };
            multiPool.taxes[i]![j] = new Decimal(edgeFeeX128.toString()).div(X128).toNumber();
        }

        // Edge fees default to the fee value set on the simplex unless that edge is explicilty set.
        // There's no way of knowing which edge fees are explicitly set vs which are from the default.
        // Which is why all edge fees are being refreshed.
        if (log.eventName === "SimplexFeesSet") {
            multiPool.taxes = await multiPoolApi.getEdgeFees(multiPool.tokens.length);
        }

        if (log.eventName === "EfficiencyFactorChanged") {
            const { token, toEsX128 } = log.args as { token: Address; toEsX128: bigint };
            const idx: number = multiPool.getTokenIdx(token);
            if (idx === -1) {
                // should not be possible
                return;
            }

            multiPool.es[idx] = new Decimal(toEsX128.toString()).div(X128);
        }

        if (log.eventName === "AdjustorChanged") {
            const { toAdjustor } = log.args as { toAdjustor: Address };
            multiPool.adjustorAddress = toAdjustor;
            multiPool.offchainAdjustor = new OffchainAdjustor();
            await this._updateOffchainAdjustor(multiPool);
        }
    }

    /// Updates token ratios in each pool's offchain adjustor
    async _updateOffchainAdjustors(): Promise<void> {
        await Promise.all(this.multiPools.values().map(async (multiPool: MultiPool) => {
            await this._updateOffchainAdjustor(multiPool);
        }));
    }

    // Updates token ratios in a single pool's offchain adjustor
    async _updateOffchainAdjustor(multiPool: MultiPool): Promise<void> {
        const adjustor: AdjustorAPI = new AdjustorAPI(multiPool.adjustorAddress, this.client);
        await Promise.all(multiPool.tokens.map(async (token) => {
            const realPerNominalRatio: Decimal = await adjustor.realPerNominalRatio(token);
            multiPool.offchainAdjustor.registerToken(token.address, realPerNominalRatio);
        }));
    }

    // NOT IMPLEMENTED - interface methods inherited from BasePoolStateProvider are not compatible with Burve.
    // As each pool contains multiple tokens.

    async swap(pool: Closure, amountIn: bigint, zeroToOne: boolean): Promise<void> {
        throw new Error("Not Implemented");
    }

}
