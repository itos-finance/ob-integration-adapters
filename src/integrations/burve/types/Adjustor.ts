import { type Address, type Client, getContract, type GetContractReturnType } from "viem";
import { iAdjustorAbi } from "../abi/iAdjustorAbi";

// Adjustor interface
export interface IAdjustor {
    // Converts a real amount to a nominal amount
    toNominal(token: Address, real: bigint, roundUp: boolean): Promise<bigint>;
    // Converts a nominal amount to a real amount
    toReal(token: Address, nominal: bigint, roundUp: boolean): Promise<bigint>;
}

// Adjustor implementation for conversions onchain
export class Adjustor implements IAdjustor {
    private readonly contract: GetContractReturnType<typeof iAdjustorAbi, Client, Address>

    constructor(public readonly address: Address, public readonly client: Client) {
        this.contract = getContract({
            address: this.address,
            abi: iAdjustorAbi,
            client: this.client
        });
    }

    async toNominal(token: Address, real: bigint, roundUp: boolean): Promise<bigint> {
        return await this.contract.read.toNominal([token, real, roundUp]);
    }

    async toReal(token: Address, nominal: bigint, roundUp: boolean): Promise<bigint> {
        return await this.contract.read.toReal([token, nominal, roundUp]);
    }
}