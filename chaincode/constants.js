const compositeObjectType = {
    companyId: 'pharma.net.companyId',
    drugId: 'pharma.net.productIDKey',
    purchaseOrderId: 'pharma.net.poId',
    shipmentKey: 'pharma.net.shipmentKey'
}

const companyHierarchy = {
    Manufacturer : 1,
    Distributor : 2,
    Retailer : 3,
    Transporter: -1
}

function isExistingLedgerObject(ledgerBuffer) {
    if (!ledgerBuffer || ledgerBuffer.length === 0) return false;
    else return true;
}

module.exports = {compositeObjectType, companyHierarchy, isExistingLedgerObject};