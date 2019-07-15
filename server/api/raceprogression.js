//In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = function (app) {
    const sqlDB = require('../db/sqlDB');

    app.post('/api/getstagestatus', function (req, res) {

    })

    app.post('/api/currentstageredir', function (req, res) {
        var newRedir = '/teamselection';     
          if(currentstage_global !== 0){
            newRedir = '/stage/' + currentstage_global;
          }
        res.send({redirect: newRedir});
    })
}