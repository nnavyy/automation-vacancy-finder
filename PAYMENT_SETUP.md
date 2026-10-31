# Payment setup — decision pending

Company Intel remains $3/month. Analytics remains free. No live checkout is enabled.

For an exact USD subscription, use a website payment processor supported in your business country. Customers pay through hosted checkout; signed payment webhooks activate/renew database-backed access, failed renewals expire it, and a customer portal handles cancellation. A Telegram wallet alone is not a card subscription merchant account. MCP can help configure a provider, but the deployed app still needs the provider API and signed webhooks.

Inside Telegram, digital services must use Stars. The alternative flow is: linked app account -> Telegram invoice -> successful_payment webhook -> expiring Company Intel entitlement. Telegram supports 30-day recurring Stars subscriptions. The price must be stated in Stars; buyers' USD cost varies. Earned Stars can be withdrawn through Fragment to a TON wallet after the hold period, subject to eligibility. Wallet credentials are not needed by this app.

Before enabling Stars: choose a Stars price; verify Fragment eligibility and a supported TON wallet yourself; configure a bot webhook secret; implement idempotent payment records, renewal, expiration, cancellation, refunds and /paysupport; test in Telegram's test environment. The current local environment has a bot token but no TELEGRAM_WEBHOOK_SECRET. Never paste wallet recovery phrases into the app or chat.

Official references:
- https://core.telegram.org/bots/payments-stars
- https://core.telegram.org/bots/api#createinvoicelink
- https://core.telegram.org/api/stars
- https://telegram.org/tos/content-creator-rewards

HR lookup validation: company-page crawling and company-specific profile filtering have regression tests. A live PostHog crawl fetched 8 pages and found its careers URL, but no named contacts. The configured Hunter key returns 401 authentication_failed; Apollo search returns 403. These provider credentials/permissions need repair before their contact discovery can be verified. The existing Apollo integration also needs migration to the current API search plus an explicitly budgeted enrichment flow; search alone does not return email addresses.
