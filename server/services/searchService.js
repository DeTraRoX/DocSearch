import { esClient, esEnabled } from '../config/elasticsearch.js';
import Document from '../models/Document.js';
import Chunk from '../models/Chunk.js';

const DOC_INDEX = 'docsearch_documents';
const CHUNK_INDEX = 'docsearch_chunks';

/**
 * Creates indices in Elasticsearch if they do not exist
 */
export const createIndices = async () => {
  if (!esEnabled || !esClient) return;

  try {
    const docIndexExists = await esClient.indices.exists({ index: DOC_INDEX });
    if (!docIndexExists) {
      await esClient.indices.create({
        index: DOC_INDEX,
        body: {
          mappings: {
            properties: {
              title: { type: 'text', analyzer: 'standard' },
              owner: { type: 'keyword' },
              tags: { type: 'keyword' },
              fileType: { type: 'keyword' },
              createdAt: { type: 'date' }
            }
          }
        }
      });
      console.log(`Created Elasticsearch index: ${DOC_INDEX}`);
    }

    const chunkIndexExists = await esClient.indices.exists({ index: CHUNK_INDEX });
    if (!chunkIndexExists) {
      await esClient.indices.create({
        index: CHUNK_INDEX,
        body: {
          mappings: {
            properties: {
              documentId: { type: 'keyword' },
              owner: { type: 'keyword' },
              text: { type: 'text', analyzer: 'standard' },
              pageNumber: { type: 'integer' },
              chunkIndex: { type: 'integer' }
            }
          }
        }
      });
      console.log(`Created Elasticsearch index: ${CHUNK_INDEX}`);
    }
  } catch (error) {
    console.log('Error creating Elasticsearch indices:', error.message);
  }
};

// Initialize indices in background
createIndices().catch(err => console.log('Elasticsearch indices creation skipped:', err.message));

/**
 * Indexes a document and its chunks in Elasticsearch
 */
export const indexDocument = async (doc, chunks) => {
  if (!esEnabled || !esClient) return;

  try {
    // Index the parent document
    await esClient.index({
      index: DOC_INDEX,
      id: doc._id.toString(),
      body: {
        title: doc.title,
        owner: doc.owner.toString(),
        tags: doc.tags,
        fileType: doc.fileType,
        createdAt: doc.createdAt
      }
    });

    // Index all chunks using bulk API
    if (chunks && chunks.length > 0) {
      const operations = chunks.flatMap(chunk => [
        { index: { _index: CHUNK_INDEX, _id: chunk._id.toString() } },
        {
          documentId: doc._id.toString(),
          owner: doc.owner.toString(),
          text: chunk.text,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunk.chunkIndex
        }
      ]);

      await esClient.bulk({ refresh: true, body: operations });
    }
    console.log(`Indexed document ${doc._id} and ${chunks.length} chunks in Elasticsearch.`);
  } catch (error) {
    console.log('Error indexing document in Elasticsearch:', error.message);
  }
};

/**
 * Deletes a document and its chunks from Elasticsearch
 */
export const deleteDocumentIndex = async (docId) => {
  if (!esEnabled || !esClient) return;

  try {
    await esClient.delete({
      index: DOC_INDEX,
      id: docId.toString(),
      ignore_unavailable: true
    });

    await esClient.deleteByQuery({
      index: CHUNK_INDEX,
      refresh: true,
      body: {
        query: {
          term: { documentId: docId.toString() }
        }
      }
    });
    console.log(`Deleted Elasticsearch indices for document: ${docId}`);
  } catch (error) {
    console.log('Error deleting document from Elasticsearch:', error.message);
  }
};

/**
 * Searches documents and chunks using fuzzy search with highlights
 */
