import { type PublicClient, type Address, erc20Abi } from "viem"
import { type Token } from '../types/Token'

// Gets decimals for a given token
export async function GetDecimals(tokenAddress: Address, client: PublicClient): Promise<number> {
    return await client.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
    })
} 