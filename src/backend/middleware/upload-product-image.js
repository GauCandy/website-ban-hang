const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.resolve(process.cwd(), "uploads", "products");

fs.mkdirSync(uploadDir, { recursive: true });

function sanitizeBaseName(filename) {
  return String(filename || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "cover";
}

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, uploadDir);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const baseName = sanitizeBaseName(path.basename(file.originalname || "cover", extension));
    callback(null, `${Date.now()}-${baseName}${extension}`);
  }
});

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

module.exports = uploadProductImage;
