const util = require('util')
const fs = require('fs')
const createWalletClient = require('./client')
const _ = require('lodash')
const homedir = require('os').homedir()
let glob = require('glob')
const rimraf = require('rimraf')
const asyncrimraf = util.promisify(rimraf)

function getWalletDirectory () {
  return `${homedir}/.indy_client/wallet/`
}

function walletExists (walletName) {
  return fs.existsSync(`${getWalletDirectory()}${walletName}`)
}

async function deleteWallet (walletName, isDryRun) {
  if (isDryRun) {
    console.log(`[DRY RUN] Wallet ${walletName} would be deleted.`)
  } else {
    return asyncrimraf(`${getWalletDirectory()}${walletName}`)
  }
}

async function listWallets (globPattern = '*') {
  if (globPattern.match(/\.\./)) {
    throw Error(`Wallet selection glob cannot contain ".." to go up in directory tree.`)
  }
  const walletDirectory = getWalletDirectory()
  return glob.sync(globPattern, { cwd: walletDirectory })
}

async function findKeyForWallet (walletName, testKeys) {
  for (let i = 0; i < testKeys.length; i++) {
    const testkey = testKeys[i]
    const wallet = await createWalletClient(walletName, testkey)
    let threw = false
    try {
      await wallet.listMyDidsWithMeta()
    } catch (err) {
      threw = true
    }
    if (!threw) {
      return testkey
    }
  }
  return undefined
}

async function findKeysForWallets (walletNames, tryKeys) {
  const resultPromises = walletNames.map(async name => {
    const key = await findKeyForWallet(name, tryKeys)
    return { name, key }
  })
  const results = await Promise.all(resultPromises)
  const selected = _.keyBy(results, 'name')
  const discovered = _.pickBy(selected, o => !!o.key)
  const unknown = _.pickBy(selected, o => !o.key)
  return { discovered, unknown }
}

module.exports.listWallets = listWallets
module.exports.findKeyForWallet = findKeyForWallet
module.exports.findKeysForWallets = findKeysForWallets
module.exports.walletExists = walletExists
module.exports.deleteWallet = deleteWallet
