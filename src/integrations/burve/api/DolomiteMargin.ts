import { type Address, erc4626Abi, getContract, type GetContractReturnType, type PublicClient } from "viem"
import { iDolomiteMarginAbi } from "../abi/iDolomiteMarginAbi"  

export class DolomiteMarginAPI {
    private readonly contract: GetContractReturnType<typeof iDolomiteMarginAbi, PublicClient, Address>;

    constructor(address: Address, client: PublicClient) {
        this.contract = getContract({
            address: address,
            abi: iDolomiteMarginAbi,
            client: client
        });    
    }

    async getMarketIdByTokenAddress(token: Address): Promise<bigint> {
        return await this.contract.read.getMarketIdByTokenAddress([token])
    }
}