const mongoose = require("mongoose");

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true},
    name: {type: String, required: true },
    confirmationToken: { type: String},
    confirmed: {type: Boolean, default: false},
    tokenExpiry: { type: Date, Default: Date.now },
    subscribedAt: { type: Date, default: Date.now}
});

const Subscriber = mongoose.model("Subscriber", subscriberSchema);

module.exports = Subscriber;
