const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check file type
function checkFileType(file, cb) {
    console.log(`[MULTER DEBUG] Filtering file: ${file.originalname} (${file.mimetype})`);
    const filetypes = /jpeg|jpg|png|gif/;
    
    // Check extension (if exists)
    const extname = file.originalname.includes('.') 
        ? filetypes.test(path.extname(file.originalname).toLowerCase())
        : true; // Allow blobs without extensions if mimetype is valid
        
    // Check mimetype
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        console.error(`[MULTER ERROR] Invalid file type detected. Ext: ${extname}, Mime: ${mimetype}`);
        cb(new Error('Images Only! Only JPEG, JPG, PNG, and GIF are allowed.'));
    }
}

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
