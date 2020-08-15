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

const mongodb = require('mongodb')
const Post = require('./post_info')
const User = require('./user')
const binary = mongodb.Binary
var code = null
var u_email = null
var c_user = null

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
app.use(express.urlencoded({extended: false }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Allow Access to 'public' directory
app.use(express.static(path.join(__dirname, 'public')))

//intialize

//routes
app.get('/',function(req,res) {
    res.render("index")
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


//Route to upload profile pic
//@in profile.ejs
app.get("/profile/upload/redirect",(req,res)=>{
    res.render("profilePic")
})
app.post("/profile/Image",upload.single('file'),(req,res)=>{
    if(c_user.ppic){
        gfs.remove({ filename: c_user.ppic, root: 'posts' }, (err, gridStore) => {
        });
    }
    c_user.ppic = req.file.filename
    c_user.save((err,data)=>{
        if(err){
            console.log("profile pic save wrong")
            console.log(err)
        }
    })
    res.redirect("/profile")
})

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
    Post.find({fname:req.params.id}).remove((err)=>{console.log("error removing post info")})
    gfs.remove({ filename: req.params.id, root: 'posts' }, (err, gridStore) => {
      if (err) {
        return res.status(404).json({ err: err });
      }
  
      res.redirect('/home');
    });
  });

  //route to get image
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

app.get('/home',function(req,res) {
    Post.find({}).sort({ _id: -1 }).exec(function(err, docs) { if(err){
        console.log("error in post loading :/home")
    }
    else{
        if(c_user != null){
            (dataB.findPeople(c_user).then((doc)=>{
                // console.log((Object.keys(doc).length))
                for(var index= 0; index<(Object.keys(doc).length);index++){
                  var target = doc[index]
                  query[index] = target
                }
                res.render("home",{files:docs, q: query, friends: c_user.friend_list, email: c_user.email, friends_email: c_user.friend_list_emails})
            }))
        }
        else{
            res.render("index")
        }
    } });
})


app.get('/profile',function(req,res) {
    res.render('profile', {name: c_user.name, age: c_user.age, location: c_user.location, gender: c_user.gender, dorm: c_user.dorm, hobbies: c_user.hobby_list, friends: c_user.friend_list, ppic:c_user.ppic, email: c_user.email, friends_email: c_user.friend_list_emails})
})

app.get('/profile/:c_username', function(req, res){
    var c_username = req.params.c_username;
    //console.log(c_username);

    User.findOne({email: c_username}, function(err,obj) { 
        //console.log(obj);
        res.render('profile', {name: obj.name, age: obj.age, location: obj.location, gender: obj.gender, dorm: obj.dorm, hobbies: obj.hobby_list, friends: obj.friend_list, ppic:obj.ppic, email: obj.email})

    });

    //console.log(obj.email);



    //res.render('profile', {name: c_user.name, age: c_user.age, location: c_user.location, gender: c_user.gender, dorm: c_user.dorm, hobbies: c_user.hobby_list, friends: c_user.friend_list, ppic:c_user.ppic, email: c_user.email})
})

app.get('/index',function(req,res) {
    res.render("index")
})
 
app.get('/clubs',function(req, res) {
    res.render("clubs", {name: c_user.name, age: c_user.age, location: c_user.location, gender: c_user.gender, dorm: c_user.dorm, hobbies: c_user.hobby_list, friends: c_user.friend_list, ppic:c_user.ppic, following: c_user.following_list})
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
            res.render("home")
        }

    })
}
                            
app.get("/login",async function(req,res){
    (dataB.validation(req.query.email, req.query.psswd)).then((user)=>{
        if(user){
            console.log(req.query.email)
            c_user = user
            res.redirect("/home")
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.render('index')
        }
    })
})

//Route to verify User

//##################################################################################
app.get("/verification",(req,res)=>{
    res.render("verification")
})

//@Des: Verifies code 
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

