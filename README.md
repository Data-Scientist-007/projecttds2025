# TDS Virtual Teaching Assistant

An AI-powered Virtual Teaching Assistant API for the IIT Madras Tools in Data Science (TDS) course. This application can automatically answer student questions based on course content and Discourse forum posts.

## Features

- **Intelligent Q&A**: Answers student questions using course content and forum discussions
- **Image Support**: Accepts base64-encoded images for visual questions
- **Fast Response**: Responds within 30 seconds
- **Data Scraping**: Scrapes course content and Discourse posts automatically
- **Rate Limiting**: Built-in rate limiting for API protection
- **Beautiful UI**: Modern, responsive interface for testing and administration

## API Endpoint

### POST /api/

**Request Format:**
```json
{
  "question": "Your question here",
  "image": "base64_encoded_image_data (optional)"
}
```

**Response Format:**
```json
{
  "answer": "Generated answer based on course content",
  "links": [
    {
      "url": "https://discourse.onlinedegree.iitm.ac.in/...",
      "text": "Relevant discussion title"
    }
  ]
}
```

**Example Usage:**
```bash
curl "https://your-app.com/api/" \
  -H "Content-Type: application/json" \
  -d '{"question": "Should I use gpt-4o-mini or gpt-3.5-turbo?"}'
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/tds-virtual-ta.git
cd tds-virtual-ta
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Edit `.env` file with your configuration (OpenAI API key is optional)

5. Initialize the database and scrape sample data:
```bash
npm run scrape
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` with the API at `http://localhost:3000/api/`

## Data Scraping

The application includes a web scraper that collects:
- Course content from TDS Jan 2025 (as of Apr 15, 2025)
- Discourse posts from Jan 1, 2025 - Apr 14, 2025

To run the scraper:
```bash
npm run scrape
```

## Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Various Platforms

#### Vercel
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Railway
```bash
npm install -g @railway/cli
railway login
railway deploy
```

#### Heroku
```bash
heroku create your-app-name
git push heroku main
```

## Project Structure

```
├── src/                    # React frontend
│   ├── App.tsx            # Main application component
│   └── ...
├── server/                # Node.js backend
│   ├── index.ts          # Express server
│   ├── database.ts       # SQLite database management
│   ├── answerEngine.ts   # AI answer generation
│   └── scraper.ts        # Web scraping functionality
├── data/                 # SQLite database storage
└── dist/                # Production build output
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: OpenAI API key (optional, falls back to rule-based answers)
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `DATABASE_PATH`: SQLite database path

### Rate Limiting

- Default: 30 requests per minute per IP
- Configurable via environment variables

## Evaluation

The application is designed to work with promptfoo for evaluation:

```bash
npx promptfoo eval --config project-tds-virtual-ta-promptfoo.yaml
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions, please open an issue on GitHub or contact the development team.