const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const Schema = mongoose.Schema


const uSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    nick_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    pref_list: {
        type: Array,
        required: true
    },
    'pref': {
        type: String,
        required: true
    },
    hobby_list: {
        type: Array,
        required: true
    },
    friend_list: {
        type: Array,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    language: {
        type: Array,
        required: true
    },
    major: {
        type: String,
        required: true
    },
    dorm: {
        type: String,
        required: true
    },
    ethnicity: {
        type: String,
        required: true
    },

//    "name":"James Walsh","user":"user","nick_name":"not_set","email":"James Walsh@calpoly.edu","pref_list":["ethnicity","gender","location","major","hobby_list"],"pref":"ethnicity","hobby_list":["dancing","road trips","baking"],"friend_list":[],"gender":"male","age":{"$numberInt":"20"},"location":"Oklahoma","language":["Marathi","Spanish","Tamil","Urdu"],"major":"ME","dorm":"red bricks","ethnicity":"American"} 
})

const User = mongoose.model("User",uSchema, 'users')


module.exports = User;