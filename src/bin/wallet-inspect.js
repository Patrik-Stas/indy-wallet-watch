#!/usr/bin/env node

const { runScript } = require('./script-comon')
const createWalletClient = require('../client')
const { findKeysForWallets, listWallets } = require('../indy-utils')
const { didsToTableString, pairwiseToTableString } = require('../client-utils')
const _ = require('lodash')
const Promise = require('bluebird')

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
    description: 'Glob to select target wallets. Default glob is \'*\'',
    defaultValue: '*'
  },
  {
    name: 'dictionary',
    alias: 'd',
    type: String,
    description: 'Key dictionary as JSON array. Default dictionary is \'["key","123"]\'',
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

async function enrichByDetails (walletDetail) {
  const { name, key } = walletDetail
  const walletClient = await createWalletClient(name, key)
  const didRecords = await walletClient.listMyDidsWithMeta()
  const pairwiseRecords = await walletClient.listPairwise()
  const searchresullt = walletClient.searchAll()
  console.log(`Search result = ${JSON.stringify(searchresullt)}`)
  return { ...walletDetail, didRecords, pairwiseRecords, searchresullt }
}

function printTablesOverview (walletDetail) {
  const { didRecords, pairwiseRecords, name, key } = walletDetail
  const tableDids = didsToTableString(didRecords)
  const tablePairwises = pairwiseToTableString(pairwiseRecords)
  console.log(`------------------${name} / ${key} --------------------------------'`)
  console.log(tableDids)
  if (tablePairwises) {
    console.log(tablePairwises)
  }
}

async function run (options) {
  const wallets = await listWallets(options.filter)
  const keyDictionary = JSON.parse(options['dictionary'])
  console.log(`Target wallets : ${JSON.stringify(wallets)}`)
  // console.log(`Dict : ${JSON.stringify(keyDictionary)}`)
  const { discovered, unknown } = await findKeysForWallets(wallets, keyDictionary)
  const enriched = await Promise.props(_.mapValues(discovered, async (o) => enrichByDetails(o)))
  for (const name of Object.keys(enriched)) {
    await printTablesOverview(enriched[name])
  }
  console.log(JSON.stringify(unknown))
  if (unknown.length > 0) {
    console.log(`----------------------------------------Couldn't open wallets--------------------------------------------------`)
    const unknownWallets = _.map(unknown, o => o.name)
    for (const walletRecord of unknownWallets) {
      console.log(walletRecord.name)
    }
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
