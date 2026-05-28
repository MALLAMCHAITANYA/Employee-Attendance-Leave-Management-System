import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetDepartment: {
      type: String,
      default: 'All' // e.g. 'Engineering', 'HR', 'All'
    },
    targetBranch: {
      type: String,
      default: 'All' // e.g. 'HQ', 'Branch A', 'All'
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
