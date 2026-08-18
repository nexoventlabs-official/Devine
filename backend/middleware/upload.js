import multer from 'multer';

// In-memory uploads (streamed straight to Cloudinary).
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 60 * 1024 * 1024 }, // 60MB (covers short product videos)
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|svg\+xml)|application\/pdf|video\/(mp4|quicktime|webm|3gpp|x-matroska)/.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});

export default upload;
