import { describe, expect, test } from "bun:test";
import { DecimalAdjustor } from "../../types/adjustor/DecimalAdjustor";

describe("DecimalAdjustor", () => {
    const adjustor: DecimalAdjustor = new DecimalAdjustor();
    adjustor.registerToken("0x6", 6);
    adjustor.registerToken("0x18", 18);
    adjustor.registerToken("0x24", 24);

    // 6 decimal tests

    test("toNominal < 18", () => {
        const nominal = adjustor.toNominal("0x6", 10n ** 6n, false)
        expect(nominal).toBe(10n ** 18n);
    });

    test("toReal < 18", () => {
        const real = adjustor.toReal("0x6", 10n ** 18n, true)
        expect(real).toBe(10n ** 6n);
    });

    test("toReal < 18 rounding up", () => {
        const nominal: bigint = 10n ** 24n + 1n;
        const realUp = adjustor.toReal("0x6", nominal, true)
        const realDown = adjustor.toReal("0x6", nominal, false)
        expect(realUp).toBe(10n ** 12n + 1n);
        expect(realDown).toBe(10n ** 12n);
    });

    test("toReal < 18 rounding down", () => {
        const nominal: bigint = 10n ** 24n - 1n;
        const realUp = adjustor.toReal("0x6", nominal, true)
        const realDown = adjustor.toReal("0x6", nominal, false)
        expect(realUp).toBe(10n ** 12n);
        expect(realDown).toBe(10n ** 12n - 1n);
    });

    // 18 decimal tests 

    test("toNominal = 18", () => {
        const nominal = adjustor.toNominal("0x18", 10n ** 18n, false)
        expect(nominal).toBe(10n ** 18n);
    });

    test("toReal = 18", () => {
        const real = adjustor.toReal("0x18", 10n ** 18n, true)
        expect(real).toBe(10n ** 18n);
    });

    // 24 decimal tests

    test("toNominal = 24", () => {
        const nominal = adjustor.toNominal("0x24", 10n ** 12n, false)
        expect(nominal).toBe(10n ** 6n);
    });

    test("toReal = 24", () => {
        const real = adjustor.toReal("0x24", 10n ** 6n, true)
        expect(real).toBe(10n ** 12n);
    });

    test("toNominal = 24 rounding up", () => {
        const real: bigint = 10n ** 30n + 1n;
        const nominalUp = adjustor.toNominal("0x24", real, true)
        const nominalDown = adjustor.toNominal("0x24", real, false)
        expect(nominalUp).toBe(10n ** 24n + 1n);
        expect(nominalDown).toBe(10n ** 24n);
    });

    test("toNominal = 24 rounding down", () => {
        const real: bigint = 10n ** 30n - 1n;
        const nominalUp = adjustor.toNominal("0x24", real, true)
        const nominalDown = adjustor.toNominal("0x24", real, false)
        expect(nominalUp).toBe(10n ** 24n);
        expect(nominalDown).toBe(10n ** 24n - 1n);
    });

    // unregistered tests

    test("toNominal unregistered", () => {
        expect(() => adjustor.toNominal("0x1", 10n ** 18n, false)).toThrow("DecimalAdjustor: token 0x1 not registered");
    });

    test("toReal unregistered", () => {
        expect(() => adjustor.toReal("0x1", 10n ** 18n, false)).toThrow("DecimalAdjustor: token 0x1 not registered");
    });
});