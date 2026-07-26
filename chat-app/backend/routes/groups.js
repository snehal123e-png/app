const express = require("express");
const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// Create Group

router.post(
    "/create",
    authMiddleware,
    (req, res) => {


        const db = readDB();


        const group = {

            id:
                db.nextGroupId || 1,


            name: req.body.name,


            adminId: req.user.id,


            members: [
                req.user.id
            ],


            photo: null,


            createdAt:
                new Date().toISOString()

        };



        if (!db.groups)
            db.groups = [];


        db.groups.push(group);


        db.nextGroupId =
            group.id + 1;


        writeDB(db);



        res.json(group);


    });





// Get my groups

router.get(
    "/",
    authMiddleware,
    (req, res) => {


        const db = readDB();



        const groups =
            db.groups.filter(
                g =>
                    g.members.includes(req.user.id)
            );



        res.json(groups);


    });





// Add member

router.post(
    "/:id/add",
    authMiddleware,
    (req, res) => {


        const db = readDB();


        const group =
            db.groups.find(
                g => g.id === Number(req.params.id)
            );



        if (!group)
            return res.status(404).json({
                message: "Group not found"
            });



        if (group.adminId !== req.user.id)
            return res.status(403).json({
                message: "Only admin can add members"
            });



        const userId =
            Number(req.body.userId);



        if (!group.members.includes(userId)) {
            group.members.push(userId);
        }



        writeDB(db);



        res.json(group);


    });






// Remove member

router.post(
    "/:id/remove",
    authMiddleware,
    (req, res) => {


        const db = readDB();



        const group =
            db.groups.find(
                g => g.id === Number(req.params.id)
            );



        if (group.adminId !== req.user.id)
            return res.status(403).json({
                message: "Only admin"
            });



        group.members =
            group.members.filter(
                id => id !== Number(req.body.userId)
            );



        writeDB(db);



        res.json(group);


    });
// Update Group Info

router.put(
    "/:id",
    authMiddleware,
    (req, res) => {


        const db = readDB();


        const group =
            db.groups.find(
                g => g.id === Number(req.params.id)
            );



        if (!group)
            return res.status(404).json({
                message: "Group not found"
            });



        if (group.adminId !== req.user.id)
            return res.status(403).json({
                message: "Only admin can edit"
            });



        group.name =
            req.body.name || group.name;


        group.description =
            req.body.description || group.description;



        writeDB(db);



        res.json(group);



    });
// Leave Group

router.post(
    "/:id/leave",
    authMiddleware,
    (req, res) => {


        const db = readDB();



        const group =
            db.groups.find(
                g => g.id === Number(req.params.id)
            );



        if (!group)
            return res.status(404).json({
                message: "Group not found"
            });



        group.members =
            group.members.filter(
                id => id !== req.user.id
            );



        writeDB(db);



        res.json({
            success: true
        });


    });
// Promote Admin

router.post(
    "/:id/admin",
    authMiddleware,
    (req, res) => {


        const db = readDB();



        const group =
            db.groups.find(
                g => g.id === Number(req.params.id)
            );



        if (group.adminId !== req.user.id)
            return res.status(403).json({
                message: "Only admin"
            });



        group.adminId =
            Number(req.body.userId);



        writeDB(db);



        res.json(group);


    });


module.exports = router;