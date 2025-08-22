export const mixedAdjustorEventsAbi = [
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "token",
        internalType: "address",
        type: "address",
        indexed: true,
      },
      {
        name: "adjustor",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "AdjustorChanged",
  },
  {
    type: "event",
    anonymous: false,
    inputs: [
      {
        name: "adjustor",
        internalType: "address",
        type: "address",
        indexed: true,
      },
    ],
    name: "DefaultAdjustorChanged",
  },
] as const;
