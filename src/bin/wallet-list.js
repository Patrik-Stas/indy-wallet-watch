#!/usr/bin/env node
const findKeysForWallets = require('../indy-utils').findKeysForWallets
const { listWallets } = require('../indy-utils')
const { runScript } = require('./script-comon')

const optionDefinitions = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Display this usage guide.'
  },
  {
    name: 'filter',
    alias: 'f',
    type: String,
    description: 'Glob to select target wallets.',
    defaultValue: '*'
  },
  {
    name: 'find-keys',
    type: Boolean,
    description: 'Should we try to find out and print wallet keys.'
  },
  {
    name: 'dictionary',
    alias: 'd',
    type: String,
    description: 'Key dictionary as JSON array. Only used with --find-keys option.',
    defaultValue: '["key","123"]'
  }
]

const usage = [
  {
    header: 'Typical Example',
    content: 'A simple example demonstrating typical usage.'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  },
  {
    content: 'Project home: {underline https://github.com/Patrik-Stas/indy-wallet-watch}'
  }
]

function printWallet (name, key = '???') {
  console.log(`${name}     ${key}`)
}

async function run (options) {
  // console.debug(JSON.stringify(options))
  const wallets = await listWallets(options.filter)

  if (options['find-keys'] === true) {
    const keyDictionary = JSON.parse(options['dictionary'])
    const { discovered, unknown } = await findKeysForWallets(wallets, keyDictionary)
    for (const walletKey of Object.keys(discovered)) {
      printWallet(discovered[walletKey].name, discovered[walletKey].key)
    }
    for (const walletKey of Object.keys(unknown)) {
      printWallet(unknown[walletKey].name, null)
    }
  } else {
    console.log(wallets)
  }
}

function areOptionsValid (options) {
  console.log(`Validating ${JSON.stringify(options)}`)
  if (options['filter'] === null) {
    console.error('--filter/-f options used, but no filter value provided')
    return false
  }
  if (!!options['find-keys'] && !!options['dictionary']) {
    try {
      JSON.parse(options['dictionary'])
    } catch (e) {
      console.error('value for --dictionary/-d is not valid JSON array')
      return false
    }
  }
  return true
}

runScript(optionDefinitions, usage, areOptionsValid, run)
