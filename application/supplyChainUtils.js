"use strict";

/*
Node JS app to create Purchase order on the network
*/

const contractHelper =  require('./contractHelper.js');
const {constants} = require('./constants.js');

async function createPO(buyerCRN, sellerCRN, drugName, quantity, organisationRole) {
  try {
    const drugTransferContract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
    console.log("Creating new Purchase Order request");
    const userBuffer = await drugTransferContract.submitTransaction("createPO", buyerCRN, sellerCRN, drugName, quantity);

    console.log("Processing new Purchase Order");
    let newOrg = JSON.parse(userBuffer.toString());
    console.log(newOrg);
    console.log("Purchase Order now Created");
    return newOrg;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

async function createShipment(buyerCRN, drugName, listOfAssets, transporterCRN, organisationRole) {
  try {
      const Contract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
      console.log('Creating new Shipmentrequest');
      const userBuffer = await Contract.submitTransaction('createShipment', buyerCRN, drugName, listOfAssets, transporterCRN);

      console.log('Processing new Shipment');
      let newOrg = JSON.parse(userBuffer.toString());
      console.log(newOrg);
      console.log('Shipment now Created');
      return newOrg;
  } catch (error) {
      console.log(`\n\n ${error} \n\n`);
      throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

async function updateShipment(buyerCRN, drugName, transporterCRN, organisationRole) {
  try {
      const Contract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
      console.log('Updating Shipmentrequest');
      const userBuffer = await Contract.submitTransaction('updateShipment', buyerCRN, drugName, transporterCRN);

      console.log('Updating Shipment');
      let newOrg = JSON.parse(userBuffer.toString());
      console.log(newOrg);
      console.log('Shipment now Updated');
      return newOrg;
  } catch (error) {
      console.log(`\n\n ${error} \n\n`);
      throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

module.exports.execute = {createPO, createShipment, updateShipment};