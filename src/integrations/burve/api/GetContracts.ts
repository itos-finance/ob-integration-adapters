import { type Address } from "viem";
import { MultiPool } from '../types/MultiPool';
import { DecimalAdjustor } from '../types/adjustor/DecimalAdjustor';
import { ERC20API } from './ERC20';
import { ERC4626API } from './ERC4626';
import { MultiPoolAPI } from './MultiPool';

// Gets all multi pool addresses for a given chainId.
// Defaults to Berachain mainnet (80094).
export async function GetContracts(chainId: number = 80094): Promise<Address[]> {
    const response = await fetch(`https://www.burve.fi/api/contracts?chainId=${chainId}`);
    const data = await response.json() as Array<string>;
    return data.map((address: string) => address.toLowerCase() as Address);
}

// Creates a MultiPool instance for a given pool address using MultiPoolAPI
export async function CreateMultiPool(api: MultiPoolAPI): Promise<MultiPool> {
    // Get tokens first (needed for other operations)
    const tokenAddresses: Address[] = await api.getTokens();

    // Run all independent operations in parallel
    const [tokens, vaults, es, edgeFees] = await Promise.all([
        // Get tokens with decimals
        Promise.all(tokenAddresses.map(async (tokenAddress: Address) => {
            const erc20Api: ERC20API = new ERC20API(tokenAddress, api.client);
            const decimals: number = await erc20Api.getDecimals();
            return {
                address: tokenAddress,
                decimals: decimals
            }
        })),

        // Get vaults with max withdraws
        Promise.all(tokenAddresses.map(async (tokenAddress: Address) => {
            const [active, _]: Array<[Address, Address]> = await api.getVaults(tokenAddress);
            const erc4626Api: ERC4626API = new ERC4626API(active as unknown as Address, api.client);
            const maxWithdraw: bigint = await erc4626Api.getMaxWithdraw(api.address);
            return {
                address: active as unknown as Address,
                maxWithdraw: maxWithdraw
            }
        })),

        // Get efficiency factors
        api.getEs(),

        // Get edge fees (needs token count)
        api.getEdgeFees(tokenAddresses.length)
    ]);

    // Configure decimal adjustor
    const adjustor: DecimalAdjustor = new DecimalAdjustor();
    for (const token of tokens) {
        adjustor.registerToken(token.address, token.decimals);
    }

    return new MultiPool({ address: api.address, tokens, vaults, adjustor, es, taxes: edgeFees })
}
