import Table from "cli-table/lib";
import _ from 'lodash';

async function findDidWithMeta(client, metadata) {
  console.log(`Searching for DID with metadata = ${metadata}`);
  const didsWithMeta = await client.listMyDidsWithMeta();
  for (let didRecord of didsWithMeta) {
    const {metadata, did, vkey} = didRecord;
    if (metadata === metadata) {
      console.log(`Found DID with metadata ${metadata}. DID = ${JSON.stringify(did)}.`);
      return {did, vkey};
    }
  }
  return null
}

export async function getDidWithMetadata(metadata) {
  let did = null;
  let vkey = null;
  if (!!metadata) {
    const foundDid = await findDidWithMeta(metadata);
    if (foundDid) {
      did = foundDid.did;
      vkey = foundDid.vkey;
    } else {
      console.error(`No DID with metadata '${metadata}' was found.`);
      return null
    }
  }
  console.log(`Did with metadata was assured. DID =${did}, Verkey = ${vkey}`);
  const didRecord = await client.getMyDidWithMeta(did);
  console.log(`Details about the created did in wallet: ${JSON.stringify(didRecord)}`);
  return {did, vkey}
}

export function didsToTableString(didRecords) {
  if (didRecords.length === 0) {
    return ""
  }
  var table = new Table({
    head: ['DID', 'Verkey', 'TmpVerkey', 'Metadata']
    , colWidths: [32, 48, 16, 128]
  });
  const didsForTable = _.map(didRecords, o => [o.did, o.verkey, o.tempVerkey || "", o.metadata || ""]);
  for (let i = 0; i < didsForTable.length; i++) {
    table.push(didsForTable[i])
  }
  return table.toString()
}

export function pairwiseToTableString(pairwiseRecords) {
  if (pairwiseRecords.length === 0) {
    return ""
  }
  var table = new Table({
    head: ['my_did', 'their_did', 'metadata']
    , colWidths: [32, 48, 128]
  });
  const pairwisesForTable = _.map(pairwiseRecords, o => [o.my_did, o.their_did, o.metadata || ""]);
  for (let i = 0; i < pairwisesForTable.length; i++) {
    table.push(pairwisesForTable[i])
  }
  return table.toString()
}