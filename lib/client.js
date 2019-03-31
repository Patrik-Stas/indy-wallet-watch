import indy from "indy-sdk";
import fs from 'fs';
const homedir = require('os').homedir();

export function createWalletClient(walletName, key) {

  if (!walletName) {
    throw Error("wallet name must be defined")
  }
  if (!key) {
    throw Error("wallet key must be defined")
  }

  const walletConfig = JSON.stringify({id: walletName, storage_type: "default"});
  const walletCredentials = JSON.stringify({key});
  let walletHandle = undefined;
  let poolHandle = undefined;

  function wasWalletFileCreated() {
    return fs.existsSync(`${homedir}/.indy_client/wallet/${walletName}`);
  }

  async function createWallet() {
    console.log(`Creating wallet. Wallet config:
    \n${JSON.stringify(walletConfig, null, 2)}.
    \n${JSON.stringify(walletCredentials, null, 2)}`);
    await indy.createWallet(walletConfig, walletCredentials);
    console.log(`New wallet '${walletName}' created.`)
  }

  async function assureWalletExists() {
    if (!wasWalletFileCreated) {
      await createWallet()
    }
  }

  async function openWallet() {
    if (!!walletHandle) {
      console.warn(`Wallet is ${walletName} already opened (by this client).`)
      return
    }
    walletHandle = await indy.openWallet(walletConfig, walletCredentials);
  }

  async function closeWallet() {
    if (!walletHandle) {
      console.warn(`Wallet is ${walletName} already opened (by this client).`)
      return
    }
    await indy.closeWallet(walletHandle);
    walletHandle = undefined;
  }

  async function safeWalletOp(callable) {
    if (!walletHandle) {
      await openWallet();
      const result = await callable();
      await closeWallet();
      return result
    } else {
      return await callable();
    }
  }


  async function openPoolLedger(poolName) {
    if (!poolHandle) {
      indy.setProtocolVersion(2);
      console.log(`Connecting to ${poolName}`);
      poolHandle = await indy.openPoolLedger(poolName);
      console.log('Connected.');
    } else {
      console.warn(`Client for wallet ${walletName} already connected to pool ${poolName}`)
    }
  }

  async function closePoolLedger() {
    if (!!poolHandle) {
      await indy.closePoolLedger();
      poolHandle = undefined
    } else {
      console.warn(`Client for wallet ${walletName} is not connected to any pool.`)
    }
  }


  // --------------------------------- INDY WALLET OPS -------------------------------------
  async function listMyCredentials() {
    const code = async () => {
      return await indy.proverGetCredentials(walletHandle);
    };
    return await safeWalletOp(code)
  }

  async function listMyDidsWithMeta() {
    return await safeWalletOp(async () => await indy.listMyDidsWithMeta(walletHandle));
  }

  async function listPairwise() {
    return await safeWalletOp(async () => await indy.listPairwise(walletHandle));
  }

  async function getMyDidWithMeta(did) {
    return await safeWalletOp(async () => await indy.getMyDidWithMeta(walletHandle, did));
  }

  async function createDidWithMeta(seed, metadata) {
    return await safeWalletOp(async () => await indy.createAndStoreMyDid(walletHandle, seed, metadata));
  }

  async function writeTrustAnchorOnLedger(sourceDid, did, verkey, alias) {
    return await safeWalletOp(async () => await indy,writeNymOnLedger(sourceDid, did, verkey, alias, "TRUST_ANCHOR"));
  }

  return {
    wasWalletFileCreated,
    createWallet,
    assureWalletExists,
    listMyDidsWithMeta,
    listMyCredentials,
    writeTrustAnchorOnLedger,
    createDidWithMeta,
    getMyDidWithMeta,
    openWallet,
    closeWallet,
    listPairwise,
  }
}