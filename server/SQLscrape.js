const cheerio = require('cheerio');
const request = require('request');
const functies = require('./functies');
const schedule = require('node-schedule');
const sqlDB = require('./db/sqlDB');
const fs = require('fs');

module.exports = {
        getStartlist: function (raceName, year, callback) {
        var raceString = "";
        var prijzenfile = "";
        switch (raceName) {
            case "giro":
                raceString = "giro-d-italia";
                prijzenfile = "./server/Giroprijzen.txt";
                break;
            case "tour":
                raceString = "tour-de-france";
                prijzenfile = "./server/tourprijzen.txt";
                break;
            case "vuelta":
                raceString = "vuelta-a-espana";
                prijzenfile = "./server/prijzen.txt";
                break;
        }
        var race_id = `(SELECT race_id FROM race WHERE name = '${raceName}' AND year = ${year})`;
        fs.readFile(prijzenfile, function (err, file) {

            var data = file.toString();
            var renners = data.split("\n");
            request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
                if (!error && response.statusCode === 200) {
                    var $ = cheerio.load(html);
                    var riderQuery = `INSERT INTO rider(pcs_id, country, firstname, lastname, initials) VALUES`;
                    var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) VALUES`;
                    var startlist_IDs = '(';

                    $(".team").each(function (index, element) { //gaat ieder team af
                        var teamName = $(this).children().first().children().last().text();
                        // $(this).children()
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
                            if ($(this).siblings().eq(4 * index + 4).attr("class") != null) {
                                var country = $(this).siblings().eq(4 * index + 4).attr("class").split(' ')[1];
                            }
                            var prijs = 66666666;
                            for (i in renners) {
                                var renprijs = renners[i].split(" ");
                                if (pcsid === renprijs[0]) {
                                    prijs = parseFloat(renprijs[1]);
                                } else {
                                }
                            }
                            if (prijs < 6) {
                                prijs = prijs * 1000000;
                            }
                            if (prijs === 66666666)
                                console.log(pcsid);

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
                            //insert rider or do nothing
                            if(prijs !== 66666666){// only add riders if they have a correct price, no riders with incorrect price like this hopefully
                                riderQuery += `('${pcsid}', '${country}', '${voornaam}', '${lastname}', '${voorletters}'),`;
                                var rider = `(SELECT rider_id FROM rider WHERE PCS_id = '${pcsid}')`;
                                participationQuery += `(${race_id},${rider}, ${prijs}, '${teamName}'),`;
                                var rider_participation = `(SELECT rider_participation_id FROM rider_participation WHERE rider_id = ${rider} AND race_id = ${race_id})`;
                                startlist_IDs += `${rider_participation},`
                            }
                        })
                    });

                    startlist_IDs = startlist_IDs.slice(0,-1) +')'

                    var ridersInRace = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id})`

                    var deleteStageSelectionQuery = `DELETE FROM stage_selection_rider WHERE rider_participation_id NOT IN ${startlist_IDs} AND rider_participation_id IN ${ridersInRace};\n `

                    var deleteKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE kopman_id NOT IN ${startlist_IDs} AND kopman_id IN ${ridersInRace};\n `

                    var deleteTeamSelectionQuery = `DELETE FROM team_selection_rider WHERE rider_participation_id NOT IN ${startlist_IDs} AND rider_participation_id IN ${ridersInRace};\n `

                    var deleteStartlistQuery = `DELETE FROM rider_participation WHERE rider_participation_id NOT IN ${startlist_IDs} AND race_id = ${race_id};\n `;
                    
                    riderQuery = riderQuery.slice(0,-1) +  ` ON CONFLICT (PCS_id) 
                    DO UPDATE SET PCS_id = EXCLUDED.PCS_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials;\n `;
                
                    participationQuery = participationQuery.slice(0, -1) + ` ON CONFLICT (race_id,rider_id) 
                    DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, team = EXCLUDED.team, price = EXCLUDED.price;\n `;

                    var totalQuery = deleteStageSelectionQuery + deleteKopmanQuery + deleteTeamSelectionQuery + deleteStartlistQuery + riderQuery + participationQuery;
                    console.log(totalQuery)
                    sqlDB.query(totalQuery, (err, res) => {
                        if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
                        else {

                            console.log(res);
                            callback(err,"");
                        }
                    });

                }
            });
        })

    },

    getResult: function (raceName, year, et, callback) {
        var TTstages = [1, 9, 21];
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
            if (!error && response.statusCode === 200) {
                var $ = cheerio.load(html);
                var teamWinners = [];
                var cases = new Array();
                $(".tabnav").each(function (index, element) {
                    cases.push($(this).text());
                })
                if (!cases.length || cases[0] !== 'Stage') {
                    cases[0] = 'Stage';
                }

                // store the team and id of the leader of each classification and stage winner for teampoints
                var index = 0;
                $(".basic").each(function (i, element) {
                    var end = $(this).children().eq(1).children().first().children().length;
                    if($(this).parent().attr("data-id")!=='bonifications' && $(this).parent().attr("data-id")!=='today'){
                        var classification = cases[index];
    
                        if (end && classification !== 'Teams') {
                            var columns = new Array();
                            $(this).children().first().children().first().children().each(function (index, element) {
                                columns.push($(this).text())
                            })
                            var teamCol = columns.indexOf("Team");
                            teamWinners[classification] = $(this).children().eq(1).children().first().children().eq(teamCol).children().eq(0).text();
                        }
                        index++;
                    }
                });
                var ridersDay = new Array();
                var ridersDNF = new Array();
                var ridersGC = new Array();
                var ridersPoints = new Array();
                var ridersYoc = new Array();
                var ridersKom = new Array();
                //process the full results and store in riders* arrays
                var index = 0;

                $(".basic").each(function (i, element) {
                    var end = $(this).children().eq(1).children().first().children().length;
                    if (end && cases[index] !== 'Teams' && $(this).parent().attr("data-id")!=='bonifications' && $(this).parent().attr("data-id")!=='today') {
                        var classification = cases[index];
                        index++;
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
                                
                                case 'Stage'://Dag uitslag
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

                                case 'GC'://Algemeen Klassement
                                    var result = $(this).children().eq(timeCol).children().eq(0).text();
                                    var rider = { pcsid: id, team: teamName, result: result };
                                    ridersGC.push(rider);
                                    break;

                                case 'Points'://Sprinter Klassement
                                    var result = $(this).children().eq(pntCol).text();
                                    var rider = { pcsid: id, team: teamName, result: result };
                                    ridersPoints.push(rider);
                                    break;

                                case 'Youth'://Jongeren Klassement
                                    var result = $(this).children().eq(timeCol).children().eq(0).text();
                                    var rider = { pcsid: id, team: teamName, result: result };
                                    ridersYoc.push(rider);
                                    break;

                                case 'KOM'://Berg Klassement
                                    var result = $(this).children().eq(pntCol).text();
                                    var rider = { pcsid: id, team: teamName, result: result };
                                    ridersKom.push(rider);
                                    break;
                            }
                        })

                    }
                });

                // change DNF to true for ridersDNF
                var race_id = `(SELECT race_id FROM race WHERE name = '${raceName}' AND year = ${year})`;
                var dnfquery = `UPDATE rider_participation SET dnf = TRUE 
                WHERE race_id = ${race_id} AND rider_id IN ( `
                for (var rider in ridersDNF) {
                    dnfquery += `(SELECT rider_id FROM rider WHERE pcs_id = '${ridersDNF[rider].pcsid}'),`
                }
                dnfquery = dnfquery.slice(0, -1) + ")";
                if(ridersDNF.length){ //only submit if > 0
                    sqlDB.query(dnfquery, (err, dnfres) => {
                        if (err) {console.log("WRONG QUERY:",dnfquery); throw err;}
                        else {
                            console.log()
                            console.log("Riders DNF updated", dnfres.rowCount )
                        }
                    });
                }
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et} AND race_id = ${race_id})`;

                var uitslagCompleet = false;
                var GCprevlength = 176;
                // var youngPrev = [];
                var prevstage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et-1} AND race_id = ${race_id})`
                var prevQuery = `SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT gcpos = 0 `
                sqlDB.query(prevQuery,function(err,prevRes){
                    if (err) {console.log("WRONG QUERY:",prevQuery); throw err;}
                    if(et != 1){
                        GCprevlength = prevRes.rows[0].count;
                        // youngprevlength = prevRes.rows[0].youngCount;
                    }
                    // var jongDNF = 0;
                    // for (i in ridersDNF) {
                    //     if (youngPrev.map(jongeren => jongeren._id).includes(ridersDNF[i]))
                    //         jongDNF++;
                    // }
                    
                    var akComp = (ridersGC.length + ridersDNF.length) == GCprevlength;
                    var sprintComp = ridersPoints.length;
                    var bergComp = ridersKom.length;
                    var jongComp = ridersYoc.length; //+ jongDNF.length == ;
                    if (et == 1) { jongComp = true; bergComp = true; }
                    console.log(ridersGC.length , ridersDNF.length,GCprevlength)
                    if (akComp && sprintComp && bergComp && jongComp && ridersGC.length === ridersDay.length) {
                        uitslagCompleet = true;
                    }
                    
                    var stageCompleteQuery = `UPDATE stage SET complete = TRUE, finished = TRUE WHERE stage_id = ${stage_id}`
                    if(uitslagCompleet){
                        sqlDB.query(stageCompleteQuery,function(err,completeRes){
                            if (err) {console.log("WRONG QUERY:",stageCompleteQuery); throw err;}
                            console.log("Stage %s Complete",et)
                        })
                    }
                })


                // process scores for each finished rider and send to db
                var GTfinished = false;
                if (et === 21) GTfinished = true; // laatste etappe
                var resultsQuery = `INSERT INTO results_points(stage_id, rider_participation_id, 
                                stagepos, gcpos, pointspos, kompos, yocpos, 
                                stagescore, gcscore, pointsscore, komscore, yocscore, teamscore, totalscore, 
                                stageresult, gcresult, pointsresult, komresult, yocresult) 
                                VALUES`

                for (var i =0;i<ridersDay.length;i++) {// for each rider get the variables for the results_points table
                    var pcsid = ridersDay[i].pcsid;
                    var teamRider = ridersDay[i].team;
                    var teamscore = 0;

                    //STAGE
                    var stagepos = parseInt(i) + 1;
                    var stagescore = getPunten('Stage', stagepos);
                    var stageresult = ridersDay[i].result;
                    if (teamRider === teamWinners['Stage'] && stagepos !== 1 && !TTstages.includes(et)) teamscore += 10;

                    //GC
                    var gcpos = getIndex(ridersGC, 'pcsid', pcsid) + 1;
                    var gcscore = 0;
                    var gcresult = "";
                    if (gcpos) {
                        gcscore = getPunten('GC', gcpos);
                        gcresult = ridersGC[gcpos - 1].result;
                    }
                    if (teamRider === teamWinners['GC'] && gcpos !== 1) teamscore += 8;

                    //POINTS
                    var pointspos = getIndex(ridersPoints, 'pcsid', pcsid) + 1;
                    var pointsscore = 0;
                    var pointsresult = "";

                    if (pointspos) {
                        pointsscore = getPunten('Points', pointspos);
                        pointsresult = ridersPoints[pointspos - 1].result;
                    }
                    if (teamRider === teamWinners['Points'] && pointspos !== 1) teamscore += 6;

                    //KOM
                    var kompos = getIndex(ridersKom, 'pcsid', pcsid) + 1;
                    var komscore = 0;
                    var komresult = 0;
                    if (kompos) {
                        komscore = getPunten('KOM', kompos);
                        komresult = ridersKom[kompos - 1].result;
                    }
                    if (teamRider === teamWinners['KOM'] && kompos !== 1) teamscore += 3;

                    //YOC
                    var yocpos = getIndex(ridersYoc, 'pcsid', pcsid) + 1;
                    var yocscore = 0;
                    var yocresult = "";
                    if (yocpos) {
                        yocscore = getPunten('Youth', yocpos);
                        yocresult = ridersYoc[yocpos - 1].result;
                    }
                    if (teamRider === teamWinners['yoc'] && yocpos !== 1) teamscore += 2;

                    //TOTAL
                    var totalscore = stagescore + gcscore + pointsscore + komscore + yocscore + teamscore;

                    // SQLQUERY addition
                    var rider_id = `(SELECT rider_id FROM rider WHERE pcs_id = '${pcsid}')`
                    var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id} AND rider_id = ${rider_id})`
                    resultsQuery += `(${stage_id},${rider_participation_id},
                                ${stagepos},    ${gcpos},   ${pointspos},   ${kompos},  ${yocpos}, 
                                ${stagescore},  ${gcscore}, ${pointsscore}, ${komscore},${yocscore},${teamscore},${totalscore},
                                '${stageresult}','${gcresult}','${pointsresult}','${komresult}','${yocresult}'),`;
                }

                resultsQuery = resultsQuery.slice(0, -1) + ' ON CONFLICT (stage_id,rider_participation_id) DO NOTHING';
                deleteQuery = `DELETE FROM results_points WHERE stage_id = ${stage_id}; `;
                totalQuery = deleteQuery + resultsQuery;
                if(ridersDay.length){// don't send if no results
                    sqlDB.query(totalQuery,(err,res)=>{
                        if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}
                        else {
                            console.log("Processed results stage ",et,"Riders ",res[1].rowCount)
                            functies.calculateUserScores(raceName,year,et,callback)
                        }
                    })
                }else{
                    functies.calculateUserScores(raceName,year,et,callback)                    
                }
            }
        });
    },

    getTimetoFinish: function (callback) {
        request({
            url: 'https://www.procyclingstats.com/',
            headers: { "Connection": "keep-alive" }
        }, function (error, response, html) {
            var $ = cheerio.load(html);
            var rule = '';
            var finished = false;   
            var girobeschikbaar = false;
            $(".home1").first().children('.homeTbl1').first().children().first().children().first().children().eq(1).children().each(function () {
                if ($(this).children().eq(2).text().startsWith('Giro d\'Italia')) { // voor de giro
                    girobeschikbaar = true;
                    if ($(this).children().eq(0).text() != 'finished' && $(this).children().eq(0).text() != '-') {
                        var timeRemaining = $(this).children().eq(0).text();
                        console.log("Time Remaining: ",timeRemaining);
                        if (timeRemaining[timeRemaining.length - 1] === 'm' || timeRemaining[0] === 1 ) { // als nog een uur of minder
                            rule = '*/5 * * * *';// iedere 5 min checken 
                            console.log("next run in 5 min")
                            callback(finished, rule);
                            return;
                        } else {
                            rule = '15 * * * *';// ieder uur op XX:15
                            console.log("next run in 1 hour")
                            callback(finished, rule);
                            return;
                        }

                    } else {//als gefinisht
                        rule = '* * * * *';// iedere 1 min checken 
                        finished = true;
                        callback(finished, rule);
                        return;
                    }
                }
            });
            if (!girobeschikbaar) {
                console.log("Race not available");
                rule = '0 0 10 * *'; // check at 10am
                callback(finished, rule);
                return;
            }
        });
    },

    getRider: function (pcsid, callback) {
        request(`https://www.procyclingstats.com/rider/${pcsid}`, function (err, res, html) {
            if (!err && res.statusCode === 200) {
                var $ = cheerio.load(html);
                var entry = $('.entry').children('h1').text()
                if (entry === 'Could not find rider') { //Kijk of de pagina bestaat, volledig afhankelijk van de 404 pagina layout
                    callback(404)
                    return;
                } else {
                    var nameAndTeam = entry.split('»') //Zoek naam en team op de pagina
                    var age = $('.rdr-info-cont').text().match(new RegExp(/\(([^)]+)\)/))[1] //Zoek de leeftijd, het getal tussen de haakjes
                    var country = $('.entry').children('span').attr("class").split(' ')[2];
                    var countryFullname = $('.rdr-info-cont').children('a.black').text()
                    var imageURL = 'https://www.procyclingstats.com/' + $('.rdr-img-cont').find('img').attr('src') //URL van het plaatje van de renner
                    var nameArray = nameAndTeam[0].trim().split(' ') //Split de naam
                    var lastName = nameArray.pop() //Haal de achternaam er uit en sla op
                    var initials = '';
                    nameArray.forEach(function (name) {
                        initials += name[0] + '.'
                    });
                    var firstName = nameArray.join(' ')
                    var rider = {
                        'lastName': lastName, //Laatste entry in de array is de achternaam
                        'firstName': firstName, //De rest is voornamen
                        'age': age,
                        'country': country,
                        'team': nameAndTeam[1], //Naam van het team
                        'imageURL': imageURL,
                        'pcsid': pcsid,
                        'countryFullname': countryFullname,
                        'initials': initials
                    }
                    callback(rider);
                    return;
                }
            } else {
                callback(404)
                return;
            }
        });
    }
}

//functies voor intern gebruik
getIndex = function (array, attr, value) {
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
        case 'Stage'://dag
            if (pos < dag.length) return dag[pos];
            return 0;
        case 'GC'://ak
            if (pos < ak.length) return ak[pos];
            return 0;
        case 'Points'://punt
            if (pos < punt.length) return punt[pos];
            return 0;
        case 'Youth'://jong
            if (pos < jong.length) return jong[pos];
            return 0;
        case 'KOM'://berg
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

getTTTPunten= function (pos) {
    if (pos < 0) return 0;
    var punten = [40, 32, 28, 24, 20, 16, 12, 8];
    if (pos < punten.length) return punten[pos];
    return 0;
}

