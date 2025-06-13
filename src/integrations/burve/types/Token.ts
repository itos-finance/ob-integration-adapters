import { type Address } from "viem"

// Maximum number of tokens in a multi pool
export const MAX_TOKENS: number = 16

// Token interface
export interface Token {
    address: Address
    decimals: number
}