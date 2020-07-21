const express = require('express')
const app = express()
const tabsR = require('./routes/tabs')
const pytalk = require('pytalk')
const fs = require('fs')
const dataB = require('./database')
const User = require("./user");
const { models } = require("mongoose");
const { use } = require('./routes/tabs')

// Connection URL
// const url = 'mongodb://jay:$jay123@MC-Profiles/Mustang_Connect?authSource=admin';

// Use connect method to connect to the Server
// MongoClient.connect(url, function(err, client) {
//   assert.equal(null, err);
//   client.close();
// });


var c_user


// Set view engine as EJS
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/assets'));

app.use('/tabs', tabsR)

app.get('/',function(req,res) {
    let path = './views/'
    path += 'home.html'
    fs.readFile(path,(err,data)=>{
        if(err){
            console.log(err)
        }
        else{
            res.end(data)
        }
    })
})

app.get('/chat',function(req,res) {
    fs.readFile('./views/chat.html',(err,data)=>{
        if(err){
            console.log(err)
        }
        else{
            res.end(data)
        }
    })
})

app.get('/home',function(req,res) {
    let path = './views/'
    path += 'home.html'
    fs.readFile(path,(err,data)=>{
        if(err){
            console.log(err)
        }
        else{
            res.end(data)
        }
    })
})


app.get('/profile',function(req,res) {
    res.render('profile', {name: c_user.name, age: c_user.age, location: c_user.location, gender: c_user.gender, dorm: c_user.dorm, hobbies: c_user.hobby_list, friends: c_user.friend_list})
})

app.get('/index',function(req,res) {
    let path = './views/'
    path += 'index.html'
    fs.readFile(path,(err,data)=>{
        if(err){
            console.log(err)
        }
        else{
            res.end(data)
        }
    })
})
 
                            
app.get("/login",async function(req,res){
    (dataB.validation(req.query.email, req.query.psswd)).then((user)=>{
        if(user){
            c_user = user
            res.redirect('/home') 
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.redirect('/index')
        }
    })
})

// app.get("/register", function(req,res=>{

// }))



    



app.listen(5000)