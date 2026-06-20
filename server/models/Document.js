import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  storageKey: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'docx', 'txt', 'image'],
  },
  fileSize: {
    type: Number,
    required: true,
  },
  extractedText: {
    type: String,
    default: '',
  },
  summary: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isFavorite: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for MongoDB full-text search fallback
documentSchema.index({ title: 'text', extractedText: 'text', tags: 'text' });

const Document = mongoose.model('Document', documentSchema);
export default Document;
