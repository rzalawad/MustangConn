const User = require("./user");
const Club = require("./club");
const chatRoom = require("./chatRoom");
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
        get_collc(query, m_pref).then((collection)=>{
            for(var t=0; t<(Object.keys(collection).length); t++){
                var target = collection[t]
                var a_repeat = false
                if (user.email == target.email || user.friend_list.includes(target.email) || user.requested_list.includes(target.email) || user.request_list.includes(target.email)){
                    a_repeat = true
                }

                if (!a_repeat) {
                    var scr =0
                    var lenght = Object.keys(user.pref_list).length
                    for(var index = 0; index<lenght; index++){
                        var p = (user.pref_list)[index]
                        if(p=='language' || p=='hobby_list'){
                            if(lsa(target.pref_list,user.pref_list)){
                                if(p in target.pref_list)
                                    scr+=scores[index]
                                else
                                    scr+= scores[index] - dp[index]
                                // console.log("scores",scr)
                            }
                            else{
                                if(target[p] == user[p]){
                                    if(p in target.pref_list)
                                        scr+=scores[index]
                                    else
                                        scr+= scores[index] - dp[index]
                                }
                            }       
                        }
                        else{
                            if(target[p] == user[p]){
                                if(p in target.pref_list)
                                    scr+=scores[index]
                                else
                                    scr+= scores[index] - dp[index]
                            }
                        }
                    }
                    if(scr>=0.55){
                            fp_list[Object.keys(fp_list).length] = target
                    }
                }
            }
                
                resolve(fp_list)
        }).catch((err)=>{
            console.log(err)
        })
    })
}

var validation = function(username, password) {
    return new Promise(function(resolve, reject) {
        var user_found = false

        User.findOne({email:username},function(err,docs){
            if(docs == null){
                user_found = false
            }
            else{
                if (password == (docs.toObject()).password){
                    resolve(docs)
                    user_found = true 
                }
                else{
                    user_found = false
                }
            }
        })

        if (user_found == false) {
            Club.findOne({email: username}).then(docs => {
                if(docs == null){
                    reject(false)
                }
                else{
                    if (password == (docs.toObject()).password) {
                        resolve(docs)
                    }
                    else {
                        reject(false)
                    }
                }
            })
        }
    })
}

var get_sprofile_for_email = (email) => {

    return User.findOne({email: email}).exec()
}

var get_cprofile_for_email = (email) => {

    return Club.findOne({email: email}).exec()
}

var get_friends_for_email = (email) => {

    return User.findOne({email: email}, {name: 1, email: 1, ppic: 1}).exec()
}

function edit_Database() {
    /* This function is used to edit the database (preferably the entire database)
     *  In this example, we have a function that changes the majors that were set
     *  initially with the DBCreator.py function to the new values set at the register
     *  page.
     */
    User.find({}, {email: 1, major: 1}).then(u_cursor => {
        var d_list = ["Biochemistry", "Computer Science", "Software Engineering", "Mechanical Engineering", "Business Administration", "Chemistry", "Physics", "Sociology", "Art and Design", "Music", "General Engineering", "Architecture", "Biomedical Engineering", "Computer Engineering", "Architectural Engineering", "Aerospace Engineering", "Theatre Arts"]
        var d_ref = ["biology", "Cs", "SE", "ME", "BUSS", "CHEM", "PHY", "SOCIO", "ART", "MUSIC", "GEN_STUD", "ARCH", "BMED", "CENG", "ARENG", "AERO", "THEAT"]
        u_cursor.forEach((item) => {
            var cur = item.email
            var i = 0
            var space_found = false
            while (!space_found) {
                if (d_ref[i++] == item.major) {
                    space_found = true
                    var val = d_list[i-1];
                }

                if (i > d_ref.length - 1) {
                    break;
                }
            }

            if (space_found) {
                User.updateOne({email: cur}, {$set: {'major': val}}, (err => {
                    if(err) {
                        console.log(err);
                    }
                }))
            }
        })
    })
}

function chat_room_query(email1, email2)
{
    if (email1.localeCompare(email2) > 0)
    {
        [email1, email2] = [email2, email1]
    }
    return chatRoom.chatRoomModel.findOne({email1: email1, email2: email2}).exec()
}

function chat_room_by_id(id)
{
    return chatRoom.chatRoomModel.findById(id).exec()
}

exports.validation = validation
exports.findPeople = find_people
exports.get_sprofile_for_email = get_sprofile_for_email
exports.get_cprofile_for_email = get_cprofile_for_email
exports.get_friends_for_email = get_friends_for_email
exports.edit_Database = edit_Database
exports.chat_room_query = chat_room_query
exports.chat_room_by_id = chat_room_by_id