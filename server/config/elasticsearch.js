import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

dotenv.config();

let esClient = null;
let esEnabled = false;

const initElasticsearch = async () => {
  if (process.env.ELASTICSEARCH_ENABLED === 'true' && process.env.ELASTICSEARCH_URL) {
    try {
      esClient = new Client({
        node: process.env.ELASTICSEARCH_URL,
        maxRetries: 2,
        requestTimeout: 3000
      });
      await esClient.ping();
      esEnabled = true;
      console.log('Elasticsearch Connected Successfully.');
    } catch (error) {
      console.log('Elasticsearch ping failed. Fallback to MongoDB text search active. Error:', error.message);
      esClient = null;
      esEnabled = false;
    }
  } else {
    console.log('Elasticsearch config is disabled. MongoDB text search fallback active.');
  }
};

// Start initialization without blocking imports
initElasticsearch().catch(err => {
  console.log('Elasticsearch initialization failed:', err.message);
  esClient = null;
  esEnabled = false;
});

export { esClient, esEnabled, initElasticsearch };
