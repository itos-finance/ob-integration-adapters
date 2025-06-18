import { Decimal } from 'decimal.js'
import { type Address, type PublicClient, getContract } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"
import { X128 } from '../utils'

// Gets all onchain edge fees for a given multi pool
// Returned array is n x n where n is the number of tokens in the pool 
// Access should be done with [i][j] where i < j, other locations are NaN
export async function GetEdgeFees(poolAddress: Address, numTokens: number, client: PublicClient): Promise<number[][]> {
    const simplex = getContract({
        address: poolAddress,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    // token pairs (idx0, idx1) where idx0 < idx1
    const pairs: [number, number][] = generatePairs(numTokens);

    // Can be batched into a single RPC request if the client enables multicall
    const edgeFeesX128 = await Promise.all(pairs.map(([idx0, idx1]) => {
        return simplex.read.getEdgeFee([idx0, idx1]);
    }));

    // Create n x n array filled with NaN
    const edgeFees = Array(numTokens).fill(null).map(() =>
        Array(numTokens).fill(NaN)
    );

    // Fill in the values where i < j and convert from X128
    for (let index = 0; index < pairs.length; index++) {
        const [i, j] = pairs[index] as [number, number];
        edgeFees[i]![j] = new Decimal((edgeFeesX128[index] as unknown as BigInt).toString()).div(X128).toNumber();
    }

    return edgeFees;
}

// Generates all index pairs (i, j) where i < j
function generatePairs(n: number): [number, number][] {
    const pairs: [number, number][] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            pairs.push([i, j]);
        }
    }
    return pairs;
}