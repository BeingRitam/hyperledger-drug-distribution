#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# Color Coding for Terminal
C_RESET='\033[0m'
C_RED='\033[0;31m'
C_GREEN='\033[0;32m'
C_BLUE='\033[0;34m'
C_YELLOW='\033[1;33m'

# This is a collection of bash functions used by different scripts
ORDERER_CA=${PWD}/crypto/ordererOrganizations/pharma.net/orderers/orderer.pharma.net/msp/tlscacerts/tlsca.pharma.net-cert.pem
PEER0_MANUFACTURER_CA=${PWD}/crypto/peerOrganizations/manufacturer.pharma.net/peers/peer0.manufacturer.pharma.net/tls/ca.crt
PEER0_DISTRIBUTOR_CA=${PWD}/crypto/peerOrganizations/distributor.pharma.net/peers/peer0.distributor.pharma.net/tls/ca.crt
PEER0_RETAILER_CA=${PWD}/crypto/peerOrganizations/retailer.pharma.net/peers/peer0.retailer.pharma.net/tls/ca.crt
PEER0_CONSUMER_CA=${PWD}/crypto/peerOrganizations/consumer.pharma.net/peers/peer0.consumer.pharma.net/tls/ca.crt
PEER0_TRANSPORTER_CA=${PWD}/crypto/peerOrganizations/transporter.pharma.net/peers/peer0.transporter.pharma.net/tls/ca.crt

# verify the result of the end-to-end test
verifyResult() {
  if [ "$1" -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute pharma Network Bootstrap ==========="
    echo
    exit 1
  fi
}

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/pharma.net/orderers/orderer.pharma.net/msp/tlscacerts/tlsca.pharma.net-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/pharma.net/users/Admin@pharma.net/msp
}

