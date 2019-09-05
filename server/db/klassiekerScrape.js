const sqlDB = require('./sqlDB');
const cheerio = require('cheerio');
const request = require('request');
const schedule = require('node-schedule');

var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi','milano-sanremo','e3-harelbeke','gent-wevelgem','dwars-door-vlaanderen','ronde-van-vlaanderen','Scheldeprijs','paris-roubaix','amstel-gold-race','la-fleche-wallone','liege-bastogne-liege','Eschborn-Frankfurt'];
var raceWeight = [1.25, 1, 1.25, 2, 1.5, 1.5, 1.25, 2, 1, 2, 1.5, 1.5, 2, 1.25];



getStartlistKlassieker = function (year, racenr, callback) {
    var race_id = 4;
    var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = ${racenr})`;
    var raceString = raceNames[racenr-1];
        request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var riderQuery = `INSERT INTO rider(PCS_id, country, firstname, lastname, initials) VALUES`;
                var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) VALUES`;
                var results_pointsQuery = `INSERT INTO results_points(stage_id, rider_participation_id) VALUES`;
                var startlist_IDs = '(';
                $(".team").each(function (index, element) { //gaat ieder team af
                    var teamName = $(this).children().first().children().eq(-1).text();
                    $(this).children().eq(2).children(".rider").each(function (index, element) { //gaat iedere renner af
                        var name = $(this).children().first().text();

                        // sla achternaam voor naam en voorletters op
                        var lastname = $(this).children().first().children().first().text();
                        var voornaam = name.substring(lastname.length + 1);
                        var voornamen = voornaam.split(' ').filter(x => x);
                        var voorletters = "";
                        for (var i = 0; i < voornamen.length; i++) {
                            voorletters += voornamen[i].substring(0, 1) + ".";
                        }

                        var pcsid = $(this).attr('href').substring(6);
                        if ($(this).siblings().eq(4 * index + 1).attr("class") != null) {
                            var country = $(this).siblings().eq(4 * index + 1).attr("class").split(' ')[1];
                        }
                        var prijs = 500000; //default 500k

                        // if name contains '
                        var apind = voornaam.indexOf("'");
                        if (apind >= 0) {
                            voornaam = voornaam.substr(0, apind) + "'" + voornaam.substr(apind, voornaam.length - 1);
                        }
                        var apind = lastname.indexOf("'")
                        if (apind >= 0) {
                            lastname = lastname.substr(0, apind) + "'" + lastname.substr(apind, lastname.length - 1);
                        }
                        //sqlcode
                        //insert rider or update
                        riderQuery += `('${pcsid}', '${country}', '${voornaam}', '${lastname}', '${voorletters}'),`;
                        var rider = `(SELECT rider_id FROM rider WHERE PCS_id = '${pcsid}')`;
                        participationQuery += `(${race_id},${rider}, ${prijs}, '${teamName}'),`;
                        var rider_participation = `(SELECT rider_participation_id FROM rider_participation WHERE rider_id = ${rider} AND race_id = ${race_id})`;
                        results_pointsQuery += `(${stage_id},${rider_participation}),`;
                        startlist_IDs += `${rider_participation},`
                    })
                });
                startlist_IDs = startlist_IDs.slice(0,-1) +')'
                var deleteQuery = `DELETE FROM results_points WHERE stage_id = ${stage_id} AND rider_participation_id NOT IN ${startlist_IDs}; `;// to remove riders no longer on startlist

                riderQuery = riderQuery.slice(0,-1) +  ` ON CONFLICT (PCS_id) 
                DO UPDATE SET PCS_id = EXCLUDED.PCS_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials; `;
                
                participationQuery = participationQuery.slice(0, -1) + `ON CONFLICT (race_id,rider_id) 
                DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, team = EXCLUDED.team; `;

                results_pointsQuery = results_pointsQuery.slice(0, -1) + `ON CONFLICT (stage_id, rider_participation_id)
                DO NOTHING; `;
                var totalQuery = deleteQuery +  riderQuery + participationQuery + results_pointsQuery;
                var error = null;
                sqlDB.query(totalQuery, (err, res) => {
                    if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}                                
                    else {
                        console.log("Startlist Query Results:",res);
                    }
                    error = err;
                });
                callback(error,"res");
            }
        })
    }



