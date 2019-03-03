module.exports = function (app,sqlDB) {
    const async = require('async')
    const SQLread = require('../db/SQLread')
    SQLread.passConnection(sqlDB)

    app.post('/api/getracepartcipation', function (req, res) {
        SQLread.getCurrentRace(function(err,race){
            console.log(race)
            if(err) throw err
            async.auto({
                stageStarttime: function(callback){
                    SQLread.getStageStarttime(race.race_id, '1', callback)
                },
                userParticipation: function(callback){
                    SQLread.getUserRaceParticipation(req.user.account_id, race.race_id, callback)
                }
            }),function(err,results){
                if(err) throw err;
                console.log(results)
                res.send(results)
            }
        });
    });
}