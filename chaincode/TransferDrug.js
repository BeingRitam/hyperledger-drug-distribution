"use strict";

const {Contract} = require('fabric-contract-api');
const {compositeObjectType, companyHierarchy, isExistingLedgerObject} = require('./constants.js');

class TransferDrug extends Contract {
    constructor() {super("pharma.net.transferDrug");}

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

            //creating partial composite key for buyer and seller org to fetch details of both orgs
            const buyerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                compositeObjectType.companyId,[buyerCRN]
            );

            let buyerKey = await buyerCompKey.next();

            const sellerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                compositeObjectType.companyId, [sellerCRN]
            );
            let sellerKey = await sellerCompKey.next();

            let buyerOrgBuffer = await ctx.stub
                .getState(buyerKey.value.key)
                .catch((err) => {console.log(err);});
                console.log(`buyer buffer: ${JSON.stringify(buyerOrgBuffer)}`);

            // Validate existing buyer org
            if(!isExistingLedgerObject(buyerOrgBuffer)) {
                return {
                    error: `No Organisation exist with CRN: ${buyerCRN}`
                };
            }
            let buyerOrgDetails = JSON.parse(buyerOrgBuffer.toString());

            let sellerOrgBuffer = await ctx.stub
                .getState(sellerKey.value.key)
                .catch((err) => {console.log(err);});

            // Validate existing seller org
            if(!isExistingLedgerObject(sellerOrgBuffer)) {
                return {
                    error: `No Organisation exist with CRN: ${sellerCRN}`
                };
            }

            let sellerOrgDetails = JSON.parse(sellerOrgBuffer.toString());

            //making sure hierarchy is followed when buying drug on the network.
            //Distributor can buy from Manufacturer  || Retailer can buy from Distributor || but retailer can't directly buy from Manufacturer
            if ((buyerOrgDetails.hierarchyKey === companyHierarchy.Retailer && sellerOrgDetails.hierarchyKey === companyHierarchy.Distributor)
                || (buyerOrgDetails.hierarchyKey === companyHierarchy.Distributor && sellerOrgDetails.hierarchyKey === companyHierarchy.Manufacturer)) {
                let newPurchaseOrderObject = {
                    poID: poIDKey,
                    drugName: drugName,
                    quantity: quantity,
                    buyer: buyerKey.value.key,
                    seller: sellerKey.value.key,
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
        //creating comp key for shipment to store shipment onj on ledger
        try {
            const shipmentKey = await ctx.stub.createCompositeKey(
                compositeObjectType.shipmentKey, [buyerCRN, drugName]
            );

            //partial key of drug to update drug owner
            let poIDCompKey = await ctx.stub.getStateByPartialCompositeKey(
                compositeObjectType.purchaseOrderId, [buyerCRN]
            );

            let poIDKey = await poIDCompKey.next();

            let poIDBuffer = await ctx.stub.getState(poIDKey.value.key).catch((err) => {
                console.log(err);
            });

            let poIDDetails = JSON.parse(poIDBuffer.toString());

            const transporterCompKey = await ctx.stub.getStateByPartialCompositeKey(
                compositeObjectType.companyId,
                [transporterCRN]
            );
            let transporterKey = await transporterCompKey.next();

            //length of listofAsset == quantity specified in PO
            let listOfAssetArray = listOfAssets.split(",");
            let assets = [];
            //make sure quantity == length of list of assets
            if (listOfAssetArray.length == poIDDetails.quantity) {
                try {
                    for (let i = 0; i < listOfAssetArray.length; i++) {
                        let drugCompKey = await ctx.stub.getStateByPartialCompositeKey(
                            compositeObjectType.drugId,
                            [listOfAssetArray[i]]
                        );
                        let drugKey = await drugCompKey.next();

                        assets.push(drugKey.value.key);
                        let drugKeyDetail = await ctx.stub
                            .getState(drugKey.value.key)
                            .catch((err) => {
                                console.log(err);
                            });
                        //veryfiying if the serial number passed in list of assests are valid and if they point to a drug which is registered on the network
                        let drugKeyBuffer = JSON.parse(drugKeyDetail.toString());
                        drugKeyBuffer.owner = transporterKey.value.key;
                    }
                } catch (err) {
                    console.log(err + " Error in the Drug validation process.");
                }
            } else {
                return {
                    error: "Either the drug Quantity doesn't match with PO, or drug ID is not valid",
                };
            }

            let newShipmentObj = {
                shipmentID: shipmentKey,
                creator: poIDDetails.seller,
                assets: assets,
                transporter: transporterKey.value.key,
                status: "in-transit",
            };
            let shipmentDataBuffer = Buffer.from(JSON.stringify(newShipmentObj));
            await ctx.stub.putState(shipmentKey, shipmentDataBuffer);
            return newShipmentObj;
        } catch (err) {
            return {
                error: "Unable to create Shipment on the network, check input parameters",
                errorTrace: err.toString()
            };
        }
    }

    /**
     *updateShipment on the network
     * @param ctx - The transaction context object
     * @param buyerCRN
     * @param drugName
     * @param transporterCRN
     * @returns - shipment object
     */

    async updateShipment(ctx, buyerCRN, drugName, transporterCRN) {
        //Only Transporter can invoke this function
        try {
            if (ctx.clientIdentity.getMSPID() != "transporterMSP") {
                return {
                    error: "Only Transporter can invoke this function"
                };
            }
            const shipmentKey = await ctx.stub.createCompositeKey(
                "pharma.net.shipmentKey",
                [buyerCRN, drugName]
            );

            let shipmentBuffer = await ctx.stub.getState(shipmentKey).catch((err) => {
                console.log(err);
            });

            let shipmentDetail = JSON.parse(shipmentBuffer.toString());

            shipmentDetail.status = "delivered";

            const buyerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                "pharma.net.companyId",
                [buyerCRN]
            );
            let buyerKey = await buyerCompKey.next();
            let resultArray = [];
            try {
                for (let i = 0; i < shipmentDetail.assets.length; i++) {
                    let drugKey = shipmentDetail.assets[i];

                    let drugBuffer = await ctx.stub.getState(drugKey).catch((err) => {
                        console.log(err);
                    });
                    let drugDetail = JSON.parse(drugBuffer.toString());
                    //fetching each drug from assets and updating its shipment and owner keys...
                    drugDetail.shipment = shipmentKey;
                    drugDetail.owner = buyerKey.value.key;
                    let drugDetailBuffer = Buffer.from(JSON.stringify(drugDetail));
                    resultArray.push(drugDetail);
                    await ctx.stub.putState(drugKey, drugDetailBuffer);
                }
            } catch (err) {
                console.log(err + " Error while updating drug owner");
            }
            let shipmentDataBuffer = Buffer.from(JSON.stringify(shipmentDetail));
            await ctx.stub.putState(shipmentKey, shipmentDataBuffer);
            return resultArray;
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
     * @param drugName
     * @param serialNo - serial num of drug
     * @param retailerCRN -
     * @param customerAadhar - Aadhar of customer
     * @returns - updated Drug object
     */

    async retailDrug(ctx, drugName, serialNo, retailerCRN, customerAadhar) {
        try {
            //getting retailer composite key
            const retailerCompKey = await ctx.stub.getStateByPartialCompositeKey(
                "pharma.net.companyId",
                [retailerCRN]
            );
            let companyKey = await retailerCompKey.next();


            //getting Drug composite key
            const drugKey = await ctx.stub.createCompositeKey(
                "pharma.net.productIDKey",
                [serialNo, drugName]
            );
            let drugBuffer = await ctx.stub.getState(drugKey).catch((err) => {
                console.log(err);
            });
            let drugDetail = JSON.parse(drugBuffer.toString());
            console.log("TEWSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS");
            console.log(drugDetail.owner + "company key " + companyKey.value.key);

            //making sure retailer who invoke the functions owns the Drug:
            if (drugDetail.owner != companyKey.value.key) {
                return {
                    error: "This retailer doesn't own the Drug you are trying to buy, Please enter valid RetailerCRN",
                };
            }

            //updating drug owner = customer Aadhar
            drugDetail.owner = customerAadhar;
            let drugBufferUpdate = Buffer.from(JSON.stringify(drugDetail));
            await ctx.stub.putState(drugKey, drugBufferUpdate);
            return drugDetail;
        } catch (err) {
            return {
                error: "Unable to retail Drug on the network, check input parameters",
                errorTrace: err.toString()
            };
        }
    }
}
module.exports = TransferDrug;