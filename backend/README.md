# AI Agentic Platform - Backend

Express.js backend API for the AI Agentic SaaS Platform.

## Features

- Email sorting and scheduling via LLM
- Document summarization (PDF, DOC, DOCX, TXT)
- Location finding and route calculation
- Ollama integration for AI capabilities

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=5000
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
GMAIL_CLIENT_ID=your_gmail_client_id_here
GMAIL_CLIENT_SECRET=your_gmail_client_secret_here
CORS_ORIGIN=http://localhost:3000
```

3. Install and run Ollama:
   - Download from https://ollama.ai
   - Run: `ollama pull llama3.2:latest` (fast & lightweight)
   - Alternatives: `ollama pull phi3:mini`
   - Or use the Docker setup below

4. Run the server:
```bash
npm run dev
```

## Docker Setup

To run with Docker and Ollama:

```bash
docker-compose up
```

This will start both the backend API and Ollama service.

## API Endpoints

- `POST /api/email/sort` - Sort and schedule emails
- `POST /api/doc/summary` - Summarize documents
- `GET /api/map/destinations` - Get available destinations
- `POST /api/map/route` - Calculate route between locations

## Important Notes

- No authentication or database is implemented (as per requirements)
- Update college locations in `utils/mapUtils.js` with your actual coordinates
- Gmail API credentials need to be configured for email scheduling features

