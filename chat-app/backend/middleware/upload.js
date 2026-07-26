const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/profiles");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const unique =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1e9);

        cb(
            null,
            unique + path.extname(file.originalname)
        );
    }
});

const fileFilter = (req, file, cb) => {

    const allowed = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    ];

    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only images are allowed."));
    }

};

module.exports = multer({
    storage,
    fileFilter
});