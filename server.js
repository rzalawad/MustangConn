//library imports
const express = require('express')
const http = require('http')
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

//file imports
const dataB = require('.backendJS/database')
const driver = require(".backendJS/driver")
const Post = require('.backendJS/post_info')
const User = require('.backendJS/user')
const masterRoom = require('')

//instantiation
const app = express()
const server = http.createServer(app)

//mongo connection
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
mongoose.connect(url)
var conn = mongoose.connection;
var db = mongoose.connection.db

const binary = mongodb.Binary
var code = null
var u_email = null
var c_user = null

const master_room = 



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
            res.end(data, {friends: c_user.friend_list})
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
        res.render("home",{files:docs})
    } });
})


app.get('/profile',function(req,res) {
    res.render('profile', {name: c_user.name, age: c_user.age, location: c_user.location, gender: c_user.gender, dorm: c_user.dorm, hobbies: c_user.hobby_list, friends: c_user.friend_list, ppic:c_user.ppic})
})

app.get('/index',function(req,res) {
    res.render("index")
})
 
app.get("/post/upload", (req,res)=>{
    res.render("upload")
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
//@Des: creats new user in dataB
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
    c_user.password = req.query.password
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







//#########################################################
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
        res.render("index")
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
app.post("/post", upload.single('file'), (req, res) => {
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
    

server.listen(process.env.PORT || 3000,()=> console.log("Online at 3000"))
