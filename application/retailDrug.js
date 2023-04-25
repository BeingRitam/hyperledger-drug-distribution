'use strict';

/*
Node JS app to retail drug on the network
*/

const contractHelper = require("./contractHelper.js");
const {constants} = require('./constants.js');

async function main(drugName, serialNo, retailerCRN, customerAadhar) {
    try {
        const drugTransferContract = await contractHelper.getContractInstance(constants.organisationRole.retailer, constants.contractName.drugTransfer);
        console.log(`Trying to sell drug: ${drugName} by retailer CRN: ${retailerCRN} with serial No: ${serialNo}`);
        const drugBuffer = await drugTransferContract.submitTransaction('retailDrug', drugName, serialNo, retailerCRN, customerAadhar);

        let drugObj = JSON.parse(drugBuffer.toString());
        console.log(drugObj);
        if(!drugObj.error) {
        console.log(`drug: ${drugName} sold to customer with adhaar ${customerAadhar} by retailer: ${retailerCRN}`);
        }
        return drugObj;
    } catch (error) {
        console.log(`\n\n ${error} \n\n`);
        throw new Error(error);
    } finally {
        contractHelper.disconnect();
    }
}

module.exports.execute = main;