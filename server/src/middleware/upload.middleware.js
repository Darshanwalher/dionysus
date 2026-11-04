const path = require('path');
const multer = require('multer');

const storage = multer.memoryStorage();

const allowedExtensions = ['.mp3', '.wav', '.ogg', '.webm', '.m4a', '.mp4', '.aac', '.flac'];
const allowedMimeTypes = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'application/ogg',
  'audio/webm',
  'video/webm',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'audio/aac',
  'audio/flac',
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/');
  const isExtAllowed = allowedExtensions.includes(ext);

  if (isMimeAllowed || isExtAllowed) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${file.mimetype}. Accepted formats: MP3, WAV, OGG, M4A, MP4, WebM`
      ),
      false
    );
  }
};

const uploadAudio = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max
  },
}).single('audio');

module.exports = { uploadAudio };

