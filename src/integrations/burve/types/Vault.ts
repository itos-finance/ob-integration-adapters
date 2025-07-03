import type { Address } from "viem"

export interface Vault {
    // Address of the vault
    address: Address, 
    // Max withdraw amount of underlying asset
    maxWithdraw: bigint
}