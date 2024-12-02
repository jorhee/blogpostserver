//user controllers
//[Dependencies and modules]
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../auth");

const {errorHandler} = require("../auth");




// User registration



module.exports.registerUser = async (req, res) => {

    try {
        // Checks if the email is in the right format
        if (!req.body.email.includes("@")) {
            // if the email is not in the right format, send a message 'Invalid email format'.
            return res.status(400).send({ message: 'Invalid email format' });
        }

        // Checks if the password has atleast 8 characters
        if (req.body.password.length < 8) {
            // If the password is not atleast 8 characters, send a message 'Password must be atleast 8 characters long'.
            return res.status(400).send({ message: 'Password must be atleast 8 characters long' });
        }

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email: req.body.email });

        if (existingUser) {
            // If the email already exists, send a message 'Email already exists'
            return res.status(400).send({ message: 'Email already exists' });
        }

        // If the email does not exist, create a new user
        const hashedPassword = await bcrypt.hash(req.body.password, 10);  // Hash the password

        let newUser = new User({
            email: req.body.email,
            isAdmin: req.body.isAdmin,
            password: hashedPassword,
        });

        // Save the new user to the database
        await newUser.save();

        // Send a success message 'User registered successfully'
        return res.status(201).send({
            message: 'Registered successfully'
        });

    } catch (error) {
        // Handle any errors that occur during the process
        return errorHandler(error, req, res);
    }
};

//[SECTION] User authentication
module.exports.loginUser = (req, res) => {

    if(req.body.email.includes("@")){
        return User.findOne({ email : req.body.email })
        .then(result => {
            if(result == null){
                // if the email is not found, send a message 'No email found'.
                return res.status(404).send({ message: 'Email does not exist' });
            } else {
                const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
                if (isPasswordCorrect) {
                    // if all needed requirements are achieved, send a success message 'User logged in successfully' and return the access token.
                    return res.status(200).send({ 
                        access : auth.createAccessToken(result)
                        })
                } else {
                    // if the email and password is incorrect, send a message 'Incorrect email or password'.
                    return res.status(401).send({ message: 'Incorrect email or password' });
                }
            }
        })
        .catch(error => errorHandler(error, req, res));
    } else{
        // if the email used in not in the right format, send a message 'Invalid email format'.
        return res.status(400).send({ message: 'Invalid email format' });
    }
};




//[Retrieve User Details]

module.exports.getProfile = (req, res) => {
    return User.findById(req.user.id)
    .then(user => {

        if(!user){
            // if the user has invalid token, send a message 'invalid signature'.
            return res.status(403).send({ message: 'invalid signature' })
        }else {
            // if the user is found, return the user.
            user.password = "";
            return res.status(200).send({
                user: {
                    _id: user._id,
                    email: user.email,
                    isAdmin: user.isAdmin,
                    __v: user.__v // Include the __v field
                }
            });
        }  
    })
    .catch(error => errorHandler(error, req, res));
};


