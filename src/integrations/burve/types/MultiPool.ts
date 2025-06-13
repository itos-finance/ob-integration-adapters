import type { Address } from "viem"
import type { Token } from "./Token"
import { Decimal } from 'decimal.js';
import type { IAdjustor } from "./Adjustor";

// Multi pool onchain data (parital - hardcoded addresses)
export interface MultiPoolMetadata {
    // Address of the multi pool
    address: Address
    // Tokens in the pool
    tokens: Token[]
}

// Multi pool implementation (fully composed after onchain lookups)
export class MultiPool {
    public readonly metadata: MultiPoolMetadata;
    public readonly adjustor: IAdjustor;
    public readonly es: Decimal[];
    public taxes: number[][];

    constructor({ metadata, adjustor, es, taxes }: { metadata: MultiPoolMetadata, adjustor: IAdjustor, es: Decimal[], taxes: number[][] }) {
        this.metadata = metadata;
        this.adjustor = adjustor;
        this.es = es;
        this.taxes = taxes;
    }

    // Gets the index of a token in the pool. -1 if not found.
    getIdx(token: Address): number {
        return this.metadata.tokens.findIndex((t) => t.address.toLowerCase() === token.toLowerCase());
    }

    // Gets the tax for a given token pair
    getTax(inIdx: number, outIdx: number): number {
        if (inIdx < outIdx) {
            return this.taxes[inIdx]![outIdx]!;
        }
        return this.taxes[outIdx]![inIdx]!;
    }
}