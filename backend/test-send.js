// test-send.js
require("dotenv").config();
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "tech.adityamondal2003@gmail.com",
  from: process.env.SENDGRID_FROM_EMAIL,
  subject: "Test Email from AuraLume",
  text: "If you see this, SendGrid works perfectly!",
};

sgMail.send(msg)
  .then(() => console.log("✅ Email sent successfully"))
  .catch(err => console.error("❌ SendGrid error:", err.response?.body || err));
