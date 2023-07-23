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
  const resultsIterator = ctx.stub.getHistoryForKey(ledgerKey);

  const results = [];
  for await (const keyMod of resultsIterator) {
    const result = {
        timestamp: keyMod.timestamp,
        txid: keyMod.txId,
        isDelete: keyMod.isDelete,
        value: JSON.parse(keyMod.value.toString('utf8'))
    }
    results.push(result);
  }
  return results;
}

function isExistingLedgerObject(ledgerBuffer) {
  if (!ledgerBuffer || ledgerBuffer.length === 0) return false;
  else return true;
}

module.exports = {getLedgerObjectByPartialIdentifier, getLedgerObjectByIdentifiers, getLedgerObjectByKey, getHistroyOfChangesByIdentifiers, isExistingLedgerObject}