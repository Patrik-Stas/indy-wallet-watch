import {createWalletClient} from "../src/indy-wallet-client";

const walletName = process.env.WALLET;
const walletKey = process.env.KEY;

async function run() {
  const wallet = await createWalletClient(walletName, walletKey);
  const table = await wallet.toTableString();
  console.log(table);
}

run();