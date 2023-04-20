#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Deploying Chaincode PHARMANET On Pharma Network"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
VERSION="$4"
TYPE="$5"
: ${CHANNEL_NAME:="pharmachannel"}
: ${DELAY:="5"}
: ${LANGUAGE:="node"}
: ${VERSION:=1.1}
: ${TYPE="basic"}

LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
ORGS="manufacturer distributor retailer consumer transporter"
TIMEOUT=15
PACKAGE_NAME="pharmanet.tar.gz"

if [ "$TYPE" = "basic" ]; then
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/"
else
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-advanced/"
fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

packageChaincode() {
  set -x
  peer lifecycle chaincode package $PACKAGE_NAME --path $CC_SRC_PATH --lang $LANGUAGE --label $VERSION >&log.txt
  PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${PACKAGE_NAME})
  echo 'Package ID': $PACKAGE_ID
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode packaging has failed"
  successln "Chaincode is packaged"
}

packageChaincode

## Install new version of chaincode on peer0 of all 3 orgs making them endorsers
echo "Installing chaincode on peer0.manufacturer.pharma.net ..."
installChaincode 0 'manufacturer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer1.manufacturer.pharma.net ..."
installChaincode 1 'manufacturer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer0.distributor.pharma.net ..."
installChaincode 0 'distributor' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer1.distributor.pharma.net ..."
installChaincode 1 'distributor' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer0.retailer.pharma.net ..."
installChaincode 0 'retailer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer1.retailer.pharma.net ..."
installChaincode 1 'retailer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer0.consumer.pharma.net ..."
installChaincode 0 'consumer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer1.consumer.pharma.net ..."
installChaincode 1 'consumer' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer0.transporter.pharma.net ..."
installChaincode 0 'transporter' $VERSION $PACKAGE_NAME
echo "Installing chaincode on peer1.transporter.pharma.net ..."
installChaincode 1 'transporter' $VERSION $PACKAGE_NAME


# Instantiate chaincode on the channel using peer0.manufacturer
echo "Instantiating chaincode on channel using peer0.manufacturer.pharma.net ..."
instantiateChaincode 0 'manufacturer' $VERSION

echo
echo "========= All GOOD, Chaincode CERTNET Is Now Installed & Instantiated On pharma Network =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
