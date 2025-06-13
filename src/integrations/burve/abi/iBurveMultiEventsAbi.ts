
export const iBurveMultiEventsAbi = [
    {
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'i', internalType: 'uint8', type: 'uint8', indexed: true },
            { name: 'j', internalType: 'uint8', type: 'uint8', indexed: true },
            {
                name: 'edgeFeeX128',
                internalType: 'uint128',
                type: 'uint128',
                indexed: false,
            },
        ],
        name: 'EdgeFeeSet',
    },
    {
        type: 'event',
        anonymous: false,
        inputs: [
            { name: 'cid', internalType: 'uint16', type: 'uint16', indexed: false },
            {
                name: 'targetX128',
                internalType: 'uint256',
                type: 'uint256',
                indexed: false,
            },
            {
                name: 'balances',
                internalType: 'uint256[16]',
                type: 'uint256[16]',
                indexed: false,
            },
        ],
        name: 'NewClosureBalances',
    },
    {
        type: 'event',
        anonymous: false,
        inputs: [
            {
                name: 'defaultEdgeFeeX128',
                internalType: 'uint128',
                type: 'uint128',
                indexed: false,
            },
            {
                name: 'protocolTakeX128',
                internalType: 'uint128',
                type: 'uint128',
                indexed: false,
            },
        ],
        name: 'SimplexFeesSet',
    },
    {
        type: 'event',
        anonymous: false,
        inputs: [
            {
                name: 'admin',
                internalType: 'address',
                type: 'address',
                indexed: true,
            },
            {
                name: 'token',
                internalType: 'address',
                type: 'address',
                indexed: true,
            },
            {
                name: 'fromEsX128',
                internalType: 'uint256',
                type: 'uint256',
                indexed: false,
            },
            {
                name: 'toEsX128',
                internalType: 'uint256',
                type: 'uint256',
                indexed: false,
            },
        ],
        name: 'EfficiencyFactorChanged',
    },
] as const