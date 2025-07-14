export const iAdjustorAbi = [
	{
		type: 'function',
		inputs: [
			{ name: 'token', internalType: 'address', type: 'address' },
			{ name: 'real', internalType: 'int256', type: 'int256' },
			{ name: 'roundUp', internalType: 'bool', type: 'bool' },
		],
		name: 'toNominal',
		outputs: [{ name: 'nominal', internalType: 'int256', type: 'int256' }],
		stateMutability: 'view',
	},
	{
		type: 'function',
		inputs: [
			{ name: 'token', internalType: 'address', type: 'address' },
			{ name: 'nominal', internalType: 'int256', type: 'int256' },
			{ name: 'roundUp', internalType: 'bool', type: 'bool' },
		],
		name: 'toReal',
		outputs: [{ name: 'real', internalType: 'int256', type: 'int256' }],
		stateMutability: 'view',
	},
] as const