export const searchDocuments = async (userId, queryText) => {
  if (esEnabled && esClient) {
    try {
      // Search in Chunks with highlight
      const response = await esClient.search({
        index: CHUNK_INDEX,
        body: {
          query: {
            bool: {
              must: [
                { term: { owner: userId.toString() } },
                {
                  multi_match: {
                    query: queryText,
                    fields: ['text'],
                    fuzziness: 'AUTO'
                  }
                }
              ]
            }
          },
          highlight: {
            fields: {
              text: { fragment_size: 150, number_of_fragments: 2 }
            }
          }
        }
      });

      const hits = response.hits.hits;
      const results = [];

      for (const hit of hits) {
        const source = hit._source;
        const doc = await Document.findById(source.documentId);
        if (doc) {
          results.push({
            documentId: source.documentId,
            title: doc.title,
            fileType: doc.fileType,
            fileUrl: doc.fileUrl,
            tags: doc.tags,
            createdAt: doc.createdAt,
            pageNumber: source.pageNumber,
            score: hit._score,
            highlight: hit.highlight && hit.highlight.text ? hit.highlight.text.join(' ... ') : source.text.slice(0, 150) + '...'
          });
        }
      }
      return results;
    } catch (error) {
      console.log('Elasticsearch search error, falling back to MongoDB:', error.message);
    }
  }

  // MONGODB FALLBACK SEARCH
  try {
    const escapedQuery = escapeRegExp(queryText);
    const regex = new RegExp(escapedQuery, 'i');
    
    // Search chunks
    const matchingChunks = await Chunk.find({
      owner: userId,
      text: regex
    }).populate('documentId');

    const results = [];
    matchingChunks.forEach(chunk => {
      const doc = chunk.documentId;
      if (doc) {
        const text = chunk.text;
        const matchIndex = text.toLowerCase().indexOf(queryText.toLowerCase());
        let snippet = '';
        if (matchIndex !== -1) {
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(text.length, matchIndex + queryText.length + 80);
          snippet = text.slice(start, end);
          // Highlight with HTML marks
          const regexHighlight = new RegExp(`(${escapedQuery})`, 'gi');
          snippet = snippet.replace(regexHighlight, '<mark>$1</mark>');
          if (start > 0) snippet = '...' + snippet;
          if (end < text.length) snippet = snippet + '...';
        } else {
          snippet = text.slice(0, 150) + '...';
        }

        results.push({
          documentId: doc._id,
          title: doc.title,
          fileType: doc.fileType,
          fileUrl: doc.fileUrl,
          tags: doc.tags,
          createdAt: doc.createdAt,
          pageNumber: chunk.pageNumber,
          score: 1.0,
          highlight: snippet
        });
      }
    });

    // Also search document titles if not already captured
    const matchingDocs = await Document.find({
      owner: userId,
      $or: [{ title: regex }, { tags: regex }]
    });

    matchingDocs.forEach(doc => {
      const exists = results.some(r => r.documentId.toString() === doc._id.toString());
      if (!exists) {
        results.push({
          documentId: doc._id,
          title: doc.title,
          fileType: doc.fileType,
          fileUrl: doc.fileUrl,
          tags: doc.tags,
          createdAt: doc.createdAt,
          pageNumber: 1,
          score: 1.5, // Title match gets higher score
          highlight: doc.summary ? doc.summary.slice(0, 150) + '...' : 'Title match. View document to read content.'
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.log('MongoDB search fallback error:', error.message);
    return [];
  }
};

/**
 * Gets autocomplete suggestions matching document titles
 */
export const getAutocompleteSuggestions = async (userId, queryText) => {
  if (esEnabled && esClient) {
    try {
      const response = await esClient.search({
        index: DOC_INDEX,
        body: {
          query: {
            bool: {
              must: [
                { term: { owner: userId.toString() } },
                {
                  match_phrase_prefix: {
                    title: queryText
                  }
                }
              ]
            }
          },
          _source: ['title']
        }
      });
      // De-duplicate
      const titles = response.hits.hits.map(hit => hit._source.title);
      return [...new Set(titles)].slice(0, 8);
    } catch (error) {
      console.log('Elasticsearch autocomplete error, falling back to MongoDB:', error.message);
    }
  }

  // MongoDB Fallback
  try {
    const regex = new RegExp('^' + escapeRegExp(queryText), 'i');
    const docs = await Document.find({ owner: userId, title: regex }).limit(8);
    return docs.map(d => d.title);
  } catch (error) {
    console.log('MongoDB autocomplete suggestions fallback error:', error.message);
    return [];
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
