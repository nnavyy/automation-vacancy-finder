# Email setup

OTP requires SMTP_USER, SMTP_PASS and MAIL_FROM_ADDRESS. There is no fallback to EMAIL_USER. Until a dedicated sender is configured, delivery fails closed. Deployed credentials have not been changed.

Without a domain, create a separate project Gmail account. Enable two-step verification and create an app password if supported. Set SMTP_USER and MAIL_FROM_ADDRESS to that same project address, and SMTP_PASS to its app password through local/Vercel environment settings. A changed display name cannot conceal a personal sending account. Gmail has sending limits; a verified domain and transactional provider are the longer-term setup. Resend's shared test domain only delivers to the account owner.

# Subscription management still to implement

The current COMPANY_INTEL_USER_IDS allowlist has no start/end dates. The Telegram contact link does not collect payments or automatically activate access.

Create a bot invoice for 250 XTR with a 30-day subscription period. Link the authenticated website account to a Telegram user. Store an order with an opaque invoice payload, expected amount and user ID. Authenticate webhook updates and validate pre-checkout and successful_payment against that order. Store telegram_payment_charge_id uniquely so retries cannot double-grant access. Store Telegram's subscription_expiration_date as the paid-through date. Handle renewal failures, refunds, cancellation and out-of-order events; enforce expiry in every protected API using server time.

The customer billing page should show start date, paid-through date, renewal status and cancellation. The operator view should show payments and expiry by user. Manual Wallet payments also need verified transaction records and explicit expiry. A username, screenshot or redirect is not payment proof.

Telegram can deliver confirmation and renewal notices. Email copies are optional for the technical payment flow. The allowlist must be replaced before claiming automatic subscriptions. None of this billing flow is enabled yet.

References:
- https://core.telegram.org/bots/payments-stars
- https://core.telegram.org/bots/api#successfulpayment
- https://support.google.com/accounts/answer/185833
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
