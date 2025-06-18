import { Decimal } from 'decimal.js'
import { type PublicClient, getContract } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"
import { type ClosureMetadata, maxClosureId, MIN_CLOSURE_ID } from "../types/Closure"
import type { MultiPoolMetadata } from "../types/MultiPool"
import { MAX_TOKENS } from "../types/Token"
import { range } from "../utils"

// Gets all onchain closure metadata for a given multi pool
export async function GetClosures(multiPoolMetadata: MultiPoolMetadata, client: PublicClient): Promise<ClosureMetadata[]> {
    const simplex = getContract({
        address: multiPoolMetadata.address,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    const closureIds: number[] = range(MIN_CLOSURE_ID, maxClosureId(multiPoolMetadata.tokens.length));

    // Can be batched into a single RPC request if the client enables multicall
    const closureData = await Promise.all(closureIds.map((id) => {
        return simplex.read.getClosureValue([id]);
    }));

    return closureData.map((data, index) => {
        return {
            cid: closureIds[index] as number,
            balances: data[2].map((amount) => new Decimal(amount.toString())) as Decimal[] & {
                length: typeof MAX_TOKENS;
            },
            target: new Decimal(data[1].toString()).div(new Decimal(2).toPower(128)),
        }
    });
} 