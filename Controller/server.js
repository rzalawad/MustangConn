const express = require('express')
const app = express()
const session = require('express-session')
const http = require('http')
const server = http.createServer(app)
const fs = require('fs')
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const io = require("socket.io").listen(server)
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

//file imports
const dataB = require('../Model/database')
const driver = require("../Model/driver")
const chatFormat = require("../Model/chatFormat")


//mongo connection
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
mongoose.connect(url)
var conn = mongoose.connection;
var db = mongoose.connection.db


const Post = require('../Model/post_info')
const User = require('../Model/user')
const Club = require('../Model/club')
const binary = mongodb.Binary
app.use(bodyParser.urlencoded({extended: true}))

//session
var session_middleware = session({
    store: new MongoStore({ mongooseConnection: conn, collection: "sessions" }),
    secret: "f53638%;3#hHJA34",
    resave: true,
    saveUninitialized: true,
   
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
})
var sharedsession = require("express-socket.io-session")
app.use(session_middleware)


//socketio middleware
//io.use(sharedsession(session, {
//    autoSave:true
//}));
io.use(sharedsession(session_middleware, {autoSave: true}))


const customField = {
    usernameField: 'email',
    passwordField: 'psswd'
}

const verifyCallback = (username, password, done) => {
    User.findOne({ email: username, password: password }, function(err, user) {
        if (err) { return done(err); }
        if (!user) {
          return done(null, false, { message: 'Incorrect username.' });
        }
        return done(null, user);
    });
}

const strategy = new LocalStrategy(customField, verifyCallback)

passport.use(strategy)

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((userID, done) => {
    User.findById(userID).then((user) => {
        done(null, user)
    }).catch(err => done(err))
})

app.use(passport.initialize())
app.use(passport.session())

app.use( (req, res, next) => {
    next()
})


var code = null

const chatRoom = require("../Model/chatRoom")
const formatMessage = require('../Model/chatFormat');
const { ENGINE_METHOD_PKEY_METHS } = require('constants');

//Initialize gridfs
Grid.mongo = mongoose.mongo;
let gfs 
conn.once('open', () => {
    gfs =  Grid(conn.db)
    console.log("now in db")
    gfs.collection('posts')
})

// Create storage engine
const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'posts'
          };
          resolve(fileInfo);
        });
      });
    }
  });

const upload = multer({ storage });

// Set view engine as EJS
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Allow Access to 'public' directory
app.use(express.static(path.join(__dirname, '../public')))








//ONE
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//INDEX and Login routes


//@1: index
app.get('/',function(req,res) {
    req.session.code = null
    req.session.u_email = null
    res.render("index")
})
//for historical reasons :)
app.get('/index',function(req,res) {
    res.redirect("/")
})


//@2: r/login
//Pending issues: 1) Login with correct credentials sometimes don't run then function
app.get("/login",async function(req,res){
    (dataB.validation(req.query.email, req.query.psswd)).then((user)=>{
        if(user){
            req.session.user = user
            res.redirect("/home")
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.redirect('/')
        }
    })
})


//@3: r/logout
app.get("/logout", function(req,res) {
    req.session.user = null
    req.session.destroy()
    res.redirect("/")
})


//@4: r/studentSignUp and r/clubSignUp
//@Des: Verified page containing list of available clubs
app.get("/verification",(req,res)=>{
    fs.readFile('./public/club_directory/clubs.txt', (err, data) => {
        var text = data.toString();

        if(text.length > 0){
            var club_names = []
            var eachLine = text.split("\n")
            var i;

            for (i = 0; i < eachLine.length; i++) {
                var eachattr = eachLine[i].split(",")
                if (eachattr[0]) {
                    club_names.push(eachattr[0])
                }
            }

            res.render("verification", {clubs: club_names})
        }
    });
})

//@Des: asks for student email and generates code
app.get("/student-verification",function(req,res){
    req.session.flag = true
    User.findOne({email:req.query.email}).then((obj)=>{
        if(!obj){
            (driver.codeGenerator(req.query.email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = req.query.email
                    res.render("codeEntry", {receiver:null})
                }
                else{   
                    res.render("error", {msg: "Driver-Generated Error: Unable to send code"})
                }
            }).catch((err)=>{
                res.render("error", {msg: err})
            })
        }
        else{
            res.redirect('/verification')
        }
    })  
})

