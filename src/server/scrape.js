const cheerio = require('cheerio');
const request = require('request');
const schedule = require('node-schedule');
const sqlDB = require('./db/sqlDB');
const async = require('async');
const stageresults = require('./api/stageresults');
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
        prijzenfile = "./startlist_scorito_giro.txt";
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
      let riders = JSON.parse(file).Content;
      var riderprices = []
      for (let i in riders) {
        let rider = riders[i];
        let firstName = rider.FirstName;
        let lastName = rider.LastName;
        let price = parseFloat(rider.Price);
        riderprices.push({ firstName, lastName, price })
      }
      startlistProcessRiders(raceString, riderprices, race.year, race_id, callback)
    })
  }
}

var startlistProcessRiders = function (raceString, scoritoPrices, year, race_id, callback) {
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
        $(this).children().eq(3).children().eq(0).children().each(function (index, element) { //gaat iedere renner af
          var name_link_div = $(this).children().eq(1);
          var name = name_link_div.text();
          var pcs_id = name_link_div.attr('href').substring(6);
          var country = $(this).children().eq(0).attr("class").split(' ')[1];

          // sla achternaam voor naam en voorletters op
          var i = 0
          while (i <= name.length) {
            character = name.charAt(i);
            if (character != character.toUpperCase() && character != ' ') {
              break;
            }
            i++;
          }
          var firstLastSplit = name.substring(0, i).lastIndexOf(' ');
          var lastname = name.substring(0, firstLastSplit);
          var voornaam = name.substring(firstLastSplit + 1, name.length);
          var voornamen = voornaam.split(' ').filter(x => x);
          var voorletters = "";
          for (var i = 0; i < voornamen.length; i++) {
            voorletters += voornamen[i].substring(0, 1) + ".";
          }

          if (scoritoPrices === 'classics') {//voor klassiekers zijn de prijzen te veel werk om in te voeren
            var prijs = 500000;
          } else {// voor grote ronde zijn de prijzen ingelezen
            var prijs = 66666666;
            for (let j in scoritoPrices) {
              if (voornaam.toLowerCase().replace("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(scoritoPrices[j].firstName.toLowerCase().replace("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "")) && lastname.toLowerCase().replace("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "") === scoritoPrices[j].lastName.toLowerCase().replace("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "")) {
                prijs = parseFloat(scoritoPrices[j].price);
              }
            }
            if (prijs === 66666666) {//rider not in prices file
              console.log("To add: ", pcs_id, voornaam.replace("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("ł", "l"), lastname);
            }
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

      if (scoritoPrices === 'classics') {
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

var getResult = function (race, stagenr) {
  var race_id = `(SELECT race_id FROM race WHERE year = ${race.year} AND name = '${race.name}')`
  var stageQuery = `SELECT * FROM stage INNER JOIN race USING(race_id) WHERE stagenr = ${stagenr} AND race_id = ${race_id}`;
  //Get info about current stage
  sqlDB.query(stageQuery, (err, stageResults) => {
    if (err) { console.log("WRONG QUERY:", stageQuery); throw err; }
    var stage = stageResults.rows[0];
    var raceString = getRaceString(race.name, stage.stagename);
    var stage_id = stage.stage_id;
    var etLink = stage.type === 'FinalStandings' ? stagenr - 1: stagenr;

    //get results from PCS
    request({
      url: `https://www.procyclingstats.com/race/${raceString}/${race.year}/stage-${etLink}`,
      headers: { "Connection": "keep-alive" }
    }, function (error, response, html) {
      if (error) console.log(error);
      if (!error && response.statusCode === 200) {
        var $ = cheerio.load(html);
       
        var TTTresult = []; // TODO clean up TTT code
        if (stage.type === 'TTT') {// TTTresults is teamnames
          $(".resTTTh").first().parent(function () {
            $(this).children('.tttRidersCont').each(function () {
              TTTresult.push($(this).children().eq(0).children().eq(1).children().eq(1).text());
            })
          })
        }

        var [ridersResults, teamWinners] = processPCSresults($, stage.type);

        updateDNFriders(ridersResults['dnf'], stage.race_id);

        setStageToComplete(ridersResults, stage.stagenr, race_id);

        var resultsQuery = buildResultsQuery(ridersResults, teamWinners, stage);
        var deleteQuery = `DELETE FROM results_points WHERE stage_id = ${stage_id}; `;
        
        var totalQuery = deleteQuery + resultsQuery;
        
        if (ridersResults['all'].length) {// don't send if no results
          sqlDB.query(totalQuery, (err, res) => {
            if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
            else {
              console.log("Processed results stage", stagenr, "Riders:", res[1].rowCount, "DNF:", ridersResults['dnf'].length)
              calculateUserScores(race_id, stagenr, stage.type)
            }
          })
        } else {
          calculateUserScores(race_id, stagenr, stage.type)
        }
      }
    })
  })
}

var getRaceString = function (raceName, stageName) {
  switch (raceName) {
    case "giro":
      return "giro-d-italia";
    case "tour":
      return "tour-de-france";
    case "vuelta":
      return "vuelta-a-espana";
  }
  return stageName;
}

var processPCSresults = function($, stageType) {
  var ridersResults = { 'all': [], 'Stage': [], 'GC': [], 'Points': [], 'Youth': [], 'KOM': [], 'dnf': [] };
  var teamWinners = [];

  var classifications = getClassifications($, stageType);// list of available classifications

  let tableWrapper = $(".w68.left.mb_w100");
  tableWrapper.children().each(function (index, element) {
    var hasResults = classifications.length;
    if (hasResults > 0 && classifications[index] !== 'Teams') {// maybe doesnt prevent crashes
      var classification = classifications[index];
      var columns = [];
      let currentClassificationTable = tableWrapper.children().eq(index + 3);
      currentClassificationTable.children().first().children().first().children().first().children().each(function (classindex, element) {
        columns.push($(this).text());
      })
      currentClassificationTable.children().first().children().eq(1).children().each(function (riderindex, element) {//voor iedere renner in de uitslag
        var rider = resultsProcessRiders(classification, columns, $(this))
        if (rider.DNF) {//doesn't add rider if pos==0
          ridersResults['dnf'].push(rider);
          return
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
  return [ridersResults, teamWinners];
}

var getClassifications = function($, stageType) {
  var classifications = [];
  $(".restabs").children().each(function (index, element) {
    classifications.push($(this).text());
  })

  if (!classifications.length || classifications[0] !== 'Stage') {
    classifications[0] = 'Stage';
  }

  if (stageType === 'TTT') { // remove stage if TTT
    classifications.shift()
  } else if (stageType === 'CLA') {// only stage results if classics
    classifications = ['Stage'];
  }
  return classifications;
}

var updateDNFriders = function(dnfRiders, race_id) {
  if (dnfRiders.length) { //only submit if > 0
    var dnfquery = `UPDATE rider_participation SET dnf = TRUE 
                WHERE race_id = ${race_id} AND rider_id IN ( `
    for (var rider in dnfRiders) {
      dnfquery += `(SELECT rider_id FROM rider WHERE pcs_id = '${dnfRiders[rider].pcs_id}'),`
    }
    dnfquery = dnfquery.slice(0, -1) + ")";
    sqlDB.query(dnfquery, (err, dnfres) => {
      if (err) { console.log("WRONG QUERY:", dnfquery); throw err; }
    });
  }
}

var setStageToComplete = function(ridersResults, stagenr, race_id) {
  // TODO classics complete / classics auto scrape
  var uitslagCompleet = false;
  var [GCprevlength, pointsprevlength, komprevlength, youngprevlength, prevStageComplete] = [176, 10, 0, 1, true]
  var prevstage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${stagenr - 1} AND race_id = ${race_id})`
  var stage_id = `(SELECT stage_id FROM stage WHERE stagenr = ${stagenr} AND race_id = ${race_id})`
  var prevQuery = `SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT gcpos = 0;
                  SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT pointspos = 0;
                  SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT kompos = 0;
                  SELECT COUNT(rider_participation_id) FROM results_points WHERE stage_id = ${prevstage_id} AND NOT yocpos = 0;
                  SELECT complete as count FROM stage WHERE stage_id = ${prevstage_id}`;

  sqlDB.query(prevQuery, function (err, prevRes) {
    if (err) { console.log("WRONG QUERY:", prevQuery); throw err; }
    if (stagenr != 1) {
      [GCprevlength, pointsprevlength, komprevlength, youngprevlength, prevStageComplete] = prevRes.map(x => x.rows[0].count)
    }

    var akComp = (ridersResults['GC'].length + ridersResults['dnf'].length) >= GCprevlength;
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
        console.log("Stage %s Complete", stagenr)
      })
    }
  })
}

var buildResultsQuery = function(ridersResults, teamWinners, stage) {
    //processing scores and SQL insert
    var resultsQuery = `INSERT INTO results_points(stage_id, rider_participation_id, 
      stagepos, stagescore, stageresult, gcpos, gcscore, gcresult, gcprev, gcchange,
      pointspos, pointsscore, pointsresult, pointsprev, pointschange, kompos, komscore, komresult, komprev, komchange,
      yocpos, yocscore, yocresult, yocprev, yocchange, teamscore, totalscore)
      VALUES`
    var classifications = ['Stage', 'GC', 'Points', 'KOM', 'Youth']
    for (var i in ridersResults['all']) {

      var pcs_id = ridersResults['all'][i].pcs_id;
      var teamRider = ridersResults['all'][i].team;
      var teamscore = 0;
      var totalscore = 0;
      var rider_id = `(SELECT rider_id FROM rider WHERE pcs_id = '${pcs_id}')`;
      var rider_participation_id = `(SELECT rider_participation_id FROM rider_participation WHERE race_id = ${stage.race_id} AND rider_id = ${rider_id})`;
      var riderInsert = `(${stage.stage_id},${rider_participation_id},`
      for (var j in classifications) {
        var classification = classifications[j];
        //set initial values
        var [pos, score, result, prev, change] = [0, 0, "", "", ""];
        if (classification === 'Stage') {
          if (stage.type === 'TTT') {
            pos = TTTresult.indexOf(teamRider) + 1; // positie in de uitslag
          } else {// REG, ITT or CLA
            pos = getIndex(ridersResults[classification], 'pcs_id', pcs_id) + 1;
            if (pos > 0) {
              result = ridersResults[classification][pos - 1].result;
            }
          }
          score = getPunten(stage.type, classification, pos, stage.type)
          totalscore += score;
          teamscore += getTeamPunten(teamRider, teamWinners, pos, classification, stage.type, stage.type)
          riderInsert += `${pos},${score},'${result}'`;
        } else {// non 'Stage' Results
          pos = getIndex(ridersResults[classification], 'pcs_id', pcs_id) + 1;
          score = getPunten(stage.type, classification, pos, stage.type)
          totalscore += score;
          if (pos > 0) {
            result = ridersResults[classification][pos - 1].result;
            prev = ridersResults[classification][pos - 1].prev;
            change = ridersResults[classification][pos - 1].change;
          }
          teamscore += getTeamPunten(teamRider, teamWinners, pos, classification, stage.type, stage.type)
          riderInsert += `,${pos},${score},'${result}','${prev}','${change}'`;
        }
      }
      totalscore += teamscore;
      resultsQuery += riderInsert + ',' + teamscore + ',' + totalscore + '),';
    }
    resultsQuery = resultsQuery.slice(0, -1) + ' ON CONFLICT (stage_id,rider_participation_id) DO NOTHING';
    return resultsQuery;
}

var resultsProcessRiders = function (classification, columns, row) {
  var renCol = columns.indexOf("Rider");
  var teamCol = columns.indexOf("Team");
  var pcs_id = row.children().eq(renCol).children().eq(1).attr('href').substring(6);
  var team = row.children().eq(teamCol).children().eq(0).text();

  var timeCol = columns.indexOf('Time');
  var pntCol = columns.indexOf('Points');
  var result = timeCol + 1 ? row.children().eq(timeCol).children().eq(0).text() : row.children().eq(pntCol).text();
  if (result == '' && timeCol != -1) result = row.children().eq(timeCol).text();

  var prevCol = columns.indexOf('Prev');
  if (classification === 'Stage') {
    var pos = row.children().first().text();
    if (!isNaN(parseInt(pos))) {
      return { pcs_id, team, result, DNF: false }
    } else {
      return { pcs_id, team, result, DNF: true };
    }
  } else {
    var prev = '';
    var change = '-'
    if (prevCol > 0) {
      prev = row.children().eq(prevCol).text()
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

var getPunten = function (stageType, kl, pos, stageWeight = 1) {
  if (stageType === "FinalStandings") {
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

var getTeamPunten = function (teamRider, teamWinners, pos, classification, stageType, stageWeight = 1) {
  pos -= 1;
  var teampoints = { 'Stage': 10, 'GC': 8, 'Points': 6, 'KOM': 3, 'Youth': 2 }
  if (stageType === 'ITT') teampoints['Stage'] = 0;
  if (stageType === "FinalStandings") {
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

var calculateUserScores = function (race_id, stage, stageType) {
  let participantsQuery = `SELECT account_participation_id, budgetParticipation FROM account_participation WHERE race_id = ${race_id};\n `
  let TTTstageQuery = `SELECT stagenr FROM stage WHERE race_id = ${race_id} AND type ='TTT';\n `
  let raceLengthQuery = `SELECT stage_id FROM stage WHERE race_id = ${race_id};\n `
  let totalQuery = participantsQuery + TTTstageQuery + raceLengthQuery;
  sqlDB.query(totalQuery, function (err, res) {
    if (err) throw err;
    var totalQuery = '';
    var TTTstages = res[1].rows.map(stage => stage.stagenr);
    for (var i in res[0].rows) {// voor iedere gewone user

      for (var j = stage; j < res[2].rowCount; j++) {// to show correct totalscores for later stages 
        var scoreQuery = `INSERT INTO stage_selection(account_participation_id,stage_id, stagescore, totalscore) VALUES`
        var account_participation_id = res[0].rows[i].account_participation_id;
        var stage_id = `(SELECT stage_id FROM stage WHERE race_id = ${race_id} and stagenr = ${j})`;
        var selection_id_val = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id = ${stage_id})`
        var selection = `stage_selection_rider`
        var selection_id = `stage_selection_id`
        var kopmanScore = ` + (COALESCE ((SELECT 0.5 * stagescore FROM results_points
          WHERE rider_participation_id = (SELECT kopman_id FROM stage_selection WHERE stage_selection_id = ${selection_id_val}) AND stage_id = ${stage_id}),0))`
        if (stageType === "FinalStandings") {
          kopmanScore = ''
          selection_id = `account_participation_id`
          selection = 'team_selection_rider'
          selection_id_val = account_participation_id;
        }
        var stagescore = `COALESCE((SELECT SUM(results_points.totalscore) FROM ${selection} 
                                INNER JOIN results_points USING (rider_participation_id)
                                WHERE ${selection_id} = ${selection_id_val} AND results_points.stage_id = ${stage_id}),0) `;
        if (res[0].rows[i].budgetparticipation) {// andere stage score voor budget
          var divide2 = "";
          if (TTTstages.includes(j)) {
            divide2 = "/2";
          }
          stagescore = `COALESCE((SELECT SUM(results_points.totalscore - results_points.teamscore) FROM ${selection} 
                    INNER JOIN results_points USING (rider_participation_id)
                    WHERE ${selection_id} = ${selection_id_val} AND results_points.stage_id = ${stage_id}),0)${divide2} `;
        }
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

var startSchedule = () => {
  var activeRacesQuery = `SELECT * FROM race WHERE NOT finished`;
  sqlDB.query(activeRacesQuery, (err, activeRacesResults) => {
    if (err) { console.log("WRONG QUERY:", activeRacesQuery); throw err; }
    // async.each(activeRacesResults.rows, (race, callback) => {
    activeRacesResults.rows.forEach(race => {
      var scrapeResults = schedule.scheduleJob("* * * * *", function () {
        var stageQuery = `SELECT * FROM STAGE
        WHERE starttime < now() AT TIME ZONE 'Europe/Paris' AND race_id = ${race.race_id}
        ORDER BY stagenr DESC
        LIMIT 1`;
        sqlDB.query(stageQuery, function (err, results) {//returns the most recent stage that started
          if (err) { console.log("WRONG QUERY:", stageQuery); throw err; }
          if (results.rows.length) {// if some results, so at least after start of stage 1
            var stage = results.rows[0];
            if (!stage.finished) {
              getTimetoFinish(race.name, function (stageFinished, newResultsRule) {// getTimetoFinish if not finished
                if (stageFinished) {
                  var updateStageQuery = `UPDATE stage SET finished = TRUE WHERE stage_id = ${stage.stage_id}`
                  sqlDB.query(updateStageQuery, function (err) {
                    if (err) { console.log("WRONG QUERY:", updateStageQuery); throw err; }
                    else console.log("Race %s Stage %s finished", race.race_id, stage.stagenr)
                  });
                  getResult(race, stage.stagenr, function (err, response) {
                    if (err) throw err;
                    console.log(response, "stage", stage.stagenr, "\n");
                  })
                } else {
                  scrapeResults.reschedule(newResultsRule);  //update new schedule
                }
              })
            } else if (!stage.complete) {//get results if not complete
              getResult(race, stage.stagenr, function (err, response) {
                if (err) throw err;
                console.log(response, "stage", stage.stagenr, "\n");
              })
            } else {// if finished and complete set schedule to run again at start of next stage
              var nextStageQuery = `SELECT * FROM stage WHERE race_id = ${race.race_id} AND stagenr = ${stage.stagenr + 1}`;
              sqlDB.query(nextStageQuery, function (err, nextStageResults) {
                if (err) { console.log("WRONG QUERY:", nextStageQuery); throw err; }
                if (nextStageResults.rows[0].type !== "FinalStandings") {
                  var d = nextStageResults.rows[0].starttime;
                  var resultsRule = `${d.getSeconds() + 5} ${d.getMinutes()} ${d.getHours()} ${d.getDate()} ${d.getMonth()} *`
                  scrapeResults.reschedule(resultsRule);
                  console.log("wait until next stage")
                }
              })
            }
          } else {
            scrapeResults.reschedule('0 17 * * *')// als voor een race check dan opnieuw iedere dag om 17:00
            console.log("Check again at 17:00", race.name)
          }
        })
      })
    })
  })
}

var getTimetoFinish = function (racename, callback) {
  request({
    url: 'https://www.procyclingstats.com/',
    headers: { "Connection": "keep-alive" }
  }, function (error, response, html) {
    var $ = cheerio.load(html);
    var rule = '';
    var racebeschikbaar = false;
    $('.tblCont1').first().children().eq(1).children().eq(1).children().first().each(function () {
      var startString = ''
      switch (racename) {
        case 'giro': startString = 'Giro d\'Italia'; break;
        case 'tour': startString = 'Tour de France'; break;
        case 'vuelta': startString = 'La Vuelta ciclista a España'; break;
      }

      if ($(this).children().eq(2).text().startsWith(startString)) {
        racebeschikbaar = true;
        if ($(this).children().eq(0).text() != 'finished') {
          var finish = $(this).children().eq(0).text().split(':').map(x => parseInt(x));
          var now = new Date();
          if (finish[0] - now.getHours() <= 1) { // als nog een uur of minder
            rule = '*/5 * * * *';// iedere 5 min checken 
            console.log("next run in 5 min", racename)
            callback(false, rule);
            return;
          } else {
            rule = '15 * * * *';// ieder uur op XX:15
            console.log("next run in 1 hour", racename)
            callback(false, rule);
            return;
          }

        } else {//als gefinisht
          rule = '* * * * *';// iedere 1 min checken 
          console.log("stage finished", racename)
          callback(true, rule);
          return;
        }
      }
    });
    if (!racebeschikbaar) { // trigger later
      console.log("Race not available"), racename;
      rule = '0 0 10 * *'; // check at 10am
      callback(false, rule);
      return;
    }
  });
}

module.exports.getStartlist = getStartlist;
module.exports.getResult = getResult;
module.exports.getRider = getRider;
module.exports.startSchedule = startSchedule;