const cheerio = require('cheerio');
const request = require('request');
const schedule = require('node-schedule');
const sqlDB = require('./db/sqlDB');

const getStartlist = function (race, callback) {
  const fs = require('fs');
  var raceString = "";
  var prijzenfile = "";
  var raceDataQuery = "";
  // set race_id
  var race_id
  if (race.race_id != null) {
    race_id = race.race_id;
  } else {// set race_id using racename/year
    race_id = `(SELECT race_id FROM race WHERE name = '${race.raceName}' AND year = ${race.year})`;
  }
  //set racestring
  if (race.raceName === 'classics') {//if classics get name of the stage/race from DB
    raceDataQuery = `SELECT * FROM stage WHERE race_id = ${race_id} AND stagenr = ${race.racenr}`
    sqlDB.query(raceDataQuery, (err, results) => {
      if (err) { console.log("WRONG QUERY:", raceDataQuery); throw err; }
      else {
        startlistProcessRiders(results.rows[0].name, 'classics', race.year, race_id, callback)
      }
    })
  } else {//if not classics set racestring and load price list
    switch (race.raceName) {
      case "giro":
        raceString = "giro-d-italia";
        prijzenfile = "./src/server/Giroprijzen.txt";
        break;
      case "tour":
        raceString = "tour-de-france";
        prijzenfile = "./src/server/tourprijzen.txt";
        break;
      case "vuelta":
        raceString = "vuelta-a-espana";
        prijzenfile = "./src/server/vueltaprijzen.txt";
        break;
    }
    fs.readFile(prijzenfile, function (err, file) {
      if (err) console.log(err);
      var data = file.toString().split("\n");
      var riderprices = []
      for (var i in data) {
        var rider = data[i].split(" ");
        var pcs_id = rider[0];
        var price = parseFloat(rider[1]);
        riderprices.push({ pcs_id, price })
      }
      startlistProcessRiders(raceString, riderprices, race.year, race_id, callback)
    })
  }
}

