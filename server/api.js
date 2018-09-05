module.exports = function (app){
  var passport = require('passport');

  //Register a new account
  app.use("/api/signup", passport.authenticate('local-signup', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/whytho', // redirect back to the signup page if there is an error
  }));

  //Login into an excisting account
  app.use('/api/login', function (req, res, next) {
    var redirectURL = '/';
    if (req.query.redir != undefined) redirectURL = req.query.redir;
    passport.authenticate('local-login', {
      successRedirect: redirectURL, // scheelt ook weer een keer klikken
      failureRedirect: '/', // redirect back to the signup page if there is an error
    })(req, res, next);
  });
}

/*
  const COLUMNS = [
    "carbohydrate_g",
    "protein_g",
    "fa_sat_g",
    "fa_mono_g",
    "fa_poly_g",
    "kcal",
    "description"
  ];

app.get("/api/food", (req, res) => {
  const param = req.query.q;

  if (!param) {
    res.json({
      error: "Missing required parameter `q`"
    });
    return;
  }

  // WARNING: Not for production use! The following statement
  // is not protected against SQL injections.
  const r = db.exec(
    `
    select ${COLUMNS.join(", ")} from entries
    where description like '%${param}%'
    limit 100
  `
  );

  if (r[0]) {
    res.json(
      r[0].values.map(entry => {
        const e = {};
        COLUMNS.forEach((c, idx) => {
          // combine fat columns
          if (c.match(/^fa_/)) {
            e.fat_g = e.fat_g || 0.0;
            e.fat_g = (parseFloat(e.fat_g, 10) +
              parseFloat(entry[idx], 10)).toFixed(2);
          } else {
            e[c] = entry[idx];
          }
        });
        return e;
      })
    );
  } else {
    res.json([]);
  }
});*/