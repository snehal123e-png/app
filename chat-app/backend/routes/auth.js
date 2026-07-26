// routes/auth.js

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readDB, writeDB } = require("../db");

const router = express.Router();



/* ==========================
   REGISTER
========================== */

router.post("/register", async (req, res) => {

  console.log("========== REGISTER REQUEST ==========");
  console.log("Body:", req.body);


  try {

    const {
      username,
      email,
      password
    } = req.body;



    if (!username || !email || !password) {

      return res.status(400).json({

        message: "All fields are required."

      });

    }



    const db = readDB();



    console.log("Current Users:", db.users);



    const existingUser = db.users.find(

      (u) =>
        u.email === email ||
        u.username === username

    );



    if (existingUser) {

      return res.status(400).json({

        message: "Username or email already in use."

      });

    }



    const hashedPassword =
      await bcrypt.hash(password, 10);




    const newUser = {


      id: db.nextUserId,


      username,


      email,


      password: hashedPassword,



      photo: "",



      about:
        "Hey there! I am using Chat App.",



      online: false,



      lastSeen:
        new Date().toISOString(),



      // 📌 Permanent pinned chats
      pinnedChats: [],



      createdAt:
        new Date().toISOString()


    };




    db.users.push(newUser);



    db.nextUserId++;



    writeDB(db);



    console.log("User Saved Successfully");





    const token = jwt.sign(

      {

        id: newUser.id,

        username: newUser.username

      },


      process.env.JWT_SECRET,


      {

        expiresIn: "7d"

      }


    );





    res.status(201).json({


      message:
        "User registered successfully.",



      token,



      user: {


        id: newUser.id,


        username: newUser.username,


        email: newUser.email,


        photo: newUser.photo,


        about: newUser.about,


        pinnedChats: newUser.pinnedChats


      }


    });




  } catch (err) {


    console.error("REGISTER ERROR");

    console.error(err);



    res.status(500).json({

      message: err.message

    });


  }


});






/* ==========================
   LOGIN
========================== */


router.post("/login", async (req, res) => {


  console.log("========== LOGIN REQUEST ==========");

  console.log(req.body);



  try {



    const {
      email,
      password
    } = req.body;





    const db = readDB();




    const user = db.users.find(

      (u) => u.email === email

    );





    if (!user) {


      return res.status(400).json({

        message:
          "Invalid email or password."

      });


    }






    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );





    if (!isMatch) {


      return res.status(400).json({

        message:
          "Invalid email or password."

      });


    }





    // For old users
    // who don't have pinnedChats

    if (!user.pinnedChats) {

      user.pinnedChats = [];

      writeDB(db);

    }






    const token = jwt.sign(


      {

        id: user.id,

        username: user.username


      },


      process.env.JWT_SECRET,


      {


        expiresIn: "7d"


      }


    );







    res.json({


      message:
        "Login successful.",



      token,



      user: {


        id: user.id,


        username: user.username,


        email: user.email,


        photo: user.photo,


        about: user.about,


        pinnedChats: user.pinnedChats


      }


    });





  } catch (err) {


    console.error(err);



    res.status(500).json({

      message: err.message

    });


  }


});






module.exports = router;