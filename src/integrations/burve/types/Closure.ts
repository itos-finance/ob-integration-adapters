import { Decimal } from 'decimal.js';
import type { MultiPool } from './MultiPool';
import { Value } from './Value';
import type { Address } from "viem";
import type { BasePoolState } from "../../../base/BasePoolState";
import { MAX_TOKENS } from './Token';

export const MIN_CLOSURE_ID: number = 3
const NOM_BALANCE_DE_MINIMUS: Decimal = new Decimal("1e8");
const MIN_SWAP_AMOUNT: Decimal = new Decimal("16e8"); // in nominal terms

// Note: Should be top level of application
Decimal.set({ precision: 80 })

// Computes the maximum closure id for a given number of tokens
export function maxClosureId(numTokens: number): number {
    return 2 ** numTokens - 1
}

// Error thrown when a swap goes past the bounds of the closure. 
// Either the min / max balance for an in / out token.
export class SwapPastBounds extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "SwapPastBounds";
    }
}

// Error thrown when a swap amount is less than the minimum swap amount.
export class MinSwapAmount extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "MinSwapAmount";
    }
}

// Closure onchain data
export interface ClosureMetadata {
    // closure id
    readonly cid: number
    // nominal token balances
    readonly balances: Decimal[] & { length: typeof MAX_TOKENS }
    // target (not X128)
    readonly target: Decimal
}

// Closure implementation 
// A closure acts as a pool in the context of this integration.
export class Closure implements ClosureMetadata, BasePoolState {
    public readonly pool: MultiPool
    public readonly cid: number
    public balances: Decimal[] & { length: typeof MAX_TOKENS }
    public target: Decimal

    constructor({ pool, cid, balances, target }: { pool: MultiPool, cid: number, balances: Decimal[] & { length: typeof MAX_TOKENS }, target: Decimal }) {
        this.pool = pool
        this.cid = cid
        this.balances = balances
        this.target = target
    }

    // Allows for use in AddressMap.
    get address(): Address {
        return `${this.pool.metadata.address}-${this.cid}`
    }

    // Sim swap in nominal terms.
    // Exact  in 0 for 1 simSwap(0, 1, 1e18)  -> [inAmt, outAmt]
    // Exact out 0 for 1 simSwap(1, 0, -1e18) -> [inAmt, outAmt]
    // Sign of returned amounts is from the perspective of the closure.
    simSwap(
        inIdx: number,
        outIdx: number,
        inAmount: Decimal,
    ): [Decimal, Decimal] {
        if (inAmount.gte(0) && inAmount.lt(MIN_SWAP_AMOUNT)) {
            throw new MinSwapAmount("In amount less than min swap amount")
        }

        if (inAmount.gt(0)) {
            inAmount = inAmount.mul(1.0 - this.pool.getTax(inIdx, outIdx));
        }

        // Sanity check input
        if (inAmount.gt(0)) {
            const maxBalanceIn = this.getMaxX(inIdx);
            if ((this.balances[inIdx] as Decimal).plus(inAmount).gt(maxBalanceIn)) {
                throw new SwapPastBounds("In balance more than max in balance")
            }
        } else {
            const minBalanceIn = this.getMinX(inIdx);
            if ((this.balances[inIdx] as Decimal).plus(inAmount).lt(minBalanceIn)) {
                throw new SwapPastBounds("In balance less than min in balance")
            }
        }

        const valueChange: Decimal = this.v(inIdx, (this.balances[inIdx] as Decimal).plus(inAmount)).minus(this.v(inIdx));
        const currentValue: Decimal = this.v(outIdx);
        const outBalance: Decimal = this.x(outIdx, currentValue.minus(valueChange));
        let outAmount: Decimal = outBalance.minus(this.balances[outIdx] as Decimal);

        // Sanity check output
        if (inAmount.gt(0)) {
            const minBalanceOut = this.getMinX(outIdx);
            if (outBalance.lt(minBalanceOut)) {
                throw new SwapPastBounds("Out balance less than min out balance")
            }
        } else {
            const maxBalanceOut = this.getMaxX(outIdx);
            if (outBalance.gt(maxBalanceOut)) {
                throw new SwapPastBounds("Out balance more than max out balance")
            }
        }

        if (inAmount.gt(0)) {
            inAmount = inAmount.div(1.0 - this.pool.getTax(inIdx, outIdx));
        } else {
            outAmount = outAmount.div(1.0 - this.pool.getTax(inIdx, outIdx));
        }

        if (inAmount.isNegative() && outAmount.lt(MIN_SWAP_AMOUNT)) {
            throw new MinSwapAmount("Out amount less than min swap amount")
        }

        return [inAmount, outAmount];
    }

    // Price of y/x in nominal terms.
    getPrice(xIdx: number, yIdx: number): Decimal {
        const yv: Decimal = this.virtualBalance(yIdx);
        const xv: Decimal = this.virtualBalance(xIdx);
        const yvt: Decimal = this.virtualTarget(yIdx);
        const xvt: Decimal = this.virtualTarget(xIdx);
        return yv.mul(xvt).div(xv.mul(yvt)).pow(2);
    }

    // NOT IMPLEMENTED - interface methods inherited from BasePoolState are not compatible with Burve.
    // As each pool contains multiple tokens.

    get token0(): Address {
        throw new Error("Not Implemented");
    }

    get token1(): Address {
        throw new Error("Not Implemented");
    }

    get reserve0(): bigint {
        throw new Error("Not Implemented");
    }

    get reserve1(): bigint {
        throw new Error("Not Implemented");
    }

    // Internal math

    v(idx: number, x?: Decimal): Decimal {
        x = x ?? (this.balances[idx] as Decimal);
        return Value.v(this.target, this.pool.es[idx] as Decimal, x);
    }

    x(idx: number, value: Decimal) {
        return Value.x(this.target, this.pool.es[idx] as Decimal, value);
    }

    vD(idx: number) {
        return Value.virtualCap(this.target, this.pool.es[idx] as Decimal).minus(this.v(idx));
    }

    virtualBalance(idx: number, x?: Decimal) {
        x = x ?? (this.balances[idx] as Decimal);
        return Value.virtualBalance(this.target, this.pool.es[idx] as Decimal, x);
    }

    virtualTarget(idx: number) {
        return Value.virtualTarget(this.target, this.pool.es[idx] as Decimal);
    }

    virtualCap(idx: number) {
        return Value.virtualCap(this.target, this.pool.es[idx] as Decimal);
    }

    getMinX(xIdx: number): Decimal {
        return Value.minXPerT(this.pool.es[xIdx] as Decimal).mul(this.target).plus(NOM_BALANCE_DE_MINIMUS).ceil();
    }

    getMaxX(_xIdx: number): Decimal {
        return this.target.mul(2).minus(NOM_BALANCE_DE_MINIMUS).floor();
    }
}