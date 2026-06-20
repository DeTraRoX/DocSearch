import SearchHistory from '../models/SearchHistory.js';
import * as searchService from '../services/searchService.js';

// @desc    Perform search on documents/content
// @route   GET /api/search
// @access  Private
export const searchDocs = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Search query is required' });
  }

  try {
    const results = await searchService.searchDocuments(req.user._id, q);

    // Save query to search history
    await SearchHistory.create({
      userId: req.user._id,
      query: q,
      resultsCount: results.length,
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get autocomplete search suggestions
// @route   GET /api/search/suggestions
// @access  Private
export const getSuggestions = async (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.json([]);
  }

  try {
    const suggestions = await searchService.getAutocompleteSuggestions(req.user._id, q);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user search history
// @route   GET /api/search/history
// @access  Private
export const getSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ userId: req.user._id })
      .sort({ searchedAt: -1 })
      .limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear search history
// @route   DELETE /api/search/history
// @access  Private
export const clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ userId: req.user._id });
    res.json({ message: 'Search history cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
