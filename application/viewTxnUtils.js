'use strict';

/*
Node JS app to view History of drug asset on the network
*/

const contractHelper = require('./contractHelper.js');
const { constants } = require('./constants.js');
async function getDrugTxnHistory(drugName, serialNo) {
  try {
    const lifeCycleContract = await contractHelper.getContractInstance(constants.organisationRole.consumer, constants.contractName.lifeCycle);
    console.log(`Trying to fetch histroy of drug: ${drugName} with serial ${serialNo}`);
    const drugHistBuffer = await lifeCycleContract.submitTransaction('viewHistory', drugName, serialNo);

    let drugHistoryObj = JSON.parse(drugHistBuffer.toString());
    console.log(drugHistoryObj);
    if(!drugHistoryObj.error) {
      console.log(`Histroy succesfully fetched for drug: ${drugName} with serial: ${serialNo}`);
      }
    return drugHistoryObj;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

async function getDrugWorldState(drugName, serialNo) {
  try {
    const lifecyleContract = await contractHelper.getContractInstance(constants.organisationRole.consumer, constants.contractName.lifeCycle);
    console.log(`Trying to fetch current state for drug: ${drugName} with serial: ${serialNo}`);
    const drugStateBuffer = await lifecyleContract.submitTransaction('viewDrugCurrentState', drugName, serialNo);

    let drugState = JSON.parse(drugStateBuffer.toString());
    console.log(drugState);
    if (!drugState.error) {
      console.log(`Successfully fetched world state details for drug: ${drugName} with serial: ${serialNo}`);
    }
    return drugState;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

module.exports.execute = { getDrugTxnHistory, getDrugWorldState };