//@Des: asks for club email and generates code
app.get("/club-verification",function(req,res){
    fs.readFile('./public/club_directory/clubs.txt', (err, data) => {
        var text = data.toString();
        var club_email = null

        if(text.length > 0){
            var eachLine = text.split("\n")
            var i;

            for (i = 0; i < eachLine.length; i++) {
                var eachattr = eachLine[i].split(",")

                if (eachattr[0] == req.query.club_name) {
                    if (eachattr[1]) {
                        club_email = eachattr[1].replace(/\s/g, '')
                    }

                    break;
                }
            }
        }

        if (club_email) {
            Club.findOne({name:req.query.club_name}).then((obj)=>{
                if(!obj){
                    (driver.codeGenerator(club_email)).then((cod)=>{
                    if (cod){
                        req.session.code = cod
                        req.session.u_email = club_email
                        req.session.cl_name = req.query.club_name
                        res.render("codeEntry", {receiver:club_email})
                    }
                    else{   
                        res.render("error", {msg: "Driver-Generated Error: Unable to send code"})
                    }
                }).catch((err2)=>{
                    res.render("error", {msg: err2})
                })
                }
                else{
                    res.redirect('/verification')
                }
            })
        }
        else {
            console.log("Club email is null")
            res.render("error", {msg: "Server-generated Error: Club Email is null"})
        }
    })  
})

//@Des: Verifies code 
app.get("/codeVerify", function(req,res){
    if(req.session.code == null){
        req.session.u_email = null
        req.session.u_type = null
        req.session.save()
        res.render("error", {msg: "Driver-Generated Error: Unable to find sent code"})
    }
    else{
        if (req.query.code == req.session.code){
            req.session.code = null
            if (req.session.u_type != null) {
                res.render("changePassword")
            }
            else {
                if (req.query.account_type == "student") {
                    res.render("registerStudent")
                }
                else {
                    res.render("registerClub")
                }
            }
        }
        else{
            req.session.u_email = null
            req.session.u_type = null
            req.session.save()
            res.redirect("/verification")
        }
    }
})

app.get("/studentSignUp",(req,res)=>{
    if ((req.session.u_email != null) && (req.session.code == null)) {
        req.session.user = new User()
        req.session.user.name = req.query.name
        req.session.user.major = req.query.major
        req.session.user.year = req.query.year
        req.session.user.age = req.query.age
        req.session.user.gender = req.query.gender
        req.session.user.dorm = req.query.dorm
        req.session.user.location = req.query.location
        req.session.user.ethnicity = req.query.ethnicity
        req.session.user.language = (req.query.language).split(',')
        req.session.user.hobby_list = (req.query.hobbies).split(',')

        //Give us four admin accounts, and others student accounts
        var ur_email = req.session.u_email
        if ((ur_email == "jdevkar@calpoly.edu") || (ur_email == "rzalawad@calpoly.edu") ||
            (ur_email == "jzmorris@calpoly.edu") || (ur_email == "kigwe@calpoly.edu")) {
                req.session.user.user = "admin"
        }
        else {
            req.session.user.user = "student"
        }

        req.session.user.email = req.session.u_email
        req.session.user.password = req.query.password[0]
        req.session.user.friend_list = []
        req.session.user.club_list = []
        req.session.user.requested_list = []
        req.session.user.request_list = []

        for(req.session.lopV = 1; req.session.lopV <=5; req.session.lopV++){
            req.session.tempV = req.session.lopV.toString()
            req.session.user.pref_list[req.session.lopV-1] = req.query[req.session.tempV]
        }
        req.session.user.pref = req.session.user.pref_list[0]
        req.session.user.save((err,data)=>{
            if(err){
                res.render("error", {msg: err})
            }
            else{
                res.redirect("/home")
            }
        })
        // clearing themps JIC
        req.session.lopV = 0
        req.session.tempV = 0
    }
    else {
        res.redirect("/")
    }
})

