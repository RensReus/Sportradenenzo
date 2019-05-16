const sqlDB = require('./db/sqlDB')
const schedule = require('node-schedule')
const SQLscrape = require('./SQLscrape');

calculateUserScoresOld = function (et, callback) {
    User.find({'teamselectie.userrenners': {$size: 20}}, function (err, users) {
        if (err) throw err;
        users.forEach(function (user, index) {//get all users
            var punten = 0;
            if (et != 22) {
                if(user.opstellingen[et - 1].opstelling != undefined){
                    Renner.find({ '_id': { $in: user.opstellingen[et - 1].opstelling._id } }, function (err, renners) {// get all renners in opstelling
                        if (err) throw err;
                        renners.forEach(function (renner, index) {
                            if (user.groups.budget) {// aparte budget score berekening
                                if (renner._id === user.opstellingen[et - 1].kopman) {//de niet teampunten gaan x1.5
                                    punten += renner.punten.dag[et - 1] * 0.5 + renner.punten.totaal[et - 1] - renner.punten.team.totaal[et - 1];
                                } else {//voor niet kopman
                                    punten += renner.punten.totaal[et - 1] - renner.punten.team.totaal[et - 1];
                                };
                            } else {//gewone score
                                if (renner._id === user.opstellingen[et - 1].kopman) {//de niet teampunten gaan x1.5
                                    punten += renner.punten.dag[et - 1] * 0.5 + renner.punten.totaal[et - 1];
                                } else {//voor niet kopman
                                    punten += renner.punten.totaal[et - 1];
                                };
                            }
                        });
                        user.profieldata.poulescore.set(et - 1, punten);
                        user.profieldata.totaalscore = user.profieldata.poulescore.reduce((a, b) => a + b);
                        user.save(function (err, result) {//save score
                            if (err) throw err;
                            if (index === users.length - 1) {// als laaste renner dan calculate user en continue code
                                callback();
                            }
                        });
                    });
                }
            }
            if(et == 22){
                Renner.find({ '_id': { $in: user.teamselectie.userrenners.map(renner => renner._id) } }, function (err, renners) {// get all renners in opstelling
                    if (err) throw err;
                    renners.forEach(function (renner, index) {
                        if (user.groups.budget) {// aparte budget score berekening
                            punten += renner.punten.totaal[et - 1] - renner.punten.team.totaal[et - 1];
                        } else {//gewone score
                            punten += renner.punten.totaal[et - 1];
                        }
                    });
                    user.profieldata.poulescore.set(et - 1, punten);
                    user.profieldata.totaalscore = user.profieldata.poulescore.reduce((a, b) => a + b);
                    user.save(function (err, result) {//save score
                        if (err) throw err;
                        if (index === users.length - 1) {// als laaste renner dan calculate user en continue code
                            callback();
                        }
                    });
                });
            }
        });
    });
}
/**
* @param {number} year
* @param {number} stage 
* @param {function} callback
* @returns {Array} array of riders [{ name: , price: , team: ,rider_participation: },...]
 */

calculateUserScores = function(name,year,stage,callback){
    var race_id = `(SELECT race_id FROM race WHERE year = ${year} AND name = '${name}')`
    var participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id}`
    sqlDB.query(participantsQuery,function(err,res){
        if(err) throw err;
        var totalQuery = '';

        for (i in res.rows){// voor iedere gewone user
            for(var j = stage; j < 23; j++){// to show correct totalscores for later stages
                var scoreQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
                var account_participation_id = res.rows[i].account_participation_id;
                var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${j})`;
                var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id = ${stage_id})`
                var stagescore = `COALESCE((SELECT SUM(results_points.totalscore) FROM stage_selection_rider 
                                INNER JOIN results_points USING (rider_participation_id)
                                WHERE stage_selection_id = ${stage_selection_id} AND results_points.stage_id = ${stage_id}),0) `;
                if(res.rows[i].budgetparticipation){// andere stage score voor budget
                    stagescore = `COALESCE((SELECT SUM(results_points.totalscore - results_points.teamscore) FROM stage_selection_rider 
                    INNER JOIN results_points USING (rider_participation_id)
                    WHERE stage_selection_id = ${stage_selection_id} AND results_points.stage_id = ${stage_id}),0) ` ;
                }
                var kopmanScore = ` + (COALESCE ((SELECT 0.5 * stagescore FROM results_points
                                    WHERE rider_participation_id = (SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${stage_selection_id}) AND stage_id = ${stage_id}),0))`
                stagescore +=  kopmanScore;
                var previousStages = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr < ${j})`
                var prevstagesScore = `COALESCE((SELECT SUM(stagescore) FROM stage_selection
                    WHERE account_participation_id = ${account_participation_id} AND stage_id IN ${previousStages}),0)`;
                var totalscore = `${prevstagesScore} + ${stagescore}`;
                scoreQuery += `(${account_participation_id},${stage_id},${stagescore},${totalscore})`;
                scoreQuery += ` ON CONFLICT (account_participation_id,stage_id)
                DO UPDATE SET stagescore = EXCLUDED.stagescore, totalscore = EXCLUDED.totalscore; `
                totalQuery += scoreQuery;

            }
        }
        sqlDB.query(totalQuery,(err, res) => {
            if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
            callback(err, 'Calculated User Scores');
        })
    })
}

