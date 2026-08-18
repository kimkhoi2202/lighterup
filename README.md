# Lighter Up

A marketplace platform for holiday light installation services.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker Desktop** (required for local Supabase)

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

The default values in `.env.example` are pre-configured for local Supabase development. No changes needed for basic development!

### 4. Start Local Supabase

Make sure Docker Desktop is running, then:

```bash
npm run supabase:start
```

This will start all Supabase services locally:
- **API**: http://127.0.0.1:54321
- **Studio**: http://127.0.0.1:54323 (database admin UI)
- **Inbucket**: http://127.0.0.1:54324 (email testing)

### 5. Set Up the Database

Apply migrations and seed the database with test data:

```bash
npm run supabase:reset
```

This will:
- Create all database tables
- Set up Row Level Security policies
- Populate test data (users, jobs, conversations, messages)

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run supabase:start` | Start local Supabase |
| `npm run supabase:stop` | Stop local Supabase |
| `npm run supabase:reset` | Reset database with migrations + seed data |
| `npm run supabase:studio` | Open Supabase Studio |
| `npm run supabase:status` | Check Supabase status |

## Project Structure

```
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and configs
│   └── store/         # State management
├── supabase/
│   ├── migrations/    # Database schema migrations
│   ├── seed.sql       # Test data for local development
│   └── config.toml    # Supabase configuration
└── public/            # Static assets
```

## Features in Development

- ✅ User authentication (homeowner/contractor)
- ✅ Job posting and management
- ✅ Real-time messaging
- 🚧 Google Calendar integration (optional)
- 🚧 Payment processing

## Troubleshooting

### Supabase won't start
- Make sure Docker Desktop is running
- Try `npm run supabase:stop` then `npm run supabase:start`

### Database connection errors
- Run `npm run supabase:status` to check if services are running
- Verify your `.env.local` has the correct local URLs

### Port conflicts
- Local Supabase uses ports 54321-54327
- The app uses port 3000 by default
- Check `supabase/config.toml` to modify ports if needed

## Need Help?

Contact the team lead for:
- Test account passwords
- Access to remote Supabase (production/staging)
- Google OAuth credentials (if working on calendar features)

