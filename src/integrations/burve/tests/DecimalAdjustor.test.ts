import { describe, expect, test } from "bun:test";
import { DecimalAdjustor } from "./DecimalAdjustor";

describe("DecimalAdjustor", () => {
    const adjustor: DecimalAdjustor = new DecimalAdjustor();
    adjustor.registerToken("0xUSDC", 6);

    test("USDC toNominal", async () => {
        const nominal = await adjustor.toNominal("0xUSDC", 10n ** 18n, false)
        expect(nominal).toBe(10n ** 30n);
    });

    test("USDC toReal", async () => {
        const real = await adjustor.toReal("0xUSDC", 10n ** 18n, true)
        expect(real).toBe(10n ** 6n);
    });

    test("DAI toNominal", async () => {
        const nominal = await adjustor.toNominal("0xDAI", 10n ** 18n, false)
        expect(nominal).toBe(10n ** 18n);
    });

    test("DAI toReal", async () => {
        const real = await adjustor.toReal("0xDAI", 10n ** 18n, true)
        expect(real).toBe(10n ** 18n);
    });
});