const mongoose = require('mongoose')
const chatRoom = require("./chatRoom")
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const Rooms = mongoose.Schema({
    rooms: [{
        type: chatRoom
    }]
})