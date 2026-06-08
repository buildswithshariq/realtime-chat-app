const User = require("../models/User");
const bcrypt= require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken= (id)=>{
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn: "30d",
    });
};

const registerUser = async (req , res )=>{
    try{
        const {username, name, password, confirmPassword}= req.body;

        if(!username || !name || !password || !confirmPassword){
            return res.status(400).json({
                message: "Please fill all fields",
            })
        }

        // No spaces in username
        if (/\s/.test(username)) {
            return res.status(400).json({
                message: "Username cannot contain spaces",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: "Passwords do not match",
            });
        }

        const userExist = await User.findOne({ username: username.toLowerCase() });

        if(userExist){
            return res.status(400).json({
                message: "Username already taken"
            });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword= await bcrypt.hash(password, salt);

        const user = await User.create({
            username: username.toLowerCase(),
            name,
            password: hashedPassword,
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            token: generateToken(user._id),
        });

    }  catch(error){
        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });
    }
    
};

const loginUser = async (req , res)=>{
    try{
        const{username, password}= req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: "Please fill all fields",
            });
        }

        const user = await User.findOne({ username: username.toLowerCase() });

        if(!user){
           return res.status(400).json({
                message: "User not found, please register"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
           return res.status(400).json({
                message: "Wrong password",
            });
        }

        res.status(200).json({
            _id: user._id,
            username: user.username,
            name: user.name,
            token: generateToken(user._id),
        });
    } catch(error){
        console.log(error);

       return res.status(500).json({
            message: "Server Error",
        });
    }
}

module.exports= {registerUser,loginUser};