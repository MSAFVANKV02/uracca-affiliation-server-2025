// import multer from "multer";

// const storage = multer.memoryStorage();

// export const upload = multer({
//   storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024, // 5MB
//   },
// });
import multer from "multer";

/* ------------------------------------------------
   Storage (Memory)
------------------------------------------------ */
const storage = multer.memoryStorage();

/* ------------------------------------------------
   File Filter (type validation)
------------------------------------------------ */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Unsupported file type: ${file.mimetype}`
      )
    );
  }
};

/* ------------------------------------------------
   Multer Instance
------------------------------------------------ */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // ✅ 10MB
    files: 5,                  // max 5 files
  },
});
