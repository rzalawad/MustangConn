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


const model_of_chat_history = mongoose.model("chatHistory", messageHistory)


const chatRoom = mongoose.Schema({
    user1: {type: Number, default: -1},
    user2: {type: Number, default: -1},
    roomNum: {type: Number, default: -1},
    messageHistory: {type:messageHistory}
})

module.exports.chatRoom = chatRoom
module.exports.chatRoomInit = mongoose.model('chatRoom', chatRoom)
module.exports.messageHistoryInit = mongoose.model('messageHistory', messageHistory)