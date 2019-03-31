import {listWallets} from '../lib/indy-utils'

async function run() {
  const wallets = await listWallets();
  console.log(wallets);
}

run();