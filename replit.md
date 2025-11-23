# ScholarshipAI - Scholarship Matching & Essay Generation Platform

## Overview

ScholarshipAI is a full-stack web application that helps students find relevant scholarships and generate personalized, winning essays using AI. The system combines semantic matching with strategic essay generation based on patterns learned from successful scholarship applications.

The platform guides users through a four-step workflow:
1. **Profile Creation**: Students input their academic background, activities, and goals
2. **Scholarship Matching**: AI matches the profile against a database of scholarships using vector similarity
3. **Selection**: Students review and select from top-matched scholarships
4. **Essay Generation**: AI generates a tailored essay using strategic writing patterns

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Built on shadcn/ui components (Radix UI primitives) with Tailwind CSS for styling. The design follows Material Design 3 principles adapted for educational technology, prioritizing form clarity, data comparison, and content readability.

**State Management**: React Query (@tanstack/react-query) for server state management, with local component state using React hooks. No global state management library is used.

**Routing**: Wouter for lightweight client-side routing.

**Form Handling**: React Hook Form with Zod validation via @hookform/resolvers for type-safe form validation.

**Design System**: Custom design tokens defined in CSS variables, with a neutral color palette optimized for information-dense interfaces. Typography uses Inter for UI elements and Merriweather for essay display.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful JSON API with two primary endpoints:
- `/api/match-scholarships`: Accepts student profile, returns ranked scholarship matches
- `/api/generate-essay`: Accepts scholarship description and student profile, returns generated essay

**Python Integration**: The backend spawns Python child processes to execute specialized AI operations. This hybrid approach allows Node.js to handle HTTP concerns while Python handles ML/AI workloads.

**Session Management**: Uses express-session with connect-pg-simple for PostgreSQL-backed session storage.

**Development vs Production**: Separate entry points (`index-dev.ts` and `index-prod.ts`) handle different serving strategies. Development uses Vite's middleware mode for HMR, while production serves pre-built static assets.

### Data Storage Solutions

**Primary Database**: PostgreSQL (via Neon serverless driver @neondatabase/serverless).

**ORM**: Drizzle ORM for type-safe database operations with schema defined in `shared/schema.ts`. Schema uses Zod for runtime validation.

**Vector Database**: ChromaDB (accessed via Python backend) stores scholarship embeddings for semantic search. Database path: `attached_assets/chroma_scholarship_db`.

**In-Memory Storage**: Fallback MemStorage implementation for development/testing without database dependency.

### Authentication and Authorization

Currently uses a basic in-memory user storage system (`MemStorage` class). The infrastructure supports session-based authentication via express-session, but the main application flow does not require user accounts - it's designed for anonymous usage.

## External Dependencies

### AI Services

**Anthropic Claude API**: Primary AI service for essay generation and profile extraction.
- Model: `claude-sonnet-4-20250514`
- Used for: Semantic matching, essay generation, and structured data extraction
- API key managed via environment variable or hardcoded in Python scripts

### Embedding Services

**Nomic Embed API**: Generates text embeddings for semantic scholarship matching.
- Model: `nomic-embed-text-v1.5`
- Used for: Converting student profiles and scholarship descriptions into vector representations
- API key: Managed in Python backend

### Database Services

**Neon Serverless PostgreSQL**: Cloud-hosted PostgreSQL database.
- Connection: Via `DATABASE_URL` environment variable
- Driver: `@neondatabase/serverless` with WebSocket support
- Schema management: Drizzle Kit for migrations

### Vector Search

**ChromaDB**: Local persistent vector database for scholarship storage and similarity search.
- Type: Self-hosted, file-based storage
- Location: `attached_assets/chroma_scholarship_db`
- Collection: `scholarships` with metadata fields (GPA, degree level, field of study, etc.)

### Pre-trained Strategy Map

The system includes a pre-computed `strategy_map.json` that contains 6+ clusters of scholarship essay strategies derived from successful applications. Each cluster defines:
- Description archetype (what types of scholarships match this pattern)
- Writing strategy (broad instructions and structural template)

This map enables the essay generator to select appropriate writing strategies based on scholarship requirements.

### Build and Development Tools

- **Vite**: Frontend build tool and dev server with HMR
- **esbuild**: Server-side bundling for production
- **TypeScript**: Type checking across the entire stack
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

### Python Environment

The Python backend scripts (`scholarship_matcher.py`, `essay_generator.py`) require:
- Python 3.x
- `anthropic` SDK
- `chromadb` library
- `requests` for HTTP calls

These scripts are executed as child processes from the Node.js backend.