# AI Agentic SaaS Platform

A comprehensive AI-powered platform for email management, document summarization, and location finding.

## Features

- **Email Management**: Sort emails by priority and schedule events automatically
- **Document Summary**: Upload PDF, DOC, DOCX, or TXT files and get AI-generated summaries
- **Location Finder**: Find routes between your location and college destinations

## Project Structure

```
.
├── Frontend/          # Next.js frontend application
│   ├── pages/        # Next.js pages (email, doc, map)
│   ├── components/   # React components (Navbar, NotificationDrawer, MapComponent)
│   ├── styles/       # Global styles and theme
│   └── pages/api/    # API proxy routes
│
└── backend/          # Express.js backend API
    ├── routes/       # API route definitions
    ├── controllers/  # Business logic controllers
    ├── agents/       # LLM agent (Ollama integration)
    └── utils/        # Utility functions (PDF parser, map utils)
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Ollama (for AI features) - Download from https://ollama.ai

### Frontend Setup

1. Navigate to Frontend directory:
```bash
cd Frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

4. Run development server:
```bash
npm run dev
```

Frontend will be available at http://localhost:3000

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (`.env`):
```
PORT=5000
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=deepseek
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
CORS_ORIGIN=http://localhost:3000
```

4. Install and pull Ollama model:
```bash
# Make sure Ollama is installed and running
ollama pull deepseek
```

5. Run the server:
```bash
npm run dev
```

Backend will be available at http://localhost:5000

### Docker Setup (Alternative)

You can use Docker Compose to run both backend and Ollama:

```bash
cd backend
docker-compose up
```

## Configuration

### College Locations

Update the college locations in `backend/utils/mapUtils.js` with your actual coordinates:

```javascript
const COLLEGE_LOCATIONS = [
  { name: 'Library', lat: 12.9716, lng: 77.5946 },
  // Add more locations...
]
```

### Google APIs (Optional)

For email scheduling features, you'll need to:
1. Create a project in Google Cloud Console
2. Enable Gmail API and Calendar API
3. Create OAuth 2.0 credentials
4. Add credentials to `.env` file

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, Leaflet
- **Backend**: Express.js, Node.js
- **AI**: Ollama (DeepSeek model)
- **File Processing**: pdf-parse, mammoth

## Theme

The platform uses a black/white/purple color scheme as specified in the design requirements.

## Development

- Frontend runs on port 3000
- Backend runs on port 5000
- Ollama runs on port 11434

## Notes

- No authentication or database is implemented (stateless API)
- All data is processed in-memory
- Update environment variables before running in production

