import { type Address, type PublicClient, getContract, type GetContractReturnType } from "viem";
import { iAdjustorAbi } from "../abi/iAdjustorAbi";
import { type Token } from "../types/Token";
import Decimal from "decimal.js";

// Adjustor implementation for conversions onchain
export class AdjustorAPI {
    private readonly contract: GetContractReturnType<typeof iAdjustorAbi, PublicClient, Address>

    constructor(address: Address, client: PublicClient) {
        this.contract = getContract({
            address: address,
            abi: iAdjustorAbi,
            client: client
        });
    }

    async toNominal(token: Address, real: bigint, roundUp: boolean): Promise<bigint> {
        return await this.contract.read.toNominal([token, real, roundUp]);
    }

    async toReal(token: Address, nominal: bigint, roundUp: boolean): Promise<bigint> {
        return await this.contract.read.toReal([token, nominal, roundUp]);
    }

    async realPerNominalRatio(token: Token): Promise<Decimal> {
        const real: bigint = 100n * (10n ** BigInt(token.decimals));
        const nominal: bigint = await this.toNominal(token.address, real, false);
        return new Decimal(real.toString()).div(new Decimal(nominal.toString()));
    }
}