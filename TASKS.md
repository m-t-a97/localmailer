# LocalMailer MVP Feature Checklist

## 1. Auth & Accounts (Use Authula)

- [ ] Email/password signup + login
- [ ] Google + GitHub OAuth (via Authula plugins)
- [ ] Password reset flow
- [ ] Workspace/Organization creation (via Authula Organizations plugin)
- [ ] User profile (name, email, avatar)
- [ ] Session management + logout

## 2. SMTP Email Capture

- [ ] SMTP server listening on `smtp.localmailer.com:587`
- [ ] Accept emails from any sender (no validation yet)
- [ ] Parse email headers (To, From, Subject, Date)
- [ ] Parse email body (HTML + plaintext)
- [ ] Parse attachments (store in Postgres or S3)
- [ ] Email validation (basic: required From/To/Subject)

## 3. Web Inbox UI

- [ ] Inbox list view (sender, subject, timestamp, preview snippet)
- [ ] Pagination (20–50 emails per page)
- [ ] Click-to-open email (full HTML render + plaintext fallback)
- [ ] Basic search (subject, sender, recipient)
- [ ] Delete single email
- [ ] Clear entire inbox
- [ ] Empty inbox state + loading state

## 4. User Configuration

- [ ] Generate unique SMTP credentials per user/workspace
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` display
- [ ] Copy-paste environment variables for:
  - Next.js
  - Django
  - Laravel
  - Node.js (nodemailer)
  - Python (django.core.mail)
- [ ] One-click Vercel integration (pre-fill `.env`)

## 5. Free Tier (Limits)

- [ ] 100 emails/day limit (store count in DB)
- [ ] 24-hour email retention (auto-delete older emails)
- [ ] 1 workspace only
- [ ] Basic inbox (no advanced features)

## 6. Pro Tier (Paid Features)

- [ ] Stripe subscription (monthly + yearly)
- [ ] Unlimited emails (or 50K/month cap)
- [ ] 30-day email retention
- [ ] 5+ workspace users
- [ ] Email forwarding (optional but valuable)
- [ ] API access (webhooks, programmatic inbox queries)

## 7. Stripe Billing Integration

- [ ] Stripe checkout page
- [ ] Monthly ($9) + yearly ($99) plans
- [ ] Upgrade/downgrade flow
- [ ] Invoice email (Stripe default)
- [ ] Trial period (optional: 7 days)

## 8. API (For CI/CD + Automation)

- [ ] `GET /api/inbox` → list emails (authenticated)
- [ ] `GET /api/inbox/:id` → get email details
- [ ] `DELETE /api/inbox/:id` → delete email
- [ ] `POST /api/webhook` → receive emails via HTTP (optional替代 SMTP)
- [ ] API key generation per workspace

## 9. Basic Admin + Settings

- [ ] User settings page (name, email, password change)
- [ ] Workspace settings (name, members, SMTP credentials)
- [ ] Billing settings (view plan, upgrade, cancel)
- [ ] Delete account (optional but good UX)

## 10. Dev-Friendly Docs

- [ ] Quick-start guide (5-min setup)
- [ ] Framework-specific snippets (Next.js, Django, Laravel, etc.)
- [ ] SMTP troubleshooting (common errors)
- [ ] API documentation (endpoints, auth, examples)
- [ ] FAQ (why not Mailtrap, why not local, pricing)

## 11. Landing Page

- [ ] Hero section ("LocalMailer - Emails That Never Leave Your Machine")
- [ ] Features grid (4 columns: SMTP, Preview, Inbox, API)
- [ ] Tech stack badges (Next.js, Authula, Postgres)
- [ ] Pricing section (Free vs Pro)
- [ ] CTA buttons ("Star on GitHub", "Deploy Now")
- [ ] Footer (links, copyright, contact)

## 12. Marketing + Launch

- [ ] Product Hunt launch page copy
- [ ] Reddit post (r/webdev, r/dotnet, r/nextjs)
- [ ] Twitter/X posts (10–15 tweets over 2 weeks)
- [ ] Dev.to article ("How I stopped using docker-compose for email testing")
- [ ] BetaList submission
- [ ] GitHub README (open-source client, link to hosted version)

---

## Prioritized Development Order (2–3 Weeks)

### Week 1: Core

- Authula integration (Auth + Workspaces)
- SMTP server (accept + parse emails)
- Database schema (emails, users, workspaces)

### Week 2: Inbox + Free Tier

- Web inbox UI (list + open + delete + search)
- Free tier limits (100/day, 24h retention)
- SMTP credentials generation

### Week 3: Billing + Polish

- Stripe integration (monthly/yearly plans)
- Pro tier features (unlimited, 30-day retention, teams)
- API endpoints
- Landing page + docs
- Launch marketing (Product Hunt, Reddit, Twitter)

---

## What You SKIP (Post-MVP)

- ❌ Custom domains (`smtp.yourproject.com`)
- ❌ Email templates builder
- ❌ Advanced analytics (open rates, click rates)
- ❌ Mobile app
- ❌ Multi-region SMTP (one region is fine)
- ❌ Enterprise features (SSO, audit logs)
- ❌ Complex billing (Stripe handles subscriptions)

Ship this in 2–3 weeks. Launch on Product Hunt. Get 100 beta users. Iterate. Scale to 1,000 users in 6 months. **$9K/month profit.**
