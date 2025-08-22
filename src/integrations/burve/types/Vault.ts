import type { Address } from "viem"

export interface Vault {
    // Address of the vault
    address: Address, 
    // Total amount of the underlying asset
    totalAssets: bigint
    // Dolomite market id
    dolomiteMarketId: bigint
    // Has withdraw limit
    hasWithdrawLimit: boolean
}