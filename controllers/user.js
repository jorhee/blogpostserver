//user controllers
//[Dependencies and modules]
const bcrypt = require("bcrypt");
const User = require("../models/User");
const auth = require("../auth");

const {errorHandler} = require("../auth");




// User registration



module.exports.registerUser = async (req, res) => {
    try {
        const { email, password, userName } = req.body;

        // Validate email format
        if (!email || !email.includes("@")) {
            return res.status(400).send({ message: 'Invalid email format.' });
        }

        // Validate password length
        if (!password || password.length < 8) {
            return res.status(400).send({ message: 'Password must be at least 8 characters long.' });
        }

        // Validate userName presence
        if (!userName || userName.trim().length === 0) {
            return res.status(400).send({ message: 'User name is required.' });
        }

        // Check if the email already exists in the database
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).send({ message: 'Email already exists.' });
        }

        // Check if the userName already exists in the database
        const existingUserName = await User.findOne({ userName: userName.trim() });
        if (existingUserName) {
            return res.status(400).send({ message: 'User name already exists.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            email,
            userName: userName.trim(),
            password: hashedPassword, // Store hashed password
        });

        // Save the new user to the database
        await newUser.save();

        // Send a success message
        return res.status(201).send({ message: 'Registered successfully.' });
    } catch (error) {
        // Handle errors
        console.error('Error registering user:', error);
        return res.status(500).send({ message: 'Error registering user.', error: error.message });
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
        .select('-password') // Exclude the password field from the response
        .then(user => {
            if (!user) {
                // if the user is not found, send an 'invalid signature' message
                return res.status(403).send({ message: 'Invalid signature' });
            } else {
                // if the user is found, return the user object without the password
                return res.status(200).send({
                    user: user
                });
            }
        })
        .catch(error => errorHandler(error, req, res));
};


