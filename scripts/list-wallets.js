import {listWallets} from '../src/indytools'

async function run() {
  const wallets = await listWallets();
  console.log(wallets);
}

run();