//In dit bestand staan alle calls die betrekking hebben tot de resultaten van een stage

module.exports = function (app) {
    const sqlDB = require('../db/sqlDB')
    const functies = require('../functies')

    app.post('/api/getstagevictories', function (req, response) {
        if(!req.user){
            response.redirect('/')
        }else{
            var race_id = req.body.race_id;
            var poule_id = req.body.poule_id;
            var subquery1 = `(SELECT username, stagescore, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore DESC) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id}) AS subquery`
            var subquery2 = `(SELECT username, stagescore, stagenr, rank() over (PARTITION BY stagenr ORDER BY stagescore DESC) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = ${race_id} 
            GROUP BY username, stagescore, stagenr
            HAVING SUM(stagescore) > 0 OR stagenr < 10) AS subquery`
            var query1 = `SELECT ARRAY_AGG(username ORDER BY stagescore DESC) as usernames, ARRAY_AGG(stagescore ORDER BY stagescore DESC) as scores, stagenr FROM ${subquery1}
            GROUP BY stagenr
            HAVING SUM(stagescore) > 0 OR stagenr < 10; `;//ranking per stage
            var query2 = `SELECT username, ARRAY_AGG(rank) as ranks, ARRAY_AGG(count) as rankcounts FROM 
            (SELECT username, rank, COUNT(rank) FROM ${subquery2} GROUP BY username,rank) b
            GROUP BY username`//aantal keer per ranking
            var query = query1 + query2;
            sqlDB.query(query,(err, res) => {
                if (err) throw err;
                else {
                    var headersRank=["Stage"];
                    var headersCount=["User"];
                    var rowsRank=[];
                    var rowsCount=[];
                    
                    var userCount = res[1].rows.length
                    for(var i in res[0].rows){//ranking per stage
                        var row = [parseInt(i)+1];
                        for(var j in res[0].rows[i].usernames){
                            row.push(res[0].rows[i].usernames[j] + " (" + res[0].rows[i].scores[j] + ")");
                        }
                        rowsRank.push(row);
                    }


                    for(var i in res[1].rows){//aantal keer per ranking
                        var user = res[1].rows[i];
                        var row = new Array(userCount+1).fill(0)
                        row[0] = user.username;
                        for(var j in user.ranks){
                            row[user.ranks[j]] = user.rankcounts[j];
                        }
                        rowsCount.push(row);
                    }

                    //make headers
                    for(var i = 1; i < userCount + 1;i++){
                        headersRank.push(i+"e");
                        headersCount.push(i+"e");
                    }

                    //sort rowsCount
                    rowsCount.sort(function(a,b){
                        for(var i = 1; i <userCount+1; i++){
                            if(a[i]>b[i]) return false;
                            if(a[i]<b[i]) return true;
                        }
                        return false;
                    })

                    response.send({rankTable:{header: headersRank, rows: rowsRank}, countTable:{header: headersCount, rows: rowsCount}})
                }
            })
        }
    })

    app.post('/api/getriderpointsall',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var query = `SELECT  concat(firstname, ' ', lastname) AS name, team, SUM(stagescore)/GREATEST(count(DISTINCT username),1) AS stagescore, 
            SUM(teamscore)/GREATEST(count(DISTINCT username),1) AS teamscore, SUM(totalscore)/GREATEST(count(DISTINCT username),1) AS totalscore, 
            count(DISTINCT username) AS usercount, string_agg(DISTINCT username, ', ') AS users FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING(rider_id)
            LEFT JOIN team_selection_rider on results_points.rider_participation_id = team_selection_rider.rider_participation_id
            LEFT JOIN account_participation USING(account_participation_id)
            LEFT JOIN account USING (account_id)
            WHERE rider_participation.race_id = 4
            GROUP BY name, team
            ORDER BY totalscore DESC`
            //0 for string 1 for number
            var coltype = {name:0,team:0,stagescore:1,teamscore:1,totalscore:1,usercount:1};
            sqlDB.query(query,(err,results)=>{
                if(err) throw err;
                res.send({tableData: results.rows,
                    coltype: coltype,
                title: "Alle Renners"})
            })
        }
    })

    app.post('/api/getriderpointsselected',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var query = `SELECT  concat(firstname, ' ', lastname) AS "Name", team AS "Team",price AS "Price", SUM(stagescore)/GREATEST(count(DISTINCT username),1) AS "Stagescore",  
            SUM(teamscore)/GREATEST(count(DISTINCT username),1) AS "Teamscore", SUM(totalscore)/GREATEST(count(DISTINCT username),1) AS "Totalscore", 
            ROUND(SUM(totalscore)/GREATEST(count(DISTINCT username),1)*1e6/price,0) AS "Points per Million",  
            count(DISTINCT username) AS "Usercount", string_agg(DISTINCT username, ', ') AS "Users" FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING(rider_id)
            LEFT JOIN team_selection_rider on results_points.rider_participation_id = team_selection_rider.rider_participation_id
            LEFT JOIN account_participation USING(account_participation_id)
            LEFT JOIN account USING (account_id)
            WHERE rider_participation.race_id = 4 AND rider_participation.rider_participation_id in (select rider_participation_id from team_selection_rider) 
            GROUP BY "Name", "Team", "Price"
            ORDER BY "Points per Million" DESC`
            //0 for string 1 for number
            var coltype = {"Name":0,"Team":0,"Price":1,"Stagescore":1,"Teamscore":1,"Totalscore":1,"Points per Million":1,"Usercount":1};
            sqlDB.query(query,(err,results)=>{
                if(err) throw err;
                res.send({tableData: results.rows,
                coltype: coltype,
                title: "Alle Geselecteerde Renners"})
            })
        }
    })

    app.post('/api/getriderresults',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var query = `SELECT stagenr, stagepos, stagescore, teamscore, totalscore FROM results_points
            INNER JOIN rider_participation USING(rider_participation_id)
            INNER JOIN rider USING(rider_id)
            INNER JOIN stage USING(stage_id)
            WHERE rider_participation_id = ${req.body.rider_participation_id}
            ORDER BY stagenr; 
            SELECT name, year, firstname, lastname FROM rider_participation
            INNER JOIN race USING(race_id)
            INNER JOIN rider USING(rider_id)
            WHERE rider_participation_id = ${req.body.rider_participation_id};
            SELECT 0 AS stagenr,  0 AS stagepos, SUM(stagescore) AS Stagescore, sum(teamscore) AS Teamscore, SUM(totalscore) AS Totalscore FROM results_points
            WHERE rider_participation_id = ${req.body.rider_participation_id}`
            //0 for string 1 for number
            var coltype = {};
            sqlDB.query(query,(err,results)=>{
                if(err) throw err;
                var total = results[2].rows[0];
                total.stagenr = "Total";
                total.stagepos = "";
                results[0].rows.push(total)
                var headerinfo = results[1].rows[0];
                var title = headerinfo.firstname + " " +  headerinfo.lastname + " - " + headerinfo.name + " " + headerinfo.year;
                res.send({tableData: results[0].rows,
                coltype: coltype,
                title: title})
            })
        }
    })



    //CHARTS
    //CHARTS misschien nieuwe file
    app.post('/api/chartuserstagescores',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var currentStageNum = functies.stageNumKlassieker();
            var query = `SELECT username, stagenr, totalscore FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = 4 AND stage.stagenr <= ${currentStageNum}
            ORDER BY username, stagenr`
            sqlDB.query(query, (err,results)=>{
                if(err) throw err;
                var username = results.rows[0].username;
                var userObj = {
                    type: "line", 
                    name: username,
                    showInLegend: true,
                    dataPoints:[] 
                }
                var data = [];
                userObj.dataPoints.push({x:0,y:0})

                for(var i in results.rows){
                    if(userObj.name == results.rows[i].username){
                        userObj.dataPoints.push({x: results.rows[i].stagenr, y:results.rows[i].totalscore})
                    }else{
                        data.push(userObj);
                        username = results.rows[i].username;
                        userObj = {
                            type: "line", 
                            name: username,
                            showInLegend: true,
                            dataPoints:[] 
                        }
                        userObj.dataPoints.push({x:0,y:0})
                        userObj.dataPoints.push({x:results.rows[i].stagenr, y:results.rows[i].totalscore})
                    }
                    
                }
                data.push(userObj)
                for(i in userObj.dataPoints){
                    var total = 0;
                    for(user in data){
                        total += data[user].dataPoints[i].y;
                    }
                    var avg = total/data.length;
                    for(user in data){
                        data[user].dataPoints[i].y -= avg;
                    }
                }
                console.log(data)
                data.sort(function(a,b){return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y})
                res.send(data);
            })
        }
    })

    app.post('/api/chartuserranking',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var currentStageNum = functies.stageNumKlassieker();
            var query = `SELECT username, stagenr, rank() over (PARTITION BY stagenr ORDER BY totalscore desc) FROM stage_selection
            INNER JOIN account_participation USING (account_participation_id)
            INNER JOIN account USING (account_id)
            INNER JOIN stage USING (stage_id)
            WHERE stage.race_id = 4 AND stage.stagenr <= ${currentStageNum}
            ORDER BY username, stagenr`
            sqlDB.query(query, (err,results)=>{
                if(err) throw err;
                var username = results.rows[0].username;
                var userObj = {
                    type: "line", 
                    name: username,
                    showInLegend: true,
                    dataPoints:[] 
                }
                var data = [];

                for(var i in results.rows){
                    if(userObj.name == results.rows[i].username){
                        userObj.dataPoints.push({x: results.rows[i].stagenr, y:parseInt(results.rows[i].rank)})
                    }else{
                        data.push(userObj);
                        username = results.rows[i].username;
                        userObj = {
                            type: "line", 
                            name: username,
                            showInLegend: true,
                            dataPoints:[] 
                        }
                        userObj.dataPoints.push({x:results.rows[i].stagenr, y:parseInt(results.rows[i].rank)})
                    }
                    
                }
                data.push(userObj)
                console.log(data)

                data.sort(function(a,b){return b.dataPoints[b.dataPoints.length - 1].y - a.dataPoints[a.dataPoints.length - 1].y})
                res.send(data);
            })
        }
    })

    app.post('/api/chartriderpercentage',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var currentStageNum = functies.stageNumKlassieker();
            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = 4)`
            var query = `SELECT totalscore, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id}) AND totalscore > 0 AND stage.stagenr <= ${currentStageNum}
            ORDER by lastname, stagenr`
            sqlDB.query(query, (err,results)=>{
                if(err) throw err;
                var lastname = results.rows[0].lastname;
                var riderObj = {
                    type: "stackedColumn", 
                    name: lastname,
                    showInLegend: true,
                    dataPoints:[] 
                }
                var data = [];

                for(var i in results.rows){
                    if(riderObj.name == results.rows[i].lastname){
                        riderObj.dataPoints.push({x: results.rows[i].stagenr, y:results.rows[i].totalscore})
                    }else{
                        data.push(riderObj);
                        lastname = results.rows[i].lastname;
                        riderObj = {
                            type: "stackedColumn", 
                            name: lastname,
                            showInLegend: true,
                            dataPoints:[] 
                        }
                        riderObj.dataPoints.push({x: results.rows[i].stagenr, y:results.rows[i].totalscore})
                    }
                    
                }
                data.push(riderObj)
                res.send(data);
            })
        }
    })

    app.post('/api/chartriderpercentagetotal',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var currentStageNum = functies.stageNumKlassieker();
            var account_participation_id = `(SELECT account_participation_id FROM account_participation WHERE account_id = ${req.user.account_id} AND race_id = 4)`
            var query = `SELECT totalscore, lastname, stagenr FROM results_points
            INNER JOIN rider_participation USING (rider_participation_id)
            INNER JOIN rider USING (rider_id)
            INNER JOIN stage USING (stage_id)
            WHERE rider_participation_id IN (SELECT rider_participation_id FROM team_selection_rider WHERE account_participation_id = ${account_participation_id})
            ORDER by lastname, stagenr`
            var query2 = `select array_agg(stagenr) as stages, array_agg(totalscore) as scores, lastname from team_selection_rider
            left join results_points using(rider_participation_id)
            left join rider_participation using(rider_participation_id)
            left join rider using(rider_id)
            left join stage using(stage_id)
            where account_participation_id = ${account_participation_id} AND stage.stagenr <= ${currentStageNum}
            group by lastname`

            sqlDB.query(query2, (err,results)=>{
                if(err) throw err;
                var data = [];
                
                for (var i in results.rows){
                    var lastname = results.rows[i].lastname;
                    var riderObj = {
                        type: "line", 
                        name: lastname,
                        showInLegend: true,
                        dataPoints:[] 
                    }
                    var rider = results.rows[i]
                    var total = 0;
                    for(var j = 0; j < currentStageNum+1; j++){
                        var index = rider.stages.indexOf(j);
                        if(index + 1){// index not -1
                            total += rider.scores[index];
                        }
                        riderObj.dataPoints.push({x: j, y:total})

                        
                    }
                    data.push(riderObj)
                }

                
                res.send(data);
            })
        }
    })

    app.post('/api/versus',function(req,res){
        if(!req.user){
            res.redirect('/')
        }else{
            var query = `SELECT lastname, array_agg(username) FROM team_selection_rider
                        INNER JOIN rider_participation USING(rider_participation_id)
                        INNER JOIN rider USING (rider_id)
                        INNER JOIN account_participation USING(account_participation_id)
                        INNER JOIN account USING (account_id)
                        WHERE account_id IN (1,2) AND account_participation.race_id = 4
                        GROUP BY lastname`
        }
    })
}