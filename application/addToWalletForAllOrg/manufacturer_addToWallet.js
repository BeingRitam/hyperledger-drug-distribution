"use strict";

/**
 * This is a Node.JS module to load a user's Identity to his wallet.
 * This Identity will be used to sign transactions initiated by this user.
 * Defaults:
 *  User Name: manufacturer_ADMIN
 *  User Organization: manufacturer
 *  User Role: Admin
 *
 */

const fs = require('fs'); // FileSystem Library
const path = require('path');
const {Wallets} = require("fabric-network"); // Wallet Library provided by Fabric
async function main(certificatePath, privateKeyPath) {
	// Main try/catch block
	try {

		// A wallet is a filesystem path that stores a collection of Identities
		const wallet = await Wallets.newFileSystemWallet('./identity/manufacturer');
		// Fetch the credentials from our previously generated Crypto Materials required to create this user's identity
		const certificate = fs.readFileSync(path.resolve(__dirname, certificatePath)).toString();
		// IMPORTANT: Change the private key name to the key generated on your computer
		const privatekey = fs.readFileSync(path.resolve(__dirname, privateKeyPath)).toString();

		// Load credentials into wallet
		const identityLabel = "MANUFACTURER_ADMIN";
		const identity = {
			credentials: {
				certificate: certificate,
				privateKey: privatekey
			},
			mspId: 'manufacturerMSP',
			type: 'X.509'
		};

		await wallet.put(identityLabel, identity);
	} catch (error) {
		console.log(`Error adding to wallet. ${error}`);
		console.log(error.stack);
		throw new Error(error);
	}
}

console.log
const certificatePath = './../../network/crypto-config/peerOrganizations/manufacturer.pharma.net/users/Admin@manufacturer.pharma.net/msp/signcerts/Admin@manufacturer.pharma.net-cert.pem';
const privateKeyPath = './../../network/crypto-config/peerOrganizations/manufacturer.pharma.net/users/Admin@manufacturer.pharma.net/msp/keystore/priv_sk';
main(certificatePath, privateKeyPath).then(() => {
	console.log("User - Manufacturer identity added to wallet.");
});

module.exports.execute = main;