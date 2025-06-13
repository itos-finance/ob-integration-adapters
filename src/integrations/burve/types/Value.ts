import Decimal from "decimal.js";

// Thrown when the x balance is too small
export class TooSmallError extends Error {
    constructor(msg?: string) {
        super(msg);
        this.name = "TooSmallError";
    }
}

// Value calculations
export class Value {
    // Returns the minimum amoutn of X we can have per T according to the efficiency factor.
    static minXPerT(e: Decimal): Decimal {
        return new Decimal(1).div(e.plus(2));
    }

    // Calculates the value based on the target, the efficiency factor, and amount of X.
    static v(t: Decimal, e: Decimal, x: Decimal): Decimal {
        const et: Decimal = e.mul(t);
        const virtualBalance: Decimal = x.plus(et);
        const virtualTarget: Decimal = et.plus(t);
        const virtualCap: Decimal = virtualTarget.plus(t);
        const value: Decimal = virtualCap.minus(virtualTarget.pow(2).div(virtualBalance));

        if (value.isNegative()) {
            throw new TooSmallError();
        }

        return value;
    }

    // Calculates the amount of X based on the target, the efficiency factor, and value.
    static x(t: Decimal, e: Decimal, val: Decimal): Decimal {
        const et: Decimal = e.mul(t);
        const vt: Decimal = et.plus(t);
        const vc: Decimal = vt.plus(t);
        const vx: Decimal = vt.pow(2).div(vc.minus(val));
        return vx.minus(et);
    }

    static virtualBalance(t: Decimal, e: Decimal, x: Decimal): Decimal {
        return x.plus(e.mul(t));
    }

    static virtualTarget(t: Decimal, e: Decimal): Decimal {
        return e.mul(t).plus(t);
    }

    static virtualCap(t: Decimal, e: Decimal): Decimal {
        return e.plus(2).mul(t);
    }
}