var startlistProcessRiders = function (raceString, prices, year, race_id, callback) {
  request(`https://www.procyclingstats.com/race/${raceString}/${year}/startlist`, function (error, response, html) {
    var stage_id = 0; //Placeholder
    if (!error && response.statusCode === 200) {
      var $ = cheerio.load(html);
      var riderQuery = `INSERT INTO rider(pcs_id, country, firstname, lastname, initials) VALUES`;
      var participationQuery = `INSERT INTO rider_participation (race_id,rider_id,price,team) VALUES`;
      var results_pointsQuery = `INSERT INTO results_points(stage_id, rider_participation_id) VALUES`;
      var startlist_IDs = '(';

      $(".team").each(function (index, element) { //gaat ieder team af
        var teamName = $(this).children().first().children().last().text();
        $(this).children().eq(2).children(".rider").each(function (index, element) { //gaat iedere renner af

          var name = $(this).children().first().text();
          // sla achternaam voor naam en voorletters op
          var lastname = $(this).children().first().children().first().text().toLowerCase();
          lastname = lastname.charAt(0).toUpperCase() + lastname.slice(1);
          var voornaam = name.substring(lastname.length + 1);
          var voornamen = voornaam.split(' ').filter(x => x);
          var voorletters = "";
          for (var i = 0; i < voornamen.length; i++) {
            voorletters += voornamen[i].substring(0, 1) + ".";
          }

          //add pcs_id and country 
          var pcs_id = $(this).attr('href').substring(6);
          if ($(this).siblings().eq(4 * index + 1).attr("class") != null) {
            var country = $(this).siblings().eq(4 * index + 1).attr("class").split(' ')[1];
          }
          if (prices === 'classics') {//voor klassiekers zijn de prijzen te veel werk om in te voeren
            var prijs = 500000;
          } else {// voor grote ronde zijn de prijzen ingelezen
            var prijs = 66666666;
            for (let j in prices) {
              if (prices[j].pcs_id === pcs_id) {
                prijs = parseFloat(prices[j].price) * 1000000;
              }
            }
            if (prijs === 66666666)//rider not in prices file
              console.log("To add: ", pcs_id);
          }

          // if name contains '
          var apind = voornaam.indexOf("'");
          if (apind >= 0) {
            voornaam = voornaam.substr(0, apind) + "'" + voornaam.substr(apind, voornaam.length - 1);
          }
          var apind = lastname.indexOf("'")
          if (apind >= 0) {
            lastname = lastname.substr(0, apind) + "'" + lastname.substr(apind, lastname.length - 1);
          }
          //insert rider or do nothing
          if (prijs !== 66666666) {// only add riders if they have a correct price, no riders with incorrect price like this hopefully
            riderQuery += `('${pcs_id}', '${country}', '${voornaam}', '${lastname}', '${voorletters}'),`;
            var rider = `(SELECT rider_id FROM rider WHERE PCS_id = '${pcs_id}')`;
            participationQuery += `(${race_id}, ${rider}, ${prijs}, '${teamName}'),`;
            var rider_participation = `(SELECT rider_participation_id FROM rider_participation WHERE rider_id = ${rider} AND race_id = ${race_id})`;
            results_pointsQuery += `(${stage_id},${rider_participation}),`;
            startlist_IDs += `${rider_participation},`
          }
        })
      });
      startlist_IDs = startlist_IDs.slice(0, -1) + ')'
      riderQuery = riderQuery.slice(0, -1) + ` ON CONFLICT (PCS_id) 
                    DO UPDATE SET PCS_id = EXCLUDED.PCS_id, country = EXCLUDED.country, firstname = EXCLUDED.firstname, lastname = EXCLUDED.lastname, initials = EXCLUDED.initials;\n `;

      participationQuery = participationQuery.slice(0, -1) + ` ON CONFLICT (race_id,rider_id) 
                    DO UPDATE SET race_id = EXCLUDED.race_id, rider_id = EXCLUDED.rider_id, team = EXCLUDED.team, price = EXCLUDED.price;\n `;

      if (prices === 'classics') {
        var deleteQuery = `DELETE FROM results_points WHERE stage_id = ${stage_id} AND rider_participation_id NOT IN ${startlist_IDs}; `;// to remove riders no longer on startlist
        results_pointsQuery = results_pointsQuery.slice(0, -1) + `ON CONFLICT (stage_id, rider_participation_id) DO NOTHING; `;
        var totalQuery = deleteQuery + riderQuery + participationQuery + results_pointsQuery;
      } else {//grote rondes
        var ridersInRace = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id})`
        var deleteStageSelectionQuery = `DELETE FROM stage_selection_rider WHERE rider_participation_id NOT IN ${startlist_IDs} AND rider_participation_id IN ${ridersInRace};\n `
        var deleteKopmanQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE kopman_id NOT IN ${startlist_IDs} AND kopman_id IN ${ridersInRace};\n `
        var deleteTeamSelectionQuery = `DELETE FROM team_selection_rider WHERE rider_participation_id NOT IN ${startlist_IDs} AND rider_participation_id IN ${ridersInRace};\n `
        var deleteStartlistQuery = `DELETE FROM rider_participation WHERE rider_participation_id NOT IN ${startlist_IDs} AND race_id = ${race_id};\n `;
        var totalQuery = deleteStageSelectionQuery + deleteKopmanQuery + deleteTeamSelectionQuery + deleteStartlistQuery + riderQuery + participationQuery;
      }
      sqlDB.query(totalQuery, (err, res) => {
        if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
        else {
          callback(err, "");
        }
      });
    }
  });
}

