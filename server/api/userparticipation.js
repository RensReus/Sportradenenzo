module.exports = function (app) {
    const jwt = require('jsonwebtoken')  
    const fs = require('fs');
    const sqlDB = require('../db/sqlDB')

    function getSecret() {
        if (fs.existsSync('./server/jwtsecret.js')) {
            return secret = require('../jwtsecret');
        } else {
            return secret = process.env.JWT_SECRET;
        }
    }

    app.post('/api/getracepartcipation', function (req, res) {
        var query = `SELECT * FROM account_participation 
        WHERE race_id = ${race_id_global} AND account_id = ${req.user.account_id}`
        sqlDB.query(query, (err,results) => {
            if (err) {console.log("WRONG QUERY:",query); throw err;}            
              else{
                res.send(results)
            }
        });
    });

    // app.post('/api/addparticipation',function(req,res){
    //     if(!req.user){
    //         res.send(false)
    //         res.redirect('/')
    //     }else{
    //         var account_id = req.user.account_id;
    //         var race_id = race_id_global;
    //         query = `INSERT INTO account_participation (account_id, race_id, budgetParticipation) 
    //         VALUES($1, $2, FALSE),($1, $2, TRUE)
    //         ON CONFLICT (account_id, race_id, budgetParticipation) DO NOTHING`
    //         var values = [account_id,race_id];

    //         sqlDB.query(query, values, (err) => {
    //             if (err) {console.log("WRONG QUERY:",query); throw err;}                                    
    //             else{
    //                 res.send("added")
    //             }
    //         });
    //     }
    // })

    app.post('/api/getprofiledata', function (req, res) {
        jwt.verify(req.body.token, getSecret(), function (err, user) {
            if (err) {
                res.redirect('/')
                throw err;
            } else {
                var account_id = req.body.account_id;
                var last_stage_id = `(SELECT stage_id FROM stage WHERE race_id = 6 and stagenr = 22)`
                var accountQuery = `SELECT * FROM account
                WHERE account_id = ${account_id};\n `
                var participationsQuery = `SELECT * FROM account_participation
                WHERE account_id = ${account_id};\n `
                var tourposQuery = `SELECT rank FROM (
                    SELECT RANK() OVER(ORDER by totalscore DESC), account_id FROM stage_selection
                    INNER JOIN account_participation USING(account_participation_id)             
                    WHERE stage_id=${last_stage_id} AND budgetparticipation = false ) a
                    WHERE account_id = ${account_id};\n `
                var totalQuery = accountQuery + participationsQuery + tourposQuery;
                sqlDB.query(totalQuery, (err,results) => {
                    if (err) {console.log("WRONG QUERY:",totalQuery); throw err;}            
                      else{
                        if(results[0].rows.length ===0){
                            res.send({userNotFound:true})
                        }else{
                            var username = results[0].rows[0].username;
                            var tourpos = results[2].rows[0].rank;
                            res.send({userNotFound:false,username,tourpos})
                        }
                    }
                });
            }
        })
    })


    

}