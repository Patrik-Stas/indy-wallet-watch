import indy from "indy-sdk";
import * as indyTools from './indytools'
import fs from 'fs';
import Table from "cli-table/lib";
const homedir = require('os').homedir();

export function createWalletClient(walletName, key, poolHandle) {

  if (!walletName) {
    throw Error("wallet name must be defined")
  }
  if (!key) {
    throw Error("wallet key must be defined")
  }

  const walletConfig = JSON.stringify({id: walletName, storage_type: "default"});
  const walletCredentials = JSON.stringify({key});
  let walletHandle = null;
  let isWalletOpened = false;

  function wasWalletFileCreated() {
    return fs.existsSync(`${homedir}/.indy_client/wallet/${walletName}`);
  }

  async function createWallet() {
    console.log(`Creating wallet. Wallet config:
    \n${JSON.stringify(walletConfig, null, 2)}.
    \n${JSON.stringify(walletCredentials, null ,2)}`);
    await indy.createWallet(walletConfig, walletCredentials);
    console.log(`New wallet '${walletName}' created.`)
  }

  async function assureWalletExists() {
    console.log("Assuring local wallet.");
    try {
      await createWallet()
    } catch (err) {
      console.warn(err);
      console.warn(err.stack);
      console.warn("Wallet probably already exists, will proceed.");
    }
  }

  async function assureWalletOpen() {
    if (isWalletOpened === false) {
      walletHandle = await indy.openWallet(walletConfig, walletCredentials);
      isWalletOpened = true;
    }
  }

  async function listMyCredentials() {
    await assureWalletOpen();
    const res = await indy.proverGetCredentials(walletHandle);
    indy.getWalletRecord()
    await assureWalletClosed();
    return res;
  }

  async function assureWalletClosed() {
    if (isWalletOpened === true) {
      await indy.closeWallet(walletHandle);
      isWalletOpened = false
    }
  }

  async function listMyDidsWithMeta() {
    await assureWalletOpen();
    const dids = await indy.listMyDidsWithMeta(walletHandle);
    await assureWalletClosed();
    return dids;
  }

  async function listPairwise() {
    await assureWalletOpen();
    const pairwise = await indy.listPairwise(walletHandle);
    await assureWalletClosed();
    return pairwise;
  }


  async function findDidWithMeta(findMetadata) {
    console.log(`Searching for DID with metadata = ${findMetadata}`);
    const didsWithMeta = await indy.listMyDidsWithMeta(walletHandle);
    console.log(`All DIDs in the wallet = ${JSON.stringify(didsWithMeta)}`);
    for (let didRecord of didsWithMeta) {
      const {metadata, did, vkey} = didRecord;
      if (metadata === findMetadata) {
        console.log(`Found DID with metadata ${findMetadata}. DID = ${JSON.stringify(did)}.`);
        return {did, vkey};
      }
    }
    return null
  }

  async function getDidWithMetadata(metadata) {
    await assureWalletOpen();
    console.log(`Wallet '${walletName}' has been opened.`);
    let did = null;
    let vkey = null;
    if (!!metadata) {
      const foundDid = await findDidWithMeta(metadata);
      if (foundDid) {
        did = foundDid.did;
        vkey = foundDid.vkey;
      } else {
        console.error(`No DID with metadata '${metadata}' was found.`)
        return null
      }
    }
    console.log(`Did with metadata was assured. DID =${did}, Verkey = ${vkey}`);
    const didRecord = await indy.getMyDidWithMeta(walletHandle, did);
    console.log(`Details about the created did in wallet: ${JSON.stringify(didRecord)}`);
    await assureWalletClosed();
    return {did, vkey}
  }

  async function getDid(did) {
    await assureWalletOpen();
    const result = await indy.getMyDidWithMeta(walletHandle, did);
    await assureWalletClosed();
    return result
  }

  async function writeNymOnLedger(submitterDid, targetDid, verkey, alias, role) {
    await assureWalletOpen();
    console.log(`Writing on ledger by ${submitterDid}. TargetDid=${targetDid} TargetVerkey=${verkey} Alias=${alias} Role=${role}`);
    const nymRequest = await indy.buildNymRequest(submitterDid, targetDid, verkey, alias, role);
    const res = await indy.signAndSubmitRequest(poolHandle, walletHandle, submitterDid, nymRequest);
    console.log(`Respone after submitting request: ${JSON.stringify(res)}`);
    await assureWalletClosed();
  }

  async function writeTrustAnchorOnLedger(sourceDid, did, verkey, alias) {
    await assureWalletOpen();
    await writeNymOnLedger(sourceDid, did, verkey, alias, "TRUST_ANCHOR");
    console.log(`Written trust anchor ${did}/${verkey} on ledger ${alias}.`);
    await assureWalletClosed();
  }

  async function createDidWithMeta(seed, metadata) {
    await assureWalletOpen();
    const res =await indyTools.createAndStoreMyDid(walletHandle, seed, metadata);
    await assureWalletClosed();
    return res;
  }

  async function didsToTableString() {
    var table = new Table({
      head: ['DID', 'Verkey', 'TmpVerkey', 'Metadata']
      , colWidths: [32, 48, 16, 128]
    });
    const didsWithMeta = await listMyDidsWithMeta();
    const didsForTable = didsWithMeta.map(o => [o.did, o.verkey, o.tempVerkey || "", o.metadata || ""]);
    for (let i=0; i<didsForTable.length; i++) {
      table.push(didsForTable[i])
    }
    return table.toString()
  }


  async function pairwiseToTableString() {
    const pairwiseWithmeeta = await listPairwise();
    if (pairwiseWithmeeta.length === 0) {
      return ""
    }
    var table = new Table({
      head: ['my_did', 'their_did', 'metadata']
      , colWidths: [32, 48, 128]
    });
    const pairwisesForTable = pairwiseWithmeeta.map(o => [o.my_did, o.their_did, o.metadata || ""]);
    for (let i=0; i<pairwisesForTable.length; i++) {
      table.push(pairwisesForTable[i])
    }
    return table.toString()
  }



  async function credentialsAsTableString() {
    // var table = new Table({
    //   head: ['DID', 'Verkey', 'TmpVerkey', 'Metadata']
    //   , colWidths: [32, 48, 16, 32]
    // });
    // const credentials = await listMyCredentials();
    const credentials = await indy.openWalletSearch(walletHandle, null, {tagName:"*"}, {});
    // const didsForTable = didsWithMeta.map(o => [o.did, o.verkey, o.tempVerkey || "", o.metadata || ""]);
    // for (let i=0; i<didsForTable.length; i++) {
    //   table.push(didsForTable[i])
    // }
    // return table.toString()
    return credentials
  }


  async function addDidWithMetadata(didSeed, metadata) {
    if (!didSeed) {
      throw Error("didSeed must be defined")
    }
    await assureWalletOpen();
    if ((await getDidWithMetadata(metadata)) !== null) {
      throw Error(`Did with metadata ${metadata} already exists in wallet ${walletName}`)
    }

    console.log(`Creating DID from seed ${didSeed}. Will have assigned metadata ${metadata}.`);
    const {did, vkey} = await createDidWithMeta(didSeed, metadata);
    await assureWalletClosed()
  }

  return {
    wasWalletFileCreated,
    createWallet,
    createDidWithMeta,
    getDidWithMetadata,
    addDidWithMetadata,
    assureWalletExists,
    writeTrustAnchorOnLedger,
    getDid,
    listMyDidsWithMeta,
    pairwiseToTableString,
    didsToTableString,
    listMyCredentials,
    credentialsAsTableString
  }
}