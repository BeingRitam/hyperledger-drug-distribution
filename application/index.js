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

app.get('/', (req, res) => res.send("Hello this is an App for Pharma Network Registration"));


app.post('/company', (req, res) => {
	registerEntity.execute.createCompanyEntity(req.body.companyCRN, req.body.companyName, req.body.location, req.body.organisationRole).then((companyObj) => {
			//if the return object contains error property then return status = failure 
			//if return object doesn't have error property then return status = success
			//returnObject.errorTace property will print more detailed error or trace logs
			if (companyObj.error) {
				res.status(400).json(generateErrorResponse(companyObj, 'Error while registering the company'));
			} else {
				res.status(201).json(generateSuccessResponse('company', companyObj, 'Company Registered'));
			}
		}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

app.post('/drug', (req, res) => {
	registerEntity.execute.createDrugEntity(req.body.drugName, req.body.serialNo, req.body.mfgDate, req.body.expDate, req.body.companyCRN).then((drugObj) => {
		if (drugObj.error) {
			res.status(400).json(generateErrorResponse(drugObj, 'Error while adding the drug'));
		} else {
			res.status(201).json(generateSuccessResponse('drug', drugObj, 'Drug added successfully'));
		}
	}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

app.post('/purchaseOrder', (req, res) => {
	requisition.execute.createPO(req.body.buyerCRN, req.body.sellerCRN, req.body.drugName, req.body.quantity, req.body.organisationRole).then((purchaseOrderObj) => {
		if (purchaseOrderObj.error) {
			res.status(400).json(generateErrorResponse(purchaseOrderObj, 'Error while creating the purchase order'));
		} else {
			res.status(201).json(generateSuccessResponse('purchaseOrder', purchaseOrderObj, 'Purchase order created successfully'));
		}
	}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

app.post('/shipment', (req, res) => {
	requisition.execute.createShipment(req.body.buyerCRN, req.body.drugName, req.body.listOfAssets, req.body.transporterCRN, req.body.organisationRole).then((shipmentObject) => {
		if (shipmentObject.error) {
			res.status(400).json(generateErrorResponse(shipmentObject, 'Error while creating shipment'));
		} else {
			res.status(201).json(generateSuccessResponse('shipment', shipmentObject, 'Shipment created successfully'));
		}
	})
})

app.patch('/shipment', (req, res) => {
	requisition.execute.updateShipment(req.body.buyerCRN, req.body.drugName, req.body.transporterCRN).then((shipmentObj) => {
		if (shipmentObj.error) {
			res.status(400).json(generateErrorResponse(shipmentObj, 'Error while updating shipment'));
		} else {
			res.status(200).json(generateSuccessResponse('shipment', shipmentObj, 'Shipment updated successfully'));
		}
	})
})

app.post('/retailDrug', (req, res) => {
	retailDrug.execute(req.body.drugName, req.body.serialNo, req.body.retailerCRN, req.body.customerAadhar).then((drugObj) => {
		if (drugObj.error) {
			res.status(400).json(generateErrorResponse(drugObj, 'Error while updating Drug asset details'));
		} else {
			res.status(200).json(generateSuccessResponse('drug', drugObj, 'Drug details updated successfully'));
		}
	}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

app.get('/state', (req, res) => {
	txnUtils.execute.getDrugWorldState(req.query.drugName, req.query.serialNo).then((drugObj) => {
		if (drugObj.error) {
			res.status(400).json(generateErrorResponse(drugObj, 'Unable to fetch Drug asset details'));
		} else {
			res.status(200).json(generateSuccessResponse('drug', drugObj, 'Drug details fetched successfully'));
		}
	}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

app.get('/history', (req, res) => {
	txnUtils.execute.getDrugTxnHistory(req.query.drugName, req.query.serialNo).then((drugHistoryObj) => {
		if (drugHistoryObj.error) {
			res.status(400).json(generateErrorResponse(drugHistoryObj, 'Unable to fetch Drug asset transaction history'));
		} else {
			res.status(200).json(generateSuccessResponse('drug', drugHistoryObj, 'Drug transaction history fetched successfully'));
		}
	}).catch(e => res.status(500).send(generateServerErrorResponse(e)));
})

function generateErrorResponse(obj, errorMessage) {
	return {
		status: 'Failure',
		message: errorMessage,
		error: obj.error,
		errorTrace: obj.errorTrace
	};
}
function generateSuccessResponse(objKey, obj, successMessage) {
	return {
		status: 'Successful',
		message: successMessage,
		[objKey]: obj
	}
}
function generateServerErrorResponse(errorObj) {
	return {
		status: 'error',
		message: 'Failed',
		error: errorObj
	}
}
app.listen(port, () => console.log(`Distributed PharmaNetwork App listening on port ${port}!`));