var getResult = function (raceName, year, et, callback) {
  var stageQuery = `SELECT * FROM stage INNER JOIN race USING(race_id) WHERE stagenr = ${et} AND name = '${raceName}' AND year = ${year}`;
  sqlDB.query(stageQuery, (err, stageResults) => {
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
    var etLink = et;
    if (et === 22) {
      etLink = 21;
    }
    if (err) { console.log("WRONG QUERY:", stageQuery); throw err; }
    // set stage info
    var stage = stageResults.rows[0];
    var stage_id = stage.stage_id;
    var race_id = stage.race_id;
    var stageType = stage.type;
    var stageWeight = stage.weight;

    if (raceString === "") {//set if not GT
      raceString = stage.stagename;
    }

    request({
      url: `https://www.procyclingstats.com/race/${raceString}/${year}/stage-${etLink}`,
      headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
      if (error) console.log(error);
      if (!error && response.statusCode === 200) {
        var $ = cheerio.load(html);
        var classifications = [];// list of available classifications
        $(".tabnav").each(function (index, element) {
          classifications.push($(this).text());
        })

        if (!classifications.length || classifications[0] !== 'Stage') {
          classifications[0] = 'Stage';
        }

        if (stageType === 'TTT') { // remove stage if TTT
          classifications.shift()
        } else if (raceName === 'classics') {// only stage results if classics
          classifications = ['Stage'];
        }

        // define uitslagen arrays
        var ridersResults = { 'all': [], 'Stage': [], 'GC': [], 'Points': [], 'Youth': [], 'KOM': [], 'dnf': [] };
        var teamWinners = [];
        var TTTresult = [];
        if (stageType === 'TTT') {// TTTresults is teamnames
          $(".resTTTh").first().parent(function () {
            $(this).children('.tttRidersCont').each(function () {
              TTTresult.push($(this).children().eq(0).children().eq(1).children().eq(1).text());
            })
          })
        }
        $(".basic").each(function (index, element) {
          var end = $(this).children().eq(1).children().first().children().length;
          if (end && classifications[index] !== 'Teams' && $(this).parent().attr("data-id") !== 'bonifications' && $(this).parent().attr("data-id") !== 'today') {//prevent crashes
            var classification = classifications[index];
            var columns = [];
            $(this).children().first().children().first().children().each(function (classindex, element) {
              columns.push($(this).text());
            })

            $(this).children().eq(1).children().each(function (riderindex, element) {//voor iedere renner in de uitslag
              var rider = resultsProcessRiders(classification, columns, $(this))
              if (rider.DNF) {//doesn't add rider if pos==0
                ridersResults['dnf'].push(rider);
                // return false;// skip to next
              } else if (getIndex(ridersResults['all'], 'pcs_id', rider.pcs_id) === -1) {// add if not already in list
                ridersResults['all'].push({ pcs_id: rider.pcs_id, team: rider.team })
              }
              if (stageType === 'CLA') {
                if (riderindex < 3 && classification === 'Stage') {
                  teamWinners[classification + riderindex] = rider.team;
                }
              } else if (riderindex === 0) {//GT
                teamWinners[classification] = rider.team;
              }
              ridersResults[classification].push(rider);//push riders to each classification list
            })
          }
        })
        // change DNF to true for ridersResults[6]
        var dnfquery = `UPDATE rider_participation SET dnf = TRUE 
                    WHERE race_id = ${race_id} AND rider_id IN ( `
        for (var rider in ridersResults['dnf']) {
          dnfquery += `(SELECT rider_id FROM rider WHERE pcs_id = '${ridersResults['dnf'][rider].pcs_id}'),`
        }
        dnfquery = dnfquery.slice(0, -1) + ")";
        if (ridersResults['dnf'].length) { //only submit if > 0
          sqlDB.query(dnfquery, (err, dnfres) => {
            if (err) { console.log("WRONG QUERY:", dnfquery); throw err; }
          });
        }

        // set stage complete
        // TODO classics complete / classics auto scrape
        var uitslagCompleet = false;
        var [GCprevlength, pointsprevlength, komprevlength, youngprevlength, prevStageComplete] = [176, 0, 0, 0, true]
        var prevstage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${et - 1} AND race_id = ${race_id})`
        var prevQuery = `SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT gcpos = 0;
                        SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT pointspos = 0;
                        SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT kompos = 0;
                        SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT yocpos = 0;
                        SELECT complete FROM stage WHERE stage_id = ${prevstage_id}`
        sqlDB.query(prevQuery, function (err, prevRes) {
          if (err) { console.log("WRONG QUERY:", prevQuery); throw err; }
          if (et != 1) {
            GCprevlength = prevRes[0].rows[0].count;
            pointsprevlength = prevRes[1].rows[0].count;
            komprevlength = prevRes[2].rows[0].count;
            youngprevlength = prevRes[3].rows[0].count;
            prevStageComplete = prevRes[4].rows[0].complete
          }

          var akComp = (ridersResults['GC'].length + ridersResults['dnf'].length) == GCprevlength;
          var sprintComp = (ridersResults['Points'].length + ridersResults['dnf'].length) >= pointsprevlength;
          var bergComp = (ridersResults['KOM'].length + ridersResults['dnf'].length) >= komprevlength;
          var jongComp = (ridersResults['Youth'].length + ridersResults['dnf'].length) >= youngprevlength;
          if (akComp && sprintComp && bergComp && jongComp && ridersResults['GC'].length === ridersResults['Stage'].length) {
            uitslagCompleet = true;
          }

          var stageCompleteQuery = `UPDATE stage SET complete = TRUE, finished = TRUE WHERE stage_id = ${stage_id}`
          if (uitslagCompleet && prevStageComplete) {
            sqlDB.query(stageCompleteQuery, function (err, completeRes) {
              if (err) { console.log("WRONG QUERY:", stageCompleteQuery); throw err; }
              console.log("Stage %s Complete", et)
            })
          }
        })
        var finalStandings = false;
        if (et === 22) finalStandings = true; // laatste etappe
        var resultsQuery = `INSERT INTO results_points(stage_id, rider_participation_id, 
                stagepos, stagescore, stageresult, gcpos, gcscore, gcresult, gcprev, gcchange,
                pointspos, pointsscore, pointsresult, pointsprev, pointschange, kompos, komscore, komresult, komprev, komchange,
                yocpos, yocscore, yocresult, yocprev, yocchange, teamscore, totalscore)
                VALUES`
        //processing scores and SQL insert
        classifications = ['Stage', 'GC', 'Points', 'KOM', 'Youth']//reset classifications to hardcoded for sql insert
        for (var i in ridersResults['all']) {

          var pcs_id = ridersResults['all'][i].pcs_id;
          var teamRider = ridersResults['all'][i].team;
          var teamscore = 0;
          var totalscore = 0;
          var rider_id = `(SELECT rider_id FROM rider WHERE pcs_id = '${pcs_id}')`;
          var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${race_id} AND rider_id = ${rider_id})`;
          var riderInsert = `(${stage_id},${rider_participation_id},`
          for (var j in classifications) {
            var classification = classifications[j];
            //set initial values
            var [pos, score, result, prev, change] = [0, 0, "", "", ""];
            if (classification === 'Stage') {
              if (stageType === 'TTT') {
                pos = TTTresult.indexOf(teamRider) + 1; // positie in de uitslag
              } else {// REG, ITT or CLA
                pos = getIndex(ridersResults[classification], 'pcs_id', pcs_id) + 1;
                if (pos > 0) {
                  result = ridersResults[classification][pos - 1].result;
                }
              }
              score = getPunten(stageType, classification, pos, finalStandings, stageWeight)
              totalscore += score;
              teamscore += getTeamPunten(teamRider, teamWinners, pos, classification, finalStandings, stageType, stageWeight)
              riderInsert += `${pos},${score},'${result}'`;
            } else {// non 'Stage' Results
              pos = getIndex(ridersResults[classification], 'pcs_id', pcs_id) + 1;
              score = getPunten(stageType, classification, pos, finalStandings, stageWeight)
              totalscore += score;
              if (pos > 0) {
                result = ridersResults[classification][pos - 1].result;
                prev = ridersResults[classification][pos - 1].prev;
                change = ridersResults[classification][pos - 1].change;
              }
              teamscore += getTeamPunten(teamRider, teamWinners, pos, classification, finalStandings, stageType, stageWeight)
              riderInsert += `,${pos},${score},'${result}','${prev}','${change}'`;
            }
          }
          totalscore += teamscore;
          resultsQuery += riderInsert + ',' + teamscore + ',' + totalscore + '),';
        }
        var deleteQuery = `DELETE FROM results_points WHERE stage_id = ${stage_id}; `;
        resultsQuery = resultsQuery.slice(0, -1) + ' ON CONFLICT (stage_id,rider_participation_id) DO NOTHING';
        var totalQuery = deleteQuery + resultsQuery;
        if (ridersResults['all'].length) {// don't send if no results
          sqlDB.query(totalQuery, (err, res) => {
            if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
            else {
              console.log("Processed results stage", et, "Riders:", res[1].rowCount, "DNF:", ridersResults['dnf'].length)
              calculateUserScores(raceName, year, et, callback)
            }
          })
        } else {
          calculateUserScores(raceName, year, et, callback)
        }
      }
    })
  })
}


