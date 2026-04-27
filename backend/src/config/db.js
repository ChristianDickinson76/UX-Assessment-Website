const mongoose = require("mongoose");
const env = require("./env");

async function connectDb() {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is not defined");
  }

  await mongoose.connect(env.mongoUri);
}

module.exports = connectDb;
