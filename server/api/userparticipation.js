module.exports = function (app) {
    const async = require('async')
    const SQLread = require('../db/SQLread')
    const sqlDB = require('../db/sqlDB')

    app.post('/api/getracepartcipation', function (req, res) {
        var query = `SELECT * FROM account_participation 
        WHERE race_id = ${race_id_global} AND account_id = ${req.user.account_id}`
        sqlDB.query(query, (err,results) => {
            if (err) {console.log("WRONG QUERY:",query); throw err;}            
              else{
                  console.log(results)
                res.send(results)
            }
        });
    });

    app.post('/api/addparticipation',function(req,res){
        if(!req.user){
            res.send(false)
            res.redirect('/')
        }else{
            var account_id = req.user.account_id;
            var race_id = race_id_global;
            query = `INSERT INTO account_participation (account_id, race_id, budgetParticipation) 
            VALUES($1, $2, FALSE),($1, $2, TRUE)
            ON CONFLICT (account_id, race_id, budgetParticipation) DO NOTHING`
            var values = [account_id,race_id];

            sqlDB.query(query, values, (err) => {
                if (err) {console.log("WRONG QUERY:",query); throw err;}                                    
                else{
                    res.send("added")
                }
            });
        }
    })

}