var resultsProcessRiders = function (classification, columns, row) {
  var renCol = columns.indexOf("Rider");
  var teamCol = columns.indexOf("Team");
  var pcs_id = row.children().eq(renCol).children().eq(1).attr('href').substring(6);
  var team = row.children().eq(teamCol).children().eq(0).text();

  var timeCol = columns.indexOf('Time');
  var pntCol = columns.indexOf('Pnt');
  var result = timeCol + 1 ? row.children().eq(timeCol).children().eq(0).text() : row.children().eq(pntCol).text();

  var prevCol = columns.indexOf('Prev');
  if (classification === 'Stage') {
    var pos = row.children().first().text();
    if (pos === 'DF' || !isNaN(parseInt(pos))) {
      return { pcs_id, team, result, DNF: false }
    } else {
      return { pcs_id, team, result, DNF: true };
    }
  } else {
    var prev = '';
    var change = '-'
    if (prevCol > 0) {
      prev = row.children().eq(prevCol).children().first().text()
      change = row.children().eq(prevCol + 1).text();
      if (prev === '') {
        change = '*'
      }
    }
    return { pcs_id, team, result, prev, change, DNF: false }
  }
}

var getIndex = function (array, attr, value) {
  for (var i = 0; i < array.length; i += 1) {
    if (array[i][attr] === value) {
      return i;
    }
  }
  return -1;
}

