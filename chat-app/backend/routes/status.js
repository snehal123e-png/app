const express = require("express");
const multer = require("multer");
const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();



const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        cb(null, "uploads/");

    },


    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() + "-" + file.originalname
        );

    }

});


const upload = multer({
    storage
});




// Create Status

router.post(
    "/create",
    authMiddleware,
    upload.single("image"),
    (req, res) => {


        const db = readDB();



        const status = {


            id: db.nextStatusId || 1,


            userId: req.user.id,


            text: req.body.text || "",


            image: req.file
                ?
                `/uploads/${req.file.filename}`
                :
                null,


            createdAt: new Date().toISOString(),


            expiresAt:
                new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                )
                    .toISOString(),


            seenBy: []


        };



        if (!db.statuses)
            db.statuses = [];



        db.statuses.push(status);


        db.nextStatusId =
            status.id + 1;



        writeDB(db);



        res.json(status);



    });





// Get Status


router.get(
    "/",
    authMiddleware,
    (req, res) => {


        const db = readDB();


        const now =
            new Date();



        const statuses =
            db.statuses.filter(
                s =>
                    new Date(s.expiresAt) > now
            );



        res.json(statuses);



    });





// Mark Seen


router.post(
    "/seen/:id",
    authMiddleware,
    (req, res) => {


        const db = readDB();


        const status =
            db.statuses.find(
                s => s.id === Number(req.params.id)
            );



        if (status &&
            !status.seenBy.includes(req.user.id)) {

            status.seenBy.push(
                req.user.id
            );

        }



        writeDB(db);



        res.json({
            success: true
        });


    });



module.exports = router;