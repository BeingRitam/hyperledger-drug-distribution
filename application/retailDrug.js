'use strict';

/*
Node JS app to retail drug on the network
*/

const contractHelper = require("./contractHelper.js");
const {constants} = require('./constants.js');

async function main(drugName, serialNo, retailerCRN, customerAadhar, organisationRole) {
    try {
        const Contract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
        //console.log(Contract);
        console.log('Retail Drug Initialized');
        const userBuffer = await Contract.submitTransaction('retailDrug', drugName, serialNo, retailerCRN, customerAadhar);

        console.log('Updating Retail Drug');
        let newOrg = JSON.parse(userBuffer.toString());
        console.log(newOrg);
        console.log('Drug Details are now Updated');
        return newOrg;
    } catch (error) {
        console.log(`\n\n ${error} \n\n`);
        throw new Error(error);
    } finally {
        console.log('Disconnect from fabric');
        contractHelper.disconnect();
    }
}

module.exports.execute = main;