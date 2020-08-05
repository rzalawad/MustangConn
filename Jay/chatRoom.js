const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const messageHistory = mongoose.Schema({
    messageUser1: [{
            type: String
        }],
    messageUser2: [{
            type: String
        }],
    sequence: [{
        type: Number 
    }]
})



const chatRoom = mongoose.Schema({
    user1: {type: Number, default: -1},
    user2: {type: Number, default: -1},
    roomNum: {type: Number, default: -1},
    messageHistory: messageHistory
})

module.exports.chatRoom = chatRoom
module.exports.chatRoomInit = mongoose.model('chatRoom', chatRoom)