//In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = function (app, sqlDB) {
    const async = require('async')
    const SQLread = require('../db/SQLread')
    SQLread.passConnection(sqlDB)
    const SQLwrite = require('../db/SQLwrite')
    SQLwrite.passConnection(sqlDB)
    const SQLscrape = require('../SQLscrape')
    SQLscrape.passConnection(sqlDB)


    app.post('/api/getstagestatus', function (req, res) {

    })
}