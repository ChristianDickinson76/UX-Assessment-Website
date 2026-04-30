const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    showCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    artist: {
      type: String,
      required: true,
      trim: true
    },
    venue: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    genre: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      default: "Concerts"
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

showSchema.index({ showCode: 1 }, { unique: true });

module.exports = mongoose.model("Show", showSchema);
