import { describe, expect, test } from "bun:test";
import Decimal from "decimal.js";
import { OffchainAdjustor } from "../types/OffchainAdjustor";

describe("OffchainAdjustor", () => {
    const adjustor: OffchainAdjustor = new OffchainAdjustor();
    adjustor.registerToken("0xUSDC", new Decimal("1.013189210815576"));

    // toNominal tests

    test("toNominal", () => {
        const nominalRoundDown = adjustor.toNominal("0xUSDC", 100000000n, false)
        expect(nominalRoundDown).toBe(98698247n);

        const nominalRoundUp = adjustor.toNominal("0xUSDC", 100000000n, true)
        expect(nominalRoundUp).toBe(98698248n);
    })

    // toReal tests

    test("toReal", () => {
        const realRoundDown = adjustor.toReal("0xUSDC", 98698248n, false)
        expect(realRoundDown).toBe(100000000n);

        const realRoundUp = adjustor.toReal("0xUSDC", 98698248n, true)
        expect(realRoundUp).toBe(100000001n);
    })

    // unregistered tests

    test("toNominal unregistered", () => {
        expect(() => adjustor.toNominal("0x1", 10n ** 18n, false)).toThrow("OffchainAdjustor: token 0x1 not registered");
    });

    test("toReal unregistered", () => {
        expect(() => adjustor.toReal("0x1", 10n ** 18n, false)).toThrow("OffchainAdjustor: token 0x1 not registered");
    });
}); 