const express = require("express");
const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// Star / Unstar message

router.post("/:messageId", authMiddleware, (req, res) => {


    const db = readDB();

    const messageId =
        Number(req.params.messageId);


    let message =
        db.privateMessages.find(
            m => m.id === messageId
        );



    if (!message) {

        return res.status(404).json({
            message: "Message not found"
        });

    }



    if (!message.starredBy) {

        message.starredBy = [];

    }



    const exists =
        message.starredBy.includes(
            req.user.id
        );



    if (exists) {


        message.starredBy =
            message.starredBy.filter(
                id => id !== req.user.id
            );


    }
    else {


        message.starredBy.push(
            req.user.id
        );


    }



    writeDB(db);



    res.json(message);



});


module.exports = router;