import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { abi, bytecode } from "../artifacts/contracts/ChequePayment.sol/ChequePayment.json";
import { utils, CNumber } from "./accountsUtils";

async function main() {
  // Import the utilities
  const {
    ethers,
    PAYEE, 
    OWNER, 
    getBalances,
    // signAndSendTrx,
    webSocketProvider,
    waitForTrannsaction,
    // sendSignedTransaction,
    VALIDITY_WINDOW_IN_HRS } = utils();

  await getBalances();

  // Whether to log data to console or not. You can always toggle it.
  let logData = true;

  console.log(`Deploying and signing Cheque contract from account: ${OWNER.address}`);
  
  // Create an instance of the Chequepayment contract 
  var chequePayment = new ethers.ContractFactory(abi, bytecode, OWNER);
  
  // Run the constructor
  const chequePaymentTrx = await chequePayment.deploy()
  await chequePaymentTrx.deployed();

  // Create contract instance
  const contractInstance = new ethers.Contract(chequePaymentTrx.address, abi, webSocketProvider);
  
  const contractAddress = contractInstance.address;
  console.log(`Contract address: ${contractAddress}`);
  
  // Retrieves opencheques
  async function getOpenCheques(funcName: string) {
    await contractInstance.openCheques()
    .then((openCheques: { toString: () => any; }) => {
      console.log(`\nOpenCheques balance after ${funcName} was called : ${openCheques.toString()}`);
    });
  }

  // Owner draws up a new cheque.
  async function drawCheque(amount: string, value: string) {
    const trx = await contractInstance.connect(OWNER).drawCheque(
      PAYEE.address, 
      amount, 
      VALIDITY_WINDOW_IN_HRS,
      {
        value: value
      }
    );
    // await signAndSendTrx({
    //   value: value,
    //   data: drawCheque?.encodeABI(),
    //   to: contractAddress,
    //   functionName: "DrawCheque",
    //   signer: OWNER
    // })
    await waitForTrannsaction(trx)
    .then(async function(receipt: any){
      logData && console.log("\nDrawCheque Trx hash", receipt.transactionHash);
      await getOpenCheques("DrawCheque");
    });
  }

  // Owner can increase the previously drawn cheque
  async function increaseCheque(amount: string, msgValue: string) {
    const trx = await contractInstance.connect(OWNER).increaseChequeValue(
      PAYEE.address, 
      amount,
      {value: msgValue}
    );
    // await signAndSendTrx({
      
    //   // data: increaseChequeValue?.encodeABI(),
    //   to: contractAddress,
    //   functionName: 'IncreaseCheque',
    //   signer: OWNER
    // })
    // const receipt = await trx.wait(1);
    await waitForTrannsaction(trx)
    .then(async function(receipt: any){
      logData && console.log("\nTrx receipt: ", receipt.transactionHash);
    await getOpenCheques("IncreaseCheque");
    });
  }

  // Owner can reduce previously drawn cheque
  async function reduceCheque(amount: string) {
    const trx = await contractInstance.connect(OWNER).reduceChequeValue(PAYEE.address, amount)
    // await signAndSendTrx({
    //   // data: reduceChequeValue?.encodeABI(),
    //   to: contractAddress,
    //   functionName: 'ReduceCheque',
    //   signer: OWNER
    // })
    await waitForTrannsaction(trx)
      .then(async function(receipt: any){
        logData && console.log("\nTrx receipt: ", receipt);
        await getOpenCheques("ReduceCheque");
    });
  }

  // Owner is able to cancel cheques provided they're within the cancellation window.
  async function cancelCheque() {
    const trx = await contractInstance.connect(OWNER).cancelDrawnCheque(PAYEE.address);
    // await signAndSendTrx({
    //   data: cancelDrawnCheque?.encodeABI(),
    //   to: contractAddress,
    //   functionName: 'CancelCheque',
    //   signer: OWNER
    // })
    // const receipt = await trx.wait(1);
    await waitForTrannsaction(trx)
      .then(async function(receipt: any){
        logData && console.log("\nTrx receipt: ", receipt.transactionHash);
        await getOpenCheques("CancelCheque");
    });
  }
  
  // Payee will cashout the cheque if they have one drawn in their favor.
  async function cashout() {
    const trx = await contractInstance.connect(PAYEE).cashout();
    await waitForTrannsaction(trx)
    // await signAndSendTrx({
    //   data: cashout?.encodeABI(),
    //   to: contractAddress,
    //   functionName: 'Cashout',
    //   signer: PAYEE
    // })
      .then(async function(receipt: any){
        logData && console.log("\nTrx receipt: ", receipt);
        await getOpenCheques("Cashout");
    });
  }

  // const hexlify = (x:string | number) => {
  //   return ethers.utils.hexValue(x);
  // }
  
  // Initial cheque amount
  const INIT_CHEQUE_AMOUNT = '10000000000000000';
  const SUB_CHEQUE_AMOUNT = '20000000000000000';
  let increment = '50000000000000000';
  let decrement = '40000000000000000';
  const MSG_VALUE = '100000000000000000';

  await drawCheque(INIT_CHEQUE_AMOUNT, MSG_VALUE);
  await cancelCheque();
  await drawCheque(SUB_CHEQUE_AMOUNT, MSG_VALUE);
  await increaseCheque(increment, MSG_VALUE);
  await reduceCheque(decrement);
  await cashout();
}  
  // We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});