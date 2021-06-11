const fs = require('fs');
const nodemailer = require("nodemailer");

let pass: string;
if (fs.existsSync('./src/server/mailSecret.js') || fs.existsSync('./build/server/mailSecret.js')) {
  pass = require('./mailSecret.js');
} else {
  pass = process.env.MAIL_SECRET; // Zo niet gebruik heroku env var
}

let transporter = nodemailer.createTransport({
  host: "mail.zxcs.nl",
  port: 465,
  secure: true,
  auth: {
    user: 'admin@sportradenenzo.nl',
    pass: pass,
  },
});

module.exports = transporter;