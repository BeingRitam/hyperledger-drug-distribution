"use strict";
const {Contract} = require("fabric-contract-api");

class DrugRegistrationContract extends Contract {
    constructor() {
        super("pharma.net.drugRegistration");
    }

    async instantiate(ctx) {
        console.log("Pharmanet Chaincode is Instantiated");
    }

    /**
     * This transaction is used by any organisation registered as a ‘manufacturer’ to register a new drug on the ledger. 
     * @param ctx - The transaction context object
     * @param drugName - Name of the drug
     * @param serialNo 
     * @param mfgDate 
     * @param expDate 
     * @param companyCRN - unique company CRN
     * @returns - drug object 
     */

    async addDrug(ctx, drugName, serialNo, mfgDate, expDate, companyCRN) {
        //This transaction should be invoked only by a manufacturer registered on the ledger.
        try {
            if (ctx.clientIdentity.getMSPID() != "manufacturerMSP") {
                return {
                    error: "Only Manufacturer Org can add drugs on the pharma-network"
                };
            }
            //composite key for storing drug
            const productIDKey = ctx.stub.createCompositeKey(
                "pharma.net.productIDKey",
                [serialNo, drugName]
            );
            //fetching manufacturer org details from the ledger using partial composite key 
            let manufacturerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                "pharma.net.companyId",
                [companyCRN]
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

            let dataBuffer = Buffer.from(JSON.stringify(newDrugObj));
            //storing the new drug object on the ledger 
            await ctx.stub.putState(productIDKey, dataBuffer);
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