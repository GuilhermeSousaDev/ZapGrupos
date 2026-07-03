# ZapGrupos

> The largest WhatsApp groups platform in Brazil — discover and promote WhatsApp communities by category.

ZapGrupos is a web platform where people can **find** WhatsApp groups that match their interests and where group owners can **promote** their own groups to thousands of users. It combines a public directory, a creator dashboard with paid promotion plans, and an admin panel with moderation and automated group importing.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Plans & Pricing](#plans--pricing)
- [User Roles](#user-roles)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [License](#license)

---

## Features

**For visitors**
- Search groups by name, category, or tag.
- Browse groups by category and explore curated **Featured Groups**.
- Join any group directly through its WhatsApp invite link.

**For group owners / creators**
- Register WhatsApp groups with name, description, invite link, category, member count, and tags.
- Manage your groups from a personal dashboard.
- Upgrade to paid plans for more group slots, featured placement, verified badges, and analytics.

**For admins**
- Moderate submissions with an approve / reject / ban workflow.
- Manage users and accounts.
- View platform-wide analytics and reports.
- Import groups automatically via web scraping.

---

## Screenshots

### Homepage
The landing page with the main search bar, headline stats (10,000+ groups, 50+ categories, 500k+ members), and category exploration.

<img width="1896" height="908" alt="Captura de tela 2026-06-16 111004" src="https://github.com/user-attachments/assets/6d536b8e-5474-497c-8afc-75920234743f" />

### Featured Groups
Highlighted and verified groups shown prominently across the platform, each with a description, click counter, and join button.

<img width="1906" height="909" alt="Captura de tela 2026-06-16 111016" src="https://github.com/user-attachments/assets/601a1acc-0896-4db5-a028-34b6deb75f9f" />

### Register a New Group
The submission form where creators add a group: name, description, WhatsApp invite link, category, approximate member count, and up to 10 tags. Plan limits are shown at the top.

<img width="1912" height="917" alt="Captura de tela 2026-06-16 111026" src="https://github.com/user-attachments/assets/e345eb91-4a18-4221-96e3-48ee6733bc34" />

### Plans & Pricing
Subscription tiers (Free, Starter, Pro, Premium) with per-plan limits and benefits, plus an FAQ section.

<img width="1900" height="913" alt="Captura de tela 2026-06-16 111039" src="https://github.com/user-attachments/assets/6ec2046c-d925-4301-aeb4-9634a552865e" />

### Admin Panel
Administrative overview with platform totals (groups, users, pending approvals, total clicks) and shortcuts to management tools.

<img width="1898" height="918" alt="Captura de tela 2026-06-16 111055" src="https://github.com/user-attachments/assets/b49dfa67-ac69-45d7-af55-a55a4497d1be" />

### Automatic Scraping
Import groups from external sources by category. Imported groups arrive with a **pending** status for review.

<img width="1902" height="913" alt="Captura de tela 2026-06-16 111136" src="https://github.com/user-attachments/assets/70b45d3f-7698-4536-ab58-324ed6c410fa" />

### Manage Groups
Moderation queue where admins approve, reject, or ban submitted groups.

<img width="1902" height="918" alt="Captura de tela 2026-06-16 111202" src="https://github.com/user-attachments/assets/87de1823-58c5-4ec0-bcf8-bcec952e8183" />

---

## Plans & Pricing

| Plan | Price (BRL/mo) | Groups | Highlights |
|------|---------------|--------|------------|
| **Free** | R$0 | 1 group | Listed in the general directory. No featured placement, no advanced analytics. |
| **Starter** | R$19.90 | Up to 3 groups | General listing, basic stats (clicks), e-mail support. |
| **Pro** ⭐ *Most Popular* | R$49.90 | Up to 5 groups | 1 featured group, priority ranking, full analytics (clicks + views), verified badge, priority support. |
| **Premium** | R$99.90 | Unlimited | 3 simultaneous featured groups, top ranking, advanced analytics with charts, exclusive premium badge. |

> Subscriptions can be cancelled at any time; access continues until the end of the paid period.

---

## User Roles

- **Visitor** — searches and joins groups without an account.
- **Creator** — registers and manages groups, subscribes to plans.
- **Admin** — moderates content, manages users, runs scraping, and views global analytics.

---

## Tech Stack

> Fill in / adjust this section to match your actual implementation.

- **Frontend:** _e.g. React / Next.js + Tailwind CSS_
- **Backend:** _e.g. Node.js / Express or Next.js API routes_
- **Database:** _e.g. PostgreSQL / MongoDB_
- **Auth:** _e.g. JWT / OAuth_
- **Payments:** _e.g. Stripe / Mercado Pago_
- **Hosting:** _e.g. Vercel / Railway_

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/zapgrupos.git
cd zapgrupos

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# then edit .env with your values

# Run the development server
npm run dev
```

The app will be available at `http://localhost:3000` (adjust to your setup).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Connection string for the database |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `PAYMENT_API_KEY` | API key for the payment provider |

> Update this table with the variables your project actually requires.

---

## Project Structure

```
zapgrupos/
├── screenshots/        # README images
├── src/                # Application source code
├── public/             # Static assets
├── .env.example        # Example environment variables
└── README.md
```

> Adjust to reflect your real folder layout.

---

## Roadmap

- [ ] Public group rating and reviews
- [ ] Click and view analytics dashboards for creators
- [ ] More import sources for automatic scraping
- [ ] Group reporting and anti-spam improvements
- [ ] Mobile app

---

## License

This project is released under the MIT License. See the `LICENSE` file for details.

---

Made with 💚 — ZapGrupos
