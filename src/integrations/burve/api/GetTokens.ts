import { type PublicClient, getContract, type Address, erc20Abi } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"
import { type Token } from '../types/Token'

// Gets all onchain tokens for a given multi pool
export async function GetTokens(poolAddress: Address, client: PublicClient): Promise<Token[]> {
    const simplex = getContract({
        address: poolAddress,
        abi: iBurveMultiSimplexAbi,
        client: client
    });

    const tokens: Address[] = await simplex.read.getTokens() as Address[];

    const decimals = await client.multicall({
        contracts: tokens.map((token) => ({
            address: token,
            abi: erc20Abi,
            functionName: 'decimals',
        })),
        allowFailure: false
    })

    return tokens.map((token, index) => {
        return {
            address: token,
            decimals: decimals[index] as number,
        }
    });
} 