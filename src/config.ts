import { http, createPublicClient } from "viem";
import { berachain, berachainBepolia } from "viem/chains";

export const berachainClient = createPublicClient({
	chain: berachain,
	transport: http(),
});

export const berachainBepoliaClient = createPublicClient({
	batch: {
		multicall: true
	},
	chain: berachainBepolia,
	transport: http(),
});