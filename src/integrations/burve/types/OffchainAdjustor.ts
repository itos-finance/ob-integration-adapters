import Decimal from "decimal.js";
import { type Address } from "viem";
import { AddressMap } from "../../../helpers/AddressMap";

// Calculates adjustments offchain by caching the conversion factor
export class OffchainAdjustor {
    private realPerNominalRatio = new AddressMap<Decimal>();

    registerToken(token: Address, realPerNominalRatio: Decimal) {
        this.realPerNominalRatio.set(token, realPerNominalRatio);
    }

    toNominal(token: Address, real: bigint, roundUp: boolean): bigint {
        const realPerNominalRatio: Decimal | undefined = this.realPerNominalRatio.get(token);
        if (!realPerNominalRatio) {
            throw new Error(`OffchainAdjustor: token ${token} not registered`);
        }

        const shares = new Decimal(real.toString()).div(realPerNominalRatio);
        if (roundUp) {
            return BigInt(shares.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(shares.toFixed(0, Decimal.ROUND_DOWN));
        }
    }

    toReal(token: Address, nominal: bigint, roundUp: boolean): bigint {
        const realPerNominalRatio: Decimal | undefined = this.realPerNominalRatio.get(token);
        if (!realPerNominalRatio) {
            throw new Error(`OffchainAdjustor: token ${token} not registered`);
        }

        const assets = new Decimal(nominal.toString()).mul(realPerNominalRatio);
        if (roundUp) {
            return BigInt(assets.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(assets.toFixed(0, Decimal.ROUND_DOWN));
        }
    }
}