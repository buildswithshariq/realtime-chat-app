const User = require("../models/User");
const bcrypt= require("bcryptjs");

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
            message: "User created successfully",
            user,
        });

    }  catch(error){
        console.log(error);

        res.status(500).json({

            messgae: "Server Error",
        });
    }
    
};

module.exports= {registerUser,};