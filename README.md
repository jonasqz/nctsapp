# ncts.app

The first dedicated tool for the [NCT framework](https://ncts.app/what-is-nct) (Narratives, Commitments, Tasks). Connect strategy to execution.

**[ncts.app](https://ncts.app)** · [What is NCT?](https://ncts.app/what-is-nct) · [Blog](https://ncts.app/blog) · [Roadmap](https://ncts.app/roadmap)

## What is NCT?

NCT is a goal-setting framework created by Ravi Mehta (former CPO at Tinder, PM at Facebook/Tripadvisor). It replaces OKRs with three simple layers:

- **Narratives** — the strategic direction, written as a story about where your team is headed
- **Commitments** — measurable outcomes you commit to delivering within a cycle (6 weeks to 4 months)
- **Tasks** — the concrete work that drives each Commitment forward

ncts.app gives you a purpose-built workspace to plan, track, and align your team around NCTs.

## Features

- **Workspace management** — create workspaces, invite team members with role-based access (Owner, Admin, Editor, Viewer)
- **Full NCT workflow** — Narratives → Commitments → Tasks with drag-and-drop status tracking
- **Cycle planning** — flexible cycles from 6 weeks to 4 months
- **Strategy pillars & KPIs** — track strategic themes and key metrics alongside your NCTs
- **Alignment view** — see how Narratives, Commitments, and Tasks connect
- **Team collaboration** — invite members via email, assign work, track progress together
- **Keyboard-first** — command palette (⌘K) for fast navigation

## Tech Stack

- **Framework** — [Next.js 16](https://nextjs.org) (App Router, React 19)
- **Database** — PostgreSQL 16 with [Drizzle ORM](https://orm.drizzle.team)
- **Auth** — [Better Auth](https://better-auth.com) (email/password, magic links)
- **Payments** — [Stripe](https://stripe.com) (optional for self-hosted)
- **Email** — [Resend](https://resend.com) (optional — invite links work without it)
- **Styling** — [Tailwind CSS v4](https://tailwindcss.com)
- **Runtime** — [Bun](https://bun.sh) (also works with Node.js 20+)

## Self-Hosted Setup

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 20+)
- [Docker](https://docker.com) (for PostgreSQL)

### 1. Clone & install

```bash
git clone https://github.com/jonasqz/nctsapp.git
cd nctsapp
bun install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Required
DATABASE_URL=postgres://ncts:ncts@localhost:5432/ncts
BETTER_AUTH_SECRET=generate-a-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
APP_URL=http://localhost:3000

# Optional — email invites (links work without this)
RESEND_API_KEY=re_your_api_key
EMAIL_FROM=Your App <onboarding@resend.dev>

# Optional — billing (not needed for self-hosted)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 3. Start the database

```bash
docker compose up -d
```

### 4. Push the schema

```bash
bun run db:push
```

### 5. Run the app

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and you're ready to go.

### Production

```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated app (dashboard, settings)
│   │   └── dashboard/
│   │       ├── narratives/
│   │       ├── commitments/
│   │       ├── tasks/
│   │       ├── cycles/
│   │       ├── strategy/
│   │       ├── alignment/
│   │       ├── teams/
│   │       └── settings/
│   ├── (auth)/         # Login, signup, password reset
│   ├── api/            # API routes
│   └── onboarding/     # New user onboarding flow
├── components/         # Shared UI components
└── lib/
    ├── db/             # Schema & database client
    ├── auth.ts         # Auth configuration
    ├── permissions.ts  # Role-based access control
    ├── plans.ts        # Plan limits & pricing config
    └── email.ts        # Transactional email templates
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run db:push` | Push schema changes to database |
| `bun run db:studio` | Open Drizzle Studio (database GUI) |
| `bun run lint` | Run ESLint |

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## Links

- **Hosted version** — [ncts.app](https://ncts.app)
- **What is NCT?** — [ncts.app/what-is-nct](https://ncts.app/what-is-nct)
- **NCT vs OKR** — [ncts.app/nct-vs-okr](https://ncts.app/nct-vs-okr)
- **Blog** — [ncts.app/blog](https://ncts.app/blog)
- **Roadmap** — [ncts.app/roadmap](https://ncts.app/roadmap)
