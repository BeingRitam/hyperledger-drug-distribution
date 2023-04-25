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

const transitState = {
    1 : 'in-transit',
    2 : 'delivered',
    3 : 'in-warehouse'
}

module.exports = {compositeObjectType, companyHierarchy, transitState};