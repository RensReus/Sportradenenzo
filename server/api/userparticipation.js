module.exports = function (app) {
    const async = require('async')
    const SQLread = require('../db/SQLread')

    app.post('/api/getracepartcipation', function (req, res) {
        console.log('CALLED')
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