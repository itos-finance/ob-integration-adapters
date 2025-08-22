export const vaultFacetAbi = [
    {
        type: 'function',
        inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
        name: 'viewVaults',
        outputs: [
            { name: 'active', internalType: 'address', type: 'address' },
            { name: 'backup', internalType: 'address', type: 'address' },
        ],
        stateMutability: 'view',
    },
] as const