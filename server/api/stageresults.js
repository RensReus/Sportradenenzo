//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage
const async = require('async')
const sqlDB = require('../db/sqlDB')
const SQLread = require('../db/SQLread')
const jwt = require('jsonwebtoken')
const fs = require('fs');
function getSecret() {
    if (fs.existsSync('./server/jwtsecret.js')) {
        return secret = require('../jwtsecret');
    } else {
        return secret = process.env.JWT_SECRET;
    }
}

module.exports = function (app) {

    app.post('/api/setkopman', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage < 1 || req.body.stage > 21) {
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var query = `UPDATE stage_selection
                            SET kopman_id=$6
                            WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}`;
                sqlDB.query(query, values, (err, sqlres) => {
                    if (err) throw err;
                    res.send({ 'kopman': req.body.rider_participation_id })
                })
            }
        });
    });

    app.post('/api/removekopman',function(req,res){
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage < 1 || req.body.stage > 21) {
                res.send(false)
                throw err;
            } else {
                removekopman(user.account_id,req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id,function(err,kopman){
                    res.send({ kopman })
                })
            }
        });
    })

    removekopman = function(account_id, racename, year, budgetParticipation, stage, rider_participation_id,callback){
        var race_id = `(SELECT race_id FROM race WHERE name = ${racename} AND year = ${year})`;
        var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=${stage} AND race_id=${race_id})`
        var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${account_id} AND race_id = ${race_id} AND budgetParticipation = ${budgetParticipation})`;
        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE stage_id = ${stage_id} AND account_participation_id = ${account_participation_id})`
        var deleteQuery = `UPDATE stage_selection SET kopman_id = NULL WHERE stage_selection_id = ${stage_selection_id} AND kopman_id = ${rider_participation_id}`
        sqlDB.query(deleteQuery, (err, sqlres) => {
            if (err) throw err;
            callback(err,null)
        })
    }

    app.post('/api/removeriderfromstage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage < 1 || req.body.stage > 21) {
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
                var query = `DELETE FROM stage_selection_rider
                            WHERE stage_selection_id=${stage_selection_id} AND rider_participation_id=$6`;
                // TODO remove kopman
                // removekopman(user.account_id,req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id,function(err,kopman){
                //     res.send({ kopman })
                // })
                sqlDB.query(query, values, (err, sqlres) => {
                    if (err) throw err;
                    var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage];
                    var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                    var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                    var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                    var query = `SELECT * FROM stage_selection_rider
                                    INNER JOIN stage_selection USING (stage_selection_id)
                                    INNER JOIN rider_participation USING (rider_participation_id)
                                    INNER JOIN rider USING (rider_id)
                                    WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                    sqlDB.query(query, values, (err, sqlres) => {
                        if (err) throw err;
                        res.send(sqlres.rows)
                    });
                });
                sqlDB.query(query, values, (err, result) => {
                    if (err) throw err;
                })
            }
        })
    })

    app.post('/api/addridertostage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage < 1 || req.body.stage > 21) { //Kijk of de juiste etappe bestaat en de user geverifieerd is
                res.send(false)
                throw err;
            } else {
                var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage];
                var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                var query = `SELECT * FROM stage_selection_rider
                            INNER JOIN stage_selection USING (stage_selection_id)
                            INNER JOIN rider_participation USING (rider_participation_id)
                            INNER JOIN rider USING (rider_id)
                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                sqlDB.query(query, values, (err, result) => {
                    if (err) throw err;
                    if (result.rows.length === 9) {
                        res.send(false)
                    } else {
                        var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage, req.body.rider_participation_id];
                        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id})`
                        var query = `INSERT INTO stage_selection_rider (stage_selection_id, rider_participation_id)
                                            VALUES (${stage_selection_id},$6)
                                            ON CONFLICT (rider_participation_id,stage_selection_id) DO NOTHING`
                        sqlDB.query(query, values, (err, sqlres) => {
                            if (err) throw err;
                            var values = [user.account_id, req.body.racename, req.body.year, req.body.budgetParticipation, req.body.stage];
                            var race_id = `(SELECT race_id FROM race WHERE name = $2 AND year = $3)`;
                            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = $1 AND race_id = ${race_id} AND budgetParticipation = $4)`;
                            var stage_id = `(SELECT stage_id FROM stage WHERE stagenr=$5 AND race_id=${race_id})`
                            var query = `SELECT * FROM stage_selection_rider
                                            INNER JOIN stage_selection USING (stage_selection_id)
                                            INNER JOIN rider_participation USING (rider_participation_id)
                                            INNER JOIN rider USING (rider_id)
                                            WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}`;
                            sqlDB.query(query, values, (err, sqlres) => {
                                if (err) throw err;
                                res.send(sqlres.rows)
                            });
                        });
                    }
                });
            }
        })
    });

    app.post('/api/getstage', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err || isNaN(req.body.stage) || req.body.stage < 1 || req.body.stage > 22) {
                res.redirect('/')
                throw err;
            } else {
                var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
                var now = new Date();
                var query = `SELECT starttime FROM stage WHERE race_id=${race_id} AND stagenr='${req.body.stage}'`;
                sqlDB.query(query, (err, results) => {
                    if (err) { console.log("WRONG QUERY:", query); throw err; }
                    console.log(results)
                    if (!results.rows.length) {
                        res.send({ mode: '404' })
                    } else {
                        if (now < results.rows[0].starttime && req.body.stage != 22) {// if before deadline or stage '22' (finalstandings)
                            async.auto({
                                userSelectionGewoon: function (callback) {
                                    SQLread.getTeamSelection(user.account_id, false, req.body.racename, req.body.year, callback)
                                },
                                userSelectionBudget: function (callback) {
                                    SQLread.getTeamSelection(user.account_id, true, req.body.racename, req.body.year, callback)
                                },
                                stageSelectionGewoon: function (callback) {
                                    SQLread.getStageSelection(user.account_id, false, req.body.racename, req.body.year, req.body.stage, callback)
                                },
                                stageSelectionBudget: function (callback) {
                                    SQLread.getStageSelection(user.account_id, true, req.body.racename, req.body.year, req.body.stage, callback)
                                },
                                kopmanGewoon: function (callback) {
                                    SQLread.getKopman(user.account_id, false, req.body.racename, req.body.year, req.body.stage, callback)
                                },
                                kopmanBudget: function (callback) {
                                    SQLread.getKopman(user.account_id, true, req.body.racename, req.body.year, req.body.stage, callback)
                                },
                                startTime: function (callback) {
                                    SQLread.getStageStarttime(current_race_id, req.body.stage, callback)
                                },
                                prevClassifications: function (callback) {
                                    var budget = ['false', 'true'];
                                    var totalQuery = '';
                                    for (var i in budget) {//voor budget en gewoon
                                        var budgetParticipation = budget[i]
                                        var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage})`;
                                        var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                                        WHERE account_id=${user.account_id} AND race_id=${race_id} AND budgetparticipation=${budgetParticipation})`;
                                        var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`

                                        var inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${stage_selection_id}) THEN 'bold black' ELSE '' END`
                                        var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE '' END`
                                        var rowClassName = `CONCAT(${inSelection},' ', ${inteam}) AS "rowClassName"`;
                                        var stage_idPrev = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage - 1})`;
                                        var name = `CONCAT(firstname, ' ', lastname) AS "Name"`
                                        var link = `CONCAT('/rider/',rider_participation.rider_participation_id) AS "Name_link"`
                                        var team = `team AS "Team"`

                                        var classifications = [
                                            {pos:'gcpos',result:'gcresult AS "Time"'},
                                            {pos:'pointspos',result:'pointsresult AS "Time"'},
                                            {pos:'kompos',result:'komresult AS "Time"'},
                                            {pos:'yocpos',result:'yocresult AS "Time"'},
                                        ];
             
                                        for (var j in classifications){
                                            var classificationQuery = `SELECT ${classifications[j].pos} AS " ", ${link}, ${name}, ${team}, ${classifications[j].result}, ${rowClassName}
                                            FROM results_points
                                            INNER JOIN rider_participation USING(rider_participation_id)
                                            INNER JOIN rider USING(rider_id)
                                            WHERE stage_id=${stage_idPrev} AND ${classifications[j].pos} > 0 
                                            ORDER BY " " ASC
                                            LIMIT 5;\n `;
                                            totalQuery += classificationQuery;
                                        }
                                    }
                                    sqlDB.query(totalQuery, (err, selectClassResult) => {
                                        if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }

                                        callback(err, selectClassResult)
                                    })
                                }
                            }, function (err, asyncresults) {
                                if (err) throw err;
                                console.log(asyncresults.prevClassifications)
                                res.send({
                                    'mode': 'selection',
                                    'userTeamGewoon': asyncresults.userSelectionGewoon,
                                    'userTeamBudget': asyncresults.userSelectionBudget,
                                    'stageSelectionGewoon': asyncresults.stageSelectionGewoon,
                                    'stageSelectionBudget': asyncresults.stageSelectionBudget,
                                    'kopmanGewoon': asyncresults.kopmanGewoon,
                                    'kopmanBudget': asyncresults.kopmanBudget,
                                    starttime: asyncresults.startTime.starttime,
                                    prevClassificationsGewoon: asyncresults.prevClassifications.slice(0,4),
                                    prevClassificationsBudget: asyncresults.prevClassifications.slice(4,8)
                                })
                            });
                        } else {
                            var budget = ['false', 'true'];
                            var totalQuery = '';
                            for (var i in budget) {//voor budget en gewoon
                                var budgetParticipation = budget[i]
                                var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stage})`;
                                var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                                WHERE account_id=${user.account_id} AND race_id=${race_id} AND budgetparticipation = ${budgetParticipation})`;
                                var stage_selection_id = `(SELECT stage_selection_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`

                                var stagescore = `CASE rider_participation.rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}) THEN stagescore * 1.5 ELSE stagescore END`
                                var totalscore = `CASE rider_participation.rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id}) THEN totalscore + stagescore * .5 ELSE totalscore END`

                                var kopman = `rider_participation.rider_participation_id WHEN (SELECT kopman_id FROM stage_selection WHERE account_participation_id = ${account_participation_id} AND stage_id=${stage_id})`
                                var stagescore = `CASE ${kopman} THEN stagescore * 1.5 ELSE stagescore END`
                                var totalscore = `CASE ${kopman} THEN totalscore + stagescore * .5 ELSE totalscore END`
                                var name = `CASE ${kopman} THEN CONCAT('*', firstname, ' ', lastname) ELSE CONCAT(firstname, ' ', lastname) END  AS "Name"`
                                var teampoints = ` COALESCE(teamscore,0) as "Team",`;
                                if (budgetParticipation === 'true') teampoints = '';
                                var teamresultQuery = `SELECT ${name}, COALESCE(${stagescore},0) AS "Stage", COALESCE(gcscore,0) AS "AK", COALESCE(pointsscore,0) AS "Punten", COALESCE(komscore,0) AS "Berg", COALESCE(yocscore,0) AS "Jong", ${teampoints} COALESCE(${totalscore},0) as "Total"
                                    FROM stage_selection_rider 
                                    INNER JOIN rider_participation USING(rider_participation_id)
                                    LEFT JOIN results_points ON results_points.rider_participation_id = rider_participation.rider_participation_id  AND results_points.stage_id = ${stage_id}
                                    INNER JOIN rider USING(rider_id)
                                    WHERE stage_selection_id = ${stage_selection_id}
                                    ORDER BY "Total" DESC, "Stage" DESC; `;

                                var userscoresQuery = `SELECT RANK() OVER(ORDER by totalscore DESC) AS " ", CONCAT('/profile/',account_id) AS "User_link", username AS "User", stagescore AS "Stage", totalscore AS "Total" FROM stage_selection
                                                INNER JOIN account_participation USING(account_participation_id)
                                                INNER JOIN account USING(account_id)
                                                WHERE stage_id=${stage_id} AND budgetparticipation = ${budgetParticipation}
                                                ORDER BY "Total" DESC; `;

                                var inteam = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE '' END`
                                var inSelection = `CASE WHEN rider_participation.rider_participation_id IN (SELECT rider_participation_id FROM stage_selection_rider WHERE stage_selection_id = ${stage_selection_id}) THEN 'bold black' ELSE ${inteam} END`
                                var rowClassName = `${inSelection} AS "rowClassName"`;
                                var name2 = `CONCAT(initials, ' ', lastname) AS "Name"`
                                var link = `CONCAT('/rider/',rider_participation.rider_participation_id) AS "Name_link"`
                                var team = `team AS "Team"`

                                var classifications = [
                                    {pos:'stagepos',result:'stageresult AS "Time"',prev:'',change:''},
                                    {pos:'gcpos',result:'gcresult AS "Time"',prev:',gcprev AS "prev"',change:', gcchange AS "  "'},
                                    {pos:'pointspos',result:'pointsresult AS "Time"',prev:',pointsprev AS "prev"',change:', pointschange AS "  "'},
                                    {pos:'kompos',result:'komresult AS "Time"',prev:',komprev AS "prev"',change:', komchange AS "  "'},
                                    {pos:'yocpos',result:'yocresult AS "Time"',prev:',yocprev AS "prev"',change:', yocchange AS "  "'},
                                ];

                                var resultsQuery = '';

                                for (var j in classifications){
                                    var classificationQuery = `SELECT ${classifications[j].pos} AS " " ${classifications[j].change}, ${link}, ${name2}, ${team}, ${classifications[j].result}, ${rowClassName}
                                    FROM results_points
                                    INNER JOIN rider_participation USING(rider_participation_id)
                                    INNER JOIN rider USING(rider_id)
                                    WHERE stage_id=${stage_id} AND ${classifications[j].pos} > 0 
                                    ORDER BY " " ASC;\n `;
                                    resultsQuery += classificationQuery;
                                }

                                var budgetscore = '';
                                if(budgetParticipation === 'true') { budgetscore = ' - teamscore '}
                                var selectionsQuery = `SELECT username, ARRAY_AGG(json_build_object('Name', CASE WHEN kopman THEN CONCAT('* ', name) ELSE name END, 'Score',CASE WHEN kopman THEN totalscore ${budgetscore} + 0.5*stagescore ELSE totalscore ${budgetscore} END,'rowClassName',"rowClassName")) AS riders FROM
                                (SELECT username,CONCAT(firstname, ' ', lastname) as name, results_points.stagescore, results_points.totalscore, results_points.teamscore, kopman_id = rider_participation.rider_participation_id as kopman, ${rowClassName}  FROM  stage_selection_rider
                                INNER JOIN rider_participation USING (rider_participation_id)
                                INNER JOIN rider USING (rider_id)
                                INNER JOIN stage_selection USING(stage_selection_id)
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                LEFT JOIN results_points ON results_points.rider_participation_id = rider_participation.rider_participation_id  AND results_points.stage_id = ${stage_id}
                                WHERE stage_selection.stage_id = ${stage_id} AND budgetparticipation = ${budgetParticipation}
                                ) a
                                GROUP BY username;\n`;

                                var allnotselected = `(
                                SELECT rider_participation_id, account_participation_id FROM team_selection_rider
                                INNER JOIN account_participation USING(account_participation_id )
                                WHERE race_id = ${race_id} AND budgetparticipation = ${budgetParticipation} 
                                EXCEPT
                                SELECT rider_participation_id, account_participation_id FROM stage_selection_rider 
                                INNER JOIN stage_selection USING(stage_selection_id)
                                INNER JOIN account_participation USING(account_participation_id)
                                WHERE stage_id = ${stage_id} AND budgetparticipation = ${budgetParticipation}
                                ) a`

                                var allselectedriders = `(SELECT rider_participation_id FROM stage_selection_rider 
                                INNER JOIN stage_selection USING(stage_selection_id)
                                INNER JOIN account_participation USING(account_participation_id)
                                WHERE stage_id = ${stage_id} AND budgetparticipation = ${budgetParticipation} 
                                GROUP BY rider_participation_id
                                UNION
                                SELECT rider_participation_id FROM rider_participation
                                INNER JOIN results_points USING(rider_participation_id)
                                WHERE totalscore > 0 AND stage_id = ${stage_id})`

                                var notSelectedQuery = `SELECT username, ARRAY_AGG(json_build_object('Name', CONCAT(firstname, ' ', lastname), 'Score',totalscore ${budgetscore})) AS riders FROM ${allnotselected} 
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN results_points ON results_points.rider_participation_id = a.rider_participation_id AND results_points.stage_id = ${stage_id} 
                                WHERE a.rider_participation_id in ${allselectedriders} 
                                GROUP BY username; \n`

                                var query = teamresultQuery + userscoresQuery + resultsQuery + selectionsQuery + notSelectedQuery;
                                totalQuery += query;
                            }

                            var userScoresColtype = { "Stage": 1, "Total": 1 };
                            sqlDB.query(totalQuery, (err, uitslagresults) => {
                                if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }

                                var userscoresGewoon = uitslagresults[1].rows;
                                var userscoresBudget = uitslagresults[10].rows;
                                var selectiesGewoon = uitslagresults[7].rows;
                                var notSelectedGewoon = uitslagresults[8].rows;
                                var selectiesBudget = uitslagresults[16].rows;
                                var notSelectedBudget = uitslagresults[17].rows;

                                var allSelectionsGewoon = selectionsPopUp(selectiesGewoon);

                                var teamresultGewoon = [];
                                if (uitslagresults[0].rowCount) {
                                    teamresultGewoon = uitslagresults[0].rows;
                                    var totalteamGewoon = { "Name": "Totaal", "Stage": 0, "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Team": 0, "Total": 0 }
                                    for (var i in teamresultGewoon) {
                                        totalteamGewoon.Stage += parseInt(teamresultGewoon[i].Stage);
                                        totalteamGewoon.AK += teamresultGewoon[i].AK;
                                        totalteamGewoon.Punten += teamresultGewoon[i].Punten;
                                        totalteamGewoon.Berg += teamresultGewoon[i].Berg;
                                        totalteamGewoon.Jong += teamresultGewoon[i].Jong;
                                        totalteamGewoon.Team += teamresultGewoon[i].Team;
                                        totalteamGewoon.Total += parseInt(teamresultGewoon[i].Total);
                                    }
                                    teamresultGewoon.push(totalteamGewoon);
                                }
                                var stageresultsGewoon = [];
                                if (uitslagresults[2].rowCount || req.body.stage == 22) {
                                    stageresultsGewoon.push(uitslagresults[2].rows);
                                    stageresultsGewoon.push(uitslagresults[3].rows);
                                    stageresultsGewoon.push(uitslagresults[4].rows);
                                    stageresultsGewoon.push(uitslagresults[5].rows);
                                    stageresultsGewoon.push(uitslagresults[6].rows);
                                }
                                var teamresultBudget = [];
                                if (uitslagresults[9].rowCount) {
                                    teamresultBudget = uitslagresults[9].rows;
                                    var totalteamBudget = { "Name": "Totaal", "Stage": 0, "AK": 0, "Punten": 0, "Berg": 0, "Jong": 0, "Total": 0 }
                                    for (var i in teamresultBudget) {
                                        totalteamBudget.Stage += parseInt(teamresultBudget[i].Stage);
                                        totalteamBudget.AK += teamresultBudget[i].AK;
                                        totalteamBudget.Punten += teamresultBudget[i].Punten;
                                        totalteamBudget.Berg += teamresultBudget[i].Berg;
                                        totalteamBudget.Jong += teamresultBudget[i].Jong;
                                        totalteamBudget.Total += parseInt(teamresultBudget[i].Total);
                                    }
                                    teamresultBudget.push(totalteamBudget);
                                }
                                var stageresultsBudget = [];
                                if (uitslagresults[11].rowCount || req.body.stage == 22) {
                                    stageresultsBudget.push(uitslagresults[11].rows);
                                    stageresultsBudget.push(uitslagresults[12].rows);
                                    stageresultsBudget.push(uitslagresults[13].rows);
                                    stageresultsBudget.push(uitslagresults[14].rows);
                                    stageresultsBudget.push(uitslagresults[15].rows);
                                }

                                var allSelectionsBudget = selectionsPopUp(selectiesBudget);

                                res.send({
                                    'mode': 'results',
                                    allSelectionsGewoon,
                                    teamresultGewoon,
                                    userscoresGewoon,
                                    stageresultsGewoon,
                                    notSelectedGewoon,
                                    allSelectionsBudget,
                                    teamresultBudget,
                                    userscoresBudget,
                                    stageresultsBudget,
                                    notSelectedBudget,
                                    userScoresColtype: userScoresColtype,
                                })
                            })
                        }
                    }
                })
            }
        })
    });


    app.post('/api/getstageresultsclassics', function (req, res) {

        if (!req.user) {
            res.send({ 'mode': '404' });
            return;
        } else {
            var raceNames = ['omloop-het-nieuwsblad', 'kuurne-brussel-kuurne', 'strade-bianchi', 'milano-sanremo', 'e3-harelbeke', 'gent-wevelgem', 'dwars-door-vlaanderen', 'ronde-van-vlaanderen', 'Scheldeprijs', 'paris-roubaix', 'amstel-gold-race', 'la-fleche-wallone', 'liege-bastogne-liege', 'Eschborn-Frankfurt'];
            var prevText = "";
            var currText = "";
            var nextText = "";
            var lastStage = false;
            var stagenr = parseInt(req.body.stageNumber);

            if (stagenr > 1 && stagenr < raceNames.length) {
                prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
            } else if (stagenr < raceNames.length) {
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar " + (stagenr + 1) + ": " + raceNames[stagenr];
            } else if (stagenr > 1) {
                prevText = "Naar " + (stagenr - 1) + ": " + raceNames[stagenr - 2];
                currText = stagenr + ": " + raceNames[stagenr - 1];
                nextText = "Naar Einduitslag";
                lastStage = true;
            }

            var race_id = `(SELECT race_id FROM race WHERE name = '${req.body.racename}' AND year = ${req.body.year})`;
            var stage_id = `(SELECT stage_id FROM stage WHERE race_id=${race_id} AND stagenr= ${req.body.stageNumber})`;
            var account_participation_id = `(SELECT account_participation_id FROM account_participation 
                WHERE account_id=${req.user.account_id} AND race_id=${race_id})`;

            var teamresultQuery = `SELECT CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team", stagescore as "Stage Score", teamscore as "Team Score", totalscore as "Total"
                                FROM team_selection_rider 
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN results_points USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                WHERE account_participation_id=${account_participation_id} AND stage_id=${stage_id}
                                ORDER BY "Total" DESC, "Team" ; `;

            var userscoresQuery = `SELECT username, stagescore, totalscore FROM stage_selection
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                WHERE stage_id=${stage_id}
                                ORDER BY totalscore DESC; `;

            // CONCAT('<a href="/rider/', rider_participation_id,'">',firstname, ' ', lastname,'</a>') voor later

            var stageresultsQuery = `SELECT stagepos AS " ", CONCAT(firstname, ' ', lastname) AS "Name", team AS "Team", stageresult AS "Time", CASE SUM(CASE account_participation_id WHEN ${account_participation_id} THEN 1 END) WHEN 1 THEN 'bold gray' ELSE '' END AS "rowClassName"
                                FROM results_points
                                INNER JOIN rider_participation USING(rider_participation_id)
                                INNER JOIN rider USING(rider_id)
                                LEFT JOIN team_selection_rider USING(rider_participation_id)
                                WHERE stage_id=${stage_id} AND stagepos > 0 
                                GROUP BY " ", "Name", "Team", "Time"
                                ORDER BY " " ASC; `;

            var selectionsQuery = `SELECT username, COALESCE(COUNT(rider_participation_id),0) as count, ARRAY_AGG(json_build_object(
                                'Name', CONCAT(firstname, ' ', lastname), 
                                'totalscore', totalscore ,
                                'bold gray', CASE WHEN rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) THEN 'bold gray' ELSE ' ' END 
                                )) as riders FROM  results_points
                                INNER JOIN team_selection_rider USING(rider_participation_id)
                                INNER JOIN account_participation USING(account_participation_id)
                                INNER JOIN account USING(account_id)
                                INNER JOIN rider_participation USING (rider_participation_id)
                                INNER JOIN rider USING (rider_id)
                                WHERE stage_id = ${stage_id} and rider_participation_id in (SELECT rider_participation_id FROM team_selection_rider)
                                GROUP BY username; `

            var raceStartedQuery = `SELECT CURRENT_TIMESTAMP > starttime as racestarted from stage
            WHERE race_id = 4 and stagenr = 1; `

            var totalQuery = teamresultQuery + userscoresQuery + stageresultsQuery + selectionsQuery + raceStartedQuery;


            var userScoresColtype = { stagescore: 1, totalscore: 1 };

            sqlDB.query(totalQuery, (err, results) => {
                if (err) { console.log("WRONG QUERY:", totalQuery); throw err; }
                var userscores = results[1].rows;
                var selecties = results[3].rows
                for (var i in userscores) {
                    for (var j in selecties) {
                        if (userscores[i].username == selecties[j].username) {
                            userscores[i]['riderCount'] = selecties[j].count;
                            userscores[i]['riders'] = selecties[j].riders.sort(function (a, b) { return b.totalscore - a.totalscore });
                        }
                    }
                }
                res.send({
                    mode: '',
                    teamresult: results[0].rows,
                    userscores: userscores,
                    stageresults: results[2].rows,
                    userScoresColtype: userScoresColtype,
                    prevText: prevText,
                    currText: currText,
                    nextText: nextText,
                    lastStage: lastStage,
                    raceStarted: results[4].rows[0].racestarted
                });
            })
        }
    });

    app.post('/api/getfinalclassics', function (req, res) {
        if (!req.user) {
            res.send({ 'mode': '404' });
            return;
        } else {
            var prevText = "Naar 14: Eschborn-Frankfurt";
            var lastStageLink = "/stage/14";
            res.send({
                prevText: prevText,
                lastStageLink: lastStageLink,
                username: req.user.username
            })
        }
    });

    
    selectionsPopUp = function (selecties){//deze functie werkt ook voor de volledige selecties van 20
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
        allSelections.push({title: selecties[i].username, tableData: []})
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
                allSelections[j].tableData.push({"Name": " ", "Score": 0})
            }else{
                allSelections[j].tableData.push(selecties[j].riders[index])
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
                        allSelections[k].tableData.push(selecties[k].riders[index])
                    }else{// add rider2
                        var index = selecties[k].riders.findIndex(function(rider){return rider.Name === riderName2})
                        if(index === -1){
                            index = selecties[k].riders.findIndex(function(rider){return rider.Name === '* ' + riderName2})
                        }
                        allSelections[k].tableData.push(selecties[k].riders[index])
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
                allSelections[j].tableData.push({"Name": " ", "Score": 0})
            }else{
                allSelections[j].tableData.push(selecties[j].riders[index])
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
                var emptyPlaceIndex = allSelections[i].tableData.findIndex(function(rider){return rider.Name===" "})
                if(emptyPlaceIndex !== -1){
                    allSelections[i].tableData[emptyPlaceIndex] = selecties[i].riders[j];
                }else{
                    allSelections[i].tableData.push(selecties[i].riders[j])
                }
            }
            sum += parseInt(selecties[i].riders[j].Score);
        }
        allSelections[i].tableData.push({"Name":"Totaal","Score":sum})
    }

    allSelections.push({tableData:allSelectedRiders,title:"Alle Opgestelde Renners"})
    return allSelections;
}
}