import multer from 'multer';

// In-memory uploads (streamed straight to Cloudinary).
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB (covers PDFs)
  fileFilter: (req, file, cb) => {
    const ok = /image\/(png|jpe?g|webp|svg\+xml)|application\/pdf/.test(file.mimetype);
    cb(ok ? null : new Error('Unsupported file type'), ok);
  }
});

export default upload;
