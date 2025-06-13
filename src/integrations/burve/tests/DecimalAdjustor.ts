import type { Address } from "viem";
import { AddressMap } from "../../../helpers/AddressMap";
import { type IAdjustor } from "../types/Adjustor";

// Decimal adjustor for testing purposes
// If a token is not registered, it is assumed to be a 1:1 conversion between nominal and real
export class DecimalAdjustor implements IAdjustor {
    private tokenDecimals = new AddressMap<number>();

    registerToken(token: Address, decimals: number) {
        this.tokenDecimals.set(token, decimals);
    }

    async toNominal(token: Address, real: bigint, roundUp: boolean): Promise<bigint> {
        const decimals: number | undefined = this.tokenDecimals.get(token)
        if (!decimals) {
            return real;
        }

        const decimalsDiff = 18 - decimals;
        return real * (10n ** BigInt(decimalsDiff));
    }

    async toReal(token: Address, nominal: bigint, roundUp: boolean): Promise<bigint> {
        const decimals: number | undefined = this.tokenDecimals.get(token);
        if (!decimals) {
            return nominal;
        }

        const decimalsDiff = 18 - decimals;
        return nominal / (10n ** BigInt(decimalsDiff));
    }
}