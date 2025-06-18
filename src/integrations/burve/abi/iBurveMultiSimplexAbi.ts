
export const iBurveMultiSimplexAbi = [
    {
        type: 'function',
        inputs: [],
        name: 'getAdjustor',
        outputs: [{ name: '', internalType: 'address', type: 'address' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [{ name: 'closureId', internalType: 'uint16', type: 'uint16' }],
        name: 'getClosureValue',
        outputs: [
            { name: 'n', internalType: 'uint8', type: 'uint8' },
            { name: 'targetX128', internalType: 'uint256', type: 'uint256' },
            { name: 'balances', internalType: 'uint256[16]', type: 'uint256[16]' },
            { name: 'valueStaked', internalType: 'uint256', type: 'uint256' },
            { name: 'bgtValueStaked', internalType: 'uint256', type: 'uint256' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [
            { name: 'idx0', internalType: 'uint8', type: 'uint8' },
            { name: 'idx1', internalType: 'uint8', type: 'uint8' },
        ],
        name: 'getEdgeFee',
        outputs: [
            { name: 'edgeFeeX128', internalType: 'uint128', type: 'uint128' },
        ],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getEsX128',
        outputs: [{ name: '', internalType: 'uint256[16]', type: 'uint256[16]' }],
        stateMutability: 'view',
    },
    {
        type: 'function',
        inputs: [],
        name: 'getTokens',
        outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
        stateMutability: 'view',
    },
] as const