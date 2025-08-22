export const iDolomiteMarginAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getMarketIdByTokenAddress",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    type: "event",
    name: "LogDeposit",
    inputs: [
      { name: "accountOwner", type: "address", indexed: true },
      { name: "accountNumber", type: "uint256" },
      { name: "market", type: "uint256" },
      {
        name: "update",
        type: "tuple",
        components: [
          {
            name: "deltaWei",
            type: "tuple",
            components: [
              { name: "sign", type: "bool" },
              { name: "value", type: "uint256" }, // <-- uint256 here
            ],
          },
          {
            name: "newPar",
            type: "tuple",
            components: [
              { name: "sign", type: "bool" },
              { name: "value", type: "uint128" }, // <-- uint128 here
            ],
          },
        ],
      },
      { name: "from", type: "address" },
    ],
  },
  {
    type: "event",
    name: "LogWithdraw",
    inputs: [
      { name: "accountOwner", type: "address", indexed: true },
      { name: "accountNumber", type: "uint256" },
      { name: "market", type: "uint256" },
      {
        name: "update",
        type: "tuple",
        components: [
          {
            name: "deltaWei",
            type: "tuple",
            components: [
              { name: "sign", type: "bool" },
              { name: "value", type: "uint256" }, // <-- uint256 here
            ],
          },
          {
            name: "newPar",
            type: "tuple",
            components: [
              { name: "sign", type: "bool" },
              { name: "value", type: "uint128" }, // <-- uint128 here
            ],
          },
        ],
      },
      { name: "to", type: "address" },
    ],
  },
] as const;
