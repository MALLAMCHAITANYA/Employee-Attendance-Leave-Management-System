import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Policy', 'Handbook', 'Template', 'Other'],
      default: 'Policy'
    },
    filePath: { type: String, required: true },
    fileName: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roleVisibility: {
      type: [String],
      default: ['employee', 'manager', 'admin'] // Which roles can access this doc
    }
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
