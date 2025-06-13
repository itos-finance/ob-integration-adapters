import { type Address, type Client, getContract } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"
import { type MultiPoolMetadata } from "../types/MultiPool"

// Gets the onchain adjustor address for a given multi pool
export async function GetAdjustor(multiPoolMetadata: MultiPoolMetadata, client: Client): Promise<Address> {
    const simplex = getContract({
        address: multiPoolMetadata.address,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    return await simplex.read.getAdjustor();
}