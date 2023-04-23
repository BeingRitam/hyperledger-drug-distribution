const fs = require('fs');
const yaml = require('js-yaml');
const {contractName} = require('./constants.js');
const {Wallets ,Gateway} = require('fabric-network');
let gateway;



async function getContractInstance(orgName, contractIdentifier) {

    // A gateway defines which peer is used to access Fabric network
    // It uses a common connection profile (CCP) to connect to a Fabric Peer
    // A CCP is defined manually in file connection-profile-iit.yaml
    gateway = new Gateway();

    //if loop to point to the right CCP and pull the right contract 
    if (orgName == 'Manufacturer') {
        var wallet = await Wallets.newFileSystemWallet('./identity/manufacturer/');
        var fabricUserName = 'MANUFACTURER_ADMIN';
        var connectionProfile = yaml.load(fs.readFileSync('./connection-profile/connection-profile-Manufacturer.yaml', 'utf8'));
    } else if (orgName == 'Distributor') {
        var wallet = await Wallets.newFileSystemWallet('./identity/distributor/');
        var fabricUserName = 'DISTRIBUTOR_ADMIN';
        var connectionProfile = yaml.load(fs.readFileSync('./connection-profile/connection-profile-Distributor.yaml', 'utf8'));
    } else if (orgName == 'Retailer') {
        var wallet = await Wallets.newFileSystemWallet('./identity/retailer/');
        var fabricUserName = 'RETAILER_ADMIN';
        var connectionProfile = yaml.load(fs.readFileSync('./connection-profile/connection-profile-Retailer.yaml', 'utf8'));
    } else if (orgName == 'Consumer') {
        var wallet = await Wallets.newFileSystemWallet('./identity/consumer/');
        var fabricUserName = 'CONSUMER_ADMIN';
        var connectionProfile = yaml.load(fs.readFileSync('./connection-profile/connection-profile-Consumer.yaml', 'utf8'));
    } else if (orgName == 'Transporter') {
        var wallet = await Wallets.newFileSystemWallet('./identity/transporter/');
        var fabricUserName = 'TRANSPORTER_ADMIN';
        var connectionProfile = yaml.load(fs.readFileSync('./connection-profile/connection-profile-Transporter.yaml', 'utf8'));
    } else {
        return {
            message: 'Please enter valid organisation name.'
        };
    }

    // Set connection options; identity and wallet
    let connectionOptions = {
        wallet: wallet,
        identity: fabricUserName,
        discovery: {
            enabled: false,
            asLocalhost: true
        }
    };

    // Connect to gateway using specified parameters
    console.log('.....Connecting to Fabric Gateway');
    await gateway.connect(connectionProfile, connectionOptions);

    // Access certification channel
    console.log('.....Connecting to channel - pharmachannel');
    const channel = await gateway.getNetwork('pharmachannel');

    // Get instance of deployed Certnet contract
    // @param Name of chaincode
    // @param Name of smart contract
    console.log(`.....Connecting to Smart Contract ${contractIdentifier}`);
    return channel.getContract('pharmanet', contractIdentifier);
}

function disconnect() {
    console.log('.....Disconnecting from Fabric Gateway');
    gateway.disconnect();
}

module.exports.getContractInstance = getContractInstance;
module.exports.disconnect = disconnect;