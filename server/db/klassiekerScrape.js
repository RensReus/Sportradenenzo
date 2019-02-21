const cheerio = require('cheerio');
const request = require('request');
const functies = require('./functies');
const schedule = require('node-schedule');

const fs = require('fs');
if (fs.existsSync('./server/db/sqlDBlink.js')) {
    var sqlDBstring = require('./sqlDBlink.js');
} else {
    var sqlDBstring = process.env.DATABASE_URL;
}

const { Client } = require('pg');

const sqlDB = new Client({
    connectionString: sqlDBstring,
    ssl: true,
});

sqlDB.connect();


var raceNames = ['omloop-het-nieuwsblad', 'race2'];

getStartlist = function (racenr, year, callback) {
    var race = 0;
    var raceString = raceNames[racenr];
    sqlDB.query(`SELECT race_id FROM race WHERE name = 'klassiekers' AND year = ${year}`)
        .then(res => {
            if (res.rowCount > 0) race = res.rows[0].race;
            request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
                if (!error && response.statusCode == 200) {
                    var $ = cheerio.load(html);
                    $(".black").each(function (index, element) { //gaat ieder team af
                        var teamName = $(this).text();
                        $(this).parent().children(".rider").each(function (index, element) { //gaat iedere renner af
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
                            if ($(this).siblings().eq(4 * index + 4).attr("class") != null) {
                                var country = $(this).siblings().eq(4 * index + 4).attr("class").split(' ')[1];
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
                            var riderQuery = `INSERT INTO rider(pcsid, country, firstname, lastname, initials) 
                            VALUES ($1, $2, $3, $4, $5')
                            ON CONFLICT (pcsid) 
                            DO UPDATE SET pcsid = EXCLUDED.pcsid, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials
                            RETURNING rider_id`;

                            sqlDB.query(riderQuery, riderValues, (err, res) => {
                                if (err) throw err;
                                else {
                                    var rider = res.rows[0].rider_id;
                                    console.log("%s %s INSERTED INTO rider", rider, pcsid)
                                    // insert or update rider_participation
                                    var participationValues = [race, rider, prijs, teamName];
                                    var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) 
                                    VALUES ($1,$2,$3,$4')
                                    ON CONFLICT (race_id,rider_id) 
                                    DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, price = EXCLUDED.price, team = EXCLUDED.team
                                    RETURNING rider_participation_id`;
                                    sqlDB.query(participationQuery,participationValues, (err, res2) => {
                                        if (err) throw err;
                                        else { 
                                            var rider_participation_id = res2.rows[0].rider_participation_id;
                                            var resultsValues = [racenr, rider_participation_id];
                                            var results_pointsQuery = `INSERT INTO results_points(stage_id, rider_participation_id)
                                            VALUES ($1,$2)`;
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
                    callback();
                }
            });
        })
    }

getResult = function (raceName, year, et, callback) {
    var TTstages = [1, 9];
    var raceString = "";
    switch (raceName) {
        case "giro":
            raceString = "giro-d-italia";
            break;
        case "tour":
            raceString = "tour-de-france";
            break;
        case "vuelta":
            raceString = "vuelta-a-espana";
            break;
    }
    request({
        url: `https://www.procyclingstats.com/race/${raceString}/${year}/stage-${et}`,
        headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
        if (error) console.log(error);
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(html);
            var teamWinners = new Array(5).fill("");
            var cases = new Array();
            $(".resTabnav").each(function (index, element) {
                cases.push($(this).attr("class").split(' ')[2]);
            })
            if (!cases.length) {
                cases.push('stage');
            }
            // store the team and id of the leader of each classification and stage winner for teampoints
            $(".basic").each(function (index, element) {
                var end = $(this).children().eq(1).children().first().children().length;
                var classification = cases[index];

                if (end && classification != 'teams') {
                    var columns = new Array();
                    $(this).children().first().children().first().children().each(function (index, element) {
                        columns.push($(this).text())
                    })
                    var teamCol = columns.indexOf("Team");
                    teamWinners[classification] = $(this).children().eq(1).children().first().children().eq(teamCol).children().eq(0).text();
                }
            });

            var ridersDay = new Array();
            var ridersDNF = new Array();
            var ridersGc = new Array();
            var ridersPoints = new Array();
            var ridersYoc = new Array();
            var ridersKom = new Array();
            //process the full results and store in riders* arrays
            $(".basic").each(function (index, element) {
                var end = $(this).children().eq(1).children().first().children().length;
                if (end && cases[index] != 'teams') {
                    var classification = cases[index];
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
                        var pntCol = columns.indexOf('Pnt');
                        switch (classification) {
                            case 'stage'://Dag uitslag
                                var pos = $(this).children().first().text();
                                pos = parseInt(pos);
                                if (isNaN(pos)) pos = 0; //als DNF enzo
                                var result = $(this).children().eq(timeCol).children().eq(0).text();
                                var rider = { pcsid: id, team: teamName, result: result };
                                if (pos) {//doesn't add rider if pos==0
                                    ridersDay.push(rider);
                                } else {
                                    ridersDNF.push(rider);
                                }
                                break;

                            case 'gc'://Algemeen Klassement
                                var result = $(this).children().eq(timeCol).children().eq(0).text();
                                var rider = { pcsid: id, team: teamName, result: result };
                                ridersGc.push(rider);
                                break;

                            case 'points'://Sprinter Klassement
                                var result = $(this).children().eq(pntCol).text();
                                var rider = { pcsid: id, team: teamName, result: result };
                                ridersPoints.push(rider);
                                break;

                            case 'youth'://Jongeren Klassement
                                var result = $(this).children().eq(timeCol).children().eq(0).text();
                                var rider = { pcsid: id, team: teamName, result: result };
                                ridersYoc.push(rider);
                                break;

                            case 'kom'://Berg Klassement
                                var result = $(this).children().eq(pntCol).text();
                                var rider = { pcsid: id, team: teamName, result: result };
                                ridersKom.push(rider);
                                break;
                        }
                    })

                }
            });

            // change DNF to true for ridersDNF
            var dnfquery = `UPDATE rider_participation SET dnf = TRUE 
            WHERE race_id = (SELECT race_id FROM race WHERE name = '${raceName}' AND year = ${year})
            AND rider IN ( `
            for (var rider in ridersDNF) {
                dnfquery += `(SELECT rider_id FROM rider WHERE pcsid = '${ridersDNF[rider].pcsid}'),`
            }
            dnfquery = dnfquery.slice(0, -1) + ")";
            sqlDB.query(dnfquery)
                .then(console.log("%i riders updated to DNF", ridersDNF.length))
                .catch(e => console.error(e.stack));

            // process scores for each finished rider and send to db
            var GTfinished = false;
            if (et == 21) GTfinished = true; // laatste etappe
            var resultsquery = `INSERT INTO results_points(stage_id, rider_participation_id, 
                                stagepos, gcpos, pointspos, kompos, yocpos, 
                                stagescore, gcscore, pointsscore, komscore, yocscore, teamscore, totalscore, 
                                stageresult, gcresult, pointsresult, komresult, yocresult) 
                                VALUES`

            for (var i in ridersDay) {// for each rider get the variables for the results_points table
                var pcsid = ridersDay[i].pcsid;
                var teamRider = ridersDay[i].teamName;
                var teamscore = 0;

                //STAGE
                var stagepos = parseInt(i) + 1;
                var stagescore = getPunten('stage', stagepos);
                var stageresult = ridersDay[i].result;
                if (teamRider == teamWinners['stage'] && stagepos != 1 && !TTstages.contains(et)) teamscore += 10;

                //GC
                var gcpos = getIndex(ridersGc, 'pcsid', pcsid) + 1;
                var gcscore = 0;
                var gcresult = "";
                if (gcpos) {
                    gcscore = getPunten('gc', gcpos);
                    gcresult = ridersGc[gcpos - 1].result;
                }
                if (teamRider == teamWinners['gc'] && gcpos != 1) teamscore += 8;

                //POINTS
                var pointspos = getIndex(ridersPoints, 'pcsid', pcsid) + 1;
                var pointsscore = 0;
                var pointsresult = "";
                if (pointspos) {
                    pointsscore = getPunten('points', pointspos);
                    pointsresult = ridersPoints[pointspos - 1].result;
                }
                if (teamRider == teamWinners['points'] && pointspos != 1) teamscore += 6;

                //KOM
                var kompos = getIndex(ridersKom, 'pcsid', pcsid) + 1;
                var komscore = 0;
                var komresult = "";
                if (kompos) {
                    komscore = getPunten('kom', kompos);
                    komresult = ridersKom[kompos - 1].result;
                }
                if (teamRider == teamWinners['kom'] && kompos != 1) teamscore += 3;

                //YOC
                var yocpos = getIndex(ridersYoc, 'pcsid', pcsid) + 1;
                var yocscore = 0;
                var yocresult = "";
                if (yocpos) {
                    yocscore = getPunten('yoc', yocpos);
                    yocresult = ridersYoc[yocpos - 1].result;
                }
                if (teamRider == teamWinners['yoc'] && yocpos != 1) teamscore += 2;

                //TOTAL
                var totalscore = stagescore + gcscore + pointsscore + komscore + yocscore + teamscore;

                // SQLQUERY addition
                var race_id = `(SELECT race_id FROM race WHERE name = '${raceName}' AND year = ${year})`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et} AND race_id = ${race_id})`
                var rider_id = `(SELECT rider_id FROM rider WHERE pcsid = '${pcsid}')`
                var rider_participation_id = `SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id} AND rider_id = ${rider_id}`
                resultsquery += `(${stage_id},${rider_participation_id},
                                ${stagepos},    ${gcpos},   ${pointspos},   ${kompos},  ${yocpos}, 
                                ${stagescore},  ${gcscore}, ${pointsscore}, ${komscore},${yocscore},${teamscore},${totalscore},
                                '${stageresult}','${gcresult}','${pointsresult}','${komresult}','${yocresult}'),`;
            }

            resultsquery = resultsquery.slice(0, -1) + ' ON CONFLICT (stage,rider_participation) DO NOTHING';
            sqlDB.query(resultsquery)
                .then(res => { callback() })
                .catch(e => console.error(e.stack));
        }
    });
}


function getIndex(array, attr, value) {
    for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

getPunten = function (kl, pos) {
    pos -= 1;
    var dag = [50, 44, 40, 36, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    var ak = [10, 8, 6, 4, 2];
    var punt = [8, 6, 4, 2, 1];
    var jong = [5, 3, 1];
    var berg = [6, 4, 3, 2, 1];
    if (pos < 0) return 0;
    switch (kl) {
        case 'stage'://dag
            if (pos < dag.length) return dag[pos];
            return 0;
        case 'gc'://ak
            if (pos < ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if (pos < punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if (pos < jong.length) return jong[pos];
            return 0;
        case 'kom'://berg
            if (pos < berg.length) return berg[pos];
            return 0;
    }
}

getEindPunten = function (kl, pos) {
    pos -= 1;
    var ak = [100, 80, 60, 50, 40, 36, 32, 28, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
    var punt = [80, 60, 40, 30, 20, 10, 8, 6, 4, 2];
    var jong = [50, 30, 20, 10, 5];
    var berg = [60, 40, 30, 20, 10];
    if (pos < 0) return 0;
    switch (kl) {
        case 'gc'://ak
            if (pos < ak.length) return ak[pos];
            return 0;
        case 'points'://punt
            if (pos < punt.length) return punt[pos];
            return 0;
        case 'youth'://jong
            if (pos < jong.length) return jong[pos];
            return 0;
        case 'kom'://berg
            if (pos < berg.length) return berg[pos];
            return 0;
    }
}

getTTTPunten = function (pos) {
    if (pos < 0) return 0;
    var punten = [40, 32, 28, 24, 20, 16, 12, 8];
    if (pos < punten.length) return punten[pos];
    return 0;
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