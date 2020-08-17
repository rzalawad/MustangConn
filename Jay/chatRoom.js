const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const messageHistory = mongoose.Schema({
    messageUser1: {
        type: Array,
        'default': []
    },
    messageUser2: {
        type: Array,
        'default': []
    },
    sequence: {
        type: Array,
        'default': []
    }
})  


const chatRoom = mongoose.Schema({
    email1: {type: String, default: -1},
    email2: {type: String, default: -1},
    roomNum: {type: Number, default: -1},
    messageHistory: {type:messageHistory}
})

let chatRoomModel = mongoose.model('chatRoom', chatRoom)
let historyModel = mongoose.model('messageHistory', messageHistory)
module.exports.chatRoomModel = chatRoomModel
module.exports.historyModel = historyModel