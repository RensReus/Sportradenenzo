// In dit bestand staan alle calls die checken wat de status van een race of etappe is (Moet nog beginnen, begonnen, of afgelopen)

module.exports = (app, current_race, stage) => {
    const sqlDB = require('../db/sqlDB');
    const racename = current_race.name;
    const year = current_race.year;

    app.post('/api/getstagestatus', (req, res) => {
    });

    app.post('/api/getinitialdata', (req, res) => {
      let newRedir: string;
      if (stage !== 0) {
        newRedir = '/stage/' + stage;
      } else {
        newRedir = '/teamselection';
      }
      console.log(newRedir, racename, year);
      res.send({redirect: newRedir, racename, year});
    });
};
