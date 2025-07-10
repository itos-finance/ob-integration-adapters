import { type Address } from "viem";

// Adjustor interface
export interface IAdjustor {
    // Converts a real amount to a nominal amount
    toNominal(token: Address, real: bigint, roundUp: boolean): bigint;
    // Converts a nominal amount to a real amount
    toReal(token: Address, nominal: bigint, roundUp: boolean): bigint;
}