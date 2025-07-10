import Decimal from "decimal.js";
import { type Address } from "viem";
import { AddressMap } from "../../../../helpers/AddressMap";
import type { IAdjustor } from "./IAdjustor";

// Decimal adjustor - adjusts nominal representation to match 18 decimals
export class DecimalAdjustor implements IAdjustor {
    private tokenDecimals = new AddressMap<number>();

    registerToken(token: Address, decimals: number) {
        this.tokenDecimals.set(token, decimals);
    }

    toNominal(token: Address, real: bigint, roundUp: boolean): bigint {
        const decimals: number | undefined = this.tokenDecimals.get(token)
        if (!decimals) {
            throw new Error(`DecimalAdjustor: token ${token} not registered`);
        }

        if (decimals === 18) {
            return real;
        }

        // less than 18 decimals shifts up
        if (decimals < 18) {
            const diff = 18 - decimals;
            return real * (10n ** BigInt(diff));
        }

        // more than 18 decimals shifts down
        const diff = decimals - 18;
        const nominal = new Decimal(real.toString()).div(new Decimal(10).pow(diff))
        if (roundUp) {
            return BigInt(nominal.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(nominal.toFixed(0, Decimal.ROUND_DOWN));
        }
    }

    toReal(token: Address, nominal: bigint, roundUp: boolean): bigint {
        const decimals: number | undefined = this.tokenDecimals.get(token);
        if (!decimals) {
            throw new Error(`DecimalAdjustor: token ${token} not registered`);
        }

        if (decimals === 18) {
            return nominal;
        }

        // more than 18 decimals shifts up
        if (decimals > 18) {
            const diff = decimals - 18;
            return nominal * (10n ** BigInt(diff));
        }

        // less than 18 decimals shifts down
        const diff = 18 - decimals;
        const real = new Decimal(nominal.toString()).div(new Decimal(10).pow(diff))
        if (roundUp) {
            return BigInt(real.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(real.toFixed(0, Decimal.ROUND_DOWN));
        }
    }
}