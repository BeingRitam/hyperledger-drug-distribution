"use strict";
const {Contract} = require('fabric-contract-api');
const {compositeObjectType, companyHierarchy} = require('./constants.js');
const { isExistingLedgerObject } = require('./utils.js');

class RegistrationContract extends Contract {
  constructor() {super("pharma.net.registration");}

  // This is a basic user defined function used at the time of instantiating the smart contract
  // to print the success message on console
  async instantiate(ctx) {
    console.log("Pharmanet Chaincode is Instantiated");
  }

  /**
   * Register an Organization on the network
   * @param ctx - The transaction context object
   * @param companyCRN - unique ID for company 
   * @param companyName - Name of the company 
   * @param location - company location
   * @param organisationRole - type of the entity [Manufacturer | Distributor | Retailer | Transporter]
   * @returns - new organization object 
   */

  async registerCompany(ctx,companyCRN,companyName,location,organisationRole) {
    try {
      // Validate if Organisation is valid to be registered.
      const hierarchyKey = companyHierarchy[organisationRole];
      if(!hierarchyKey) {
        return {
          error: `Organisation of type ${organisationRole} is not allowed to be regstered.`
        };
      }
      //create composite key
      const companyIdKey = ctx.stub.createCompositeKey(
        compositeObjectType.companyId, [companyCRN, companyName]
      );

      //get the state from ledger to check if the company already exist
      let companyBuffer = await ctx.stub
        .getState(companyIdKey)
        .catch((err) => console.log(err));

      if(isExistingLedgerObject(companyBuffer)) {
        return {
          error: `Company with CRN: ${companyCRN} and name: ${companyName} already exist.`
        };
      }

      let newCompanyObject = {
        companyID: companyIdKey,
        name: companyName,
        location: location,
        organisationRole: organisationRole
      };

      //Hierarchy Key is only added for Manufacturer,Retailer and Distributor and not for Transporter 
      if(organisationRole != 'Transporter') {
        newCompanyObject.hierarchyKey = hierarchyKey;
      }

      console.log(`New company Object:\n${JSON.stringify(newCompanyObject)}`);

      //put state
      await ctx.stub.putState(companyIdKey, Buffer.from(JSON.stringify(newCompanyObject)));

      return newCompanyObject;
    } catch(err) {
      return {
        error: "Unable register new company.",
        errorTrace: err.toString()
      }
    }
  }
}

module.exports = RegistrationContract;