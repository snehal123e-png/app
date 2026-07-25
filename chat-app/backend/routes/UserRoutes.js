const express = require("express");
const { readDB } = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
    try {
        const db = readDB();
        const users = db.users.map((u) => ({
            id: u.id,
            username: u.username,
            email: u.email
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;