const sqlDB = require('./sqlDB')
const cheerio = require('cheerio');
const request = require('request');
const schedule = require('node-schedule');

var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi','milano-sanremo','e3-harelbeke','gent-wevelgem','dwars-door-vlaanderen','ronde-van-vlaanderen','Scheldeprijs','paris-roubaix','amstel-gold-race','la-fleche-wallone','liege-bastogne-liege','Eschborn-Frankfurt'];
var raceWeight = [1.25, 1, 1.25, 2, 1.5, 1.5, 1.25, 2, 1, 2, 1.5, 1.5, 2, 1.25];



getStartlist = function (year, racenr, callback) {
    var race_id = 4;
    var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = ${racenr})`;
    var raceString = raceNames[racenr-1];
        request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
            if (!error && response.statusCode == 200) {
                var $ = cheerio.load(html);
                var riderQuery = `INSERT INTO rider(PCS_id, country, firstname, lastname, initials) VALUES`;
                var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) VALUES`;
                var results_pointsQuery = `INSERT INTO results_points(stage_id, rider_participation_id) VALUES`;
                $(".team").each(function (index, element) { //gaat ieder team af
                    var teamName = $(this).children().first().children().eq(1).text();
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
                        
                    })
                });
                riderQuery = riderQuery.slice(0,-1) +  ` ON CONFLICT (PCS_id) 
                DO UPDATE SET PCS_id = EXCLUDED.PCS_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials`;
                
                participationQuery = participationQuery.slice(0, -1) + `ON CONFLICT (race_id,rider_id) 
                DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, team = EXCLUDED.team`;

                results_pointsQuery = results_pointsQuery.slice(0, -1) + `ON CONFLICT (stage_id, rider_participation_id)
                DO NOTHING`;

                sqlDB.query(riderQuery, (err, res) => {
                    if (err) throw err;
                    else {
                        console.log(res);
                        sqlDB.query(participationQuery, (err, res2) => {
                            if (err) throw err;
                            else { 
                                //set an empty score for each rider
                                console.log("PARTICIPATION ");
                                console.log(res2);
                                sqlDB.query(results_pointsQuery, (err, res3) => {
                                    if (err) throw err;
                                    console.log('RESULT_POINTS');
                                    console.log(res3);
                                })
                            }
                        })
                    }
                });
                
                console.log("just before callback");
                callback();
            }
        })
    }


getStartlist_old = function (year, racenr, callback) {
    var race_id = 4;
    var stage_id = 0;
    var raceString = raceNames[racenr - 1];
    sqlDB.query(`SELECT stage_id FROM stage WHERE race_id = ${race_id} AND stagenr = ${racenr}`)
        .then(res => {
            if (res.rowCount > 0) {
                stage_id = res.rows[0].stage_id;

            }
            console.log("got stage %s", stage_id);
            request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    console.log(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`)
                    $(".team").each(function (index, element) { //gaat ieder team af
                        var teamName = $(this).children().first().children().eq(1).text();
                        console.log("teamname %s", teamName);
                        $(this).children().eq(2).children(".rider").each(function (index, element) { //gaat iedere renner af
                            var name = $(this).text();
                            // sla achternaam voor naam en voorletters op
                            var lastname = $(this).children().first().text();
                            var voornaam = name.substring(lastname.length + 1);
                            var voornamen = voornaam.split(' ').filter(x => x);
                            var voorletters = "";
                            for (var i = 0; i < voornamen.length; i++) {
                                voorletters += voornamen[i].substring(0, 1) + ".";
                            }

                            var pcsid = $(this).attr('href').substring(6);
                            if ($(this).siblings().eq(4 * index).attr("class") != null) {
                                var country = $(this).siblings().eq(4 * index).attr("class").split(' ')[1];
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
                            var riderValues = [pcsid, country, voornaam, lastname, voorletters];
                            console.log(pcsid, country, voornaam, lastname, voorletters);
                            var riderQuery = `INSERT INTO rider(PCS_id, country, firstname, lastname, initials) 
                            VALUES ($1, $2, $3, $4, $5)
                            ON CONFLICT (PCS_id) 
                            DO UPDATE SET PCS_id = EXCLUDED.PCS_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials
                            RETURNING rider_id`;
                            sqlDB.query(riderQuery, riderValues, (err, res) => {
                                if (err) throw err;
                                else {
                                    var rider = res.rows[0].rider_id;
                                    console.log("%s %s INSERTED INTO rider or Updated", rider, pcsid)
                                    // insert or update rider_participation
                                    var participationValues = [race_id, rider, prijs, teamName];
                                    var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) 
                                    VALUES ($1,$2,$3,$4)
                                    ON CONFLICT (race_id,rider_id) 
                                    DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, team = EXCLUDED.team
                                    RETURNING rider_participation_id`;
                                    sqlDB.query(participationQuery, participationValues, (err, res2) => {
                                        if (err) throw err;
                                        else {
                                            //set an empty score for each rider
                                            var rider_participation_id = res2.rows[0].rider_participation_id;
                                            var resultsValues = [stage_id, rider_participation_id];
                                            var results_pointsQuery = `INSERT INTO results_points(stage_id, rider_participation_id)
                                            VALUES ($1,$2)
                                            ON CONFLICT (stage_id, rider_participation_id)
                                            DO NOTHING`;
                                            sqlDB.query(results_pointsQuery, resultsValues, (err, res3) => {
                                                if (err) throw err;
                                                console.log("rider added")
                                            })
                                        }
                                    })
                                }
                            });
                        })
                    });
                    console.log("just before callback");
                    callback();
                }
            });
        })
}


