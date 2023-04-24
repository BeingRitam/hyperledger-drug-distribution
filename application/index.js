const express = require('express');
const app = express();
const cors = require('cors');
const port = 3000;

//Import all functions
const registerEntity = require('./registrationUtils.js');
const requisition = require('./supplyChainUtils.js');
const retailDrug = require('./retailDrug.js');
const txnUtils = require('./viewTxnUtils.js');
const addToWalletConsumer = require('./addToWalletForAllOrg/consumer_addToWallet.js');
const addToWalletDistributor = require('./addToWalletForAllOrg/distributor_addToWallet.js');
const addToWalletManufacturer = require('./addToWalletForAllOrg/manufacturer_addToWallet.js');
const addToWalletTransporter = require('./addToWalletForAllOrg/transporter_addToWallet.js');
const addToWalletRetailer = require('./addToWalletForAllOrg/retailer_addToWallet.js');


//Define express app settings

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
	extended: true
}));
app.set('title', 'Drug Supply Chain System');

app.get('/', (req, res) => res.send("Hello this is an App for Pharma Network Registration"));


app.post('/company', (req, res) => {
	registerEntity.execute.createCompanyEntity(req.body.companyCRN, req.body.companyName, req.body.location, req.body.organisationRole).then((companyObj) => {
			//if the return object contains error property then return status = failure 
			//if return object doesn't have error property then return status = success
			//returnObject.errorTace property will print more detailed error or trace logs
			if (companyObj.error) {
				var result = {
					status: 'Failure',
					message: 'Error while registering the company, condition to register company not fullfilled',
					error: companyObj.error,
					errorTrace: companyObj.errorTrace
				};
			} else {
				var result = {
					status: 'success',
					message: 'Company Registered',
					company: companyObj
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.post('/drug', (req, res) => {
	registerEntity.execute.createDrugEntity(req.body.drugName, req.body.serialNo, req.body.mfgDate, req.body.expDate, req.body.companyCRN).then((drugObj) => {
			if (drugObj.error) {
				var result = {
					status: 'Failure',
					message: 'Error while adding the drug',
					error: drugObj.error,
					errorTrace: drugObj.errorTrace
				};
			} else {
				var result = {
					status: 'success',
					message: 'Drug added successfully',
					drug: drugObj
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.post('/purchaseOrder', (req, res) => {
	requisition.execute.createPO(req.body.buyerCRN, req.body.sellerCRN, req.body.drugName, req.body.quantity, req.body.organisationRole).then((purchaseOrder) => {
			var result;
			if (purchaseOrder.error) {
				result = {
					status: 'Failure',
					message: 'Error while creating the purchase order',
					error: purchaseOrder.error,
					errorTrace: purchaseOrder.errorTrace
				};
			} else {
				result = {
					status: 'success',
					message: 'Purchase order created successfully',
					purchaseOrder: purchaseOrder
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.post('/shipment', (req, res) => {
	requisition.execute.createShipment(req.body.buyerCRN, req.body.drugName, req.body.listOfAssets, req.body.transporterCRN, req.body.organisationRole).then((shipmentObject) => {
		console.log('Creating Shipment');
		var result;
		if (shipmentObject.error) {
			result = {
				status: 'Failure',
				message: 'Error while creating shipment',
				error: shipmentObject.error,
				errorTrace: shipmentObject.errorTrace
			};
		} else {
			result = {
				status: 'success',
				message: 'Shipment created successfully',
				shipment: shipmentObject
			};
		}
		res.status(500).send(result);
	})
})

app.post('/updateShipment', (req, res) => {
	requisition.execute.updateShipment(req.body.buyerCRN, req.body.drugName, req.body.transporterCRN, req.body.organisationRole).then((shipment) => {
		console.log('Updating Shipment');
		var result;
		if (shipment.error) {
			result = {
				status: 'Failure',
				message: 'Error while updating shipment',
				error: shipment.error,
				errorTrace: shipment.errorTrace
			};
		} else {
			result = {
				status: 'success',
				message: 'Shipment updated successfully',
				shipment: shipment
			};
		}
		res.status(500).send(result);
	})
})

app.post('/retailDrug', (req, res) => {
	retailDrug.execute(req.body.drugName, req.body.serialNo, req.body.retailerCRN, req.body.customerAadhar, req.body.organisationRole).then((drug) => {
			console.log('Drug Retail');
			var result;
			if (drug.error) {
				result = {
					status: 'Failure',
					message: 'Error while updating Drug asset details',
					error: drug.error,
					errorTrace: drug.errorTrace

				};
			} else {
				result = {
					status: 'success',
					message: 'Drug details updated successfully',
					drug: drug
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.get('/state', (req, res) => {
	txnUtils.execute.getDrugWorldState(req.query.drugName, req.query.serialNo).then((drug) => {
			console.log('View current state of the given Drug');
			var result;
			if (drug.error) {
				result = {
					status: 'Failure',
					message: 'Unable to fetch Drug asset details',
					error: drug.error,
					errorTrace: drug.errorTrace
				};
			} else {
				result = {
					status: 'success',
					message: 'Drug details fetched successfully',
					drug: drug
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.post('/viewHistory', (req, res) => {
	txnUtils.execute.getDrugTxnHistory(req.body.drugName, req.body.serialNo, req.body.organisationRole).then((drug) => {
			console.log('View history of transaction on the drug');
			var result;
			if (drug.error) {
				result = {
					status: 'Failure',
					message: 'Unable to fetch Drug asset transaction history',
					error: drug.error,
					errorTrace: drug.errorTrace
				};
			} else {
				result = {
					status: 'success',
					message: 'Drug transaction history fetched successfully',
					drug: drug
				};
			}
			res.json(result);
		})
		.catch((e) => {
			const result = {
				status: 'error',
				message: 'Failed',
				error: e
			};
			res.status(500).send(result);
		})
})

app.listen(port, () => console.log(`Distributed PharmaNetwork App listening on port ${port}!`));