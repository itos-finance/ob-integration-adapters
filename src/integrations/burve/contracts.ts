import { type MultiPoolMetadata } from "./types/MultiPool";

// Berachain Bepolia Multi Pools
export const MULTI_POOLS_METADATA: MultiPoolMetadata[] = [
    // BGT Multi Pool 
    {
        address: "0x3696Eb1ebF7C490d72733518b8a39fc571e046A6",
        tokens: [
            // WBERA 
            {
                address: "0x6AED803aa912E94a8a2fB99E0F410A5e18f99F50",
                decimals: 18
            },
            // iBGT
            {
                address: "0xCE8e2407Cd3A0B4a84B4edE6d78e0d8129709071",
                decimals: 18
            },
            // stBGT
            {
                address: "0xfA84c22342382F89f21F70dd71A92D8604699308",
                decimals: 18
            },
        ]
    },
    // USD Multi Pool
    {
        address: "0xe424E56389143FfE1a1C297194D39C8a12969625",
        tokens: [
            // USDC
            {
                address: "0xD220595e861D90a1acA2cc500B89AF6d1E8f3F6B",
                decimals: 6
            },
            // DAI
            {
                address: "0x8C7A09cB77C9f5Fb63979DEAA20B4BFc85d89111",
                decimals: 18
            },
            // MIM
            {
                address: "0x26B969E9B27ECd6E54188c3e9CFd18e01dbBDA53",
                decimals: 18
            },
            // USDA
            {
                address: "0x16a523a854de02CACeFE0C66A6f296EEB0638989",
                decimals: 6
            },
            // USDS
            {
                address: "0x1c90529410Ffd39556d13d69326AA9f50C43b0D2",
                decimals: 6
            },
            // atUSD
            {
                address: "0x435335D9CD9AeaDf3721D7a8E5f70E6B1233D562",
                decimals: 6
            },
            // USDW
            {
                address: "0x0B6d791E1c857E536C7f6739E9AdaB11AEe43C6D",
                decimals: 6
            }
        ]
    }
]