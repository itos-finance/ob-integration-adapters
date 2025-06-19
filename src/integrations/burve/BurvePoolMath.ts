import { Decimal } from "decimal.js";
import type { Address } from "viem";
import { BasePoolMath } from "../../base/BasePoolMath";
import { Closure } from "./types/Closure";

// Burve pool math implementation
export class BurvePoolMath extends BasePoolMath<Closure> {

    // @param closure: The closure (pool) to swap through
    // @param tokenIn: The token to swap in
    // @param tokenOut: The token to get out
    // @param amountIn: The exact amount of tokenIn to swap in
    // @returns The amount of tokenOut received (as a positive number)
    swapExactIn(
        closure: Closure,
        tokenIn: Address,
        tokenOut: Address,
        amountIn: bigint,
    ): bigint {
        if (amountIn < 0) {
            throw new Error("Amount in must be positive")
        }

        const inIdx: number = closure.pool.getIdx(tokenIn)
        const outIdx: number = closure.pool.getIdx(tokenOut)

        const nominalIn = closure.pool.adjustor.toNominal(tokenIn, amountIn, false)
        const [_, nominalOut] = closure.simSwap(inIdx, outIdx, new Decimal(nominalIn.toString()))

        return closure.pool.adjustor.toReal(tokenOut, BigInt(nominalOut.abs().toFixed(0, Decimal.ROUND_DOWN)), false);
    }

    // @param closure: The closure (pool) to swap through
    // @param tokenIn: The token to swap in
    // @param tokenOut: The token to get out
    // @param amountOut: The exact amount of tokenOut to get out
    // @returns The amount of tokenIn given (as a positive number)
    swapExactOut(
        closure: Closure,
        tokenIn: Address,
        tokenOut: Address,
        amountOut: bigint,
    ): bigint {
        if (amountOut < 0) {
            throw new Error("Amount out must be positive")
        }

        const inIdx: number = closure.pool.getIdx(tokenIn)
        const outIdx: number = closure.pool.getIdx(tokenOut)

        const nominalOut = closure.pool.adjustor.toNominal(tokenOut, amountOut, false)
        const [_, nominalIn] = closure.simSwap(outIdx, inIdx, new Decimal(nominalOut.toString()).neg())

        return closure.pool.adjustor.toReal(tokenIn, BigInt(nominalIn.toFixed(0, Decimal.ROUND_UP)), true);
    }

    // @param closure: The closure (pool) to get the price from
    // @param tokenIn: The tokenIn
    // @param tokenOut: The tokenOut
    // @returns The price of tokenOut / tokenIn in real terms
    spotPriceNoFee(
        closure: Closure,
        tokenIn: Address,
        tokenOut: Address,
    ): number {
        const inIdx: number = closure.pool.getIdx(tokenIn)
        const outIdx: number = closure.pool.getIdx(tokenOut)

        // nOut / nIn
        const nominalPrice = closure.getPrice(inIdx, outIdx)
        
        const nominalFactor = 10n ** 18n 
        const realIn = closure.pool.adjustor.toReal(tokenIn, nominalFactor, false)
        const realOut = closure.pool.adjustor.toReal(tokenOut, nominalFactor, false)

        return nominalPrice.mul(new Decimal(realOut.toString())).div(new Decimal(realIn.toString())).toNumber()
    }

    // NOT IMPLEMENTED - interface methods inherited from BasePoolMath are not compatible with Burve.
    // As each pool contains multiple tokens.

    override swapExactInput(
        pool: Closure,
        zeroToOne: boolean,
        amountIn: bigint,
    ): bigint {
        throw new Error("Not Implemented");
    }

    override swapExactOutput(
        pool: Closure,
        zeroToOne: boolean,
        amountOut: bigint,
    ): bigint {
        throw new Error("Not Implemented");
    }

    override spotPriceWithoutFee(
        pool: Closure,
        zeroToOne: boolean,
    ): number {
        throw new Error("Not Implemented");
    }
}
