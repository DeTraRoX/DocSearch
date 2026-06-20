import User from '../models/User.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';
import SearchHistory from '../models/SearchHistory.js';
import * as storageService from '../services/storageService.js';
import * as searchService from '../services/searchService.js';
import path from 'path';

// @desc    Get aggregate system statistics
// @route   GET /api/admin/analytics
// @access  Private/Admin
export const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalDocs = await Document.countDocuments({});
    
    // Aggregates for storage size
    const storageStats = await Document.aggregate([
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
        },
      },
    ]);
    const totalStorageUsed = storageStats.length > 0 ? storageStats[0].totalSize : 0;

    // File type breakdown
    const fileTypeStats = await Document.aggregate([
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          size: { $sum: '$fileSize' }
        }
      }
    ]);

    const fileTypeBreakdown = fileTypeStats.map(stat => ({
      type: stat._id,
      count: stat.count,
      size: stat.size
    }));

    // Recent activity logs
    const recentQueries = await SearchHistory.find({})
      .populate('userId', 'name email')
      .sort({ searchedAt: -1 })
      .limit(10);

    // Recent documents uploaded
    const recentUploads = await Document.find({})
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalDocs,
      totalStorageUsed,
      fileTypeBreakdown,
      recentQueries,
      recentUploads
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot revoke your own admin rights' });
    }

    user.role = req.body.role || 'user';
    await user.save();

    res.json({ message: `User role updated to ${user.role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user and all their files
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }

    // Find and delete all user documents
    const documents = await Document.find({ owner: user._id });
    for (const doc of documents) {
      await storageService.deleteFile(doc.storageKey);
      await Chunk.deleteMany({ documentId: doc._id });
      await searchService.deleteDocumentIndex(doc._id);
      await doc.deleteOne();
    }

    // Delete user searches
    await SearchHistory.deleteMany({ userId: user._id });

    // Delete user
    await user.deleteOne();

    res.json({ message: 'User and all associated documents deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all documents across all users
// @route   GET /api/admin/documents
// @access  Private/Admin
export const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find({})
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
