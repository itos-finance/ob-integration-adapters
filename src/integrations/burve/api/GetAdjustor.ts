import { type Address, type PublicClient, getContract } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"

// Gets the onchain adjustor address for a given multi pool
export async function GetAdjustor(poolAddress: Address, client: PublicClient): Promise<Address> {
    const simplex = getContract({
        address: poolAddress,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    return await simplex.read.getAdjustor();
}