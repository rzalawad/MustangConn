const express = require('express')
const session = require('express-session');
const http = require('http')
const fs = require('fs')
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream')
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const socketio = require("socket.io")
const MongoStore = require('connect-mongo')(session);
const uuid = require('uuid/v4')
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;


//file imports
const dataB = require('./database')
const driver = require("./driver")
const chatFormat = require('./chatFormat')

//instantiation
const app = express()
const server = http.createServer(app)
const io = socketio(server)

//mongo connection
const url = "mongodb+srv://jay:jay123@MC-Profiles.syvtn.mongodb.net/Mustang_Connect?retryWrites=true&w=majority"
mongoose.connect(url)
var conn = mongoose.connection;
var db = mongoose.connection.db

//app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//session
app.use(session({
    secret: "deep dark secret: I like C++ more than python",
    store: new MongoStore({ mongooseConnection: conn, collection: "sessions" }),
    resave: false,
    genid: (req) => {
        return uuid()
    },
    cookie: {
        maxAge: 1000 * 60 * 60 * 24
    }
}))



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
    console.log(req.session)
    console.log(req.user)
    next()
})



const binary = mongodb.Binary
var code = null

const Post = require('./post_info')
const chatRoom = require("./chatRoom")
const User = require('./user');
const formatMessage = require('./chatFormat');

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
app.use(methodOverride('_method'));
// Parse URL-encoded bodies (as sent by HTML forms)
//app.use(express.urlencoded());
//app.use(bodyParser.json());
// Parse JSON bodies (as sent by API clients)
//app.use(express.json());








//routes
app.get('/',function(req,res) {
    res.render("index")
})

app.get("/chat-choose", (req, res) => {
    console.log(c_user)
    
    //in the list to send, I am sending both name and usernames because names could be duplicates but usernames are unique (as they are calpoly usernames)
    var profile;
    // testing
    if (c_user.friend_list.length == 0)
    {
        dataB.get_profile_for_email("Earle Young@calpoly.edu").then((friend_profile) => profile = friend_profile)
        
        console.log("searched profile = ", profile)
        c_user.friend_list.push(
            [profile._id, profile.username]
        );
    }
    var list_to_send = []
    c_user.friend_list.forEach(id => {
        dataB.get_profile_with_id(id).then(profiles => {
            profile = profiles
        }).catch(err => console.log("Email search error occured"))
        list_to_send.push([profile.name, profile.username])
    });
    res.render("chat-choose", {friends: list_to_send})


    //code that is secure below. Implement this

    /*if (c_user != null)
    {
        res.render('chat-choose', {friends: c_user.friend_list})
    }
    else
    {
        res.render("home");
    }*/
})

app.get('/chat',function(req,res) {

    if (c_user == null)
    {
        res.send('signUp');
    }
    else
    {
        var friend_name = req.query.friend_name;
        var friend_profile = dataB.get_profile_for_username(friend_name);
        console.log(friend_profile)
        
        var room = dataB.chat_room_query(c_user, friend_name)
        if (room == null)
        {
            username1 = friend_profile.username
            username2 = c_user.username
            if (username1.localCompare(username2) > 0)
            {
                [username1, username2] = [username2, username1]
            }
            var newMsgHistory = chatRoom.messageHistoryInit().save().then(() => console.log("message history created"))
            const newRoom = new chatRoom.chatRoomInit({
                user1: username1,
                user2: username2,
                roomNum: Math.random()*10000,
                messageHistory: newMsgHistory
            })

            newRoom.save().then(() => console.log("Chat room " + newRoom._id.toString() + " created"));

            var roomID = newRoom_id.toString()

            io.on('connection', socket => {

                socket.emit("roomID", roomID)

                socket.join(roomID);
                socket.broadcast.to(roomID).emit('message', chatFormat(c_user.name, `${c_user.name} has joined the chat`))

                
                socket.on('chatMessage', msg => {
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
                })

                socket.on('disconnect', () => {
                    io.to(roomID).emit('message', formatMessage(c_user.name, `${c_user.name} has left the chat`));
                })

            });


            
        }
        else
        {

            username1 = friend_profile.username
            username2 = c_user.username
            
            if (username1.localCompare(username2) > 0)
            {
                [username1, username2] = [username2, username1]
            }

            if (username1 == friend_profile.username)
            {
                var name1 = friend_name.name
                var name2 = c_user.name
            }
            else
            {
                var name1 = c_user.name
                var name2 = friend_profile.name
            }

            io.on('connection', socket => {
                
                roomID = room._id.toString();

                socket.join(roomID)
                var pointer1 = 0, pointer2 = 0
                room.messageHistory.sequence.forEach(turn => {
                    if (turn == 1)
                    {
                        io.to(roomID).emit('message', formatMessage(name1, room.messageHistory.messageUser1[pointer1][0], room.messageHistory.messageUser1[pointer1][1]));
                        pointer1 += 1
                    }
                    else
                    {
                        io.to(roomID).emit('message', formatMessage(name2, room.messageHistory.messageUser2[pointer2][0], room.messageHistory.messageUser2[pointer2][1]));
                        pointer2 += 1
                    }
                     
                });


                socket.on('chatMessage', msg => {
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
                })

                socket.on('disconnect', () => {
                    io.to(roomID).emit('message', formatMessage(c_user.name, `${c_user.name} has left the chat`));
                })

                
            })
            
        }


        /* Dont know what this is for
        fs.readFile('./views/chat.html',(err,data)=> {
            if(err){
                console.log(err)
            }
            else{
                if (c_user.friend_list == null)
                {
                    c_user.friend_list.push("Ridham")
                }
                res.end(data, {friends: c_user.friend_list});
            }
        })
        */
    }
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
                            
app.post("/login", passport.authenticate('local', {failureRedirect: '/err', successRedirect: "/home"}))/*, async function(req,res){
    (dataB.validation(req.body.email, req.body.psswd)).then((user)=>{
        if(user){
            console.log(req.query.email)
            c_user = user
            console.log(c_user)
            res.redirect("/home")
        }
    }).catch((flag)=>{
        if(flag == false)
        {
            res.render('index')
        }
    })
})*/



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
    console.log(req.query.major)
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
    c.username = c_user.email.substring(0, c_user.email.indexOf("@"))
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
