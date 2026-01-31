# EG Leads - Sales War Room

AI-powered lead acquisition and management portal for BookedNow.ai. A "War Room" portal to identify and attack high-probability leads.

## Features

- **Lead Dashboard** - Prioritized queue of leads with tier scoring
- **Lead Management** - Full CRUD with automatic tier/score calculation
- **Smart Scoring** - Automatic lead scoring based on:
  - Years in business (established businesses score higher)
  - Review count (lower reviews = higher opportunity)
  - Booking software status (no booking = prime target)
  - Business vertical (high-value verticals prioritized)
- **Activity Tracking** - Log calls, emails, SMS, and notes
- **Status Pipeline** - Track leads from New to Closed

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: shadcn/ui + Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Deploy to Vercel (to get database credentials)

```bash
npx vercel
```

During deployment, add a Vercel Postgres database from the Vercel dashboard.

### 3. Update environment variables

Copy the database credentials from Vercel to your `.env` file:

```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
```

### 4. Run database migrations

```bash
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the War Room.

## Lead Tier System

| Tier | Description | Criteria |
|------|-------------|----------|
| Tier 1 | Prime Target | Established + Low Reviews + No Booking Tool |
| Tier 2 | Good Prospect | Meets 2 of 3 criteria |
| Tier 3 | Potential | Meets 1 criterion |
| Tier 4 | Low Priority | Doesn't meet criteria |

## Roadmap

- [ ] **Integrated Dialer** - Telnyx Voice SDK for click-to-call
- [ ] **Data Scraping** - Google Places API integration
- [ ] **AI Scoring Agent** - Amazon Bedrock for value gap analysis
- [ ] **Task Automation** - AWS Step Functions for follow-ups
- [ ] **Performance Analytics** - Sales metrics dashboard

## Environment Variables

```env
# Database (required)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# AWS - for AI features (optional)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Telnyx - for dialer (optional)
TELNYX_API_KEY=""
TELNYX_PHONE_NUMBER=""

# Google Places - for scraping (optional)
GOOGLE_PLACES_API_KEY=""
```
