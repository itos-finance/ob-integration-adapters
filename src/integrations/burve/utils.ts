import { Decimal } from 'decimal.js';

// X128 constant
export const X128: Decimal = new Decimal(2).toPower(128);

// Generates a range of numbers from start to end (inclusive)
export function range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}