calculateUserScoresKlassieker = function(year,stage,callback){
    var race_id = `(SELECT race_id FROM race WHERE year = ${year} AND name = 'classics')`
    var participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id}`
    sqlDB.query(participantsQuery,function(err,res){
        if(err) throw err;
        var totalQuery = '';
        for (i in res.rows){// voor iedere user
            for(var j = stage; j < 15; j++){// to show correct totalscores for later stages
                var scoreQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
                var account_participation_id = res.rows[i].account_participation_id;
                var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${j})`;
                var stagescore = `COALESCE((SELECT SUM(results_points.totalscore) FROM team_selection_rider 
                                INNER JOIN rider_participation USING (rider_participation_id)
                                INNER JOIN results_points USING (rider_participation_id)
                                WHERE rider_participation.race_id = ${race_id} AND account_participation_id = ${account_participation_id} and stage_id = ${stage_id}),0)`;
                var previousStages = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr < ${j})`
                var prevstagesScore = 0
                if(j != 1){
                    var prevstagesScore = `(SELECT SUM(stagescore) FROM stage_selection
                    WHERE account_participation_id = ${account_participation_id} AND stage_id IN ${previousStages})`;
                }
                var totalscore = `${prevstagesScore} + ${stagescore}`;
                scoreQuery += `(${account_participation_id},${stage_id},${stagescore},${totalscore})`;
                scoreQuery += `ON CONFLICT (account_participation_id,stage_id)
                DO UPDATE SET stagescore = EXCLUDED.stagescore, totalscore = EXCLUDED.totalscore; `
                totalQuery += scoreQuery;

            }
        }
        sqlDB.query(totalQuery,(err, res) => {
            if (err) throw err;
        })
    })
    callback(null, 'Calculated User Scores');
    
    
}

transferUsers = function () {
    User.find({"groups.budget":true}, function (err, users) {
        users.forEach(function (user) {
            user.groups.poules.push("RensRBudget");
            user.save(function (err, result) {//save score
                if (err) throw err;
                
            });
            // user.update(
            //     { 'local.admin': false },
            //     { multi: true },
            //     function (err, numberAffected) {
            //     });
        });
    });
}

transferEtappes = function () {
    Etappe.find({}, function (err, etappes) {
        etappes.forEach(function (etappe) {
            etappe.update(
                { 'uitslagKompleet': false },
                { multi: true },
                function (err, numberAffected) {
                });
        });
    });
}

transferRenners = function () {
    Renner.find({}, function (err, renners) {
        renners.forEach(function (renner) {
            renner.update(
                { 'uitgevallen': false },
                { multi: true },
                function (err, numberAffected) {
                });
        });
    });
}

optimaleScoresUser = function (teamselectie, etappes, callback) {
    Renner.find({'_id': { $in: teamselectie }},function(err, renners){
        if (err) throw err;
        var punten = new Array();
        for (var i = 0; i < etappes; i++) {
            // console.log("renners: " + renners.length);
            punten[i]=0;
            var totaalpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.totaal[i]}));
            // console.log("totaal: " + totaalpunten.length);
            
            var dagpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.dag[i]}));
            // console.log("dag: " + dagpunten.length);
            totaalpunten.sort(sortNumber);
            dagpunten.sort(sortNumber);
            //als de beste dag resultaten met kopmanpunten niet binnen de 9 beste renners dan
            for(var j = 0; j<9; j++){
                var bestedag = dagpunten[j].index;
                var positie = attrIndex(totaalpunten,'index',bestedag);
                if(positie < 8 ){// een van de 9 beste dag resultaten zit in de beste 9 totaal punten simpele som
                    punten[i] += dagpunten[j].punten*0.5;
                    for(var k = 0;k<9;k++){
                        punten[i]+=totaalpunten[k].punten;
                    }
                    break;
                }else if ((totaalpunten[positie].punten+0.5*dagpunten[j].punten)>totaalpunten[8].punten){
                    //neem de top 8 kwa totaal punten en de renner die door kopman bonus hoger komt dan nr 9
                    punten[i] += dagpunten[j].punten*0.5;
                    for(var k = 0;k<8;k++){
                        punten[i]+=totaalpunten[k].punten;
                    }
                    punten[i] += totaalpunten[positie].punten;
                    break;                   
                }
            }
            if(isNaN(punten[i]))
                punten[i]=0;
            if(punten[i]!=0)
                continue;
            // als geen van de 9 beste in de dag uitslag dan gewoon 
            for(var k = 0;k<9;k++){
                punten[i]+=totaalpunten[k].punten;
            }
            // moet nog 0.5*dagpunten voor de beste in de dag uitslag van deze groep maar deze code wordt wss nooit gerund 
            //en zelfs dan zal het wss toch 0 zijn
        }
        callback(punten);
    })
}

returnEtappeWinnaars = function(poule,callback){
    User.find({'groups.poules':poule},function(err,users){
        var usernames = new Array();
        var scores = new Array();
        var rankings = new Array();
        if (err) throw err;
        if(users!=null){
            users.forEach(function(user){
                usernames.push(user.local.username);
                scores.push(user.profieldata.poulescore);
            })
        }
        for(var i = 0; i<currentDisplay();i++){
            var stagescores = scores.map(score => score[i]);
            var zipped = []
            for (var j=0; j<stagescores.length; j++){
                zipped.push({naam: usernames[j], punten: stagescores[j]});
            }
            zipped.sort(sortNumber);
            var ranking = new Array();
            for (j=0; j<zipped.length; j++){
                ranking.push(zipped[j].naam);
            }
            rankings.push(ranking);
        }
        var rankingsUsers = new Array();
        for (i in usernames){ //telt hoe vaak een user op iedere plek geeindigt is
            var rankingsUser = new Array(usernames.length+1).fill(0);
            rankingsUser[0] = usernames[i];
            for(var j = 0; j<currentDisplay();j++){
                rankingsUser[rankings[j].indexOf(usernames[i])+1]++;
            }
            rankingsUsers.push(rankingsUser);
        }

        callback(rankings,rankingsUsers);
    })
}

function sortNumber(a,b) {
    return b.punten - a.punten;
}

function attrIndex(array, attr, value) {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}


function stageNumKlassieker(){
    var dates = [new Date("2017-10-01") // omloop
                ,new Date("2017-10-01") // KBK
                ,new Date("2017-10-01") // Strade
                ,new Date("2017-10-01") // MS
                ,new Date("2017-10-01") // E3
                ,new Date("2017-10-01") // GW
                ,new Date("2019-04-03") // DDV
                ,new Date("2019-04-07") // RVV
                ,new Date("2019-04-10") // Schelde
                ,new Date("2019-04-14") // roubaix
                ,new Date("2019-04-21") // AGR
                ,new Date("2019-04-24") // waalse pijl
                ,new Date("2019-04-28") // LBL
                ,new Date("2019-05-01")] // frankfurt


    var currDate = new Date();
    currDate.setHours(0,0,0,0);
    // if(currDate < dates[0]){ Return team selection
    //     return 0;
    // }
    for (i in dates){
        if (currDate <= dates[i]){
            return parseInt(i)+1
        }
    }
    return parseInt(dates.length) + 1 // return eindklassement           
}

var scrapeResults = schedule.scheduleJob("* * * * *", function () {//default to run every minute to initialize at the start.
  var race_id = 5;//TODO niet hardcoded
  console.log("scrape run at: " + new Date().toTimeString());
  var stageQuery = `SELECT * FROM STAGE
                    WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                    ORDER BY stagenr DESC
                    LIMIT 1`;
  sqlDB.query(stageQuery,function(err,results){//returns the most recent stage that started
    if (err) {console.log("WRONG QUERY:",query); throw err;}
    else{
      if(results.rows.length){// if some results, so at least after start of stage 1
        var stage = results.rows[0];
        if(!stage.finished){
          SQLscrape.getTimetoFinish(function(stageFinished,newResultsRule){// getTimetoFinish if not finished
            if(stageFinished){
              var updateStageQuery = `UPDATE stage SET finished = TRUE WHERE stage_id = ${stage.stage_id}`
              sqlDB.query(updateStageQuery,function(err,results){
                if (err) {console.log("WRONG QUERY:",updateStageQuery); throw err;}
                else{
                  console.log("Stage %s finished",stage.stagenr)
                }
              });
              SQLscrape.getResult('giro',2019,stage.stagenr,function(err,response){//TODO niet hardcoded
                if(err) throw err;
                else console.log(response, "stage", stage.stagenr);
              })
            }
            scrapeResults.reschedule(newResultsRule);  //update new schedule
          })
        }else if(!stage.complete){//get results if not complete
          SQLscrape.getResult('giro',2019,stage.stagenr,function(err,response){//TODO niet hardcoded 
            if(err) throw err;
            else console.log(response, "stage", stage.stagenr);
          })
        }else{// if finished and complete set schedule to run again at start of next stage
          var nextStageQuery = `SELECT * FROM stage WHERE race_id = ${race_id} AND stagenr = ${stage.stagenr + 1}`;
          sqlDB.query(nextStageQuery,function(err,nextStageResults){
            if (err) {console.log("WRONG QUERY:",nextStageQuery); throw err;}
            else{
              if(nextStageResults.rows.length){
                var d = nextStageResults.rows[0].starttime;
                resultsRule = `${d.getSeconds()+5} ${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth()} *`
                scrapeResults.cancel();// cancel updates until they are restarted by copyOpstelling
                copyOpstelling.reschedule(resultsRule);  //update new schedule
              }else{// laatste etappe compleet geen scrapes meer nodig
                  copyOpstelling.cancel();
                  scrapeResults.cancel();
              }
            }
          })
        }
      }else{
          console.log("before stage 1")
          scrapeResults.reschedule('0 18 * * *')// als voor een race check dan opnieuw iedere dag om 18:00
      }
    }
  })
});

var copyOpstelling = schedule.scheduleJob('15 10 10 * *', function () {
  console.log("copyopstelling run at: " + new Date().toTimeString());
    console.log("restart scrapeResult",scrapeResults.reschedule('15 * * * *')); //ieder uur
  var race_id = 5; //TODO remove hardcoded
  var stage_id = `(SELECT stage_id FROM stage
                    WHERE starttime < NOW() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                    ORDER BY stagenr DESC
                    LIMIT 1)`;
  var currentStagenr = `(SELECT stagenr FROM stage
                WHERE starttime < NOW() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                ORDER BY stagenr DESC
                LIMIT 1)`;

  var prevStage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${currentStagenr} - 1)`;
  var accountsWithoutSelectionQuery = `SELECT account_participation_id, stage_selection_id FROM stage_selection
                                      LEFT JOIN stage_selection_rider USING (stage_selection_id)
                                      WHERE stage_id = ${stage_id} 
                                      GROUP BY account_participation_id, stage_selection_id
                                      HAVING COUNT(rider_participation_id) = 0`;
  sqlDB.query(accountsWithoutSelectionQuery,function(err,res){
    if (err) {console.log("WRONG QUERY:",accountsWithoutSelectionQuery); throw err;}
    var totalQuery = '';
    for(var i in res.rows){//for each account_participation with an empty stage_selection for the stage that just started
        var prevStage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${prevStage_id} AND account_participation_id = ${res.rows[i].account_participation_id})`;
        //SELECT all riders from previous stage selection and insert into current stage
        var insertPrevSelection = `INSERT INTO stage_selection_rider(stage_selection_id, rider_participation_id)
        SELECT ${res.rows[i].stage_selection_id}, rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${prevStage_selection_id};\n`;
        var prevKopman_id = `(SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${prevStage_selection_id})`;
        var insertPrevKopman = `UPDATE stage_selection SET kopman_id = ${prevKopman_id} WHERE stage_selection_id = ${res.rows[i].stage_selection_id};\n`;
      totalQuery += insertPrevSelection + insertPrevKopman;
    }

    if(res.rows.length){
      sqlDB.query(totalQuery,function(err,results){
        if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
        console.log("Copied selections",res.rowCount);
      })
    }
  })

});




module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;
module.exports.transferEtappes = transferEtappes;
module.exports.optimaleScoresUser = optimaleScoresUser;
module.exports.returnEtappeWinnaars = returnEtappeWinnaars;
module.exports.calculateUserScoresKlassieker = calculateUserScoresKlassieker;
module.exports.stageNumKlassieker = stageNumKlassieker;