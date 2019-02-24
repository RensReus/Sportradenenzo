module.exports = function (app) {
    const async = require('async')
    const SQLread = require('../db/SQLread')

    app.post('/api/getracepartcipation', function (req, res) {
        SQLread.getCurrentRace(function(err,race){
            if(err) throw err
            async.auto({
                stageStarttime: function(callback){
                    SQLread.getStageStarttime(race_id, stagenr, callback)
                },
                userParticipation: function(callback){
                    SQLread.getUserRaceParticipation(req.user.account_id, race.race_id, callback)
                }
            }),function(err,results){
                if(err) throw err;
                res.send(results)
            }
        });
    });
}