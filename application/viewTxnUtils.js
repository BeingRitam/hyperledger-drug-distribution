'use strict';

/*
Node JS app to view History of drug asset on the network
*/

const contractHelper = require('./contractHelper.js');
const {constants} = require('./constants.js');
async function getDrugTxnHistory(drugName, serialNo, organisationRole) {
    try {
        const Contract = await contractHelper.getContractInstance(organisationRole, constants.contractName.lifeCycle);
        //console.log(Contract);
        console.log('View Drug History Initialized');
        const userBuffer = await Contract.submitTransaction('viewHistory', drugName, serialNo);

        console.log('Processing View Drug History');
        let newOrg = JSON.parse(userBuffer.toString());
        console.log(newOrg);
        console.log('View Drug Historyis now processed');
        return newOrg;
    } catch (error) {
        console.log(`\n\n ${error} \n\n`);
        throw new Error(error);
    } finally {
        console.log('Disconnect from fabric');
        contractHelper.disconnect();
    }
}

async function getDrugWorldState(drugName, serialNo) {
    try {
        const Contract = await contractHelper.getContractInstance(constants.organisationRole.consumer, constants.contractName.lifeCycle);
        console.log(`Trying to fetch current state for drug: ${drugName} with serial: ${serialNo}`);
        const drugStateBuffer = await Contract.submitTransaction('viewDrugCurrentState', drugName, serialNo);

        let drugState = JSON.parse(drugStateBuffer.toString());
        console.log(drugState);
        if(!drugState.error) {
            console.log(`Successfully fetched world state details for drug: ${drugName} with serial: ${serialNo}`);
          }
        return drugState;
    } catch (error) {
        console.log(`\n\n ${error} \n\n`);
        throw new Error(error);
    } finally {
        console.log('Disconnect from fabric');
        contractHelper.disconnect();
    }
}

module.exports.execute = {getDrugTxnHistory, getDrugWorldState};