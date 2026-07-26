const express = require("express");
const multer = require("multer");

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




// ==========================
// Image Upload
// ==========================

router.post(
    "/image",
    upload.single("image"),
    (req, res) => {


        if (!req.file) {

            return res.status(400).json({
                message: "No image uploaded"
            });

        }



        res.json({

            url: `/uploads/${req.file.filename}`

        });


    }
);






// ==========================
// Audio / Document / Video Upload
// ==========================

router.post(
    "/file",
    upload.single("file"),
    (req, res) => {


        if (!req.file) {

            return res.status(400).json({
                message: "No file uploaded"
            });

        }



        res.json({

            url: `/uploads/${req.file.filename}`,

            name: req.file.originalname,

            type: req.file.mimetype

        });


    }
);





module.exports = router;