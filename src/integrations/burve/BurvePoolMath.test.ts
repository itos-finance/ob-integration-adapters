import { describe, expect, test } from "bun:test";
import { parseEther, zeroAddress } from "viem";
import { BurvePoolMath } from "./BurvePoolMath";
import { DecimalAdjustor } from "./tests/DecimalAdjustor";
import { MultiPool } from "./types/MultiPool";
import { Decimal } from "decimal.js";
import { Closure } from "./types/Closure";

describe("BurvePoolMath", () => {
	const burvePoolMath = new BurvePoolMath() 

	const adjustor = new DecimalAdjustor()
	adjustor.registerToken("0xUSDC", 6)

	const multiPool = new MultiPool({
		metadata: {
			address: "0xMultiPool",
			tokens: [
				{ address: "0xUSDC", decimals: 6 },
				{ address: "0xDAI", decimals: 18 },
				{ address: "0xMIM", decimals: 18 },
			]
		},
		adjustor,
		es: [new Decimal(400), new Decimal(200), new Decimal(100)],
		taxes: [[NaN, 0.0001, 0.0001], [NaN, NaN, 0.0001], [NaN, NaN, NaN]],
	})

	const balanced = new Closure({
		pool: multiPool,
		cid: 7,
		balances: [new Decimal("1e21"), new Decimal("1e21"), new Decimal("1e21")],
		target: new Decimal("1e21"),
	})

	const imbalanced = new Closure({
		pool: multiPool,
		cid: 7,
		balances: [new Decimal("4.94948131472287834953e+21"), new Decimal("1.997459042754963957859e+21"), new Decimal("959901176647971884583")],
		target: new Decimal("2.6301420446576468496e+21"),
	})

	const balancedNoTax = new Closure({
		pool: new MultiPool({
			metadata: {
				address: "0xMultiPool",
				tokens: [
					{ address: "0xUSDC", decimals: 6 },
					{ address: "0xDAI", decimals: 18 },
					{ address: "0xMIM", decimals: 18 },
				]
			},
			adjustor,
			es: [new Decimal(10), new Decimal(10), new Decimal(10)],
			taxes: [[NaN, 0.0, 0.0], [NaN, NaN, 0.0], [NaN, NaN, NaN]],
		}),
		cid: 7,
		balances: [new Decimal("1e21"), new Decimal("1e21"), new Decimal("1e21")],
		target: new Decimal("1e21"),
	})

	// -- Balanced Tests --

	test("swapExactIn balanced USDC -> DAI", async () => {
		const outAmount = await burvePoolMath.swapExactIn(balanced, "0xUSDC", "0xDAI", 10n ** 6n)
		expect(outAmount).toBe(999892532659506326n) // 1 more than onchain swap
	})

	test("swapExactIn balanced DAI -> USDC", async () => {
		const outAmount = await burvePoolMath.swapExactIn(balanced, "0xDAI", "0xUSDC", 10n ** 18n)
		expect(outAmount).toBe(999892n) // 0 difference onchain swap
	})

	test("swapExactIn balanced DAI -> MIM", async () => {
		const outAmount = await burvePoolMath.swapExactIn(balanced, "0xDAI", "0xMIM", 10n ** 18n)
		expect(outAmount).toBe(999885127081826123n) // 1 more than onchain swap
	})

	test("swapExactIn balanced MIM -> DAI", async () => {
		const outAmount = await burvePoolMath.swapExactIn(balanced, "0xMIM", "0xDAI", 10n ** 18n)
		expect(outAmount).toBe(999885127081826123n) // 1 more than onchain swap
	})

	test("swapExactOut balanced USDC -> DAI", async () => {
		const outAmount = await burvePoolMath.swapExactOut(balanced, "0xUSDC", "0xDAI", 10n ** 18n)
		expect(outAmount).toBe(1000107n) // 1 less than onchain swap
	})

	test("swapExactOut balanced DAI -> USDC", async () => {
		const outAmount = await burvePoolMath.swapExactOut(balanced, "0xDAI", "0xUSDC", 10n ** 6n)
		expect(outAmount).toBe(1000107479693718251n) // 1 more than onchain swap
	})

	test("swapExactOut balanced DAI -> MIM", async () => {
		const outAmount = await burvePoolMath.swapExactOut(balanced, "0xDAI", "0xMIM", 10n ** 18n)
		expect(outAmount).toBe(1000114887824561650n) // 0 difference onchain swap
	})

	test("swapExactOut balanced MIM -> DAI", async () => {
		const outAmount = await burvePoolMath.swapExactOut(balanced, "0xMIM", "0xDAI", 10n ** 18n)
		expect(outAmount).toBe(1000114887824561650n) // 0 difference onchain swap
	})

	test("spotPriceNoFee balanced USDC / DAI", async () => {
		const price = await burvePoolMath.spotPriceNoFee(balanced, "0xDAI", "0xUSDC")
		expect(price).toBe(1e-12)
	})

	test("spotPriceNoFee balanced DAI / USDC", async () => {
		const price = await burvePoolMath.spotPriceNoFee(balanced, "0xUSDC", "0xDAI")
		expect(price).toBe(1e12)
	})

	test("spotPriceNoFee balanced DAI / MIM", async () => {
		const price = await burvePoolMath.spotPriceNoFee(balanced, "0xMIM", "0xDAI")
		expect(price).toBe(1)
	})

	test("spotPriceNoFee balanced MIM / DAI", async () => {
		const price = await burvePoolMath.spotPriceNoFee(balanced, "0xDAI", "0xMIM")
		expect(price).toBe(1)
	})

	// -- Imbalanced Tests --

	test("swapExactIn imbalanced USDC -> DAI", async () => {
		const amountOut = await burvePoolMath.swapExactIn(imbalanced, "0xUSDC", "0xDAI", 10n ** 6n)
		expect(amountOut).toBe(993132555182127066n) // 1 more than onchain swap
	})

	test("swapExactIn imbalanced DAI -> USDC", async () => {
		const amountOut = await burvePoolMath.swapExactIn(imbalanced, "0xDAI", "0xUSDC", 10n ** 18n)
		expect(amountOut).toBe(1006707n) // 0 difference onchain swap
	})

	test("swapExactIn imbalanced DAI -> MIM", async () => {
		const amountOut = await burvePoolMath.swapExactIn(imbalanced, "0xDAI", "0xMIM", 10n ** 18n)
		expect(amountOut).toBe(989727735789127525n) // 1 less than onchain swap
	})

	test("swapExactIn imbalanced MIM -> DAI", async () => {
		const amountOut = await burvePoolMath.swapExactIn(imbalanced, "0xMIM", "0xDAI", 10n ** 18n)
		expect(amountOut).toBe(1010165353780381807n) // 1 less than onchain swap
	})

	test("swapExactOut imbalanced USDC -> DAI", async () => {
		const amountIn = await burvePoolMath.swapExactOut(imbalanced, "0xUSDC", "0xDAI", 10n ** 18n)
		expect(amountIn).toBe(1006914n) // 1 less than onchain swap
	})

	test("swapExactOut imbalanced DAI -> USDC", async () => {
		const amountIn = await burvePoolMath.swapExactOut(imbalanced, "0xDAI", "0xUSDC", 10n ** 6n)
		expect(amountIn).toBe(993336827724068688n) // 1 more than onchain swap
	})

	test("swapExactOut imbalanced DAI -> MIM", async () => {
		const amountIn = await burvePoolMath.swapExactOut(imbalanced, "0xDAI", "0xMIM", 10n ** 18n)
		expect(amountIn).toBe(1010378937972120767n) // 0 difference onchain swap
	})

	test("swapExactOut imbalanced MIM -> DAI", async () => {
		const amountIn = await burvePoolMath.swapExactOut(imbalanced, "0xMIM", "0xDAI", 10n ** 18n)
		expect(amountIn).toBe(989936883984743486n) // 0 difference onchain swa
	})

	test("spotPriceNoFee imbalanced USDC / DAI", async () => {
		const price = await burvePoolMath.spotPriceNoFee(imbalanced, "0xDAI", "0xUSDC")
		expect(price).toBe(1.0068113951694153e-12)
	})

	test("spotPriceNoFee imbalanced DAI / USDC", async () => {
		const price = await burvePoolMath.spotPriceNoFee(imbalanced, "0xUSDC", "0xDAI")
		expect(price).toBe(993234686057.2937)
	})

	test("spotPriceNoFee imbalanced DAI / MIM", async () => {
		const price = await burvePoolMath.spotPriceNoFee(imbalanced, "0xMIM", "0xDAI")
		expect(price).toBe(1.0102721399275294)
	})

	test("spotPriceNoFee imbalanced MIM / DAI", async () => {
		const price = await burvePoolMath.spotPriceNoFee(imbalanced, "0xDAI", "0xMIM")
		expect(price).toBe(0.9898323040678265)
	})

	// -- Error Tests -- 

	test("swapExactIn in amount less than minSwapAmount", async () => {
		await expect(burvePoolMath.swapExactIn(balanced, "0xUSDC", "0xDAI", 0n)).rejects.toThrow("In amount less than min swap amount")
	})

	test("swapExactOut out amount less than minSwapAmount", async () => {
		await expect(burvePoolMath.swapExactOut(imbalanced, "0xUSDC", "0xMIM", 1n)).rejects.toThrow("Out amount less than min swap amount")
	})

	test("swapExactIn in balance DAI more than max balance", async () => {
		const maxIn = BigInt(balancedNoTax.getMaxX(1).sub(balancedNoTax.balances[1] as Decimal).toFixed(0))
		await burvePoolMath.swapExactIn(balancedNoTax, "0xDAI", "0xMIM", maxIn)
		await expect(burvePoolMath.swapExactIn(balancedNoTax, "0xDAI", "0xMIM", maxIn + 1n)).rejects.toThrow("In balance more than max in balance")
	})

	test("swapExactOut in balance DAI less than min balance", async () => {
		const maxOut = BigInt((balancedNoTax.balances[1] as Decimal).sub(balancedNoTax.getMinX(1)).toFixed(0))
		// thrown after the error we are testing
		await expect(burvePoolMath.swapExactOut(balancedNoTax, "0xMIM", "0xDAI", maxOut)).rejects.toThrow("Out balance more than max out balance")
		await expect(burvePoolMath.swapExactOut(balancedNoTax, "0xMIM", "0xDAI", (maxOut + 1n))).rejects.toThrow("In balance less than min in balance")
	})

	test("swapExactIn out balance DAI is less than min out balance", async () => {
		await expect(burvePoolMath.swapExactIn(imbalanced, "0xMIM", "0xDAI", 1990000000000000000000n)).rejects.toThrow("Out balance less than min out balance")
	})

	test("swapExactOut out balance USDC is more than max out balance", async () => {
		await expect(burvePoolMath.swapExactOut(imbalanced, "0xUSDC", "0xDAI", 1090000000000000000000n)).rejects.toThrow("Out balance more than max out balance")
	})

	test("swapExactIn amount in is negative", async () => {
		await expect(burvePoolMath.swapExactIn(balanced, "0xUSDC", "0xDAI", -1n)).rejects.toThrow("Amount in must be positive")
	})

	test("swapExactOut amount out is negative", async () => {
		await expect(burvePoolMath.swapExactOut(balanced, "0xUSDC", "0xDAI", -1n)).rejects.toThrow("Amount out must be positive")
	})
});
