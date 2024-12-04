//[Dependencies and Modules]
const express = require("express");
const mongoose = require("mongoose");
//allows our backend app to be available to our frontend app
//allows to control the app's CORS settings
const cors = require("cors");
const path = require('path');




//Routes Middleware
const blogRoutes = require("./routes/blog");
const userRoutes = require("./routes/user");


//[Environment Setup]
//loads variables from env files
require('dotenv').config();


//[Server Setup]
// Creates an "app" variable that stores the result of the "express" function that initializes our express application and allows us access to different methods that will make backend creation easy
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended:true}));   

//will allow s to customize CORS options to meet our specific requirements
/*const corsOptions = {
    origin: [`http://localhost:3000`], //allows request from this origin (client's URL)
    //methods: ['GET','POST'],
    credentials: true, //allow credentials (e.g. authorization headers)
    optionsSuccessStatus:200 //provides status code to use for successful OPTIONS requests
};
app.use(cors(corsOptions));
*/
//app.use(cors());

// Allow only requests from your React app (localhost:3000)
app.use(cors({
  origin: "http://localhost:3000",  // Update with your frontend's URL
  methods: ["GET", "POST", "PUT", "DELETE"], // Allow only the methods you need
  allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers if necessary
}));


//[Database Connection]
//Connect to our MongoDB
mongoose.connect("mongodb+srv://admin:admin123@wdc028-b461.ik3ub.mongodb.net/blogApp?retryWrites=true&w=majority&appName=WDC028-B461");
//prompts a message once the connection is 'open' and we are connected successfully to the db
mongoose.connection.once('open',()=>console.log("Now connected to MongoDB Atlas"));




//[Backend Routes]
//http://localhost:4000/

app.use("/blogs", blogRoutes);
app.use("/users", userRoutes);


// Serve static files from 'uploads' folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = 4000

//[Server Gateway Response]
if(require.main === module){
	app.listen( PORT || 4000, () => {
	    console.log(`API is now online on port ${ PORT || 4000 }`)
	});
}

module.exports = { app, mongoose };