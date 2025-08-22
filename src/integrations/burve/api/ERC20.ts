
import { type Address, getContract, type GetContractReturnType, type PublicClient, erc20Abi } from "viem"

export class ERC20API {
    private readonly contract: GetContractReturnType<typeof erc20Abi, PublicClient, Address>;

    constructor(address: Address, client: PublicClient) {
        this.contract = getContract({
            address: address,
            abi: erc20Abi,
            client: client
        });    
    }

    // Gets the decimals
    async getDecimals(): Promise<number> {
        return await this.contract.read.decimals()
    }
}