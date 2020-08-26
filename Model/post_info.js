const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"

mongoose.connect(url,{ useNewUrlParser: true,  useUnifiedTopology: true })

const Schema = mongoose.Schema


const pSchema = new Schema({
    des: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    cname: {
        type: String,
        required: true
    },
    fname: {
        type: String,
        required: true
    },
    uploader: {
        type: String,
        required: true
    },

//    "name":"James Walsh","user":"user","nick_name":"not_set","email":"James Walsh@calpoly.edu","pref_list":["ethnicity","gender","location","major","hobby_list"],"pref":"ethnicity","hobby_list":["dancing","road trips","baking"],"friend_list":[],"gender":"male","age":{"$numberInt":"20"},"location":"Oklahoma","language":["Marathi","Spanish","Tamil","Urdu"],"major":"ME","dorm":"red bricks","ethnicity":"American"} 
})

const Post = mongoose.model("Pot",pSchema)


module.exports = Post;