import { type Address } from "viem";

// Gets all multi pool addresses for a given chainId.
// Defaults to Berachain mainnet (80094).
export async function GetContracts(chainId: number = 80094): Promise<Address[]> {
    const response = await fetch(`https://www.burve.fi/api/contracts?chainId=${chainId}`);
    const data = await response.json() as Array<string>;
    return data.map((address: string) => address.toLowerCase() as Address);
}