app.get("/clubSignUp",(req,res)=>{
    if ((req.session.u_email != null) && (req.session.code == null)) {
        req.session.user = new Club()
        req.session.user.name = req.session.cl_name
        req.session.user.des = req.query.des
        req.session.user.admin = req.session.u_email
        req.session.user.user = "club"
        req.session.user.email = req.session.u_email
        req.session.user.password = req.query.password[0]
        req.session.user.members = []
        req.session.user.interests = (req.query.interests).split(',')
        req.session.user.save((err,data)=>{
            if(err){
                res.render("error", {msg: err})
            }
            else{
                res.redirect("/home")
            }
        })

        req.session.cl_name = null
    }
    else {
        res.redirect("/")
    }
})

//@i: r/recover (Changing Password)
app.get("/recover", function(req,res) {
    res.render("recover")
})

app.get("/changePassVerification", function(req,res) {
    if (req.query.account_type == "student") {
        User.findOne({email:req.query.edit_email}).then((obj)=>{
        if(obj){
            (driver.codeGenerator(req.query.edit_email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = req.query.edit_email
                    req.session.u_type = "student"
                    req.session.save()
                    res.render("codeEntry", {receiver:"change"})
                }
                else{   
                    res.render("error", {msg: "Driver-Generated Error: Unable to send code"})
                }
            }).catch((err)=>{
                res.render("error", {msg: err})
            })
        }
        else{
            res.redirect('/recover')
        }
        })
    }
    else {
        Club.findOne({email:req.query.edit_email}).then((obj)=>{
            if(obj){
                (driver.codeGenerator(req.query.edit_email)).then((cod)=>{
                    if (cod){
                        req.session.code = cod
                        req.session.u_email = req.query.edit_email
                        req.session.u_type = "club"
                        req.session.save()
                        res.render("codeEntry")
                    }
                    else{   
                        res.render("error", {msg: "Driver-Generated Error: Unable to send code"})
                    }
                }).catch((err)=>{
                    res.render("error", {msg: err})
                })
            }
            else{
                res.redirect('/recover')
            }
        })
    }
})

