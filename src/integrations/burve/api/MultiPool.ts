
import { Decimal } from 'decimal.js'
import { type Address, getContract, type GetContractReturnType, type PublicClient } from "viem"
import { iBurveMultiSimplexAbi } from "../abi/iBurveMultiSimplexAbi"
import { vaultFacetAbi } from "../abi/vaultFacetAbi"
import { type ClosureMetadata, maxClosureId, MIN_CLOSURE_ID } from "../types/Closure"
import { MAX_TOKENS } from "../types/Token"
import { range, X128 } from "../utils"

const abi = [...iBurveMultiSimplexAbi, ...vaultFacetAbi]

// API for a Burve Multi Pool
export class MultiPoolAPI {
    public readonly address: Address;
    public readonly client: PublicClient;
    private readonly contract: GetContractReturnType<typeof abi, PublicClient, Address>;

    constructor(address: Address, client: PublicClient) {
        this.address = address;
        this.client = client;
        this.contract = getContract({
            address: address,
            abi: abi,
            client: client
        });
    }

    // -- Simplex Facet --

    // Gets all tokens
    async getTokens(): Promise<Address[]> {
        return await this.contract.read.getTokens() as Address[];
    }

    // Gets all closure metadata
    async getClosures(numTokens: number): Promise<ClosureMetadata[]> {
        const closureIds: number[] = range(MIN_CLOSURE_ID, maxClosureId(numTokens));

        // Can be batched into a single RPC request if the client enables multicall
        const closureData = await Promise.all(closureIds.map((id) => {
            return this.contract.read.getClosureValue([id]);
        }));
    
        return closureData.map((data, index) => {
            return {
                cid: closureIds[index] as number,
                balances: data[2].map((amount) => new Decimal(amount.toString())) as Decimal[] & {
                    length: typeof MAX_TOKENS;
                },
                target: new Decimal(data[1].toString()).div(new Decimal(2).toPower(128)),
            }
        });
    }

    // Gets all efficiency factors
    // Result is converted from an X128 to floating point
    async getEs(): Promise<Decimal[]> {
        const esX128 = await this.contract.read.getEsX128();
        return esX128.map((e) => new Decimal(e.toString()).div(X128));
    }

    // Gets all edge fees
    // Returned array is n x n where n is the number of tokens in the pool 
    // Access should be done with [i][j] where i < j, other locations are NaN
    async getEdgeFees(numTokens: number) {
        // Generates all index pairs (i, j) where i < j
        function generatePairs(n: number): [number, number][] {
            const pairs: [number, number][] = [];
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    pairs.push([i, j]);
                }
            }
            return pairs;
        }
    
        // token pairs (idx0, idx1) where idx0 < idx1
        const pairs: [number, number][] = generatePairs(numTokens);
    
        // Can be batched into a single RPC request if the client enables multicall
        const edgeFeesX128 = await Promise.all(pairs.map(([idx0, idx1]) => {
            return this.contract.read.getEdgeFee([idx0, idx1]);
        }));
    
        // Create n x n array filled with NaN
        const edgeFees = Array(numTokens).fill(null).map(() =>
            Array(numTokens).fill(NaN)
        );
    
        // Fill in the values where i < j and convert from X128
        for (let index = 0; index < pairs.length; index++) {
            const [i, j] = pairs[index] as [number, number];
            edgeFees[i]![j] = new Decimal((edgeFeesX128[index] as unknown as BigInt).toString()).div(X128).toNumber();
        }
    
        return edgeFees;
    }

    // -- Vault Facet --

    // Gets all vaults for a token
    // Returns a tuple of [active, backup] vault addresses
    async getVaults(tokenAddress: Address): Promise<Array<[Address, Address]>> {
        return await this.contract.read.viewVaults([tokenAddress]) as unknown as Array<[Address, Address]>
    }
}