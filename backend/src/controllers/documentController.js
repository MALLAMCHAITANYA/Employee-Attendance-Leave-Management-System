import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOAD_DIR = './uploads/documents';

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${basename}-${Date.now()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|doc|txt|jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDFs, Word docs, images, and text files are allowed'));
    }
  }
});

export const getDocuments = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    
    // Admins see all documents, others see only where their role is listed in roleVisibility
    const filter = {};
    if (userRole !== 'admin') {
      filter.roleVisibility = userRole;
    }

    const list = await Document.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.json(list);
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const { title, category, roleVisibility } = req.body;
    if (!title || !category) {
      // Remove file if validation failed
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Title and category are required' });
    }

    let roles = ['employee', 'manager', 'admin'];
    if (roleVisibility) {
      try {
        roles = typeof roleVisibility === 'string' ? JSON.parse(roleVisibility) : roleVisibility;
      } catch (err) {
        roles = roleVisibility.split(',');
      }
    }

    const doc = await Document.create({
      title,
      category,
      filePath: `/uploads/documents/${req.file.filename}`,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      roleVisibility: roles
    });

    await AuditLog.create({
      user: req.user._id,
      action: 'DOCUMENT_UPLOAD',
      details: `Uploaded document: "${title}" (${req.file.originalname})`,
      ipAddress: req.ip
    });

    res.status(201).json(doc);
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Attempt to delete physical file
    const physicalPath = path.join('.', doc.filePath);
    if (fs.existsSync(physicalPath)) {
      try {
        fs.unlinkSync(physicalPath);
      } catch (err) {
        console.error('Failed to delete physical file:', err);
      }
    }

    await doc.deleteOne();

    await AuditLog.create({
      user: req.user._id,
      action: 'DOCUMENT_DELETE',
      details: `Deleted document: "${doc.title}"`,
      ipAddress: req.ip
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
  }
};
