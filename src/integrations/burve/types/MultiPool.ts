import type { Address } from "viem"
import type { Token } from "./Token"
import type { Vault } from "./Vault"
import { Decimal } from 'decimal.js';
import type { IAdjustor } from "./adjustor/IAdjustor";

// Multi pool implementation
export class MultiPool {
    public readonly address: Address;
    public readonly tokens: Token[];
    public readonly vaults: Vault[];
    public readonly adjustor: IAdjustor;
    public es: Decimal[];
    public taxes: number[][];

    constructor({ address, tokens, vaults, adjustor, es, taxes }: { address: Address, tokens: Token[], vaults: Vault[], adjustor: IAdjustor, es: Decimal[], taxes: number[][] }) {
        this.address = address;
        this.tokens = tokens;
        this.vaults = vaults;
        this.adjustor = adjustor;
        this.es = es;
        this.taxes = taxes;
    }

    // Gets the index of a token in the pool. -1 if not found.
    getTokenIdx(token: Address): number {
        return this.tokens.findIndex((t) => t.address.toLowerCase() === token.toLowerCase());
    }

    // Gets the index of a vault in the pool. -1 if not found.
    getVaultIdx(vault: Address): number {
        return this.vaults.findIndex((v) => v.address.toLowerCase() === vault.toLowerCase());
    }

    // Gets the tax for a given token pair
    getTax(inIdx: number, outIdx: number): number {
        if (inIdx < outIdx) {
            return this.taxes[inIdx]![outIdx]!;
        }
        return this.taxes[outIdx]![inIdx]!;
    }
}