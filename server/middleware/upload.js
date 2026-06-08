const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedImage = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedVideo = ["video/mp4", "video/webm", "video/quicktime"];
    const allowedAudio = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"];

    if ([...allowedImage, ...allowedVideo, ...allowedAudio].includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("File type not supported"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200MB max (video)
    },
});

module.exports = upload;
