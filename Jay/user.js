const mongoose = require('mongoose')
const UserSchema = require('./uSchema')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const User = mongoose.model("User", UserSchema.schema, 'users')


module.exports = User;