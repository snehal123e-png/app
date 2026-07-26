const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/auth");
const { readDB, writeDB } = require("../db");

// Upload profile photo
router.post(
    "/photo",
    authMiddleware,
    upload.single("photo"),
    (req, res) => {
        try {
            const db = readDB();

            const user = db.users.find(
                (u) => u.id === req.user.id
            );

            if (!user) {
                return res.status(404).json({
                    message: "User not found"
                });
            }

            user.photo = `/uploads/profiles/${req.file.filename}`;

            writeDB(db);

            res.json({
                message: "Profile photo updated",
                photo: user.photo
            });

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    }
);

module.exports = router;