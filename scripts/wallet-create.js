import {createWalletClient} from "../lib/client";

const walletName = process.env.WALLET;
const walletKey = process.env.KEY;

async function run() {
  if (!walletName) {
    console.error(`Error: Wallet name not specified`);
    return
  }
  if (!walletKey) {
    console.error(`Error: Wallet key not specified`);
    return
  }
  const wallet = await createWalletClient(walletName, walletKey);
  if (wallet.wasWalletFileCreated()) {
    console.error(`Error: Wallet ${walletName} seems to already exist!`);
    return
  }

  await wallet.createWallet();

  if (!wallet.wasWalletFileCreated()) {
    console.error(`Error: Wallet was not created.`);
    return
  }
}

run();