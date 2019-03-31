import indy from 'indy-sdk'
import fs from 'fs'
const homedir = require('os').homedir()

export function createWalletClient (walletName, key) {
  if (!walletName) {
    throw Error('wallet name must be defined')
  }
  if (!key) {
    throw Error('wallet key must be defined')
  }

  const walletConfig = JSON.stringify({ id: walletName, storage_type: 'default' })
  const walletCredentials = JSON.stringify({ key })
  let walletHandle
  let poolHandle

  function wasWalletFileCreated () {
    return fs.existsSync(`${homedir}/.indy_client/wallet/${walletName}`)
  }

  async function createWallet () {
    console.log(`Creating wallet. Wallet config:
    \n${JSON.stringify(walletConfig, null, 2)}.
    \n${JSON.stringify(walletCredentials, null, 2)}`)
    await indy.createWallet(walletConfig, walletCredentials)
    console.log(`New wallet '${walletName}' created.`)
  }

  async function assureWalletExists () {
    if (!wasWalletFileCreated) {
      await createWallet()
    }
  }

  async function openWallet () {
    if (walletHandle) {
      console.warn(`Wallet is ${walletName} already opened (by this client).`)
      return
    }
    walletHandle = await indy.openWallet(walletConfig, walletCredentials)
  }

  async function closeWallet () {
    if (!walletHandle) {
      console.warn(`Wallet is ${walletName} already opened (by this client).`)
      return
    }
    await indy.closeWallet(walletHandle)
    walletHandle = undefined
  }

  async function safeWalletOp (callable) {
    if (!walletHandle) {
      await openWallet()
      const result = await callable()
      await closeWallet()
      return result
    } else {
      return callable()
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function openPoolLedger (poolName) {
    if (!poolHandle) {
      indy.setProtocolVersion(2)
      console.log(`Connecting to ${poolName}`)
      poolHandle = await indy.openPoolLedger(poolName)
      console.log('Connected.')
    } else {
      console.warn(`Client for wallet ${walletName} already connected to pool ${poolName}`)
    }
  }

  // eslint-disable-next-line no-unused-vars
  async function closePoolLedger () {
    if (poolHandle) {
      await indy.closePoolLedger()
      poolHandle = undefined
    } else {
      console.warn(`Client for wallet ${walletName} is not connected to any pool.`)
    }
  }

  // --------------------------------- INDY WALLET OPS -------------------------------------
  async function listMyCredentials () {
    const code = async () => {
      return indy.proverGetCredentials(walletHandle)
    }
    return safeWalletOp(code)
  }

  async function listMyDidsWithMeta () {
    return safeWalletOp(async () => indy.listMyDidsWithMeta(walletHandle))
  }

  async function listPairwise () {
    return safeWalletOp(async () => indy.listPairwise(walletHandle))
  }

  async function getMyDidWithMeta (did) {
    return safeWalletOp(async () => indy.getMyDidWithMeta(walletHandle, did))
  }

  async function createDidWithMeta (seed, metadata) {
    return safeWalletOp(async () => indy.createAndStoreMyDid(walletHandle, seed, metadata))
  }

  async function writeTrustAnchorOnLedger (sourceDid, did, verkey, alias) {
    return safeWalletOp(async () => indy.writeNymOnLedger(sourceDid, did, verkey, alias, 'TRUST_ANCHOR'))
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
    listPairwise
  }
}
