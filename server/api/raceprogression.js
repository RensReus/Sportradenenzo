//In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = function (app) {
    const sqlDB = require('../db/sqlDB');

    app.post('/api/getstagestatus', function (req, res) {

    })

    app.post('/api/currentstagenum', function (req, res) {
        var race_id = race_id_global;
        var stageQuery = `SELECT * FROM STAGE
                    WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                    ORDER BY stagenr desc
                    LIMIT 1`;
        sqlDB.query(stageQuery, function (err, results) {
            if (results.rows.length) {// if some results, so at least after start of stage 1
                var stage = results.rows[0];
                if(stage.complete) stage.stagenr++;
                res.send({stage});
            } else {
                res.send({stage:'0'});
            }
        })
    })
}