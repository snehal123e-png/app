const express = require("express");
const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ==========================
// Pin / Unpin Chat
// ==========================

router.post("/:userId", authMiddleware, (req, res) => {

    const db = readDB();


    const user = db.users.find(
        u => u.id === req.user.id
    );


    if (!user) {

        return res.status(404).json({
            message: "User not found"
        });

    }



    // Create pinnedChats if missing

    if (!user.pinnedChats) {

        user.pinnedChats = [];

    }



    const chatId = Number(req.params.userId);



    // Unpin

    if (user.pinnedChats.includes(chatId)) {


        user.pinnedChats =
            user.pinnedChats.filter(
                id => id !== chatId
            );


    }

    // Pin

    else {


        user.pinnedChats.push(chatId);


    }



    writeDB(db);



    res.json({

        pinnedChats: user.pinnedChats

    });


});




// ==========================
// Get Pinned Chats
// ==========================

router.get("/", authMiddleware, (req, res) => {


    const db = readDB();



    const user = db.users.find(
        u => u.id === req.user.id
    );



    if (!user) {

        return res.status(404).json({
            message: "User not found"
        });

    }



    res.json(
        user.pinnedChats || []
    );


});



module.exports = router;