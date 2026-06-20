import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  parentFolder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure unique folder name per user within same parent folder
folderSchema.index({ name: 1, owner: 1, parentFolder: 1 }, { unique: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;
