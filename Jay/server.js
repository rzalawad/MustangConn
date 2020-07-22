const express = require('express')
const app = express()
const tabsR = require('./routes/tabs')
const pytalk = require('pytalk')
const fs = require('fs')
const dataB = require('./database')
const driver = require("./driver")
const User = require("./user");
const { models } = require("mongoose");
const { use } = require('./routes/tabs')

const mongodb = require('mongodb')
const binary = mongodb.Binary
var code = null
var u_email = null
// Connection URL
// const url = 'mongodb://jay:$jay123@MC-Profiles/Mustang_Connect?authSource=admin';

// Use connect method to connect to the Server
// MongoClient.connect(url, function(err, client) {
//   assert.equal(null, err);
//   client.close();
// });


var c_user = null


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
    code = null
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
 
app.get("/post", (req, res) => {
    if(c_user){
        console.log(c_user.user)
        if(c_user.user == "admin"){
            console.log("ninini")
            let file = {file: binary(req.file.img.data) }
            insertFile(file, res, req)
        }
        console.log("noooooo")
    }
    else{
        res.render("error")
    }
    

})

function insertFile(file, res, req) {
    console.log("poop")
    mongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }, (err, client) => {
        if (err) {
            return err
        }
        else {
            let db = client.db('Mustang_Connect')
            let collection = db.collection('clubs')
            try {
                var post = {
                    "file":file,
                    "des" :req.query.des
                }
                collection.insertOne(post)
                console.log('File Inserted')
            }
            catch (err) {
                console.log('Error while inserting:', err)
            }
            client.close()
            res.redirect('/home')
        }

    })
}
                            
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

app.get("/codeVerify", function(req,res){
    if(code == null){
        u_email = null
        res.render("error")
    }
    else{
        if (req.query.code == code){
            code = null
            res.render("register")
        }
        else{
            u_email = null
            res.render("error")
        }
    }
})

app.get("/verification", function(req,res){
    res.render("verification")
})



app.get("/Test", function(req,res){
    res.render("post")
})


app.get("/eVerification",function(req,res){
    (driver.codeGenerator(req.query.email)).then((cod)=>{
        if (cod){
            code = cod
            u_email = req.query.email
            res.render("codeEntry")
        }
        else{
            
            res.render("error")
        }
    }).catch((err)=>{
        console.log(err)
    })

})






app.get("/findPeople", function(req,res){
    if(c_user != null){
        (dataB.findPeople(c_user).then((doc)=>{
            var query = []
            // console.log((Object.keys(doc).length))
            for(var index= 0; index<(Object.keys(doc).length);index++){
              var target = doc[index]
              query[index] = target
            }
            
            res.render('findPeople',{u_name: c_user.name, q: query})
        }))
    }
    else{
        res.redirect("/index")
    }
})


app.get("/test",function(req,res){
    res.render('findPeople')
})



    


app.listen(5000)