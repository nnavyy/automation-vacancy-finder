# HH Job Copilot

Hosted job search and application tracking for HeadHunter (hh.ru).

- **Free:** vacancy discovery, job matching, cover letters, saved/applied tracking, Analytics, and Telegram notifications.
- **Company Intel — $3/month:** company research, recruiter contacts, and outreach drafts.

AI models and credentials are managed on the server. Customers do not need API keys.

## Preview

```sh
npm install
npm run dev
```

Open [localhost:3000/demo](http://localhost:3000/demo) to review the free plan with sample data. Company Intel shows the same locked feature screen used by free accounts. Sign in through the main app to use real account data.

## Configuration

Copy `.env.example` to `.env.local` and configure the database, authentication/encryption secrets, SMTP, server AI providers, and optional HH OAuth/Telegram integration. Set `APP_BASE_URL` to the canonical deployed origin. Never commit environment secrets.

Paid access currently uses operator-managed `COMPANY_INTEL_USER_IDS` grants. Checkout and automatic subscription billing are not connected. The interface states this explicitly; displaying $3/month does not charge a customer.

## Checks

```sh
npm test
npx tsc --noEmit
npm run lint
npm run build
```

The existing Vercel project uses `vercel.json` for collection, notification, and application-sync cron jobs. Deploy the reviewed commit from the production branch.

[Review findings and remaining launch work](SAAS_REVIEW.md).

## License

Proprietary software. Copyright © 2026 HH Job Copilot. All rights reserved.
Unauthorized copying, modification, redistribution, or commercial reproduction is strictly prohibited.

Legacy plans, capture scripts, duplicate screenshot exports, and self-hosting drafts are retained locally but excluded from current Git tracking and Vercel uploads. Public assets used by the app remain tracked. Existing Git history is retained.
