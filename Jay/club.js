const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const Schema = mongoose.Schema

const cSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    des: {
        type: String,
        required: true
    },
    admin: {
        type: String,
        required: true
    },
    posts: {
        type: Array,
        required: false
    },
    type: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    ppic: {
        type: String,
        required: false
    },
    members: 
    {
        type: Array,
        required: false
    },
})

const Club = mongoose.model("Club", cSchema, 'clubs')

module.exports = Club;