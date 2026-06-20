# DocSearch - Intelligent Document Search Engine & AI Assistant

DocSearch is a production-level, intelligent document search engine and SaaS platform. It allows users to upload documents (PDF, DOCX, TXT, PNG, JPG, JPEG), automatically parses page-by-page text, runs OCR on scanned images, indexes contents in real-time, generates professional summaries in the background, and enables full-text fuzzy keyword searches and interactive chats (RAG) powered by Google Gemini.

---

## 🚀 Key Features

1. **Robust Ingestion Pipeline**:
   - **PDF Extractor**: Page-by-page extraction via `pdf-parse` (maintains pagination).
   - **Word Extractor**: Converts `.docx` documents to raw structured paragraphs via `mammoth`.
   - **Image OCR**: Scans snapshots, invoices, and photos using `tesseract.js` characters recognition.
   - **Plain Text**: Reads raw logs and reports natively.
2. **Dual-Mode Full-Text Search**:
   - Primary: Uses Elasticsearch indices with fuzziness mappings and text highlight fragments.
   - Fallback: Uses MongoDB Text indexing and a regex matcher that generates highlighted marks (`<mark>`) dynamically.
3. **Conversational RAG (Retrieval-Augmented Generation)**:
   - Divides extracted texts into overlapping semantic blocks.
   - Queries the search engine for paragraphs related to user messages.
   - Grounded context prompt templates prevent AI hallucinations, referencing sources page numbers.
4. **Background AI Summarization**:
   - Prompts Gemini (`gemini-2.5-flash`) asynchronously upon ingestion to populate professional metadata.
5. **Interactive PDF/Doc Viewer**:
   - Displays page canvas with text search highlights.
   - Side-by-side RAG Chat console where clicking source references automatically flips the viewer to the cited page.
6. **SaaS Analytics Dashboard**:
   - Interactive widgets displaying document lists, tags, folders, storage space used, category spreads, and monthly upload curves.

---

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons, Axios.
- **Backend**: Node.js, Express.js, Multer (file streams), MongoDB with Mongoose, JWT authentication.
- **Search Engine**: Elasticsearch / OpenSearch (with native Mongoose Text fallbacks).
- **AI Integrations**: Google Generative AI SDK (`@google/generative-ai` 2.5-flash).

---

## 📦 Project Structure

```
DocSearch/
 ├── client/
 │    ├── src/
 │    │    ├── components/         # Shared Header, Sidebar, Toast components
 │    │    ├── context/            # AuthContext, ThemeContext, ToastContext
 │    │    ├── pages/              # Landing, Dashboard, Search, Viewer, AI assistant, Profile, Admin
 │    │    ├── services/           # Axios interceptors and endpoints config
 │    │    ├── index.css           # Styling directives and HSL variables
 │    │    ├── App.jsx             # Main client router
 │    │    └── main.jsx            # Entry mount point
 │    ├── index.html               # Main markup and SEO tags
 │    └── tailwind.config.js       # Tailwind styles mapping
 │
 ├── server/
 │    ├── config/                  # Database, Elasticsearch, Gemini connections
 │    ├── controllers/             # Auth, Documents, Searches, AI, Admin operations
 │    ├── middleware/              # JWT, upload file filters, error interceptors
 │    ├── models/                  # User, Folder, Document, Chunk, SearchHistory schemas
 │    ├── routes/                  # Express routing setups
 │    ├── services/                # Text extractors, OCR, Search, and Storage utilities
 │    ├── server.js                # App listener entry point
 │    └── .env                     # System environmental configurations
 └── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (running locally or a Mongo Atlas URI)
- *(Optional)* **Elasticsearch** (v8+). If you have Docker, you can boot it instantly with:
  ```bash
  docker run -d -p 9200:9200 -e "discovery.type=single-node" -e "xpack.security.enabled=false" docker.elastic.co/elasticsearch/elasticsearch:8.11.1
  ```
- **Gemini API Key**: Obtain a key from Google AI Studio.

---

### Step 1: Backend Configuration

1. Navigate to the `server` folder:
   ```bash
   cd server
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Open the `.env` file and fill in your configurations:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/docsearch
   JWT_SECRET=super_secret_docsearch_jwt_key_2026
   
   # Search settings (turn true if Elasticsearch Docker is running)
   ELASTICSEARCH_ENABLED=false
   ELASTICSEARCH_URL=http://localhost:9200
   
   # Storage Configuration
   STORAGE_PROVIDER=local
   UPLOAD_DIR=uploads
   
   # AI Integration
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
   ```
4. Start the server (hot-reloaded):
   ```bash
   npm run dev
   ```
   *The server listener will initialize on port 5000.*

---

### Step 2: Frontend Configuration

1. Open another terminal and navigate to the `client` folder:
   ```bash
   cd client
   ```
2. Install React dependencies (resolving peer packages via peer-flag):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Boot the development Vite server:
   ```bash
   npm run dev
   ```
4. Click the link shown in the terminal (usually `http://localhost:5173`) to launch the application.

---

## 🔐 Role-Based Access Control (RBAC)

- The application automatically promotes the **first registered user** to an **Admin** role.
- Subsequent registrations default to a standard **User** role.
- Admins can log in, access `/admin` in the sidebar, view all accounts, toggle user roles, delete folders, and inspect search logs globally.
