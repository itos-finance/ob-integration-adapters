import { Decimal } from 'decimal.js';
import {
    type Address,
    type WatchContractEventOnLogsParameter
} from "viem";
import { BasePoolStateProvider } from "../../base/BasePoolProvider";
import { AddressMap } from "../../helpers/AddressMap";
import { iBurveMultiEventsAbi } from "./abi/iBurveMultiEventsAbi";
import { iBurveMultiSwapAbi } from "./abi/iBurveMultiSwapAbi";
import { GetAdjustor } from "./api/GetAdjustor";
import { GetClosures } from "./api/GetClosures";
import { GetEdgeFees } from "./api/GetEdgeFees";
import { GetEs } from "./api/GetEs";
import { MULTI_POOLS_METADATA } from "./contracts";
import { Adjustor } from "./types/Adjustor";
import { Closure } from "./types/Closure";
import { MultiPool } from "./types/MultiPool";
import { MAX_TOKENS } from "./types/Token";
import { X128 } from './utils';

export class BurvePoolProvider extends BasePoolStateProvider<Closure> {
    readonly abi = iBurveMultiEventsAbi;
    readonly multiPools = new AddressMap<MultiPool>();

    async getAllPools(): Promise<Closure[]> {
        const closures: Closure[] = [];

        // Batch fetches all data from the chain
        const allPromises = MULTI_POOLS_METADATA.map(metadata => Promise.all([
            GetAdjustor(metadata, this.client),
            GetEs(metadata.address as Address, this.client),
            GetEdgeFees(metadata, this.client),
            GetClosures(metadata, this.client)
        ]));

        const results = await Promise.all(allPromises);

        // Process results
        for (let i = 0; i < MULTI_POOLS_METADATA.length; i++) {
            const result = results[i]!;
            const [adjustor, es, edgeFees, closuresData] = result;
            const metadata = MULTI_POOLS_METADATA[i]!;

            // cache multi pool
            const multiPool: MultiPool = new MultiPool({ metadata, adjustor: new Adjustor(adjustor, this.client), es, taxes: edgeFees })
            this.multiPools.set(multiPool.metadata.address, multiPool)

            // create closures
            for (const cData of closuresData) {
                closures.push(new Closure({ pool: multiPool, ...cData }));
            }
        }

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
            address: closure.pool.metadata.address,
            abi: iBurveMultiSwapAbi,
            functionName: "swap",
            args: [recipient, tokenIn, tokenOut, amountSpecified, amountLimit, closure.cid],
        });
    }

    async handleEvent(
        log: WatchContractEventOnLogsParameter<typeof this.abi>[number],
    ): Promise<void> {
        const address: Address = log.address
        const multiPool: MultiPool | undefined = this.multiPools.get(address)

        if (!multiPool) {
            return;
        }

        if (log.eventName === "NewClosureBalances") {
            const { cid, targetX128, balances } = log.args as { cid: number; targetX128: bigint; balances: readonly bigint[] };

            const key: Address = `${address}-${cid}`
            const closure: Closure | undefined = this.pools.get(key);
            if (!closure) {
                // should not be possible
                return;
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
            const edgeFees: number[][] = await GetEdgeFees(multiPool.metadata, this.client)
            multiPool.taxes = edgeFees;
        }

        if (log.eventName === "EfficiencyFactorChanged") {
            const { token, toEsX128 } = log.args as { token: Address; toEsX128: bigint };
            const idx: number = multiPool.getIdx(token);
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
