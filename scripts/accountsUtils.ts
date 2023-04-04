import { TransactionReceipt } from "@ethersproject/providers";
import { BigNumberish, Wallet } from "ethers";
import { ethers } from "hardhat";


/** CELOSAGE:
 * Created as tutorial for Celo developers.
 *    Author: ISAAC J a.k.a Bobelr
 *    Discord: Bobelr#8524
 *    Github: https://github.com/bobeu
 * 
 *    Get started: https://doc.celo.org
 */
// Types and interfaces for Typescript compatibility
export type CNumber = BigNumberish;
export interface TrxProps {
  data?: string;
  to?: string;
  value?: string;
  functionName: string;
  signer: Wallet
}

// Period which cheques are valid
const VALIDITY_WINDOW_IN_HRS = 1;

const hexlify = (x:number) => {
  return ethers.utils.hexlify(x);
}

// Gas cost
const GAS = hexlify(1500000);

// Gas price
const GASPRICE = hexlify(3000000000);

// Celo's Websocker URI
const SOCKET_URL = "wss://alfajores-forno.celo-testnet.org/ws";

// Set up provider
const rpcInfo = Object.assign({}, {
  CELOALFAJORES: {
    name: 'Alfajores',
    rpc: SOCKET_URL,
    chainId: 44787,
  },
}) 
// 3. Create ethers provider instance
const webSocketProvider = new ethers.providers.WebSocketProvider(
  rpcInfo.CELOALFAJORES.rpc, 
  {
    chainId: rpcInfo.CELOALFAJORES.chainId,
    name: rpcInfo.CELOALFAJORES.name,
  }
);

// Replace the first argument with your private keys
const owner = new ethers.Wallet("ba28d5cea192f121db5f1dd7f501532170bb7bb984c4d3747df3e251e529f77d", webSocketProvider);
const payee = new ethers.Wallet("8c0dc6d793391e9c1baf18285e7dd05cd504b85d620045b33f33600a9db1203e", webSocketProvider);

console.log(`Payee.address: ${payee.address}\n`);
console.log(`Payee.public key: ${payee.publicKey}\n`);

async function getBalances() {
  // Fetching balances using the provider
  const payee_balance_using_provider = ethers.utils.parseUnits((await webSocketProvider.getBalance(payee.address)).toString(), 'wei');
  const owner_balance_using_provider = ethers.utils.parseUnits((await webSocketProvider.getBalance(owner.address)).toString(), 'wei');
  
  // Fetching balances from the signer object
  const payee_wallet_balance = ethers.utils.parseUnits((await payee.getBalance()).toString(), 'wei');
  const owner_wallet_balance = ethers.utils.parseUnits((await owner.getBalance()).toString(), 'wei');

  console.log(`
    payee_balance_using_provider: ${payee_balance_using_provider}\n
    owner_balance_using_provider: ${owner_balance_using_provider}\n
    payee_wallet_balance: ${payee_wallet_balance}\n
    owner_wallet_balance: ${owner_wallet_balance}\n
    
  `);

  return {
    payee_balance_using_provider,
    owner_balance_using_provider,
    payee_wallet_balance,
    owner_wallet_balance
  }
}

// Export the utilities to use anywhere in your program.
export const utils = () => {
  return {
    ethers,
    GAS,
    GASPRICE,
    PAYEE: payee,
    OWNER: owner,
    VALIDITY_WINDOW_IN_HRS,
    webSocketProvider,
    getBalances: getBalances,
    waitForTrannsaction: async function (trx: any) {
      console.log("Waiting for confirmation ...");
      return await trx.wait(2);
    },
  }
}