// subscriber.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();

// Increase timeout for cold starts
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 seconds
  res.setTimeout(60000);
  next();
});

app.use(cors());
app.use(bodyParser.json());

// MongoDB Atlas connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
});

// Nodemailer setup with Gmail App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// Start server and connect to MongoDB
async function startServer() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas");

    const db = client.db("newsletterDB");
    const subscribers = db.collection("subscribers");

    // Subscribe route
    app.post("/subscribe", async (req, res) => {
      const { email } = req.body;

      if (!email) return res.status(400).json({ message: "Email is required" });

      try {
        // Check if email already exists
        const existing = await subscribers.findOne({ email });
        if (existing) return res.status(200).json({ message: "Already subscribed" });

        // Save new subscriber
        await subscribers.insertOne({ email, date: new Date() });

        // Send confirmation email (don't await - do it in background)
        const subscriberMail = {
          from: `"AuraLume ✨" <${process.env.GMAIL_USER}>`,
          to: email,
          subject: "🌈 Welcome to AuraLume — You're In!",
          html: `
            <div style="
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: linear-gradient(135deg, #f8f8ff, #f3e8ff);
              border-radius: 12px;
              padding: 30px;
              color: #2d0a31;
              max-width: 600px;
              margin: 20px auto;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            ">
              <div style="text-align: center;">
                <img src="https://cdn.jsdelivr.net/gh/Aditya02git/Icons/aura-logo-extralarge.png" alt="AuraLume Logo" width="70" style="margin-bottom: 10px;" />
                <h1 style="font-size: 28px; color: #ff006e;">Welcome to <span style="
                    color: #00f5ff;
                    font-weight: bold;
                    ">
                    AuraLume
                    </span>
                    !
                </h1>
              </div>
              <p style="font-size: 16px; line-height: 1.6;">Hi there 👋,</p>
              <p style="font-size: 16px; line-height: 1.6;">
                We're thrilled to have you as part of the <b>AuraLume</b> community! ✨  
                From now on, you'll receive exclusive updates, creative design insights, and sneak peeks of our latest UI components and features.
              </p>
              <div style="
                background: #9d4edd;
                color: white;
                padding: 12px 20px;
                text-align: center;
                border-radius: 8px;
                font-weight: bold;
                margin: 25px 0;
              ">
                🌟 Stay inspired. Stay luminous.
              </div>
              <p style="font-size: 15px; color: #4b006e;">
                Cheers, <br/>
                <b>Aditya Mondal</b><br/>
                Founder, AuraLume
              </p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />
              <p style="font-size: 13px; color: #777; text-align: center;">
                You received this email because you subscribed to AuraLume.<br/>
                &copy; ${new Date().getFullYear()} AuraLume. All rights reserved.
              </p>
            </div>
          `,
        };

        // Send emails in background (non-blocking)
        transporter.sendMail(subscriberMail).catch(err => 
          console.error("❌ Failed to send subscriber email:", err)
        );

        const adminMail = {
          from: `"AuraLume ✨" <${process.env.GMAIL_USER}>`,
          to: process.env.GMAIL_USER,
          subject: "🆕 New Newsletter Subscriber",
          text: `A new user subscribed: ${email}`,
        };

        transporter.sendMail(adminMail).catch(err =>
          console.error("❌ Failed to send admin notification:", err)
        );

        // Respond immediately without waiting for emails
        res.status(200).json({ message: "Subscribed successfully!" });
      } catch (err) {
        console.error("❌ Error subscribing:", err);
        res.status(500).json({ message: "Something went wrong" });
      }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

startServer();
