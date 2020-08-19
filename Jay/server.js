const express = require('express')
const app = express()
const http = require('http')
const fs = require('fs')
const dataB = require('./database')
const driver = require("./driver")
const server = http.createServer(app)
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const mongoose = require('mongoose')
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
//mongo connection
mongoose.connect(url)
var conn = mongoose.connection;
var db = mongoose.connection.db

const session = require('express-session')

const mongodb = require('mongodb')
const Post = require('./post_info')
const User = require('./user')
const Club = require('./club')
const binary = mongodb.Binary

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
app.use(express.static(__dirname + '/assets'));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// Parse JSON bodies (as sent by API clients)
app.use(express.json());
app.use(session({
    secret: 'f53638%;3#hHJA34',
    resave: false,
    saveUninitialized: true,
  }))

// Allow Access to 'public' directory
app.use(express.static(path.join(__dirname, 'public')))








//ONE
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//INDEX and Login routes


//@1: index
//wtbd: 1) better css
app.get('/',function(req,res) {
    res.render("index")
    req.session.code = null
    req.session.u_email = null
})
//for historical reasons :)
app.get('/index',function(req,res) {
    res.redirect("/")
})


//@2: r/login
//wtbd: 1) better css
//      2) better security?
app.get("/login",async function(req,res){
    (dataB.validation(req.query.email, req.query.psswd)).then((user)=>{
        if(user){
            req.session.user = user
            //console.log(req.query.email)
            res.redirect("/home")
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.redirect('/')
        }
    })
})

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
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
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
                        res.render("codeEntry", {receiver:"change"})
                    }
                    else{   
                        res.render("error")
                    }
                }).catch((err)=>{
                    console.log(err)
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
                        console.log("Save gone wrong")
                        console.log(err)
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
                        console.log("Save gone wrong")
                        console.log(err)
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


//@3: r/logout
app.post("/logout", function(req,res) {
    //console.log("no way dog")
    req.session.code = null
    req.session.user = null
    req.session.destroy()
    res.redirect("/")
})


//@4: r/signUp
//wtbd: 1) better css
app.get("/signUp",(req,res)=>{
    if (req.session.u_email != null) {
        req.session.user = new User()
        req.session.user.name = req.query.name
        req.session.user.major = req.query.major
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
        req.session.user.password = "1234"
        req.session.user.friend_list = []
        for(req.session.lopV = 1; req.session.lopV <=5; req.session.lopV++){
            req.session.tempV = req.session.lopV.toString()
            req.session.user.pref_list[i-1] = req.query[x]
        }
        req.session.user.pref = req.session.user.pref_list[0]
        req.session.user.save((err,data)=>{
            if(err){
                console.log("User save gone worng")
                console.log(err)
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

            res.render("verification", {success: true, clubs: club_names})
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
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
            })
        }
        else{
            res.redirect('/verification', {success: false, print_val: req.query.email})
        }
    })  
})

//@Des: asks for club email and generates code
app.get("/club-verification",function(req,res){
    req.session.flag = false

    fs.readFile('./public/club_directory/clubs.txt', (err, data) => {
        var text = data.toString();
        var club_email = null;

        if(text.length > 0){
            var eachLine = text.split("\n")
            var i;

            for (i = 0; i < eachLine.length; i++) {
                var eachattr = eachLine[i].split(",")
                if (eachattr[0] == req.query.club_name) {
                    if (eachattr[1]) {
                        club_email = eachattr[1]
                    }
                    else {
                        club_email = eachattr[0] + "@calpoly.edu"
                    }

                    break;
                }
            }
        }
    })

    if (club_email) {
        Club.findOne({name:eachattr[0]}).then((obj)=>{
            if(!obj){
                (driver.codeGenerator(club_email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = club_email
                    res.render("codeEntry", {receiver:club_email})
                }
                else{   
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
            })
            }
            else{
                alert("'" + eachattr[0] + "'" + " already exists.")
                res.redirect('/verification', {success: false, print_val: eachattr[0]})
            }
        })
    }
    else {
        res.render("error")
    }  
})

//@Des: Verifies code 
app.get("/codeVerify", function(req,res){
    if(req.session.code == null){
        req.session.u_email = null
        req.session.u_type = null
        req.session.save()
        res.render("error")
    }
    else{
        if (req.query.code == req.session.code){
            req.session.code = null
            if (req.session.u_type != null) {
                res.render("changePassword")
            }
            else {
                if(!req.session.user.email)
                    res.render("register")
                else{
                    res.render('') //TBC
                }
            }
        }
        else{
            req.session.u_email = null
            req.session.u_type = null
            req.session.save()
            res.render("error")
        }
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
    Post.find({}).sort({ _id: -1 }).exec(function(err, docs) { if(err){
        console.log("error in post loading :/home")
    }
    else{
        if(req.session.user != null){
            (dataB.findPeople(req.session.user).then((doc)=>{
                req.session.query = []
                for(req.session.lopV = 0; req.session.lopV < (Object.keys(doc).length); req.session.lopV++){
                    req.session.tempV = doc[req.session.lopV]
                    req.session.query[req.session.lopV] = req.session.tempV
                }
                res.render("home", {files:docs, q: req.session.query,
                            friends: req.session.user.friend_list,
                            email: req.session.user.email,
                            friends_email: req.session.user.friend_list_emails})
            }))
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
        res.render('profile', {target:req.session.user})
    }
    else {
        res.redirect("/")
    }
})

app.get('/profile/:c_username', function(req, res){
    if (req.session.user != null) {
        var c_username = req.params.c_username;
        //console.log(c_username);

        User.findOne({email: c_username}, function(err,obj) { 
            //console.log(obj);
            if (obj) {
                res.render('profile', {target:obj})
            }
            else {
                console.log(err)
            }

        });
        //console.log(obj.email);
    }
    else {
        res.redirect("/")
    }
})


//@7 : r/findpeople
//wtbd: 1) filter?
app.get("/findPeople", function(req,res){
    if (req.session.user != null) {  
        (dataB.findPeople(req.session.user).then((doc)=>{
            req.session.query = []

            for (req.session.lopV = 0; req.session.lopV < (Object.keys(doc).length); req.session.lopV++) {
                req.session.tempV = doc[req.session.lopV]
                req.session.query[req.session.lopV] = req.session.tempV
            }

            res.render('findPeople',{u_name: req.session.name, q: req.session.query})
        }))
        // clearing temps JIC
        req.session.lopV = 0
        req.session.tempV = 0
    }
    else {
        res.redirect("/")
    }
})

app.post('/addFriend', (req,res) => {
    //check for duplicates
    if (req.session.user != null) {
        for (req.session.lopV = 0; req.session.lopV < req.session.user.friend_list.length; req.session.lopV++){
            if (req.session.user.friend_list[req.session.lopV] === (req.session.query[req.body.name].name)){
                req.session.flag = true;
            }
        }
        
        if (req.session.flag != true){
            //req.session.user.friend_list.pop();
            //req.session.user.friend_list_emails.pop();

            req.session.user.friend_list.push(req.session.query[req.body.name].name);
            req.session.user.friend_list_emails.push(req.session.query[req.body.name].email);
            req.session.save();
        }

        req.session.lopV = 0

        res.redirect("/findPeople")
    }
    else {
        res.redirect("/")
    }
})


//@8: r/post
//wtbd: 1) better css
//      2) previewing post
app.post("/post", upload.single('file'), (req, res) => {
    if(req.session.user){
        if(req.session.user.user == "admin"){ //SWITCH TO CLUB ON FINAL RELEASE
            req.session.post2 = new Post()
            req.session.post2.des = (req.body.des)
            req.session.post2.type = (req.body.type)
            req.session.post2.cname = (req.body.cname)
            req.session.post2.fname = req.file.filename
            req.session.post2.uploader = req.session.user.email
            req.session.post2.save((err,data)=>{
                if(err){
                    console.log("Post gone worng")
                    console.log(err)
                }
                else{
                    console.log("ok post")
                }
            })
        }
        res.redirect("/home")
    }
    else{
        res.render("error")
    }

    req.session.post2 = null
})

app.get("/post/upload", (req,res)=>{
    res.render("upload")
})


//@9: r/clubs
//wtbd: 1) fixing server.js (which functions include/not include)
//      2) finding suggested clubs
app.get('/clubs',function(req, res) {
    res.render("clubs", {target: req.session.user})
})

app.get('/clubs/:current_Club', function(req, res){
    var current_Club = req.params.current_Club;

    Club.findOne({email: current_Club}, function(err,obj) { 
        //console.log(obj);
        if (obj) {
            res.render("viewClub", {target:obj})
        }
        else {
            console.log(err)
        }
    });
})

/*app.get('/club/profile', function(req,res) {
    Club.findOne({email:req.query.email}).then((obj)=>{
        if(!obj){
            (driver.codeGenerator(req.query.email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = req.query.email
                    res.render("verification")
                }
                else{
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
            })
        }
        else{
            res.render("error")
        }
    })
})*/

/*app.get("/club",function(req,res){
    res.render('verification',{club:true})
})*/


//@10: r/chat
//wtbd: <insert Ridham's intelligence>
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////








// THREE
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// Change Profile Image


//@11: r/ProfilePic
//wtbd: 1) better css
//      2) preview pic
app.get("/profile/upload/redirect",(req,res)=>{
    res.render("profilePic")
})

app.post("/profile/Image",upload.single('file'),(req,res)=>{
    console.log(req.session.name)
    if(req.session.user.ppic){
        gfs.remove({ filename: req.session.user.ppic, root: 'posts' }, (err, gridStore) => {
        });
        console.log("1")
    }
    //console.log(req.file);

    User.findOne({email: req.session.user.email}, function(err,obj) { 
        req.session.tempV = obj  
        // console.log(obj.name);  
        req.session.tempV.ppic = req.file.filename;
        req.session.user.ppic = req.session.tempV.ppic;
        req.session.tempV.save();
        res.redirect("/profile")
    });
})


//@12: r/Delete_Profile_Pic
//@desc Delete file
app.delete('/files/:id', (req, res) => {
    Post.find({fname:req.params.id}).remove((err)=>{console.log("error removing post info")})
    gfs.remove({ filename: req.params.id, root: 'posts' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/home');
    });
  });


//@13: r/Load_Profile_Pic
//gets profile pic from the dbw
app.get('/image/:filename', (req,res)=>{
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
})
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////








// FUNCTIONS USED IN MAH CODE   
// ############################################################################################################
function insertFile(file, res, req) {
    //console.log("poop")
    mongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true }, (err, client) => {
        if (err) {
            return err
        }
        else {
            let db = client.db('Mustang_Connect')
            let collection = db.collection('clubs')
            try {
                req.session.post = {
                    "file":file,
                    "des" :req.query.des
                }
                collection.insertOne(req.session.post)
                console.log('File Inserted')
            }
            catch (err) {
                console.log('Error while inserting:', err)
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