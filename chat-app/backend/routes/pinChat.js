const express = require("express");
const { readDB, writeDB } = require("../db");
const authMiddleware = require("../middleware/auth");

const router = express.Router();


// ==========================
// GET PINNED CHATS
// ==========================

router.get(
    "/",
    authMiddleware,
    (req, res) => {

        try {

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


        } catch (error) {

            res.status(500).json({
                message: "Server error",
                error: error.message
            });

        }

    }
);





// ==========================
// PIN / UNPIN CHAT
// ==========================

router.post(
    "/:userId",
    authMiddleware,
    (req, res) => {


        try {


            const db = readDB();



            const user = db.users.find(
                u => u.id === req.user.id
            );



            if (!user) {

                return res.status(404).json({
                    message: "User not found"
                });

            }





            if (!user.pinnedChats) {

                user.pinnedChats = [];

            }



            const chatId =
                Number(req.params.userId);





            const alreadyPinned =
                user.pinnedChats.includes(chatId);




            if (alreadyPinned) {


                user.pinnedChats =
                    user.pinnedChats.filter(
                        id => id !== chatId
                    );


            }

            else {


                user.pinnedChats.push(chatId);


            }




            writeDB(db);




            res.json({

                success: true,

                pinnedChats: user.pinnedChats,

                pinned:
                    !alreadyPinned

            });



        }
        catch (error) {


            res.status(500).json({

                message: "Server error",

                error: error.message

            });


        }


    }
);



module.exports = router;
