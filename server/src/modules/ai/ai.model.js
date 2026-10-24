import mongoose from 'mongoose';

const aiLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      required: true
    },
    kind: {
      type: String,
      enum: ['chat', 'summary', 'smart_leave'],
      required: true
    },
    prompt: {
      type: String,
      required: true
    },
    toolCalls: {
      type: Array,
      default: []
    },
    response: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    latencyMs: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['success', 'fallback', 'rate_limited', 'error'],
      default: 'success'
    },
    at: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  { versionKey: false }
);

export const AiLog = mongoose.model('AiLog', aiLogSchema);
