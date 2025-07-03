import { type PublicClient, type Address } from "viem"
import { vaultFacetAbi } from "../abi/valutFacetAbi"

// Gets all onchain vaults for tokens of a pool
export async function GetVaults(poolAddress: Address, tokens: Address[], client: PublicClient): Promise<Address[]> {
    const vaults: Array<[Address, Address]> = await client.multicall({
        contracts: tokens.map((token) => ({
            address: poolAddress,
            abi: vaultFacetAbi,
            functionName: 'viewVaults',
            args: [token],
        })),
        allowFailure: false
    }) as unknown as Array<[Address, Address]>

    return vaults.map(([active, backup]) => active)
} 