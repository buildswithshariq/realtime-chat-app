const cloudinary = require("../config/cloudinary");

const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }

        const file = req.file;
        let resourceType = "auto";
        let folder = "chat-app";
        const maxSizes = {
            image: 20 * 1024 * 1024,
            video: 200 * 1024 * 1024,
            audio: 20 * 1024 * 1024,
        };

        // Determine type and validate size
        let fileType;
        if (file.mimetype.startsWith("image/")) {
            fileType = "image";
            resourceType = "image";
        } else if (file.mimetype.startsWith("video/")) {
            fileType = "video";
            resourceType = "video";
        } else if (file.mimetype.startsWith("audio/")) {
            fileType = "audio";
            resourceType = "video"; // Cloudinary treats audio as video resource
        }

        if (file.size > maxSizes[fileType]) {
            return res.status(400).json({
                message: `File too large. Max ${maxSizes[fileType] / (1024 * 1024)}MB for ${fileType}`,
            });
        }

        // Upload to Cloudinary via stream
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: resourceType,
                    folder,
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(file.buffer);
        });

        res.status(200).json({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: fileType,
            duration: result.duration || null,
        });
    } catch (error) {
        console.log("Upload error:", error);
        res.status(500).json({ message: "Upload failed" });
    }
};

module.exports = { uploadFile };
