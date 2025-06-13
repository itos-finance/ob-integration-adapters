import { Decimal } from 'decimal.js';
import { type Address, type Client, getContract } from "viem";
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi";
import { X128 } from "../utils";

// Gets all onchain efficiency factors for a given multi pool
// Result is converted from an X128 to floating point
export async function GetEs(poolAddress: Address, client: Client): Promise<Decimal[]> {
    const simplex = getContract({
        address: poolAddress,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    const esX128 = await simplex.read.getEsX128();
    return esX128.map((e) => new Decimal(e.toString()).div(X128));
}