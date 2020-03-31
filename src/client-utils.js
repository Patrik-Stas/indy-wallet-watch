const Table = require('cli-table3')
const _ = require('lodash')

async function findDidWithMeta (client, searchMetadata) {
  console.log(`Searching for DID with metadata = ${searchMetadata}`)
  const didsWithMeta = await client.listMyDidsWithMeta()
  for (let didRecord of didsWithMeta) {
    const { metadata, did, vkey } = didRecord
    if (metadata === searchMetadata) {
      console.log(`Found DID with metadata ${metadata}. DID = ${JSON.stringify(did)}.`)
      return { did, vkey }
    }
  }
  return null
}

async function getDidWithMetadata (metadata) {
  let did = null
  let vkey = null
  if (metadata) {
    const foundDid = await findDidWithMeta(metadata)
    if (foundDid) {
      did = foundDid.did
      vkey = foundDid.vkey
    } else {
      console.error(`No DID with metadata '${metadata}' was found.`)
      return null
    }
  }
  return { did, vkey }
}

function didsToTableString (didRecords) {
  if (didRecords.length === 0) {
    return ''
  }
  var table = new Table({
    head: ['DID', 'Verkey', 'TmpVerkey', 'Metadata'],
    colWidths: [32, 48, 16, 50]
  })
  const didsForTable = _.map(didRecords, o => [o.did, o.verkey, o.tempVerkey || '', o.metadata || ''])
  for (let i = 0; i < didsForTable.length; i++) {
    table.push(didsForTable[i])
  }
  return table.toString()
}

function pairwiseToTableString (pairwiseRecords) {
  if (pairwiseRecords.length === 0) {
    return ''
  }
  var table = new Table({
    head: ['my_did', 'their_did', 'metadata'],
    colWidths: [32, 48, 50]
  })
  const pairwisesForTable = _.map(pairwiseRecords, o => [o.my_did, o.their_did, o.metadata || ''])
  for (let i = 0; i < pairwisesForTable.length; i++) {
    table.push(pairwisesForTable[i])
  }
  return table.toString()
}

module.exports.findDidWithMeta = findDidWithMeta
module.exports.getDidWithMetadata = getDidWithMetadata
module.exports.didsToTableString = didsToTableString
module.exports.pairwiseToTableString = pairwiseToTableString