app.get("/changePass",(req,res)=>{
    if ((req.session.u_type == "student") && (req.session.u_email != null)) {
        User.findOneAndUpdate({email: req.session.u_email}, {password: req.query.psswd1}).then((obj)=>{
            if (obj) {
                req.session.u_type = null
                req.session.save((err,data)=>{
                    if(err){
                        res.render("error", {msg: err})
                    }
                    else{
                        res.redirect("/home")
                    }
                })
            }
            else {
                res.redirect("/")
            }
        })
    }
    else if ((req.session.u_type == "club") && (req.session.u_email != null)) {
        Club.findOneAndUpdate({email: req.session.u_email}, {password: req.query.psswd1}).then((obj)=>{
            if (obj) {
                req.session.u_type = null
                req.session.save((err,data)=>{
                    if(err){
                        res.render("error", {msg: err})
                    }
                    else{
                        res.redirect("/home")
                    }
                })
            }
            else {
                res.redirect("/")
            }
        })
    }
    else {
        res.redirect("/")
    }
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////








//TWO 
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//Main Body routes


//@5: r/home 
//wtbd: 1) better css
//      2) better post algo
app.get('/home',function(req,res) {
    Post.find({}).sort({ _id: -1 }).exec(function(err, docs) { 
    if(err){
        res.render("error", {msg: err})
    }
    else{
        if(req.session.user != null){
            if (req.session.user.user != "club") {
                (dataB.findPeople(req.session.user).then((doc)=>{
                    req.session.query = []
                    for(req.session.lopV = 0; req.session.lopV < (Object.keys(doc).length); req.session.lopV++){
                        req.session.tempV = doc[req.session.lopV]
                        req.session.query[req.session.lopV] = req.session.tempV
                    }

                    req.session.tempV = 0
                    req.session.lopV = 0

                    var frlist = []
                    var i = 0
                    if (req.session.user.friend_list.length == 0) {
                        res.render("home", {files:docs, q: req.session.query, target: req.session.user, friends: []})
                    }
                    else {
                        req.session.user.friend_list.forEach(email => {
                            dataB.get_friends_for_email(email).then(doc2 => {
                                if(!doc2){
                                    res.render("error", {msg: err})
                                }
                                else {
                                    frlist.push(doc2)
                                    if (i == (req.session.user.friend_list.length - 1)) {
                                        res.render("home", {files:docs, q: req.session.query, target: req.session.user, friends: frlist})
                                    }
                                }
                                i++
                            })
                        })
                    }
                })).catch(err2 => res.render("error", {msg: err2}))
            }
            else {
                res.render("home", {files:docs, target: req.session.user})
            }
        }
        else{
            res.redirect("/")
        }
    }
    });
})


//@6: r/profile
//wtbd: 1) better css
//      2) nav bar bug
app.get('/profile',function(req,res) {
    if (req.session.user != null) {
        if (req.session.user.user != "club") {
            res.redirect("/profile/" + req.session.user.email)
        }
        else {
            res.redirect("/clubs/" + req.session.user.name)
        }
    }
    else {
        res.redirect("/")
    }
})

app.get('/profile/:c_username', function(req, res){
    if (req.session.user != null) {
        var c_username = req.params.c_username;

        User.findOne({email: c_username}, function(err,obj) { 
            if (obj) {
                var frlist= []
                var i = 0

                if (obj.friend_list == 0) {
                    res.render('profile', {actual_user: req.session.user, target:obj, friends: []})
                }
                else {
                    obj.friend_list.forEach(email => {
                        dataB.get_friends_for_email(email).then(doc => {
                            if(!doc){
                                res.render("error", {msg: "Unable to find " + obj.name + "'s friend with email " + email})
                            }
                            else {
                                frlist.push(doc)
                                if (i == (obj.friend_list.length - 1)) {
                                    res.render('profile', {actual_user: req.session.user, target:obj, friends: frlist})
                                }
                            }
                            i++
                        })
                    })
                }
            }
            else {
                res.render("error", {msg: "Unable to find profile of email: " + c_username})
            }
        }).catch(err => {
            console.log(err)
            res.render("error", {msg: err})
        })
    }
    else {
        res.redirect("/")
    }
})


//@7 : r/findpeople
app.get("/findPeople", function(req,res){
    if ((req.session.user != null) && (req.session.user.user != "club")) {
        (dataB.findPeople(req.session.user).then((doc)=>{
            console.log(req.session.user.requested_list);
            req.session.query = []

            for (req.session.lopV = 0; req.session.lopV < (Object.keys(doc).length); req.session.lopV++) {
                req.session.tempV = doc[req.session.lopV]
                req.session.query[req.session.lopV] = req.session.tempV
            }

            res.render('findPeople',{u_name: req.session.name, q: req.session.query, cur_user: req.session.user})
        })).catch((err)=>{
            res.render("error", {msg: err})
        })
        // clearing temps JIC
        req.session.lopV = 0
        req.session.tempV = 0
    }
    else {
        res.redirect("/")
    }
})


//@8 : Adding, requesting, and rejecting friends (r/friend/requests)
app.get("/friend/requests", function(req,res){
    if (req.session.user != null) {
        if(req.session.user.request_list.length<1){
            res.render("friendRequests",{r_list:[], actual_user:req.session.user});
        }
        else {
            var frlist= []
            var i = 0
            req.session.user.request_list.forEach(email => {
                dataB.get_sprofile_for_email(email).then(doc => {
                    if(!doc){
                        res.render("error", {msg: err})
                    }
                    else {
                        frlist.push(doc)
                        if (i == (req.session.user.request_list.length - 1)) {
                            res.render("friendRequests",{r_list:frlist, actual_user:req.session.user})
                        }
                    }
                    i++
                }).catch(err => res.render("error", {msg: err}))
            })
        }
    }
    else{
        res.redirect("/")
    }
})

app.get("/send/request", (req,res)=>{
    if (req.session.user != null) {
        User.findOne({_id: req.query.target.slice(0,-1)}).then(obj => {
            if (obj) {
                obj.request_list.push(req.session.user.email)
                obj.save()

                User.findOne({email: req.session.user.email}).then(ob => {
                    if (ob) {
                        ob.requested_list.push(obj.email)
                        ob.save()
                        req.session.user = ob
                        console.log(req.session.user.requested_list);
                    }
                    else {
                        res.render("error", {msg: "Unable to find profile with email: " + req.session.user.email})
                    }
                })

                res.redirect("/findPeople")
            }
            else {
                res.render("error", {msg: "Unable to locate user with id " + req.query.target.slice(0, -1)})
            }
        })
    }
    else {
        res.redirect("/")
    }
})

app.get("/reject/friend",(req,res)=>{
    if (req.session.user != null) {
        User.findOne({_id:req.query.target.slice(0,-1) }).then(obj => {
            if (obj) {
                obj.requested_list.splice(obj.requested_list.indexOf(req.session.user.email), 1)
                obj.save();

                User.findOne({email: req.session.user.email}).then(ob => {
                    if (ob) {
                        ob.request_list.splice(ob.request_list.indexOf(obj.email), 1)
                        ob.save();
                        req.request_list.splice(req.request_list.indexOf(obj.email), 1)
                        req.session.user = ob;
                    }
                    else {
                        res.render("error", {msg: "Unable to find profile with email: " + req.session.user.email})
                    }
                }).catch(err => console.log(err))
            }
            else {
                res.render("error", {msg: "Unable to find new friend's profile with id: " + req.query.target.slice(0,-1)})
            }
        }).catch(err => console.log(err))

        res.redirect("/friend/requests")
    }
    else {
        res.redirect("/")
    }
})

app.get("/add/friend",(req,res)=>{
    if (req.session.user != null) {
        User.findOne({_id: req.query.target.slice(0,-1)}).then(obj => {
            if (obj) {
                obj.requested_list.splice(obj.requested_list.indexOf(req.session.user.email), 1)
                obj.friend_list.push(req.session.user.email)
                obj.save();

                User.findOne({email: req.session.user.email}).then(ob => {
                    if (ob) {
                        ob.request_list.splice(ob.request_list.indexOf(obj.email), 1)
                        ob.friend_list.push(obj.email)
                        ob.save();
                        req.request_list.splice(req.request_list.indexOf(obj.email), 1)
                        req.session.user = ob;
                        req.session.save()
                    }
                    else {
                        res.render("error", {msg: "Unable to find profile with email: " + req.session.user.email})
                    }
                }).catch(err => console.log(err))
            }
            else {
                res.render("error", {msg: "Unable to find new friend's profile with id: " + req.query.target.slice(0,-1)})
            }
        }).catch(err => console.log(err))

        res.redirect("/friend/requests")
    }
    else {
        res.redirect("/")
    }
})


//@8: r/post
//wtbd: 1) better css
//      2) previewing post
app.post("/post", upload.single('file'), (req, res) => {
    if((req.session.user) && (req.session.user.user == "club")) {
        if(req.session.user.user == "club"){
            req.session.post2 = new Post()
            req.session.post2.des = (req.body.des)
            req.session.post2.type = (req.body.type)
            req.session.post2.cname = (req.body.cname)
            req.session.post2.fname = req.file.filename
            req.session.post2.uploader = req.session.user.email
            req.session.post2.save((err,data)=>{
                if(err){
                    res.render("error", {msg: err})
                }
            })
        }
        req.session.post2 = null
        res.redirect("/home")
    }
    else{
        res.redirect("/")
    }
})

app.get("/post/upload", (req,res)=>{
    if ((req.session.user != null) && (req.session.user.user == "club")) {
        res.render("upload")
    }
    else {
        res.redirect("/")
    }
})


//@9: r/clubs
//wtbd: 1) fixing server.js (which functions include/not include)
//      2) finding suggested clubs
app.get('/clubs',function(req, res) {
    if ((req.session.user != null) && (req.session.user.user != "club")) {
        Club.find({}, {name: 1, ppic: 1, des: 1}).sort({name: 1}).then(c_list => {
            res.render("clubs", {all_clubs: c_list, target: req.session.user})
        })
    }
    else {
        res.redirect("/")
    }
})

app.get('/clubs/:current_Club', function(req, res){
    if (req.session.user != null) {
        var current_Club = req.params.current_Club;

        Club.findOne({name: current_Club}, function(err,obj) { 
            //console.log(obj);
            if (obj) {
                res.render("viewClub", {actual_user: req.session.user, target:obj})
            }
            else {
                res.render("error", {msg: err})
            }
        });
    }
    else {
        res.redirect("/")
    }
})


//@10: r/chat
app.get('/chat-choose',function(req,res) {
    if (req.session.user != null) {
        //in the list to send, I am sending both name and usernames because names could be duplicates but usernames are unique (as they are calpoly usernames)

        var list_to_send = []
        if (req.session.user.friend_list_emails == 0)
        {
            list_to_send = []
            res.render("chat-choose", {friends: list_to_send})
        }
        else
        {
            list_to_send = []
            var cnt = 0
            req.session.user.friend_list_emails.forEach(email => {
                //console.log(email);
                dataB.get_sprofile_for_email(email).then(ret_profile => {
                    if (ret_profile != null)
                    {
                        list_to_send.push([ret_profile.email, ret_profile.email])
                        //console.log(cnt, req.user.friend_list_emails.length-1  )
                        if (cnt == req.session.user.friend_list_emails.length-1)
                        {
                            //console.log(list_to_send)
                            res.render("chat-choose", {friends: list_to_send})        
                        }
                    }
                    cnt++
                }).catch(err => console.log("Email ", err, " search error occured"))
            })
        }
    }   
})

app.post('/chat',function(req,res) {
        var friend_email = req.body.friend_email;
        var my_email = req.session.user.email;
        var friend_profile = null
        dataB.get_sprofile_for_email(friend_email).then( (profile) => {
            friend_profile = profile
           
            var email1 = friend_profile.email
            var email2 = req.session.user.email
            if (email1.localeCompare(email2) > 0)
            {
                [email1, email2] = [email2, email1]
            }    
            
            dataB.chat_room_query(email1, email2).then( (entireRoom) => {
                if (entireRoom != null)
                {
                    res.render("chat", {room: JSON.stringify(entireRoom), my_email: my_email, my_name: req.session.user.name, friend_name: friend_profile.name})
                }
                else
                {
                
                    const newRoom = new chatRoom.chatRoomModel({
                        email1: email1,
                        email2: email2,
                        messageHistory: []
                    })

                    newRoom.save().then( () => {
                        res.render("chat", {room: JSON.stringify(newRoom), my_email: my_email, my_name: req.session.user.name, friend_name: friend_profile.name})
                    }).catch(() => console.log("newroom save failed"))
                }
            }).catch((err) => {
                console.log("couldn't find room. Err: ", err);
            })
        }).catch(()=> console.log("couldn't find friend profile"));
})

io.on('connection', (socket) => {

    console.log('user connected');
    socket.on('data', (userdata) => {
        //console.log('data = ', socket.handshake.session)
    })
    
    socket.on("login", function(userdata) {
        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });

    socket.on("logout", function(userdata) {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    });


    socket.on('join.room', room_id => {
        socket.join(room_id)
        console.log("room joined")
    })

    socket.on('chatMessage', (roomID, name, msg) => {
        var formatted_message = formatMessage(name, msg)
        chatRoom.chatRoomModel.findOneAndUpdate({_id: roomID}, {$push: {messageSequence: formatted_message}}, () => io.to(roomID).emit('message', formatted_message))
    })

    /*socket.on('chatMessage', msg => {
        var msgObj = formatMessage(c_user.name, msg)
        if (c_user.username == newRoom.user1)
        {
            newRoom.messageHistory.sequence.push(1)
            newRoom.messageHistory.messageUser1.push([msgObj.text, msgObj.time])
        }
        else
        {
            newRoom.messageHistory.sequence.push(2)
            newRoom.messageHistory.messageUser2.push([msgObj.text, msgObj.time])
        }
        io.to(roomID).emit('message', msgObj)
    })*/

    socket.on('disconnect', () => {
        socket.leave()    
    })
})


app.get('/viewDatabase',function(req,res) {
    if ((req.session.user != null) && (req.session.user.user == "admin")) {
        User.find({}, {name: 1, email: 1, ppic: 1}).sort({name: 1}).then(u_cursor => {
            Club.find({}, {name: 1, email: 1, ppic: 1}).sort({name: 1}).then(c_cursor => {
                res.render("viewDatabase", {db_users: u_cursor, db_clubs: c_cursor})
            })  
        })
    }
    else {
        res.redirect("/")
    }
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////








// THREE
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// Change Profile Image


//@11: r/ProfilePic
//wtbd: 1) better css
//      2) preview pic
app.get("/profile/upload/redirect",(req,res)=>{
    if (req.session.user) {
        res.render("profilePic")
    }
    else {
        res.redirect("/")
    }
})

app.post("/profile/Image",upload.single('file'),(req,res)=>{
    if (req.session.user) {
        if(req.session.user.ppic){
            gfs.remove({ filename: req.session.user.ppic, root: 'posts' }, (err, gridStore) => {
            });
        }
    
        User.findOne({email: req.session.user.email}, function(err,obj) { 
            req.session.tempV = obj  
            // console.log(obj.name);  
            req.session.tempV.ppic = req.file.filename;
            req.session.user.ppic = req.session.tempV.ppic;
            req.session.tempV.save();
            res.redirect("/profile")
        });
    }
    else {
        res.redirect("/")
    }
})


//@12: r/Delete_Profile_Pic
//@desc Delete file
app.delete('/files/:id', (req, res) => {
    if ((req.session.user != null) && (req.session.user.user == "club")) {
        Post.find({fname:req.params.id}).remove((err)=>{res.render("error", {msg: err})})
        gfs.remove({ filename: req.params.id, root: 'posts' }, (err, gridStore) => {
        if (err) {
            return res.status(404).json({ err: err });
        }
    
        res.redirect('/home');
        });
    }
    else {
        res.redirect("/")
    }
});


//@13: r/Load_Profile_Pic
//gets profile pic from the dbw
app.get('/image/:filename', (req,res)=>{
    if (req.session.user != null) {
        gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
            // Check if file
            if (!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
            }
        
            // Check if image
            if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
            // Read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
            } else {
            res.status(404).json({
                err: 'Not an image'
            });
            }
        });
    }
    else {
        res.redirect("/")
    }
})
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////








// FUNCTIONS USED IN MAH CODE   
// ############################################################################################################
function insertFile(file, res, req) {
    mongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }, (err, client) => {
        if (err) {
            return err
        }
        else {
            let db2 = client.db('Mustang_Connect')
            let collection = db2.collection('clubs')
            try {
                req.session.post = {
                    "file":file,
                    "des" :req.query.des
                }
                collection.insertOne(req.session.post)
                console.log('File Inserted')
            }
            catch (err2) {
                console.log('Error while inserting:', err2)
            }
            client.close()
            res.render("home")
        }

        req.session.post = null
    })
}
///////////////////////////////////////////////////////////////////////////








// IMPORT REFERENCE CODE CAUSE ME DUMB
/* //@route to grab post from DB
 app.get('/file/:filename', (req,res)=>{
     gfs.files.findOne({filename: req.params.filename}).toArray((err,file)=>{
         if(!file || file.length ==0){
             res.render("error")
         }
         else{
             res.json(file)
         }
     })
 })
 //@route to display image
 app.get('/image/:filename', (req,res)=>{
     gfs.files.findOne({filename: req.params.filename}).toArray((err,file)=>{
         if(!file || file.length === 0){
             res.render("error")
         }
         else{
             if(file.contentType === "image/jpeg" || file.contentType === "img/png"){
                 const readstream = gfs.createReadStream(file.filename);
                 readstream.pipe(res);
               } else {
                 res.status(404).json({
                   err: 'Not an image'
                 });
             }
         }
     })
 })*/
///////////////////////////////////////////////////////


server.listen(5000,()=> console.log("Online at 5000"))
