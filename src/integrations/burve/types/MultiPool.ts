import type { Address } from "viem"
import type { Token } from "./Token"
import type { Vault } from "./Vault"
import { Decimal } from 'decimal.js';
import type { OffchainAdjustor } from "./OffchainAdjustor";

// Multi pool metadata
export class MultiPool {
    public readonly address: Address;
    public readonly tokens: Token[];
    public readonly vaults: Vault[];
    public adjustorAddress: Address;
    public offchainAdjustor: OffchainAdjustor;
    public es: Decimal[];
    public taxes: number[][];

    constructor({ address, tokens, vaults, adjustorAddress, offchainAdjustor, es, taxes }: { address: Address, tokens: Token[], vaults: Vault[], adjustorAddress: Address, offchainAdjustor: OffchainAdjustor, es: Decimal[], taxes: number[][] }) {
        this.address = address;
        this.tokens = tokens;
        this.vaults = vaults;
        this.adjustorAddress = adjustorAddress;
        this.offchainAdjustor = offchainAdjustor;
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