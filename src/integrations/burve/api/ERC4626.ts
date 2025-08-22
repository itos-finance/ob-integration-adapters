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

    async getTotalAssets(): Promise<bigint> {
        return await this.contract.read.totalAssets()
    }
}