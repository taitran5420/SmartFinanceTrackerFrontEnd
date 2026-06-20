# How AI Was Used to Build This Frontend

I built the **Smart Finance Tracker** frontend with **Claude Code** (Anthropic's AI coding
agent). I gave it the requirements and made the decisions; it scaffolded and wrote the code,
and revised on my feedback.

## What I gave it

- **Feature list** (`requirement/Smart Finance Tracker Feature List.xlsx`) — 5 features:
  balance & overdraft, smart categorized entries, monthly budgets with alerts, recurring
  transactions, and spending analytics.
- **Backend contract** (`requirement/openAPI_backend.json`) — the API to build services against.

## Skills I used

- `angular-new-app` - create the project + core app - Source: angular team - https://github.com/angular/skills
- `angular-developer` - Angular code & architecture - Source: angular team - https://github.com/angular/skills
- `frontend-design` - visual design direction - Source: anthropics - https://github.com/anthropics/skills/tree/main/skills/frontend-design

## Step by step

1. **Create sameple dashboard** (`frontend-design`) - Design one dashboard page for finance app. 
2. **Create the app** (`angular-new-app`) — scaffolded Angular 22 + Tailwind v4.
3. **Model the backend** (`angular-developer`) — turned the OpenAPI spec into TypeScript models.
4. **Services & auth** (`angular-developer`) — one service per API area + JWT auth.
5. **Dashboard** (`angular-developer`) — built the UI for all 5 features with sample data.
6. **Redesign** (`angular-developer` + `frontend-design`) — I asked for a Vietnam vibe with a
   Hạ Long Bay scenic background and the name "Smart Finance Tracker". Along the way I told it
   to keep the copy English and drop the water-level effect.
7. **Themes** — extended into switchable themes: Dawn (Vietnam), Sakura (Japan), Imperial (China).

---
*Built with Claude Code (Claude Opus). Skills: `angular-new-app`, `angular-developer`,
`frontend-design`.*
