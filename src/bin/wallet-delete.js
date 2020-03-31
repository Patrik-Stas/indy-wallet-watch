#!/usr/bin/env node
const { listWallets, deleteWallet } = require('../indy-utils')
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
    required: true
  },
  {
    name: 'dry-run',
    type: Boolean,
    description: 'Don\'t delete anything, just print what would be deleted.'
  }
]

const usage = [
  {
    header: 'Example',
    content: 'Delete all wallets containing string "test-wallet" in its name:\n> wallet-delete --filter *test-wallet*'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  },
  {
    content: 'Project home: {underline https://github.com/Patrik-Stas/indy-wallet-watch}'
  }
]

async function run (options) {
  const wallets = await listWallets(options.filter)
  for (const wallet of wallets) {
    try {
      const isDryRun = !!(options['dry-run'])
      await deleteWallet(wallet, isDryRun)
    } catch (e) {
      console.error(e)
      console.error(`Couldn't delete wallet '${wallet}'.`)
    }
  }
}

function areOptionsValid (options) {
  console.log(`Validating ${JSON.stringify(options)}`)
  if (options['filter'] === null) {
    console.error('--filter/-f options used, but no filter value provided')
    return false
  }
  return true
}

runScript(optionDefinitions, usage, areOptionsValid, run)
