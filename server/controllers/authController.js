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
        const {name, email, password}= req.body;

        if(!name || !email || !password){
            return res.status(400).json({
                message: "Please Fill All Fields",
            })
        }
        const userExist = await User.findOne({email});

        if(userExist){
            return res.status(400).json({
                message: "User already Exist Please Login"
            });
        }
        
        const salt = await bcrypt.genSalt(10);

        const hashedPassword= await bcrypt.hash(password, salt);

        const user = await User.create({
            name ,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id),
        });

    }  catch(error){
        console.log(error);

        res.status(500).json({

            messgae: "Server Error",
        });
    }
    
};

const loginUser = async (req , res)=>{
    try{
        const{email,password}= req.body;

        const user = await User.findOne({email});

        if(!user){
           return res.status(400).json({
                message: "User not Found Please Register"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch){
           return res.status(400).json({
                message: "Wrong Password",
            });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
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