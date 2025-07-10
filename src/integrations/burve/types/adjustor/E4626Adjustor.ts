import Decimal from "decimal.js";
import { type Address } from "viem";
import { AddressMap } from "../../../../helpers/AddressMap";
import type { IAdjustor } from "./IAdjustor";

export class E4626Adjustor implements IAdjustor {
    private assetPerShareRatio = new AddressMap<Decimal>();

    registerToken(token: Address, assetPerShareRatio: Decimal) {
        this.assetPerShareRatio.set(token, assetPerShareRatio);
    }

    toNominal(token: Address, real: bigint, roundUp: boolean): bigint { 
        const assetPerShareRatio: Decimal | undefined = this.assetPerShareRatio.get(token);
        if (!assetPerShareRatio) {
            throw new Error(`E4626Adjustor: token ${token} not registered`);
        }

        const shares = new Decimal(real.toString()).div(assetPerShareRatio);
        if (roundUp) {
            return BigInt(shares.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(shares.toFixed(0, Decimal.ROUND_DOWN));
        }
    }

    toReal(token: Address, nominal: bigint, roundUp: boolean): bigint {
        const assetPerShareRatio: Decimal | undefined = this.assetPerShareRatio.get(token);
        if (!assetPerShareRatio) {
            throw new Error(`E4626Adjustor: token ${token} not registered`);
        }

        const assets = new Decimal(nominal.toString()).mul(assetPerShareRatio);
        if (roundUp) {
            return BigInt(assets.toFixed(0, Decimal.ROUND_UP));
        } else {
            return BigInt(assets.toFixed(0, Decimal.ROUND_DOWN));
        }
    }
}