// in SQL zetten
var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi', 'milano-sanremo', 'e3-harelbeke', 'gent-wevelgem', 'dwars-door-vlaanderen', 'ronde-van-vlaanderen', 'Scheldeprijs', 'paris-roubaix', 'amstel-gold-race', 'la-fleche-wallone', 'liege-bastogne-liege', 'Eschborn-Frankfurt'];
var raceWeight = [1.25, 1, 1.25, 2, 1.5, 1.5, 1.25, 2, 1, 2, 1.5, 1.5, 2, 1.25];

var getPunten = function (stageType, kl, pos, finalStandings, stageWeight = 1) {
  if (finalStandings) {
    var score = getEindPunten(kl, pos);
    return score;
  }
  var dag = [50, 44, 40, 36, 32, 30, 28, 26, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
  if (stageType === "TTT") {
    var dag = [40, 32, 28, 24, 20, 16, 12, 8];
  } else if (stageType === "CLA") {
    dag = dag.map(a => a * 2 * stageWeight)
  }
  pos -= 1;
  var ak = [10, 8, 6, 4, 2];
  var punt = [8, 6, 4, 2, 1];
  var jong = [5, 3, 1];
  var berg = [6, 4, 3, 2, 1];
  if (pos < 0) return 0;
  switch (kl) {
    case 'Stage'://dag
      if (pos < dag.length) return dag[pos];
      break;
    case 'GC'://ak
      if (pos < ak.length) return ak[pos];
      break;
    case 'Points'://punt
      if (pos < punt.length) return punt[pos];
      break;
    case 'Youth'://jong
      if (pos < jong.length) return jong[pos];
      break;
    case 'KOM'://berg
      if (pos < berg.length) return berg[pos];
      break;
  }
  return 0;
}

var getTeamPunten = function (teamRider, teamWinners, pos, classification, finalStandings, stageType, stageWeight = 1) {
  pos -= 1;
  var teampoints = { 'Stage': 10, 'GC': 8, 'Points': 6, 'KOM': 3, 'Youth': 2 }
  if (stageType === 'ITT') teampoints['Stage'] = 0;
  if (finalStandings) {
    teampoints = { 'Stage': 0, 'GC': 24, 'Points': 18, 'KOM': 9, 'Youth': 6 }
  }
  if (stageType === 'CLA') {
    var totalTeamPoints = 0;
    if (pos != 0 && teamRider == teamWinners['Stage' + 0]) totalTeamPoints += 20 * stageWeight;
    if (pos != 1 && teamRider == teamWinners['Stage' + 1]) totalTeamPoints += 12 * stageWeight;
    if (pos != 2 && teamRider == teamWinners['Stage' + 2]) totalTeamPoints += 4 * stageWeight;
    return totalTeamPoints
  }
  if (teamWinners[classification] === teamRider && pos !== 0) {
    return teampoints[classification];
  }
  return 0;
}

var getEindPunten = function (kl, pos) {
  pos -= 1;
  var ak = [100, 80, 60, 50, 40, 36, 32, 28, 24, 22, 20, 18, 16, 14, 12, 10, 8, 6, 4, 2];
  var punt = [80, 60, 40, 30, 20, 10, 8, 6, 4, 2];
  var jong = [50, 30, 20, 10, 5];
  var berg = [60, 40, 30, 20, 10];
  if (pos < 0) return 0;
  switch (kl) {
    case 'GC'://ak
      if (pos < ak.length) return ak[pos];
      break;
    case 'Points'://punt
      if (pos < punt.length) return punt[pos];
      break;
    case 'Youth'://jong
      if (pos < jong.length) return jong[pos];
      break;
    case 'KOM'://berg
      if (pos < berg.length) return berg[pos];
      break;
  }
  return 0;
}

var calculateUserScores = function (name, year, stage, callback) {
  var race_id = `(SELECT race_id FROM race WHERE year = ${year} AND name = '${name}')`
  var participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id};\n`
  var TTTstageQuery = `SELECT stagenr FROM stage WHERE race_id = ${race_id} AND type ='TTT';\n`
  var totalQuery = participantsQuery + TTTstageQuery;
  sqlDB.query(totalQuery, function (err, res) {
    if (err) throw err;
    var totalQuery = '';
    var TTTstages = res[1].rows.map(stage => stage.stagenr);
    for (var i in res[0].rows) {// voor iedere gewone user

      for (var j = stage; j < 23; j++) {// to show correct totalscores for later stages
        var scoreQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
        var account_participation_id = res[0].rows[i].account_participation_id;
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${j})`;
        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id = ${stage_id})`
        var stagescore = `COALESCE((SELECT SUM(results_points.totalscore) FROM stage_selection_rider 
                                INNER JOIN results_points USING (rider_participation_id)
                                WHERE stage_selection_id = ${stage_selection_id} AND results_points.stage_id = ${stage_id}),0) `;
        if (res[0].rows[i].budgetparticipation) {// andere stage score voor budget
          var divide2 = "";
          if (TTTstages.includes(j)) {
            divide2 = "/2";
          }
          stagescore = `COALESCE((SELECT SUM(results_points.totalscore - results_points.teamscore) FROM stage_selection_rider 
                    INNER JOIN results_points USING (rider_participation_id)
                    WHERE stage_selection_id = ${stage_selection_id} AND results_points.stage_id = ${stage_id}),0)${divide2} `;
        }
        var kopmanScore = ` + (COALESCE ((SELECT 0.5 * stagescore FROM results_points
                                    WHERE rider_participation_id = (SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${stage_selection_id}) AND stage_id = ${stage_id}),0))`
        stagescore += kopmanScore;
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
    sqlDB.query(totalQuery, (err, res) => {
      if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
      callback(err, 'Calculated User Scores');
    })
  })
}

var calculateUserScoresKlassieker = function (year, stage, callback) { //TODO integreren in voorgaande functie
  var race_id = `(SELECT race_id FROM race WHERE year = ${year} AND name = 'classics')`
  var participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id}`
  sqlDB.query(participantsQuery, function (err, res) {
    if (err) throw err;
    var totalQuery = '';
    for (var i in res.rows) {// voor iedere user
      for (var j = stage; j < 15; j++) {// to show correct totalscores for later stages
        var scoreQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
        var account_participation_id = res.rows[i].account_participation_id;
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${j})`;
        var stagescore = `COALESCE((SELECT SUM(results_points.totalscore) FROM team_selection_rider 
                                INNER JOIN rider_participation USING (rider_participation_id)
                                INNER JOIN results_points USING (rider_participation_id)
                                WHERE rider_participation.race_id = ${race_id} AND account_participation_id = ${account_participation_id} and stage_id = ${stage_id}),0)`;
        var previousStages = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr < ${j})`
        var prevstagesScore = '0'
        if (j != 1) {
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
    sqlDB.query(totalQuery, (err, res) => {
      if (err) throw err;
    })
  })
  callback(null, 'Calculated User Scores');


}

var getRider = function (pcsid, callback) {
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

const setCurrentStage = (current_race) => { //TODO misschien ergens anders heen
  let promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      const race_id = current_race.id;
      const stageQuery = `SELECT * FROM STAGE
                        WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                        ORDER BY stagenr desc
                        LIMIT 1`;
      sqlDB.query(stageQuery, function (err, results) {
        if (err) { console.log("WRONG QUERY:", stageQuery); throw err; }
        if (results.rows.length) {// if some results, so at least after start of stage 1
          const stage = results.rows[0];

          if (stage.complete && stage.stagenr !== 22) { stage.stagenr++; }
          resolve(stage.stagenr);
        }else{
          resolve(0);
        }
      });
    }, 3000);
  });
  return promise;
}

