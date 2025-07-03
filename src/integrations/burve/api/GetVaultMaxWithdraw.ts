import { type Address, type PublicClient, getContract, erc4626Abi } from "viem"

// Gets the max withdraw amount for a given vault and owner
export async function GetVaultMaxWithdraw(vaultAddress: Address, owner: Address, client: PublicClient): Promise<bigint> {
    const vault = getContract({
        address: vaultAddress,
        abi: erc4626Abi,
        client: client
    })

    return await vault.read.maxWithdraw([owner])
}