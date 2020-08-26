
var assert = require('assert')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const user = require("../Model/user")

describe("testDB", function() {    
    //mongo connection
    const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
    mongoose.connect(url)
    var conn = mongoose.connection;

    it ('db', function (done) {
        conn.once('open', () => {
            console.log("now in db")
            user.findOne({email: "rzalawad@calpoly.edu"}).exec().then(profile => {
                assert(profile != null)
                done()
                conn.close()

            }).catch(err => console.log(err))
        })
    })

})

