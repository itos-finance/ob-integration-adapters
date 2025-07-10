import type { Address } from "viem"
import type { Token } from "./Token"
import type { Vault } from "./Vault"
import { Decimal } from 'decimal.js';
import type { IAdjustor } from "./adjustor/IAdjustor";

// Multi pool onchain data (parital - hardcoded addresses)
export interface MultiPoolMetadata {
    // Address of the multi pool
    address: Address
    // Tokens in the pool
    tokens: Token[]
    // Vaults for each token
    vaults: Vault[]
}

// Multi pool implementation (fully composed after onchain lookups)
export class MultiPool {
    public readonly metadata: MultiPoolMetadata;
    public readonly adjustor: IAdjustor;
    public es: Decimal[];
    public taxes: number[][];

    constructor({ metadata, adjustor, es, taxes }: { metadata: MultiPoolMetadata, adjustor: IAdjustor, es: Decimal[], taxes: number[][] }) {
        this.metadata = metadata;
        this.adjustor = adjustor;
        this.es = es;
        this.taxes = taxes;
    }

    // Gets the index of a token in the pool. -1 if not found.
    getTokenIdx(token: Address): number {
        return this.metadata.tokens.findIndex((t) => t.address.toLowerCase() === token.toLowerCase());
    }

    // Gets the index of a vault in the pool. -1 if not found.
    getVaultIdx(vault: Address): number {
        return this.metadata.vaults.findIndex((v) => v.address.toLowerCase() === vault.toLowerCase());
    }

    // Gets the tax for a given token pair
    getTax(inIdx: number, outIdx: number): number {
        if (inIdx < outIdx) {
            return this.taxes[inIdx]![outIdx]!;
        }
        return this.taxes[outIdx]![inIdx]!;
    }
}