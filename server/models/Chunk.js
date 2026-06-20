import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    default: 1,
  },
  chunkIndex: {
    type: Number,
    required: true,
  },
});

// Index text and documentId for local RAG matching fallback
chunkSchema.index({ text: 'text' });
chunkSchema.index({ documentId: 1 });

const Chunk = mongoose.model('Chunk', chunkSchema);
export default Chunk;
