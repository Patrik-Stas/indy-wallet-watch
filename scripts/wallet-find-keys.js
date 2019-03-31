import {createWalletClient} from "../lib/client-utils";
import {findKeyForWallet, findKeysForWallets, listWallets} from "../lib/indy-utils";


const keyDictionary = ['foo', 'bar', '123', 'key'];

async function run() {
  const wallets = await listWallets();
  const walletKeyPairs = await findKeysForWallets(wallets, keyDictionary);
  console.log(JSON.stringify(walletKeyPairs, null, 2))
}

run();