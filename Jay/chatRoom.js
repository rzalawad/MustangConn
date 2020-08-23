const { ObjectID } = require('mongodb')
const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })


const chatRoom = mongoose.Schema({
    email1: {type: String, default: -1},
    email2: {type: String, default: -1},
    messageSequence: {
        type: Array,
        'default': []
    }
})

let chatRoomModel = mongoose.model('chatRoom', chatRoom)
module.exports.chatRoomModel = chatRoomModel