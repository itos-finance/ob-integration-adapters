export const iBurveMultiSwapAbi = [
	{
		type: 'function',
		inputs: [
			{ name: 'recipient', internalType: 'address', type: 'address' },
			{ name: 'inToken', internalType: 'address', type: 'address' },
			{ name: 'outToken', internalType: 'address', type: 'address' },
			{ name: 'amountSpecified', internalType: 'int256', type: 'int256' },
			{ name: 'amountLimit', internalType: 'uint256', type: 'uint256' },
			{ name: '_cid', internalType: 'uint16', type: 'uint16' },
		],
		name: 'swap',
		outputs: [
			{ name: 'inAmount', internalType: 'uint256', type: 'uint256' },
			{ name: 'outAmount', internalType: 'uint256', type: 'uint256' },
		],
		stateMutability: 'nonpayable',
	},
] as const