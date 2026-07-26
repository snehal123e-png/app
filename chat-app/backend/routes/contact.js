const express = require("express");
const router = express.Router();

const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

/*
========================================
Send Contact Request
POST /api/contact/request
========================================
*/
router.post("/request", authMiddleware, (req, res) => {
    try {
        const db = readDB();

        const { toId } = req.body;

        if (!toId) {
            return res.status(400).json({
                message: "Receiver ID is required",
            });
        }

        if (req.user.id === Number(toId)) {
            return res.status(400).json({
                message: "You cannot send a request to yourself",
            });
        }

        // Check if already contacts
        const alreadyFriends = db.contacts.find(
            (c) =>
                (c.user1 === req.user.id && c.user2 === Number(toId)) ||
                (c.user1 === Number(toId) && c.user2 === req.user.id)
        );

        if (alreadyFriends) {
            return res.status(400).json({
                message: "Already connected",
            });
        }

        // Check duplicate pending request
        const pending = db.contactRequests.find(
            (r) =>
                r.fromId === req.user.id &&
                r.toId === Number(toId) &&
                r.status === "pending"
        );

        if (pending) {
            return res.status(400).json({
                message: "Request already sent",
            });
        }

        const request = {
            id: Date.now(),
            fromId: req.user.id,
            toId: Number(toId),
            status: "pending",
            createdAt: new Date().toISOString(),
        };

        db.contactRequests.push(request);

        writeDB(db);

        res.json({
            message: "Request sent successfully",
            request,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
});

/*
========================================
Incoming Requests
GET /api/contact/requests
========================================
*/
router.get("/requests", authMiddleware, (req, res) => {
    try {
        const db = readDB();

        const requests = db.contactRequests
            .filter(
                (r) =>
                    r.toId === req.user.id &&
                    r.status === "pending"
            )
            .map((r) => {
                const sender = db.users.find(
                    (u) => u.id === r.fromId
                );

                return {
                    ...r,
                    sender,
                };
            });

        res.json(requests);
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
});

/*
========================================
Accept Request
POST /api/contact/accept/:id
========================================
*/
router.post("/accept/:id", authMiddleware, (req, res) => {
    try {
        const db = readDB();

        const request = db.contactRequests.find(
            (r) => r.id == req.params.id
        );

        if (!request) {
            return res.status(404).json({
                message: "Request not found",
            });
        }

        request.status = "accepted";

        db.contacts.push({
            user1: request.fromId,
            user2: request.toId,
            createdAt: new Date().toISOString(),
        });

        writeDB(db);

        res.json({
            message: "Request accepted",
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
});

/*
========================================
Reject Request
POST /api/contact/reject/:id
========================================
*/
router.post("/reject/:id", authMiddleware, (req, res) => {
    try {
        const db = readDB();

        const request = db.contactRequests.find(
            (r) => r.id == req.params.id
        );

        if (!request) {
            return res.status(404).json({
                message: "Request not found",
            });
        }

        request.status = "rejected";

        writeDB(db);

        res.json({
            message: "Request rejected",
        });
    } catch (err) {
        res.status(500).json({
            message: err.message,
        });
    }
});

module.exports = router;