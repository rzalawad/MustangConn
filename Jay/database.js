const User = require("./user");
const { models } = require("mongoose");
const { resolveInclude } = require("ejs");

const scores = {0:0.30, 1:0.25, 2:0.20, 3:0.15, 4:0.10}
const dp = {0:0.05, 1:0.04, 2:0.03, 3:0.02, 4:0.01}




var validation = function(username, password) {
    return new Promise(function(resolve, reject) {  
          User.findOne({email:username},function(err,docs){
            if(docs == null){
                reject(false)
            } 
            else{
                if (password == (docs.toObject()).password){//to be changed to obj.password
                    resolve(docs.toObject())
                }
                else{
                    reject(false)
                } 
            }
 
        })
    })}


// validation("Brandon Moore@calpoly.edu","1234").then((doc)=>{
//     find_people(doc)
// })

exports.validation = validation
// exports.findPeople = find_people