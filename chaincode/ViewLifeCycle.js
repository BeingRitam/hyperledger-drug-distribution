"use strict";

const { Contract } = require('fabric-contract-api');
const { compositeObjectType } = require ('./constants.js');
const { getLedgerObjectByIdentifiers, getHistroyOfChangesByIdentifiers } = require ('./utils.js');

class ViewLifeCycle extends Contract {
  constructor() {super("pharma.net.viewLifeCycle");}

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    console.log("Pharmanet Chaincode is Instantiated");
  }

  /**
   * ViewHistory on the network
   * @param ctx - The transaction context object
   * @param drugName - Name of the drug
   * @param serialNo - Serial Number of the drug
   * @returns - Trnasaction ID and details of each transaction
   */

  async viewHistory(ctx, drugName, serialNo) {
    try {
      return await getHistroyOfChangesByIdentifiers(ctx, compositeObjectType.drugId, [serialNo, drugName]);
    } catch (err) {
      return {
        error: "Unable to fetch History of Drug asset on the network, check input parameters",
        errorTrace: err.toString()
      };
    }
  }

  /**
   * View drug current state from the network
   * @param ctx - The transaction context object
   * @param drugName - Name of the drug
   * @param serialNo - Serial number of the drug
   * @returns - Drug object
   */
  async viewDrugCurrentState(ctx, drugName, serialNo) {
    try {
      return await getLedgerObjectByIdentifiers(ctx, compositeObjectType.drugId, [serialNo, drugName]);
    } catch (err) {
      return {
        error: "Unable to view Current History of Drug asset on the network, check input parameters",
        errorTrace: err.toString()
      };
    }
  }
}
module.exports = ViewLifeCycle;