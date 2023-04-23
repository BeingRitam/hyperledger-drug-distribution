'use strict';

/*
Node JS app to register company on the network
*/

const contractHelper = require('./contractHelper.js');
const {constants} = require('./constants.js');

async function createCompanyEntity(companyCRN, companyName, location, organisationRole) {
  try {
    const companyContract = await contractHelper.getContractInstance(organisationRole, constants.contractName.registration);
    console.log('Creating new organisation registration request');
    const companyBuffer = await companyContract.submitTransaction('registerCompany', companyCRN, companyName, location, organisationRole);

    console.log('Processing request to register a new organization');
    let newOrg = JSON.parse(companyBuffer.toString());
    console.log(newOrg);
    console.log('New Organization is now registered');
    return newOrg;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    console.log('Disconnect from fabric');
    contractHelper.disconnect();
  }
}

async function createDrugEntity(drugName, serialNo, mfgDate, expDate, companyCRN) {
  try {
      const Contract = await contractHelper.getContractInstance(constants.organisationRole.manufacturer, constants.contractName.drugRegistration);
      console.log('Creating new Drug Add request');
      const userBuffer = await Contract.submitTransaction('addDrug', drugName, serialNo, mfgDate, expDate, companyCRN);

      console.log('Processing request to add a new DRUG');
      let newOrg = JSON.parse(userBuffer.toString());
      console.log(newOrg);
      console.log('New Drug is now added');
      return newOrg;
  } catch (error) {
      console.log(`\n\n ${error} \n\n`);
      throw new Error(error);
  } finally {
      console.log('Disconnect from fabric');
      contractHelper.disconnect();
  }
}

module.exports.execute = {createCompanyEntity, createDrugEntity};