// ga niet verder dan dit
getResultKlassieker = function (year, et, callback) {
    var raceString = raceNames[et - 1];
    var race_id = 4;
    request({
        url: `https://www.procyclingstats.com/race/${raceString}/${year}`,
        headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
        if (error) console.log(error);
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var teamWinners = ["", "", ""];
            // store the team and id of the leader of each classification and stage winner for teampoints
            $(".basic").each(function (index, element) {
                var columns = new Array();
                $(this).children().first().children().first().children().each(function (index, element) {
                    columns.push($(this).text());
                })
                var teamCol = columns.indexOf("Team");
                teamWinners[0] = $(this).children().eq(1).children().first().children().eq(teamCol).children().eq(0).text();
                teamWinners[1] = $(this).children().eq(1).children().eq(1).children().eq(teamCol).children().eq(0).text();
                teamWinners[2] = $(this).children().eq(1).children().eq(2).children().eq(teamCol).children().eq(0).text();

            });
            var ridersDay = new Array();
            //process the full results and store in riders* arrays
            $(".basic").each(function (index, element) {
                var columns = new Array();
                $(this).children().first().children().first().children().each(function (index, element) {
                    columns.push($(this).text());
                })
                var renCol = columns.indexOf("Rider");
                var teamCol = columns.indexOf("Team");
                $(this).children().eq(1).children().each(function (index, element) {//voor iedere renner in de uitslag
                    var id = $(this).children().eq(renCol).children().eq(1).attr('href').substring(6);
                    var teamName = $(this).children().eq(teamCol).children().eq(0).text();
                    var timeCol = columns.indexOf('Time');

                    var pos = $(this).children().first().text();
                    pos = parseInt(pos);
                    if (isNaN(pos)) pos = 0; //als DNF enzo
                    var result = $(this).children().eq(timeCol).children().eq(0).text();
                    var rider = { pcsid: id, team: teamName, result: result };

                    ridersDay.push(rider);
                })

            });


            var resultsquery = `INSERT INTO results_points(stage_id, rider_participation_id, 
                                stagepos, stagescore, stageresult, teamscore, totalscore)  
                                VALUES`// the rest is not needed, defaults to 0 and won't be used

            for (var i in ridersDay) {// for each rider get the variables for the results_points table
                var pcsid = ridersDay[i].pcsid;
                var teamRider = ridersDay[i].team;

                //STAGE
                var stagepos = parseInt(i) + 1;
                var stagescore = getPuntenKlas(stagepos) * raceWeight[et - 1];
                var stageresult = ridersDay[i].result;
                //TEAM
                var teamscore = getTeamPuntenKlas(stagepos, teamRider, teamWinners) * raceWeight[et - 1];
                //TOTAL
                var totalscore = stagescore + teamscore;

                // SQLQUERY addition
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et} AND race_id = ${race_id})`
                var rider_id = `(SELECT rider_id FROM rider WHERE PCS_id = '${pcsid}')`
                var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id} AND rider_id = ${rider_id})`
                resultsquery += `(${stage_id},${rider_participation_id},
                                ${stagepos}, ${stagescore}, '${stageresult}', ${teamscore}, ${totalscore}),`;
            }
            if(ridersDay.length !== 0){
                resultsquery = resultsquery.slice(0, -1) + ' ON CONFLICT (stage_id,rider_participation_id) DO UPDATE SET stagepos = EXCLUDED.stagepos, stagescore = EXCLUDED.stagescore, stageresult = EXCLUDED.stageresult, teamscore = EXCLUDED.teamscore, totalscore = EXCLUDED.totalscore';
                sqlDB.query(resultsquery, (err, res) =>{
                    if (err) {console.log("WRONG QUERY:",resultsquery); throw err;} 
                    else{
                        callback()
                    }                      
                })
            }else{
                callback();
            }
        }
    });
}

getPuntenKlas = function (pos) {
    pos -= 1;
    var dag = [100, 88, 80, 72, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4];
    if (pos < 0) return 0;
    if (pos < dag.length) return dag[pos];
    return 0;
}

getTeamPuntenKlas = function (pos, teamRider, teamWinners) {
    var teamPoints = 0;
    if (pos != 1 && teamRider == teamWinners[0]) teamPoints += 20;
    if (pos != 2 && teamRider == teamWinners[1]) teamPoints += 12;
    if (pos != 3 && teamRider == teamWinners[2]) teamPoints += 4;
    return teamPoints;
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

module.exports.getStartlist = getStartlistKlassieker;
module.exports.getResult = getResultKlassieker;