module.exports = function (app) {
    const async = require('async')
    const sqlDB = require('../db/sqlDB')
    const SQLread = require('../db/SQLread')

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

    app.post('/api/testasync',function(req,res){
        if(req.user.admin){
            var baseQuery = req.body.query;
            var combinedQuery = baseQuery + baseQuery + baseQuery + baseQuery + baseQuery + baseQuery;
            var start = new Date().getTime();
            var asyncBool = req.body.async;
            var count = req.body.count;
            if(!asyncBool){
                for(var i = 0; i < count; i++){
                    sqlDB.query(combinedQuery,(err,results)=>{
                        var end = new Date().getTime();
                        console.log("Regulag avg:",(end - start)/i)    
                    })
                }
            }else{
                for(var i = 0; i < count; i++){
                    async.auto({
                        q1: function(callback){
                            sqlDB.query(baseQuery, callback)
                        },
                        q2: function(callback){
                            sqlDB.query(baseQuery, callback)
                        },
                        q3: function(callback){
                            sqlDB.query(baseQuery, callback)
                        },
                        q4: function(callback){
                            sqlDB.query(baseQuery, callback)
                        },
                        q5: function(callback){
                            sqlDB.query(baseQuery, callback)
                        },
                        q6: function(callback){
                            sqlDB.query(baseQuery, callback)
                        }
                    },function(err,results){
                        var end = new Date().getTime();
                        console.log("Async avg:",(end - start)/i)   
                    })
                }
            }
        }
    })
}