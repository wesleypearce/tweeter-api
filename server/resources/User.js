const mongoose = require("mongoose");
const findOrCreate = require("mongoose-findorcreate");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  twitterId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  screen_name: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  description: {
    type: String
  },
  followers_count: {
    type: Number,
    required: true
  },
  profile_image_url_https: {
    type: String,
    required: true
  }
});

userSchema.plugin(findOrCreate);
const User = mongoose.model("user", userSchema);
module.exports = User;
