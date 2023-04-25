const { compositeObjectType } = require('./constants.js');

async function getLedgerObjectByPartialIdentifier(ctx, objectType, identifier) {
  const iterator = await ctx.stub.getStateByPartialCompositeKey(objectType, [identifier]);
  const res = await iterator.next();
  if (res.value && !res.value.key) {
    throw new Error(`No record found for identifier ${identifier}`);
  }

  while (!res.done) {
    const key = res.value.key;
    const record = await ctx.stub.getState(key);
    if (record && record.length > 0) {
      await iterator.close();
      return JSON.parse(record.toString());
    }
    res = await iterator.next();
  }
  throw new Error(`No record found for identifier ${identifier}`);
}

async function getLedgerObjectByIdentifiers(ctx, objectType, identifiers) {
  const ledgerKey = await ctx.stub.createCompositeKey(objectType, identifiers);
  return getLedgerObjectByKey(ctx, ledgerKey);
}

async function getLedgerObjectByKey(ctx, key) {
  const objectBuffer = await ctx.stub.getState(key);
  if (!objectBuffer || objectBuffer.length === 0) {
    throw new Error(`No record found for identifiers: ${JSON.stringify(identifiers)}`);
  } else {
    return JSON.parse(objectBuffer.toString());
  }
}

async function getHistroyOfChangesByIdentifiers(ctx, objectType, identifiers) {
  const ledgerKey = await ctx.stub.createCompositeKey(objectType, identifiers);
  let resultsIterator = await ctx.stub.getHistoryForKey(ledgerKey);
  let results = [];
  let res = await resultsIterator.next();
  if (!res.value) {
    throw new Error(`No record found for identifier ${JSON.stringify(identifiers)}`);
  }
  while (!res.done) {
    let obj = JSON.parse(res.value.value.toString('utf8'));
    let txTimestamp = res.value.timestamp;
    let isDelete = res.value.isDelete;

    let result = {
      timestamp: txTimestamp,
      txId: res.value.tx_id,
      isDelete: isDelete,
      value: obj,
    };
    results.push(result);
    res = await resultsIterator.next();
  }
  await resultsIterator.close();
  return results;
}

function isExistingLedgerObject(ledgerBuffer) {
  if (!ledgerBuffer || ledgerBuffer.length === 0) return false;
  else return true;
}

module.exports = {getLedgerObjectByPartialIdentifier, getLedgerObjectByIdentifiers, getLedgerObjectByKey, getHistroyOfChangesByIdentifiers, isExistingLedgerObject}