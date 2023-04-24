"use strict";

/*
Node JS app to create Purchase order on the network
*/

const contractHelper =  require('./contractHelper.js');
const {constants} = require('./constants.js');

async function createPO(buyerCRN, sellerCRN, drugName, quantity, organisationRole) {
  try {
    const drugTransferContract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
    console.log(`Creating new PO request by buyer: ${buyerCRN} for seller: ${sellerCRN}. Drug: ${drugName} | Qty: ${quantity}`);
    const purchaseOrderBuffer = await drugTransferContract.submitTransaction("createPO", buyerCRN, sellerCRN, drugName, quantity);

    let newPurchaseOrder = JSON.parse(purchaseOrderBuffer.toString());
    console.log(newPurchaseOrder);
    if(!newPurchaseOrder.error) {
      console.log(`New PO created buyer: ${buyerCRN} | seller: ${sellerCRN} |  Drug: ${drugName} | Qty: ${quantity}`);
    }
    return newPurchaseOrder;
  } catch (error) {
    console.log(`\n\n ${error} \n\n`);
    throw new Error(error);
  } finally {
    contractHelper.disconnect();
  }
}

async function createShipment(buyerCRN, drugName, listOfAssets, transporterCRN, organisationRole) {
  try {
      const drugTransferContract = await contractHelper.getContractInstance(organisationRole, constants.contractName.drugTransfer);
      console.log(`Creating new shipment order: for: ${buyerCRN}. Drug: ${drugName} | transporter: ${transporterCRN}`);
      const shipmentBuffer = await drugTransferContract.submitTransaction('createShipment', buyerCRN, drugName, listOfAssets, transporterCRN);

      let newShipmentObj = JSON.parse(shipmentBuffer.toString());
      console.log(newShipmentObj);
      if(!newShipmentObj.error) {
        console.log(`New shipment for: ${buyerCRN} | transporter: ${transporterCRN} |  Drug: ${drugName}`);
      }
      return newShipmentObj;
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