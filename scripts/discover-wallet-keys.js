import {createWalletClient} from "../src/indy-wallet-client";
import {findKeyForWallet, findKeysForWallets, listWallets} from "../src/indytools";


const keyDictionary = ['foo', 'bar', '123', 'key'];

async function run() {
  const wallets = await listWallets();
  const walletKeyPairs = await findKeysForWallets(wallets, keyDictionary);
  console.log(JSON.stringify(walletKeyPairs, null, 2))
}

run();