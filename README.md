# Pool XI

A small private World Cup picks board for up to 20 friends. Each person chooses one country. Active picks stay green; eliminated teams turn gray. The board also shows flags, captains, and recent matches.

## What is included

- Shared group protected by a code
- Up to 20 named friends
- All 48 tournament teams, groups, flags, and captains
- Green active cards and gray eliminated cards
- Prize pool tracker with $50 payment status per friend
- Recent match results and upcoming fixtures
- Organizer panel for corrections, manual results, and elimination status
- Automatic match updates from ESPN's public World Cup feed
- Automatic elimination of knockout-match losers after a score sync
- Responsive phone and desktop layout

## Run locally

1. Open Terminal in this folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` using `.env.example` as the guide:

   ```env
   GROUP_CODE=FRIENDS26
   ADMIN_PIN=choose-a-private-pin
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000` and enter the group code.

Local development stores picks in `.data/cup-circle.json`, so restarting the preview server does not clear them. The `.data` folder is excluded from Git.

## Deploy free on Vercel

### 1. Put this folder on GitHub

Create an empty GitHub repository, then run these commands from the `world-cup-friends` folder:

```bash
git init
git add .
git commit -m "Build Pool XI"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
git push -u origin main
```

### 2. Import it into Vercel

1. Sign in at [vercel.com](https://vercel.com/).
2. Select **Add New > Project**.
3. Import the GitHub repository.
4. Vercel should detect **Next.js** automatically.
5. Keep the default build settings and select **Deploy**.

If this app is kept inside a larger repository, set the Vercel **Root Directory** to `world-cup-friends` before deploying.

### 3. Add free shared storage

This is required before sharing the Vercel app. Without it, the deployed app refuses new picks because Vercel's server filesystem is temporary.

1. Open the new project in Vercel.
2. Open **Storage** or **Marketplace**.
3. Find **Upstash Redis** and select **Create** or **Add Integration**.
4. Choose the free plan, create a Redis database, and connect it to this Vercel project.
5. Upstash automatically adds `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the project.

The free Upstash tier currently includes 256 MB and 500,000 commands per month, which is far more than this 20-person app needs.

After redeploying, open Organizer controls and confirm you do not see a storage warning. The main dashboard should say **Storage ready**.

### 4. Add private settings

In Vercel, open **Settings > Environment Variables** and add:

| Name | Example | Purpose |
| --- | --- | --- |
| `GROUP_CODE` | `CHICAGO26` | Code friends enter to join |
| `ADMIN_PIN` | `a-private-pin` | Opens organizer actions |

Use your own values. Do not use the examples for a real group.

### 5. Automatic scores

No score API key is needed. The server reads ESPN's public 2026 World Cup scoreboard and caches it for 60 seconds. Each open dashboard checks for changes every 30 seconds. Knockout losers are automatically marked eliminated.

During the group stage, use **Team status** in Organizer controls when a country is mathematically eliminated; the 2026 best-third-place rules make a simple automatic guess unreliable.

### 6. Redeploy

After adding storage and environment variables:

1. Open **Deployments** in Vercel.
2. Open the latest deployment menu.
3. Select **Redeploy**.
4. Share the final `vercel.app` URL and `GROUP_CODE` with your friends. Keep the `ADMIN_PIN` to yourself.

## Organizer notes

- A friend can change their pick by submitting the same name again.
- The board refreshes every 30 seconds.
- Use **Add a result** if the free score provider is delayed.
- Use **Team status > Still alive** to undo an accidental elimination.
- Use **Pool payment** to mark a friend paid after they send the $50 entry fee.
- Captain names are stored in `lib/teams.ts` and can be edited if tournament leadership changes.

## Checks

```bash
npm run lint
npm run build
```

## Free-service references

- [Vercel Hobby pricing](https://vercel.com/pricing)
- [Upstash Redis pricing](https://upstash.com/pricing/redis)
- [Upstash in the Vercel Marketplace](https://vercel.com/marketplace/upstash)
- [ESPN World Cup scoreboard](https://www.espn.com/soccer/scoreboard/_/league/fifa.world)