setGlobals() {
  PEER=$1
  ORG=$2
  if [ "$ORG" == 'manufacturer' ]; then
    CORE_PEER_LOCALMSPID="manufacturerMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_MANUFACTURER_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/manufacturer.pharma.net/users/Admin@manufacturer.pharma.net/msp
    if [ "$PEER" -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.manufacturer.pharma.net:7051
    else
      CORE_PEER_ADDRESS=peer1.manufacturer.pharma.net:8051
    fi
  elif [ "$ORG" == 'distributor' ]; then
    CORE_PEER_LOCALMSPID="distributorMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_DISTRIBUTOR_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/distributor.pharma.net/users/Admin@distributor.pharma.net/msp
    if [ "$PEER" -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.distributor.pharma.net:9051
    else
      CORE_PEER_ADDRESS=peer1.distributor.pharma.net:10051
    fi

  elif [ "$ORG" == 'retailer' ]; then
    CORE_PEER_LOCALMSPID="retailerMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_RETAILER_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/retailer.pharma.net/users/Admin@retailer.pharma.net/msp
    if [ "$PEER" -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.retailer.pharma.net:11051
    else
      CORE_PEER_ADDRESS=peer1.retailer.pharma.net:12051
    fi

  elif [ "$ORG" == 'consumer' ]; then
    CORE_PEER_LOCALMSPID="consumerMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_CONSUMER_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/consumer.pharma.net/users/Admin@consumer.pharma.net/msp
    if [ "$PEER" -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.consumer.pharma.net:13051
    else
      CORE_PEER_ADDRESS=peer1.consumer.pharma.net:14051
    fi

  elif [ "$ORG" == 'transporter' ]; then
    CORE_PEER_LOCALMSPID="transporterMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_TRANSPORTER_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/transporter.pharma.net/users/Admin@transporter.pharma.net/msp
    if [ "$PEER" -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.transporter.pharma.net:15051
    else
      CORE_PEER_ADDRESS=peer1.transporter.pharma.net:16051
    fi
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi
}

updateAnchorPeers() {
  PEER=$1
  ORG=$2
  setGlobals "$PEER" "$ORG"

  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel update -o orderer.pharma.net:7050 -c "$CHANNEL_NAME" -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel update -o orderer.pharma.net:7050 -c "$CHANNEL_NAME" -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls "$CORE_PEER_TLS_ENABLED" --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep "$DELAY"
  echo
}

## Sometimes Join takes time hence RETRY at least 5 times
joinChannelWithRetry() {
  PEER=$1
  ORG=$2
  setGlobals "$PEER" "$ORG"
  export BLOCKFILE="./channel-artifacts/$CHANNEL_NAME.block"

  set -x
  peer channel join -b $BLOCKFILE >&log.txt
  res=$?
  set +x
  cat log.txt
  if [ $res -ne 0 -a "$COUNTER" -lt "$MAX_RETRY" ]; then
    COUNTER=$(expr "$COUNTER" + 1)
    echo "peer${PEER}.${ORG} failed to join the channel, Retry after $DELAY seconds"
    sleep "$DELAY"
    joinChannelWithRetry "$PEER" "$ORG"
  else
    COUNTER=1
  fi
  verifyResult $res "After $MAX_RETRY attempts, peer${PEER}.${ORG} has failed to join channel '$CHANNEL_NAME' "
}

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

installChaincode() {
  PEER=$1
  ORG=$2
  setGlobals "$PEER" "$ORG"
  VERSION=${3:-1.0}
  set -x
  peer lifecycle chaincode install $PACKAGE_NAME >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode installation on peer${PEER}.${ORG} has failed"
  echo "===================== Chaincode  pharmanet is installed on peer${PEER}.${ORG} ===================== "
  echo
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

instantiateChaincode() {
  PEER=$1
  ORG=$2
  setGlobals "$PEER" "$ORG"
  VERSION=${3:-1.0}

  # while 'peer chaincode' command can get the orderer endpoint from the peer
  # (if join was successful), let's supply it directly as we know it using
  # the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode instantiate -o orderer.pharma.net:7050 -C "$CHANNEL_NAME" -n pharmanet -l "${LANGUAGE}" -v "${VERSION}" -c '{"Args":["pharma.net.registration:instantiate"]}' -P "OR ('manufacturerMSP.member','distributorMSP.member','retailerMSP.member','consumerMSP.member','transporterMSP.member')" >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode instantiate -o orderer.pharma.net:7050 --tls "$CORE_PEER_TLS_ENABLED" --cafile $ORDERER_CA -C $CHANNEL_NAME -n pharmanet -l ${LANGUAGE} -v ${VERSION} -c '{"Args":["pharma.net.registration:instantiate"]}' -P "OR ('manufacturerMSP.member','distributorMSP.member','retailerMSP.member','consumerMSP.member','transporterMSP.member')" >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Chaincode instantiation on peer${PEER}.${ORG} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on peer${PEER}.${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

upgradeChaincode() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  VERSION=${3:-1.0}

  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode upgrade -o orderer.pharma.net:7050 -C $CHANNEL_NAME -n pharmanet -l ${LANGUAGE} -v ${VERSION} -p ${CC_SRC_PATH} -c '{"Args":["pharma.net.registration:instantiate"]}' -P "OR ('manufacturerMSP.member','distributorMSP.member','retailerMSP.member','consumerMSP.member','transporterMSP.member')" >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode upgrade -o orderer.pharma.net:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n pharmanet -l ${LANGUAGE} -v ${VERSION} -p ${CC_SRC_PATH} -c '{"Args":["pharma.net.pharmanet:instantiate"]}' -P "OR ('manufacturerMSP.member','distributorMSP.member','retailerMSP.member','consumerMSP.member','transporterMSP.member')" >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Chaincode upgrade on peer${PEER}.${ORG} has failed"
  echo "===================== Chaincode is upgraded on peer${PEER}.${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvoke <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvoke() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.pharma.net:7050 -C $CHANNEL_NAME -n pharmanet "${PEER_CONN_PARMS[@]}" -c '{"Args":["pharma.net.registration:instantiate"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.pharma.net:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n pharmanet "${PEER_CONN_PARMS[@]}" -c '{"Args":["pharma.net.registration:instantiate"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    ORG_NAME=$(echo $ORGS | cut -d " " -f $1)
    setGlobals 0 $ORG_NAME
    PEER=$CORE_PEER_ADDRESS
    PEER=${PEER%%:*}
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	PEERS="$PEER"
    else
	PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
    ## Set path to TLS certificate
    CA=PEER0_ORG$1_CA
    TLSINFO=(--tlsRootCertFiles $CORE_PEER_TLS_ROOTCERT_FILE)
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}

# println echos string
function println() {
  echo -e "$1"
}

# errorln echos i red color
function errorln() {
  println "${C_RED}${1}${C_RESET}"
}

# successln echos in green color
function successln() {
  println "${C_GREEN}${1}${C_RESET}"
}

# infoln echos in blue color
function infoln() {
  println "${C_BLUE}${1}${C_RESET}"
}

# warnln echos in yellow color
function warnln() {
  println "${C_YELLOW}${1}${C_RESET}"
}

# fatalln echos in red color and exits with fail status
function fatalln() {
  errorln "$1"
  exit 1
}

export -f errorln
export -f successln
export -f infoln
export -f warnln
