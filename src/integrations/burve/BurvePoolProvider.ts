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
import { ERC20API } from './api/ERC20';
import { ERC4626API } from './api/ERC4626';
import { CreateMultiPool, GetContracts } from './api/GetContracts';
import { MultiPoolAPI } from './api/MultiPool';
import { DecimalAdjustor } from "./types/adjustor/DecimalAdjustor";
import { Closure, type ClosureMetadata } from "./types/Closure";
import { MultiPool } from "./types/MultiPool";
import { MAX_TOKENS } from "./types/Token";
import { X128 } from './utils';

export class BurvePoolProvider extends BasePoolStateProvider<Closure> {
    readonly abi = [...iBurveMultiEventsAbi, ...erc4626Abi];
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
        const address: Address = log.address

        // Burve events
        const multiPool: MultiPool | undefined = this.multiPools.get(address)
        if (multiPool) {
            await this._handleMultiPoolEvent(multiPool, log)
            return;
        }

        // ERC4626 events
        for (const multiPool of this.multiPools.values()) {
            const vaultIdx: number = multiPool.getVaultIdx(log.address)
            if (vaultIdx === -1) {
                return;
            }

            // Refresh vault max withdraw limit when there is a balance change
            if (log.eventName === "Deposit" || log.eventName === "Withdraw") {
                const erc4626Api: ERC4626API = new ERC4626API(log.address, this.client);
                const maxWithdraw: bigint = await erc4626Api.getMaxWithdraw(multiPool.address);
                multiPool.vaults[vaultIdx]!.maxWithdraw = maxWithdraw;
            }
        }
    }

    async _handleMultiPoolEvent(multiPool: MultiPool, log: WatchContractEventOnLogsParameter<typeof this.abi>[number]): Promise<void> {
        const multiPoolApi: MultiPoolAPI = new MultiPoolAPI(multiPool.address, this.client);

        if (log.eventName === "VertexAdded") {
            const { token } = log.args as { token: Address };

            const erc20Api: ERC20API = new ERC20API(token, this.client);

            // fetch token decimals and refresh edge fees
            // we don't update es because that is fetched with a set default given the MAX_TOKENS size
            const [decimals, edgeFees] = await Promise.all([
                erc20Api.getDecimals(),
                multiPoolApi.getEdgeFees(multiPool.tokens.length + 1)
            ]);

            // update multi pool
            multiPool.tokens.push({
                address: token,
                decimals: decimals
            })
            if (multiPool.adjustor instanceof DecimalAdjustor) {
                multiPool.adjustor.registerToken(token, decimals);
            }
            multiPool.taxes = edgeFees;
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
    }

    // NOT IMPLEMENTED - interface methods inherited from BasePoolStateProvider are not compatible with Burve.
    // As each pool contains multiple tokens.

    async swap(pool: Closure, amountIn: bigint, zeroToOne: boolean): Promise<void> {
        throw new Error("Not Implemented");
    }

}