module.exports.getStartlist = getStartlist;
module.exports.getResult = getResult;
module.exports.getRider = getRider;
module.exports.setCurrentStage = setCurrentStage;

var scrapeResults = schedule.scheduleJob("* * * * *", function () {//default to run every minute to initialize at the start.
  const current_stage = 0;
  var race_id = 15;

  var stageQuery = `SELECT * FROM STAGE
                      WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race_id}
                      ORDER BY stagenr DESC
                      LIMIT 1`;
  sqlDB.query(stageQuery, function (err, results) {//returns the most recent stage that started
    if (err) { console.log("WRONG QUERY:", stageQuery); throw err; }
    else {
      if (results.rows.length) {// if some results, so at least after start of stage 1
        if (current_stage === 0) {// set to 1 to make teamselection inaccessible
          current_stage = 1
        }
        var stage = results.rows[0];
        if (!stage.finished) {
          getTimetoFinish(function (stageFinished, newResultsRule) {// getTimetoFinish if not finished
            if (stageFinished) {
              var updateStageQuery = `UPDATE stage SET finished = TRUE WHERE stage_id = ${stage.stage_id}`
              sqlDB.query(updateStageQuery, function (err, results) {
                if (err) { console.log("WRONG QUERY:", updateStageQuery); throw err; }
                else console.log("Stage %s finished", stage.stagenr)
              });
              getResult(current_racename, current_year, stage.stagenr, function (err, response) {
                if (err) throw err;
                else console.log(response, "stage", stage.stagenr, "\n");
              })
            }
            scrapeResults.reschedule(newResultsRule);  //update new schedule
          })
        } else if (!stage.complete) {//get results if not complete
          getResult(current_racename, current_year, stage.stagenr, function (err, response) {
            if (err) throw err;
            else console.log(response, "stage", stage.stagenr, "\n");
          })
        } else {// if finished and complete set schedule to run again at start of next stage
          if (current_stage < 22) {
            current_stage += 1;
          }
          var nextStageQuery = `SELECT * FROM stage WHERE race_id = ${race_id} AND stagenr = ${stage.stagenr + 1}`;
          sqlDB.query(nextStageQuery, function (err, nextStageResults) {
            if (err) { console.log("WRONG QUERY:", nextStageQuery); throw err; }
            else {
              if (stage.stagenr < 21) {
                var d = nextStageResults.rows[0].starttime;
                var resultsRule = `${d.getSeconds() + 5} ${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth()} *`
                scrapeResults.reschedule(resultsRule);
                setCurrentStage(current_race_id);

              } else {// laatste etappe compleet geen scrapes meer nodig
                scrapeResults.cancel();
              }
            }
          })
        }
      } else {
        console.log("before stage 1")
        scrapeResults.reschedule('0 18 * * *')// als voor een race check dan opnieuw iedere dag om 18:00
      }
    }
  })
});


var getTimetoFinish = function (callback) {
  request({
    url: 'https://www.procyclingstats.com/',
    headers: { "Connection": "keep-alive" }
  }, function (error, response, html) {
    var $ = cheerio.load(html);
    var rule = '';
    var finished = false;
    var girobeschikbaar = false;
    $(".home1").first().children('.homeTbl1').first().children().first().children().first().children().eq(1).children().each(function () {
      var startString = ''
      switch (current_racename) {
        case 'giro': startString = 'Giro d\'Italia'; break;
        case 'tour': startString = 'Tour de France'; break;
        case 'vuelta': startString = 'La Vuelta ciclista a España'; break;
      }
      if ($(this).children().eq(2).text().startsWith(startString)) {
        girobeschikbaar = true;
        if ($(this).children().eq(0).text() != 'finished' && $(this).children().eq(0).text() != '-') {
          var timeRemaining = $(this).children().eq(0).text();
          console.log("Time Remaining: ", timeRemaining);
          if (timeRemaining[timeRemaining.length - 1] === 'm' || timeRemaining[0] === 1) { // als nog een uur of minder
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
}