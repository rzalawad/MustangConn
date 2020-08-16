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
const cuser = require('./current_user')
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












// ONE
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//INDEX and Login routes


//@1 : index
// wtbd: better css
app.get('/',function(req,res) {
    res.render("index")
    req.session.code = null
    req.session.u_email = null
})





//@2 : r/login
// wtbd: 1)better css
//       2) better security?
app.get("/login",async function(req,res){
    (dataB.validation(req.query.email, req.query.psswd)).then((user)=>{
        if(user){
            req.session.user = user
            // console.log(req.session.user.name)
            res.redirect("/home")
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.render('index')
        }
    })
})







// @11: r/logout 
app.post("/logout",function(req,res){
    console.log("no way dog")
    req.session.destroy()
    res.redirect("/")
})




// @3 : r/Singup 
// wtbd: 1)better css
//       2)implement calpoly only students.
app.get("/signUp",(req,res)=>{
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
    req.session.user.user = "admin"
    req.session.user.email = req.session.u_email
    req.session.user.password = "1234"
    req.session.user.friend_list = []
    for(req.session.lopV = 1; req.session.lopV<=5; req.session.lopV++){
        req.session.tempV = req.session.lopV.toString()
        req.session.user.pref_list[i-1] = req.query[x]
    }
    req.session.user.pref = req.session.user.pref_list[0]
    req.session.user.save((err,data)=>{
        if(err){
            console.log("Post gone worng")
            console.log(err)
        }
        else{
            res.redirect("/home")
        }
    })
    // clearing temps JIC
    req.session.lopV = 0
    req.session.tempV =0

})

//@Des: Verifies code 
app.get("/codeVerify", function(req,res){
    if(req.session.code == null){
        req.session.u_email = null
        res.render("error")
    }
    else{
        if (req.query.code == req.session.code){
            req.session.code = null
            if(!req.session.user.email)
                res.render("register")
            else{
                res.render('') //TBC
            }
        }
        else{
            req.session.u_email = null
            res.render("error")
        }
    }
})
//@Des: asks fro email and generates code
app.get("/eVerification",function(req,res){
    req.session.flag = true
    User.findOne({email:req.query.email}).then((obj)=>{
        if(!obj){
            (driver.codeGenerator(req.query.email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = req.query.email
                    res.render("codeEntry")
                }
                else{   
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
            })
        }
        else{
            res.redirect('/')
        }
    })  
})
// des: verified page
app.get("/verification",(req,res)=>{
    res.render('verification',{club:false})
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////











//TWO 
//$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
//Main Body routes


//@4 : r/home 
//wtbd: 1)better css
//      2)better post algo 
app.get('/home',function(req,res) {
    Post.find({}).sort({ _id: -1 }).exec(function(err, docs) { if(err){
        console.log("error in post loading :/home")
    }
    else{
        res.render("home",{files:docs})
    } });
})


//@5 : r/profile
//wtbd: 1)better css
//      2)nav bar bug
app.get('/profile',function(req,res) {
    res.render('profile', {target:req.session.user})
})



// @6 : r/findpoeple
// wtbd: 1)filter? 
app.get("/findPeople", function(req,res){   
        (dataB.findPeople(req.session.user).then((doc)=>{
            req.session.query = []
            for(req.session.lopV= 0; req.session.lopV<(Object.keys(doc).length); req.session.lopV++){
                req.session.tempV= doc[req.session.lopV]
                req.session.query[req.session.lopV] = req.session.tempV
            }
            res.render('findPeople',{u_name: req.session.name, q: req.session.query})
        }))
            // clearing temps JIC
        req.session.lopV = 0
        req.session.tempV =0
})



// @7 : r/post
//wtbd : 1) better css
//       2) previewing post
app.post("/post", upload.single('file'), (req, res) => {
    if(req.session.user){
        if(req.session.user.user == "admin"){
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

app.get("/upload", (req,res)=>{
    res.render("upload")
})
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////










// THREE
// $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$
// Change Profile Image



// @8 : r/ProfilePic
// wtbd : 1)better css
        // 2)preview pic
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
    // console.log(req.file);
    
    User.findOne({email: req.session.user.email}, function(err,obj) { 
                    req.session.tempV = obj  
                    // console.log(obj.name);  
                    req.session.tempV.ppic = req.file.filename;
                    req.session.user.ppic = req.session.tempV.ppic;
                    req.session.tempV.save();s
                    res.redirect("/profile")
            }); 
           
})

// @9 : r/Delete_Profile_Pic
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



// @10 : r/Load_Profile_Pic
// gets profile pic from the dbw
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



// ##################################################################################################################
// Creat Club Profile

app.get('/club/profile', function(req,res) {
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
})
//@Des: asks fro email and generates code
app.get("/club/verification",function(req,res){
    req.session.flag = false
    Club.findOne({email:req.query.email}).then((obj)=>{
        if(!obj){
            (driver.codeGenerator(req.query.email)).then((cod)=>{
                if (cod){
                    req.session.code = cod
                    req.session.u_email = req.session.email
                    res.render("codeEntry")
                }
                else{   
                    res.render("error")
                }
            }).catch((err)=>{
                console.log(err)
            })
        }
        else{
            res.redirect('/')
        }
    })  
})
app.get("/club",function(req,res){
    res.render('verification',{club:true})
})





/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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



app.post('/addFriend', (req,res) => {
    //check for duplicates 

    for (req.session.lopV = 0; req.session.lopV < req.session.user.friend_list.length; req.session.lopV++){
        if (req.session.user.friend_list[i] === (query[req.body.name].name)){
            req.session.flag = true;
        }
    }
    
    if (req.session.flag != true){
        //req.session.userfriend_list.pop();
        //req.session.userfriend_list_emails.pop();

        req.session.user.friend_list.push(query[req.body.name].name);
        req.session.user.friend_list_emails.push(query[req.body.name].email);
        req.session.user.save();
    }
    req.session.lopV =0 
})
















// FUNCTIONS USED IN MAH CODE   
// ############################################################################################################

function insertFile(file, res, req) {
    // console.log("poop")
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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
      





// IMPORT REFERENCE CODE CAUSE ME DUMB
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




server.listen(5000,()=> console.log("Online at 5000"))