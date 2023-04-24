'use strict';

/*
Node JS app to register company on the network
*/

const contractHelper = require('./contractHelper.js');
const {constants} = require('./constants.js');

async function createCompanyEntity(companyCRN, companyName, location, organisationRole) {
  try {
    const companyContract = await contractHelper.getContractInstance(organisationRole, constants.contractName.registration);
    console.log(`Creating new ${organisationRole} organisation with name: ${companyName} and registration number: ${companyCRN}`);
    const companyBuffer = await companyContract.submitTransaction('registerCompany', companyCRN, companyName, location, organisationRole);

    let newOrg = JSON.parse(companyBuffer.toString());
    console.log(newOrg);
    if(!newOrg.error) {
      console.log(`${organisationRole} organisation is now registered with name: ${companyName}`);
    }
    return newOrg;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

async function createDrugEntity(drugName, serialNo, mfgDate, expDate, companyCRN) {
  try {
      const drugContract = await contractHelper.getContractInstance(constants.organisationRole.manufacturer, constants.contractName.drugRegistration);
      console.log(`Registering new drug: ${drugName} with serial: ${serialNo} by manufacturer: ${companyCRN}`);
      const drugBuffer = await drugContract.submitTransaction('addDrug', drugName, serialNo, mfgDate, expDate, companyCRN);

      let newDrug = JSON.parse(drugBuffer.toString());
      console.log(newDrug);
      if(!newDrug.error) {
        console.log(`New drug: ${drugName} with serial: ${serialNo} registered by manufacturer: ${companyCRN}`);
      }
      return newDrug;
  } catch (error) {
      console.log(`\n\n ${error} \n\n`);
      throw new Error(error);
  } finally {
      contractHelper.disconnect();
  }
}

module.exports.execute = {createCompanyEntity, createDrugEntity};