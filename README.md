# ScholarshipAI 🎓

**AI-powered scholarship matching and essay drafting** — built for the Anthropic x UofT Hackathon (Honorable Mention 🏅)

**Live demo:** [scholarship-hackathon-15.onrender.com](https://scholarship-hackathon-15.onrender.com)

Finding scholarships is a needle-in-a-haystack problem: thousands of listings, each with different eligibility rules, and every application wants a tailored essay. ScholarshipAI matches a student against **200+ scraped scholarships** and drafts application essays built around strategies mined from past winning essays.

## How It Works

### 🔍 Matching Pipeline
1. **Profile classification** — the student's profile is classified to narrow the scholarship pool to eligible candidates
2. **Vector search** — semantic search shortlists the top 10 scholarships from the narrowed pool
3. **LLM agent ranking** — Claude agent calls rank the final top 5 matches for the student

### ✍️ Essay Generation
1. **Strategy mining** — winning essays are analyzed for strategies tied to each scholarship type and student profile
2. **Guided drafting** — those strategies are fed into LLM prompts to generate several tailored drafts
3. **Reviewer agent** — a separate agent evaluates the drafts and picks the strongest one

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Server | Node.js (TypeScript), Drizzle ORM |
| AI backend | Python, Claude API, vector search |

## Project Structure

```
├── client/           # React frontend
├── server/           # Node/TypeScript server (Drizzle ORM)
├── python_backend/   # Matching + essay pipeline (Claude API, vector search)
├── shared/           # Shared types/schemas
└── main.py           # Python entry point
```

## Running Locally

```bash
# Install dependencies
npm install
uv sync           # or: pip install -e .

# Set environment variables
export ANTHROPIC_API_KEY=your_key_here
export DATABASE_URL=your_database_url

# Start the app
npm run dev
```

## Team

Built in 24 hours at the Anthropic x University of Toronto Hackathon, where it earned an **Honorable Mention**.