// ga niet verder dan dit
getResult = function (year, et, callback) {
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
            // console.log($(".basic").first().children().first().children().children())
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
                var stagescore = getPunten(stagepos) * raceWeight[et - 1];
                var stageresult = ridersDay[i].result;
                //TEAM
                var teamscore = getTeamPunten(stagepos, teamRider, teamWinners) * raceWeight[et - 1];
                //TOTAL
                var totalscore = stagescore + teamscore;

                // SQLQUERY addition
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et} AND race_id = ${race_id})`
                var rider_id = `(SELECT rider_id FROM rider WHERE PCS_id = '${pcsid}')`
                var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id} AND rider_id = ${rider_id})`
                resultsquery += `(${stage_id},${rider_participation_id},
                                ${stagepos}, ${stagescore}, '${stageresult}', ${teamscore}, ${totalscore}),`;
            }

            resultsquery = resultsquery.slice(0, -1) + ' ON CONFLICT (stage_id,rider_participation_id) DO UPDATE SET stagepos = EXCLUDED.stagepos, stagescore = EXCLUDED.stagescore, stageresult = EXCLUDED.stageresult, teamscore = EXCLUDED.teamscore, totalscore = EXCLUDED.totalscore';
            // console.log(resultsquery)
            sqlDB.query(resultsquery)
                .then(res => { callback() })
                .catch(e => console.error(e.stack));
        }
    });
}

getPunten = function (pos) {
    pos -= 1;
    var dag = [100, 88, 80, 72, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8, 4];
    if (pos < 0) return 0;
    if (pos < dag.length) return dag[pos];
    return 0;
}

getTeamPunten = function (pos, teamRider, teamWinners) {
    var teamPoints = 0;
    console.log(pos, teamRider, teamWinners[0])
    if (pos != 1 && teamRider == teamWinners[0]) teamPoints += 20;
    if (pos != 2 && teamRider == teamWinners[1]) teamPoints += 12;
    if (pos != 3 && teamRider == teamWinners[2]) teamPoints += 4;
    console.log(teamPoints)
    return teamPoints;
}

getTimetoFinish = function (callback) {
    request({
        url: 'https://www.procyclingstats.com/',
        headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
        var $ = cheerio.load(html);
        var rule = new schedule.RecurrenceRule()
        var finished = false;
        var girobeschikbaar = false;

        $(".ind_td").first().children().eq(1).children().each(function () {
            if ($(this).children().eq(2).text().startsWith('La Vuelta ciclista a España')) { // voor de giro
                girobeschikbaar = true;
                if ($(this).children().eq(5).text() != 'finished') {
                    var timeRemaining = $(this).children().eq(0).text();
                    if (timeRemaining[timeRemaining.length - 1] == 'm' || timeRemaining[0] == 1) { // als nog een uur of minder
                        rule.minute = new schedule.Range(0, 59, 5); // iedere 5 min checken
                        callback([finished, rule]);
                        return;
                    } else {
                        rule.minute = 7; // ieder uur als finish nog ver weg
                        callback([finished, rule]);
                        return;

                    }

                } else {//als gefinisht
                    rule.minute = new schedule.Range(0, 59, 1); // iedere minuut checken
                    finished = true;
                    callback([finished, rule]);
                    return;
                }
            }
        });
        if (!girobeschikbaar) {
            rule.minute = 7;
            callback([finished, rule]);
            return;
        }
    });


}

module.exports.getStartlist = getStartlist;
module.exports.getResult = getResult;
module.exports.getTimetoFinish = getTimetoFinish;