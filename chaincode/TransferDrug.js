"use strict";

const { Contract } = require('fabric-contract-api');
const { compositeObjectType, companyHierarchy, transitState } = require('./constants.js');
const { getLedgerObjectByPartialIdentifier, getLedgerObjectByIdentifiers } = require('./utils.js');

class TransferDrug extends Contract {
  constructor() { super("pharma.net.transferDrug"); }

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    console.log("Pharmanet Chaincode is Instantiated");
  }

  /**
   * Create purchase order on the network
   * @param ctx - The transaction context object
   * @param buyerCRN -  CRN of buyer org
   * @param sellerCRN - CRN for seller org
   * @param drugName - name of the drug
   * @param quantity - qty to be ordered
   * @returns - new purchase order object
   */

  async createPO(ctx, buyerCRN, sellerCRN, drugName, quantity) {
    try {
      if (!['distributorMSP', 'retailerMSP'].includes(ctx.clientIdentity.getMSPID())) {
        return {
          error: 'Only Distributor and Retailer create a new purchase order'
        };
      }
      const poIDKey = ctx.stub.createCompositeKey(
        compositeObjectType.purchaseOrderId, [buyerCRN, drugName]);

      let buyerOrgDetails = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, buyerCRN);
      let sellerOrgDetails = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, sellerCRN);

      //making sure hierarchy is followed when buying drug on the network.
      //Distributor can buy from Manufacturer  || Retailer can buy from Distributor || but retailer can't directly buy from Manufacturer
      if ((buyerOrgDetails.hierarchyKey === companyHierarchy.Retailer && sellerOrgDetails.hierarchyKey === companyHierarchy.Distributor)
        || (buyerOrgDetails.hierarchyKey === companyHierarchy.Distributor && sellerOrgDetails.hierarchyKey === companyHierarchy.Manufacturer)) {
        let newPurchaseOrderObject = {
          poID: poIDKey,
          drugName: drugName,
          quantity: quantity,
          buyer: buyerOrgDetails.companyID,
          seller: sellerOrgDetails.companyID,
        };
        console.log(`New purchaseOrder Object:\n${JSON.stringify(newPurchaseOrderObject)}`);

        // Put state
        await ctx.stub.putState(poIDKey, Buffer.from(JSON.stringify(newPurchaseOrderObject)));
        return newPurchaseOrderObject;
      } else {
        return {
          error: `Purchase order cannot be created by requester type: ${buyerOrgDetails.organisationRole} where the seller is of type: ${sellerOrgDetails.organisationRole}. Since intermediate organisation is being skipped`
        };
      }
    } catch (err) {
      return {
        error: "Unable to create PO on the network, check input parameters",
        errorTrace: err.toString()
      };
    }

  }

  /**
   * Create a shipment on the network
   * @param ctx - The transaction context object
   * @param buyerCRN - Buyer Identifier
   * @param drugName - Name of the drug
   * @param listOfAssets - array holding serial number of drugs [001,002,003]
   * @param transporterCRN - Transporter Identifier
   * @returns - shipment object
   */

  async createShipment(ctx, buyerCRN, drugName, listOfAssets, transporterCRN) {
    try {
      // Only manufacturer and distributor should be able to create shipment
      if (!['distributorMSP', 'manufacturerMSP'].includes(ctx.clientIdentity.getMSPID())) {
        return {
          error: 'Only Distributor and Retailer can create a shipment.'
        };
      }
      const shipmentKey = await ctx.stub.createCompositeKey(
        compositeObjectType.shipmentKey, [buyerCRN, drugName]
      );

      let purchaseOrderObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.purchaseOrderId, buyerCRN);
      let tansporterObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, transporterCRN);

      let listOfAssetArray = listOfAssets.split(',');
      var assets = [];
      //make sure quantity == length of list of assets
      if (listOfAssetArray.length == purchaseOrderObj.quantity) {
        try {
          for (let serial of listOfAssetArray) {
            let drugObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.drugId, serial);

            // Drug name should match with the drug belongs to that asset serial number
            if(drugObj.name != drugName) {
              return {
                error: `Drug serial number: ${serial} belongs to: ${drugObj.name}. Although the drug requested for is: ${drugName}.`
              }
            }
            // Drug should be owned by the person against the seller of PO
            if(purchaseOrderObj.seller != drugObj.owner) {
              return {
                error: `Drug serial number: ${serial} owns by ${drugObj.owner}. PO created for the seller: ${purchaseOrderObj.seller}. Not authorised to sell.`
              }
            }
            drugObj.owner = tansporterObj.companyID;
            drugObj.shipment = transitState[1];
            assets.push(drugObj);
          }
        } catch (err) {
          return {
            error: "Unable to create PO on the network, check input parameters",
            errorTrace: err.toString()
          };
        }
      } else {
        return {
          error: `Number of assets not matching with the requested quantity of PO.`
        };
      }

      // Put state for each drugs in batch
      for(let drugObj of assets) {
        await ctx.stub.putState(drugObj.productID, Buffer.from(JSON.stringify(drugObj)));
      }

      let newShipmentObj = {
        shipmentID: shipmentKey,
        creator: purchaseOrderObj.seller,
        assets: assets,
        transporter: tansporterObj.companyID,
        status: transitState[1],
      };
      await ctx.stub.putState(shipmentKey, Buffer.from(JSON.stringify(newShipmentObj)));
      return newShipmentObj;
    } catch (err) {
      return {
        error: "Unable to create Shipment on the network, check input parameters",
        errorTrace: err.toString()
      };
    }
  }

  /**
   * Update Shipment on the network
   * @param ctx - The transaction context object
   * @param buyerCRN - Identifier to whom this product is being delivered
   * @param drugName - Name of the drug being delivered
   * @param transporterCRN - Identifier of the transporter delivering this shipment
   * @returns - shipment object
   */

  async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {
    //Only Transporter can update the shipment
    try {
      if (ctx.clientIdentity.getMSPID() != 'transporterMSP') {
        return {
          error: 'Only Transporter can update the shipment'
        };
      }

      let shipmentObj = await getLedgerObjectByIdentifiers(ctx, compositeObjectType.shipmentKey, [buyerCRN, drugName]);
      let buyerObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, buyerCRN);
      let tansporterObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, transporterCRN);
      let purchaseOrderObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.purchaseOrderId, buyerCRN);

      if(purchaseOrderObj.buyer != buyerObj.companyID) {
        return {
          error: 'Validation failure. Purchase order was not created for the buyer CRN provided'
        };
      }

      if(shipmentObj.transporter != tansporterObj.companyID) {
        return {
          error: `Transporter with CRN: ${transporterCRN} is not the shipment owner of this consignment. Not authorised to update state.`
        };
      }

      shipmentObj.status = transitState[2];

      for (let drugObj of shipmentObj.assets) {
        drugObj.shipment = tansporterObj.name;
        drugObj.owner = buyerObj.companyID;
        ctx.stub.putState(drugObj.productID, Buffer.from(JSON.stringify(drugObj)));
      }
      await ctx.stub.putState(shipmentObj.shipmentID, Buffer.from(JSON.stringify(shipmentObj)));
      return shipmentObj;
    } catch (err) {
      return {
        error: "Unable to update Shipment on the network, check input parameters",
        errorTrace: err.toString()
      };
    }
  }

  /**
   * Retail drug on the network
   * @param ctx - The transaction context object
   * @param drugName - Name of the drug
   * @param serialNo - serial num of drug
   * @param retailerCRN - Identifier of retail seller
   * @param customerAadhar - Aadhar of customer
   * @returns - updated Drug object
   */
  async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {
    try {
      if (ctx.clientIdentity.getMSPID() != 'retailerMSP') {
        return {
          error: 'Only Retailer can retail sell a drug'
        };
      }
      let retailerObj = await getLedgerObjectByPartialIdentifier(ctx, compositeObjectType.companyId, retailerCRN);
      let drugObj = await getLedgerObjectByIdentifiers(ctx, compositeObjectType.drugId, [serialNo, drugName]);

      // Retailer who is making the sale should own the drug
      if (drugObj.owner != retailerObj.companyID) {
        return {
          error: `Retailer with CRN: ${retailerCRN} is not the owner of drug serial number ${serialNo}. Unable to make the sell.`
        };
      }

      //updating drug owner = customer Aadhar
      drugObj.owner = customerAadhar;
      await ctx.stub.putState(drugObj.productID, Buffer.from(JSON.stringify(drugObj)));
      return drugObj;
    } catch (err) {
      return {
        error: "Unable to retail Drug on the network, check input parameters",
        errorTrace: err.toString()
      };
    }
  }
}
module.exports = TransferDrug;