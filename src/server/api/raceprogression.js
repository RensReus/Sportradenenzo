//In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = function (app, racename, year, stage) {
    const sqlDB = require('../db/sqlDB');

    app.post('/api/getstagestatus', function (req, res) {

    })

    app.post('/api/getinitialdata', function (req, res) {
        var newRedir = '/teamselection';     
          if(stage !== 0){
            newRedir = '/stage/' + stage;
          }
        res.send({redirect: newRedir, racename, year});
    })
}