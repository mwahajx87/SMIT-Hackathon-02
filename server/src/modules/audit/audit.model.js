import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    actorRole: {
      type: String,
      required: true,
      enum: ['admin', 'hr', 'employee']
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'approve', 'reject', 'finalize', 'cancel', 'deactivate', 'reset_password']
    },
    entity: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      required: true
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    ip: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'at', updatedAt: false },
    versionKey: false
  }
);

// Prevent updating or deleting audit logs directly
auditLogSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate', 'deleteOne', 'deleteMany', 'findOneAndDelete'], function() {
  throw new Error('Audit logs are append-only and cannot be modified or deleted.');
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
