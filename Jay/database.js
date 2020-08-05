const User = require("./user");
const chatRoom = require("./chatRoom")
const { models } = require("mongoose");
const { resolveInclude } = require("ejs");

const scores = {0:0.30, 1:0.25, 2:0.20, 3:0.15, 4:0.10}
const dp = {0:0.05, 1:0.04, 2:0.03, 3:0.02, 4:0.01}



function lsa(target,user){
    var match = 0
    for(var item in user){
        if(item in target){
            match+=1
        }
    }
    var scr = (match/target.length + match/user.length)/2
    if(scr>=0.6){
        return true 
    }
}

var get_collc = function(query,pref){
    return new Promise(function(resolve, reject){
            User.find(query, (err,result)=>{
                // console.log("noo",Object.keys(result).length)
                resolve(result)
            })
    })
}

var find_people = function(user){
    return new Promise(function(resolve,reject){
        var fp_list ={}
        var m_pref = user.pref
        var query = {}
        query[m_pref] = user[m_pref]
        // console.log(m_pref)
        get_collc(query, m_pref).then((collection)=>{
            // console.log("nicee",Object.keys(collection).length)
            for(var t=0; t<(Object.keys(collection).length); t++)
            {
                var target = collection[t]
                if (user.email == target.email)
                {
                    continue
                }
                var scr =0
                var lenght = Object.keys(user.pref_list).length
                for(var index = 0; index<lenght; index++)
                {
                    var p = (user.pref_list)[index]
                    if(p=='language' || p=='hobby_list')
                    {
                        if(lsa(target.pref_list,user.pref_list))
                        {
                            if(p in target.pref_list)
                                scr+=scores[index]
                            else
                                scr+= scores[index] - dp[index]
                            // console.log("scores",scr)
                        }
                        else
                        {
                            if(target[p] == user[p])
                            {
                                if(p in target.pref_list)
                                    scr+=scores[index]
                                else
                                    scr+= scores[index] - dp[index]
                            }
                        }       
                    }
                    else
                    {
                        if(target[p] == user[p])
                        {
                            if(p in target.pref_list)
                                scr+=scores[index]
                            else
                                scr+= scores[index] - dp[index]
                        }
                    }
                    }
                    // console.log(scr)
                    if(scr>=0.55)
                    {
                        fp_list[Object.keys(fp_list).length] = target
                    }
                }
                
                resolve(fp_list)

        })

    })
}

var validation = function(username, password) {
    return new Promise(function(resolve, reject) {  
          User.findOne({email:username},function(err,docs){
            if(docs == null){
                reject(false)
            } 
            else{
                if (password == (docs.toObject()).password){//to be changed to obj.password
                    resolve(docs)
                }
                else{
                    reject(false)
                } 
            }
 
        })
    })}


function get_profile_for_username(username)
{
    User.find({username: username}).then(profiles =>{
        return profiles;
    }).catch(err => {
        console.log("search error")
    })
}

function get_profile_for_name(name)
{
    User.find({name: name}).then(profiles =>{
        return profiles;
    }).catch(err => {
        console.log("search error")
    })
}


function get_profile_with_id(id)
{
    User.findById(id).then(profile => {
        return profile;
    }).catch(err => {
        console.log("Search by ID error occurred. ID: ", id)
    })
}


function chat_room_query(username1, username2)
{
    if (username1.localCompare(username2) > 0)
    {
        [username1, username2] = [username2, username1]
    }
    var room1 = chatRoom.chatRoom.find({username1: username1, username2: username2})
    return room1
}



//test

// var test = function(username, password, property) {
//     return new Promise(function(resolve, reject) {  
//         var prop = property+" -_id"
//         var n =  User.findOne({email:username}).select(prop)
//         n.exec(function (err, someValue) {
//             if (err) return next(err);
//             for (var key in someValue) {
//                 if (someValue.hasOwnProperty(key)) {
//                     console.log(someValue[property]);
//                 }
//             }
//         })
//     })}


// validation("Phillip Martinez@calpoly.edu","1234").then((result)=>{
//     find_people(result).then((doc)=>{
//         console.log(doc)
//     })
// })

   


    


exports.validation = validation
exports.findPeople = find_people
exports.get_profile_for_username = get_profile_for_username
exports.get_profile_with_id = get_profile_with_id
exports.chat_room_query = chat_room_query