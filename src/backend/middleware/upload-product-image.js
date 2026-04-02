const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDir = path.resolve(process.cwd(), "uploads", "products");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const uploadProductImage = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(_req, file, callback) {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      callback(new Error("Chỉ chấp nhận file ảnh."));
      return;
    }

    callback(null, true);
  }
});

function deduplicateByHash(req, _res, next) {
  const files = req.files || (req.file ? [req.file] : []);

  for (const file of files) {
    const hash = crypto.createHash("sha256").update(file.buffer).digest("hex").slice(0, 16);
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const filename = `${hash}${extension}`;
    const filepath = path.join(uploadDir, filename);

    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, file.buffer);
    }

    file.filename = filename;
    file.path = filepath;
    file.destination = uploadDir;
  }

  next();
}

module.exports = { uploadProductImage, deduplicateByHash };
