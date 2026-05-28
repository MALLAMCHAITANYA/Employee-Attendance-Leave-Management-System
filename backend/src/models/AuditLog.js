import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Can be null if system-generated or unauthenticated
    },
    action: {
      type: String,
      required: true
    },
    details: {
      type: String,
      required: true
    },
    ipAddress: {
      type: String
    }
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
