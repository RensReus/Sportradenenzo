//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app,sqlDB) {
    const async = require('async')
    const SQLread = require('../db/SQLread')
    SQLread.passConnection(sqlDB)
    const SQLwrite = require('../db/SQLwrite')
    SQLwrite.passConnection(sqlDB)
    const SQLscrape = require('../SQLscrape')
    SQLscrape.passConnection(sqlDB)
}