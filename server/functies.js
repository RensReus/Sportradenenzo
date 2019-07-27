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
        var TTTstage = 2;//TODO hardcoded
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
                    var divide2 = "";
                    if(j == TTTstage){
                        divide2 = "/2";
                    }
                    stagescore = `COALESCE((SELECT SUM(results_points.totalscore - results_points.teamscore) FROM stage_selection_rider 
                    INNER JOIN results_points USING (rider_participation_id)
                    WHERE stage_selection_id = ${stage_selection_id} AND results_points.stage_id = ${stage_id}),0)${divide2} ` ;
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
            punten[i]=0;
            var totaalpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.totaal[i]}));
            
            var dagpunten = renners.map((renner, index) => ({index : index, punten : renner.punten.dag[i]}));
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
  var race_id = race_id_global;
  var stageQuery = `SELECT * FROM STAGE
                    WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                    ORDER BY stagenr DESC
                    LIMIT 1`;
  sqlDB.query(stageQuery,function(err,results){//returns the most recent stage that started
    if (err) {console.log("WRONG QUERY:",stageQuery); throw err;}
    else{
      if(results.rows.length){// if some results, so at least after start of stage 1
        var stage = results.rows[0];
        if(!stage.finished){
          SQLscrape.getTimetoFinish(function(stageFinished,newResultsRule){// getTimetoFinish if not finished
            if(stageFinished){
              var updateStageQuery = `UPDATE stage SET finished = TRUE WHERE stage_id = ${stage.stage_id}`
              sqlDB.query(updateStageQuery,function(err,results){
                if (err) {console.log("WRONG QUERY:",updateStageQuery); throw err;}
                else console.log("Stage %s finished",stage.stagenr)
              });
              SQLscrape.getResult('tour',2019,stage.stagenr,function(err,response){//TODO niet hardcoded
                if(err) throw err;
                else console.log(response, "stage", stage.stagenr,"\n");
              })
            }
            scrapeResults.reschedule(newResultsRule);  //update new schedule
          })
        }else if(!stage.complete){//get results if not complete
          SQLscrape.getResult('tour',2019,stage.stagenr,function(err,response){//TODO niet hardcoded 
            if(err) throw err;
            else console.log(response, "stage", stage.stagenr,"\n");
          })
        }else{// if finished and complete set schedule to run again at start of next stage
          currentstage_global += 1;
          var nextStageQuery = `SELECT * FROM stage WHERE race_id = ${race_id} AND stagenr = ${stage.stagenr + 1}`;
          sqlDB.query(nextStageQuery,function(err,nextStageResults){
            if (err) {console.log("WRONG QUERY:",nextStageQuery); throw err;}
            else{
              if(stage.stagenr < 21){
                var d = nextStageResults.rows[0].starttime;
                resultsRule = `${d.getSeconds()+5} ${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth()} *`
                scrapeResults.reschedule(resultsRule);
                setCurrentStage();

              }else{// laatste etappe compleet geen scrapes meer nodig
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

function setCurrentStage(){
    var race_id = race_id_global;
        var stageQuery = `SELECT * FROM STAGE
                    WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                    ORDER BY stagenr desc
                    LIMIT 1`;
        sqlDB.query(stageQuery, function (err, results) {
            if (results.rows.length) {// if some results, so at least after start of stage 1
                var stage = results.rows[0];
                if(stage.complete) stage.stagenr++;
                currentstage_global = stage.stagenr;
            }
        })
}


function selectionsPopUp(selecties){//deze functie werkt ook voor de volledige selecties van 20
    //Voor de gecombineerde opstellingen popup
    var allSelectedRiders = [];//alle geselecteerde riders sorterd naar aantal keer geselecteerd
    var allSelections = [];
    for (var i in selecties) {
        for (var j in selecties[i].riders){
            var riderName = selecties[i].riders[j].Name;
            if(riderName.startsWith('*')){
                riderName = riderName.substring(2)
            }
            var riderObj = {name: riderName, selected: 1, users: selecties[i].username};
            var index = allSelectedRiders.findIndex(function(rider){return rider.name === riderName});
            if(index===-1){
                allSelectedRiders.push(riderObj);
            }else{
                allSelectedRiders[index].selected += 1;
                allSelectedRiders[index].users += ", " + selecties[i].username;
            }
        }
        // allSelections.push({title: selecties[i].username, data: selecties[i].riders})
        allSelections.push({title: selecties[i].username, data: []})
    }
    allSelectedRiders.sort(function(a,b){return b.selected - a.selected})
    //Hersorteren dagselecties van users
    var allSelectedRiders34 = allSelectedRiders.filter(rider => rider.selected > 2);
    //alle renners die 3 of 4x zijn gekozen kunnen automatisch boven aan gezet worden
    for (var i in allSelectedRiders34){
        var riderName = allSelectedRiders34[i].name;
        for(var j in selecties){
            var index = selecties[j].riders.findIndex(function(rider){return rider.Name === riderName})
            if(index === -1){
                index = selecties[j].riders.findIndex(function(rider){return rider.Name === '* ' + riderName})
            }
            if(index === -1){
                allSelections[j].data.push({"Name": " ", "Score": 0})
            }else{
                allSelections[j].data.push(selecties[j].riders[index])
            }
        }
    }
    // voor de renners die 2x zijn gekozen wordt het iets lastiger omdat je moet checken of je 2 dubbel gekozen renners naast elkaar kan zetten
    var allSelectedRiders2 = allSelectedRiders.filter(rider => rider.selected === 2);

    var placesNeeded = [];// een overzichtje van alle 2x renners en door wie geselecteerd
    for (var i in allSelectedRiders2){
        var placesNeededRider = []
        var riderName = allSelectedRiders2[i].name;
        for(var j in selecties){//kijk of deze renner zo hoog mogelijk geplaatst kan worden
            var index = selecties[j].riders.findIndex(function(rider){return rider.Name === riderName})
            if(index === -1){
                index = selecties[j].riders.findIndex(function(rider){return rider.Name === '* ' + riderName})
            }
            if(index !== -1){
                placesNeededRider.push(j)
            }
        }
        placesNeeded.push(placesNeededRider)
    }

    function allUnique(arr1,arr2){
        for(var i in arr1){
            for(var j in arr2){
                if(arr1[i]===arr2[j]) return false;
            }
        }
        return true;
    }

    //nu kijken welke sets van 2 elkaar complementeren
    var i = 0;
    while(placesNeeded.length>1 && i < placesNeeded.length - 1){
        var matched = false;
        for(var j = i + 1; j < placesNeeded.length; j++){
            if(allUnique(placesNeeded[i],placesNeeded[j])){//passen ze samen dan insert
                matched = true;
                var riderName2 = allSelectedRiders2[j].name;
                var riderName1 = allSelectedRiders2[i].name;
                //verwijder de 2 passende renners
                allSelectedRiders2.splice(j,1); allSelectedRiders2.splice(i,1);
                placesNeeded.splice(j,1); placesNeeded.splice(i,1);
                for(var k in selecties){
                    var index = selecties[k].riders.findIndex(function(rider){return rider.Name === riderName1})
                    if(index === -1){
                        index = selecties[k].riders.findIndex(function(rider){return rider.Name === '* ' + riderName1})
                    }
                    if(index !== -1){//add rider1
                        allSelections[k].data.push(selecties[k].riders[index])
                    }else{// add rider2
                        var index = selecties[k].riders.findIndex(function(rider){return rider.Name === riderName2})
                        if(index === -1){
                            index = selecties[k].riders.findIndex(function(rider){return rider.Name === '* ' + riderName2})
                        }
                        allSelections[k].data.push(selecties[k].riders[index])
                    }
                }
                continue;
            }
        }
        if (matched){
            i=0;
            continue;
        }
        i++;
    }

    // alle overgebleven 2x renners toevoegen
    for (var i in allSelectedRiders2){
        var riderName = allSelectedRiders2[i].name;
        for(var j in selecties){//kijk of deze renner zo hoog mogelijk geplaatst kan worden
            var index = selecties[j].riders.findIndex(function(rider){return rider.Name === riderName})
            if(index === -1){
                index = selecties[j].riders.findIndex(function(rider){return rider.Name === '* ' + riderName})
            }
            if(index === -1){
                allSelections[j].data.push({"Name": " ", "Score": 0})
            }else{
                allSelections[j].data.push(selecties[j].riders[index])
            }
        }
        placesNeeded.push(placesNeededRider)
    }

    

    //de rest opvullen met 1x geselecteerde renners
    var allSelectedRiders1 = allSelectedRiders.filter(rider => rider.selected === 1);
    for (var i in selecties){
        var sum = 0;
        for (var j in selecties[i].riders){
            var index = allSelectedRiders1.findIndex(function(rider){return rider.name === selecties[i].riders[j].Name})
            if(index === -1){
                index = allSelectedRiders1.findIndex(function(rider){return '* ' + rider.name === selecties[i].riders[j].Name})
            }
            if(index!==-1){
                allSelectedRiders1.slice(index,1)
                var emptyPlaceIndex = allSelections[i].data.findIndex(function(rider){return rider.Name===" "})
                if(emptyPlaceIndex !== -1){
                    allSelections[i].data[emptyPlaceIndex] = selecties[i].riders[j];
                }else{
                    allSelections[i].data.push(selecties[i].riders[j])
                }
            }
            sum += parseInt(selecties[i].riders[j].Score);
        }
        allSelections[i].data.push({"Name":"Totaal","Score":sum,"rowClassName":"bold black"})
    }

    allSelections.push({title:"Alle opsgestelde Renners", data: allSelectedRiders})
    return allSelections;
}


module.exports.calculateUserScores = calculateUserScores;
module.exports.transferUsers = transferUsers;
module.exports.transferEtappes = transferEtappes;
module.exports.optimaleScoresUser = optimaleScoresUser;
module.exports.returnEtappeWinnaars = returnEtappeWinnaars;
module.exports.calculateUserScoresKlassieker = calculateUserScoresKlassieker;
module.exports.stageNumKlassieker = stageNumKlassieker;
module.exports.attrIndex = attrIndex;
module.exports.setCurrentStage = setCurrentStage;
module.exports.selectionsPopUp = selectionsPopUp;