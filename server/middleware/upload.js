const multer = require('multer');
const { AppError } = require('../utils/errors');

const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf', 'text/plain'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.toLowerCase().split('.').pop();
  const allowedExts = ['png', 'jpg', 'jpeg', 'pdf', 'txt', 'log'];
  
  if (allowedExts.includes(ext) || ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${ext} not allowed. Allowed: ${allowedExts.join(', ')}`, 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

module.exports = upload;
