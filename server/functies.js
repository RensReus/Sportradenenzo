const sqlDB             = require('./db/sqlDB')

calculateUserScores = function (et, callback) {
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
calculateUserScoresKlassieker = function(year,stage,callback){
    var race_id = `(SELECT race_id FROM race WHERE year = ${year} AND name = 'classics')`
    var participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id}`
    sqlDB.query(participantsQuery,function(err,res){
        if(err) throw err;
        var stageselectionQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
        for (i in res.rows){
            var account_participation_id = res.rows[i].account_participation_id;
            var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${stage})`;
            var stagescore = `(SELECT SUM(results_points.totalscore) FROM team_selection_rider 
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN results_points USING (rider_participation_id)
                            WHERE rider_participation.race_id = ${race_id} AND account_participation_id = ${account_participation_id} and stage_id = ${stage_id})`;
            var previousStages = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr < ${stage})`
            var prevstagesScore = 0
            if(stage != 1){
                var prevstagesScore = `(SELECT SUM(stagescore) FROM stage_selection
                WHERE account_participation_id = ${account_participation_id} AND stage_id IN ${previousStages})`;
            }
            var totalscore = `${prevstagesScore} + ${stagescore}`;
            stageselectionQuery += `(${account_participation_id},${stage_id},${stagescore},${totalscore}),`;
        }
        stageselectionQuery = stageselectionQuery.slice(0, -1) + `ON CONFLICT (account_participation_id,stage_id)
        DO UPDATE SET stagescore = EXCLUDED.stagescore, totalscore = EXCLUDED.totalscore`
        sqlDB.query(stageselectionQuery,(err, res) => {
            if (err) throw err;
            console.log(stageselectionQuery)
            console.log("res:",res);
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
            //en zelfs dan zal het wss toch 0 zij
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


module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;
module.exports.transferEtappes = transferEtappes;
module.exports.optimaleScoresUser = optimaleScoresUser;
module.exports.returnEtappeWinnaars = returnEtappeWinnaars;
module.exports.calculateUserScoresKlassieker = calculateUserScoresKlassieker;