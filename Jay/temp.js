const mongoose = require('mongoose')
const mongodb = require('mongodb')
const User = require('./user')

//mongo connection
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
mongoose.connect(url)

User.find().exec().then( (profiles) =>{
    profiles.forEach(element => {
        User.findOneAndUpdate({email: element.email}, {username: element.email.substr(0, element.email.indexOf("@")) })   
    });

    console.log("Got here")
})



var conn = mongoose.connection;
var db = mongoose.connection.db