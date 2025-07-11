
import { type Address, getContract, type GetContractReturnType, type PublicClient, erc4626Abi } from "viem"

export class ERC4626API {
    private readonly contract: GetContractReturnType<typeof erc4626Abi, PublicClient, Address>;

    constructor(address: Address, client: PublicClient) {
        this.contract = getContract({
            address: address,
            abi: erc4626Abi,
            client: client
        });    
    }

    // Gets the max withdraw amount for a given vault and owner
    async getMaxWithdraw(owner: Address): Promise<bigint> {
        return await this.contract.read.maxWithdraw([owner])
    }
}