import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    priority: {
      type: String,
      enum: ['normal', 'urgent'],
      default: 'normal'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Announcement = mongoose.model('Announcement', announcementSchema);

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['leave_decision', 'correction_decision', 'payslip_ready', 'announcement', 'general'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    link: {
      type: String,
      default: null
    },
    readAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
