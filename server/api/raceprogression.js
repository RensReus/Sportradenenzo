//In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = function (app) {
    const SQLread = require('../db/SQLread')
    const SQLwrite = require('../db/SQLwrite')
    const SQLscrape = require('../SQLscrape')
    const functies = require('../functies')


    app.post('/api/getstagestatus', function (req, res) {

    })

    app.post('/api/currentstagenum',function(req,res){
        console.log("in api",functies.stageNumKlassieker())
        res.send(functies.stageNumKlassieker().toString())
    })
}