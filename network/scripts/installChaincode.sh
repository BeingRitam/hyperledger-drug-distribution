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
CC_NAME="$6"
CC_SEQ="$7"
: ${CHANNEL_NAME:="pharmachannel"}
: ${DELAY:="5"}
: ${LANGUAGE:="node"}
: ${VERSION:=1.1}
: ${TYPE="basic"}
: ${CC_NAME="pharmanet"}
: ${CC_SEQ=1}

LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
ORGS="manufacturer distributor retailer consumer transporter"
TIMEOUT=15
PACKAGE_NAME="pharmanet.tar.gz"

if [ "$TYPE" = "basic" ]; then
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode/"
else
  CC_SRC_PATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/chaincode-advanced/"
fi

# import utils
. scripts/utils.sh

println "executing with the following"
println "- CHANNEL_NAME: ${C_GREEN}${CHANNEL_NAME}${C_RESET}"
println "- CC_NAME: ${C_GREEN}${CC_NAME}${C_RESET}"
println "- CC_SRC_PATH: ${C_GREEN}${CC_SRC_PATH}${C_RESET}"
println "- LANGUAGE: ${C_GREEN}${LANGUAGE}${C_RESET}"
println "- VERSION: ${C_GREEN}${VERSION}${C_RESET}"
println "- CC_SEQ: ${C_GREEN}${CC_SEQ}${C_RESET}"
println "- DELAY: ${C_GREEN}${DELAY}${C_RESET}"

packageChaincode() {
  set -x
  peer lifecycle chaincode package $PACKAGE_NAME --path $CC_SRC_PATH --lang $LANGUAGE --label $VERSION >&log.txt
  export PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${PACKAGE_NAME})
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode packaging has failed"
  successln "Chaincode is packaged"
}

# queryInstalled PEER ORG
queryInstalled() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  set -x
  infoln "Querying on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME'..."
  peer lifecycle chaincode queryinstalled >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Query installed on peer$1.$ORG.pharma.net has failed"
  successln "Query installed successful on peer$1.$ORG.pharma.net on channel"
}

# approveForMyOrg VERSION PEER ORG
approveForMyOrg() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  set -x
  infoln "Approving chaincode definition on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME'..."
  peer lifecycle chaincode approveformyorg -o orderer.pharma.net:7050 --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name $CC_NAME --version $VERSION  --sequence $CC_SEQ --package-id $PACKAGE_ID >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition approved on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME' failed"
  successln "Chaincode definition approved on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME'"
}

# checkCommitReadiness VERSION PEER ORG
checkCommitReadiness() {
  infoln "Checking the commit readiness of the chaincode definition on channel '$CHANNEL_NAME'..."
  set -x
  peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CC_NAME --version $VERSION  --sequence $CC_SEQ --output json >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Commit readiness check on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME' failed"
  successln "Commit readiness check on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME'"
}

# commitChaincodeDefinition VERSION PEER ORG (PEER ORG)...
commitChaincodeDefinition() {
  parsePeerConnectionParameters $@
  set -x
  peer lifecycle chaincode commit -o orderer.pharma.net:7050 --tls --cafile "$ORDERER_CA" --channelID $CHANNEL_NAME --name $CC_NAME "${PEER_CONN_PARMS[@]}" --version $VERSION --sequence $CC_SEQ >&log.txt
  res=$?
  { set +x; } 2>/dev/null
  cat log.txt
  verifyResult $res "Chaincode definition commit failed on peer0.org${ORG} on channel '$CHANNEL_NAME' failed"
  successln "Chaincode definition committed on channel '$CHANNEL_NAME'"
}

queryCommitted() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  infoln "Attempting to Query committed status on peer$1.$ORG.pharma.net on channel '$CHANNEL_NAME'..."
    set -x
    peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME} >&log.txt
    res=$?
    { set +x; } 2>/dev/null
}

packageChaincode

# Install new version of chaincode on peer0 of all 3 orgs making them endorsers
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

# Query Chaincode
queryInstalled 0 'manufacturer'
queryInstalled 1 'manufacturer'
queryInstalled 0 'distributor'
queryInstalled 1 'distributor'
queryInstalled 0 'retailer'
queryInstalled 1 'retailer'
queryInstalled 0 'consumer'
queryInstalled 1 'consumer'
queryInstalled 0 'transporter'
queryInstalled 1 'transporter'

# Approve Chaincode
approveForMyOrg 0 'manufacturer'
approveForMyOrg 0 'distributor'
approveForMyOrg 0 'retailer'
approveForMyOrg 0 'consumer'
approveForMyOrg 0 'transporter'

# Check commit readiness
checkCommitReadiness

# Commit Chaincode
commitChaincodeDefinition 1 2 3 4 5

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
