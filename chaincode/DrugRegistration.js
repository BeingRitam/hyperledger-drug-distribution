"use strict";
const {Contract} = require('fabric-contract-api');
const {compositeObjectType, isExistingLedgerObject} = require('./constants.js');

class DrugRegistrationContract extends Contract {
    constructor() {super("pharma.net.drugRegistration");}

    async instantiate(ctx) {
        console.log("Pharmanet Chaincode is Instantiated");
    }

    /**
     * This transaction is used by any organisation registered as a ‘manufacturer’ to register a new drug on the ledger. 
     * @param ctx - The transaction context object
     * @param drugName - Name of the drug
     * @param serialNo - Uniquely identifiable number for each strip
     * @param mfgDate - Date of Manufacture
     * @param expDate - Date of Expiry
     * @param companyCRN - unique company CRN
     * @returns - drug object 
     */

    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {
        //This transaction should be invoked only by a manufacturer registered on the ledger.
        try {
            if (ctx.clientIdentity.getMSPID() != 'manufacturerMSP') {
                return {
                    error: 'Only Manufacturer can add drugs in the network'
                };
            }
            //composite key for storing drug
            const productIDKey = ctx.stub.createCompositeKey(
                compositeObjectType.drugId, [serialNo, drugName]
            );
            //get the state from ledger to check if the company already exist
            let drugBuffer = await ctx.stub
                .getState(productIDKey)
                .catch((err) => console.log(err));

            if(isExistingLedgerObject(drugBuffer)) {
                return {
                    error: `Drug with name: ${drugName} and serial: ${serialNo} is already registered.`
                };
            }
            //fetching manufacturer org details from the ledger using partial composite key 
            let manufacturerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                compositeObjectType.companyId, [companyCRN]
            );
            //manuKey hold the return object from the itterator manuKey.value.key hold the composite key of the Manufacturer org
            let manuKey = await manufacturerCompKey.next();

            let newDrugObj = {
                productID: productIDKey,
                name: drugName,
                manufacturer: manuKey.value.key,
                manufacturingDate: mfgDate,
                expiryDate: expDate,
                owner: manuKey.value.key,
                shipment: "",
            };
            console.log(`New drug Object:\n${JSON.stringify(newDrugObj)}`);

            // put state
            await ctx.stub.putState(productIDKey, Buffer.from(JSON.stringify(newDrugObj)));
            return newDrugObj;

        } catch (err) {
            return {
                error: "Unable to register Drug on the network, check input parameters",
                errorTrace: err.toString()
            };
        }

    }
}
module.exports = DrugRegistrationContract;