//@Des: asks fro email and generates code
app.get("/eVerification",function(req,res){
    (driver.codeGenerator(req.query.email)).then((cod)=>{
        if (cod){
            code = cod
            u_email = req.query.email
            console.log(u_email)
            res.render("codeEntry")
        }
        else{
            
            res.render("error")
        }
    }).catch((err)=>{
        console.log(err)
    })

})

///////////////////////////////////////////////////////////////////////////
//Route: to sign up
//@Des: creates new user in dataB
//#########################################################

app.get("/signUp",(req,res)=>{
    c_user = new User()
    c_user.name = req.query.name
    c_user.major = req.query.major
    c_user.age = req.query.age
    c_user.gender = req.query.gender
    c_user.dorm = req.query.dorm
    c_user.location = req.query.location
    c_user.ethnicity = req.query.ethnicity
    c_user.language = (req.query.language).split(',')
    c_user.hobby_list = (req.query.hobbies).split(',')
    c_user.user = "admin"
    c_user.email = u_email
    c_user.password = "1234"
    c_user.friend_list = []
    for(var i= 1; i<=5;i++){
        var x = i.toString()
        c_user.pref_list[i-1] = req.query[x]
    }
    c_user.pref = c_user.pref_list[0]
    c_user.save((err,data)=>{
        if(err){
            console.log("Post gone worng")
            console.log(err)
        }
        else{
            res.redirect("/home")
        }
    })

})

app.get("/test",(req,res)=>{
    res.render("register")
})



///////////////////////////////////////////////////////


var query = []

//#########################################################
app.get("/findPeople", function(req,res){
    if(c_user != null){
        (dataB.findPeople(c_user).then((doc)=>{
            // console.log((Object.keys(doc).length))
            for(var index= 0; index<(Object.keys(doc).length);index++){
              var target = doc[index]
              query[index] = target
            }
            res.render('findPeople',{u_name: c_user.name, q: query})
        }))
    }
    else{
        res.render("index")
    }
})



app.post('/addFriend', (req,res) => {
    //check for duplicates 

    for (var i = 0, len = c_user.friend_list.length; i < len; i++){
        if (c_user.friend_list[i] === (query[req.body.name].name)){
            var flag = true;
        }
    }
    
    if (flag != true){
        //c_user.friend_list.pop();
        //c_user.friend_list_emails.pop();

        c_user.friend_list.push(query[req.body.name].name);
        c_user.friend_list_emails.push(query[req.body.name].email);
        c_user.save();
    }
})

// //@route to grab post from DB
// app.get('/file/:filename', (req,res)=>{
//     gfs.files.findOne({filename: req.params.filename}).toArray((err,file)=>{
//         if(!file || file.length ==0){
//             res.render("error")
//         }
//         else{
//             res.json(file)
//         }
//     })
// })

// //@route to display image
// app.get('/image/:filename', (req,res)=>{
//     gfs.files.findOne({filename: req.params.filename}).toArray((err,file)=>{
//         if(!file || file.length === 0){
//             res.render("error")
//         }
//         else{
//             if(file.contentType === "image/jpeg" || file.contentType === "img/png"){
//                 const readstream = gfs.createReadStream(file.filename);
//                 readstream.pipe(res);
//               } else {
//                 res.status(404).json({
//                   err: 'Not an image'
//                 });
//             }
//         }
//     })
// })

var des = null
var type = null
//@route to upload post image and description
app.post("/post/upload", upload.single('file'), (req, res) => {
    if(c_user){
        console.log(c_user.user)
        if(c_user.user == "admin"){
            var post = new Post()
            post.des = (req.body.des)
            post.type = (req.body.type)
            post.cname = (req.body.cname)
            post.fname = req.file.filename
            post.uploader = c_user.email
            post.save((err,data)=>{
                if(err){
                    console.log("Post gone worng")
                    console.log(err)
                }
            })
        }
        res.redirect("/home")
        console.log("noooooo")
    }
    else{
        res.render("error")
    }

})
    
app.get("/post/upload", (req,res)=>{
    res.render("upload")
})

server.listen(5000,()=> console.log("Online at 5000"))