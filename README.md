# Beez — Invoices, Clients & Payments Workspace

Beez is a fast, focused, and offline-capable invoicing and financial workspace built for freelancers, consultants, and multi-business owners. Manage multiple businesses, track clients, issue professional invoices, record payments and receipts, and schedule recurring expenses with live multi-currency conversions.

---

## ✨ Features

### 🏢 Multi-Business Workspace

- **Entity Switching**: Seamlessly manage and toggle between multiple businesses or view an aggregated "All Businesses" perspective.
- **Custom Branding & Settings**: Set company logos, registration numbers, tax IDs, contact information, notes, and default currencies per business.

### 💱 Multi-Currency & Real-Time Open Exchange

- **Open Exchange Rates**: Integrated with a free, open exchange rate API with zero API keys required.
- **Unified Base Currency Reporting**: View all metrics (lifetime revenue, lifetime expenses, and net profit) accurately converted into the selected business currency.
- **Intelligent Caching**: Exchange rates are cached in `localStorage` with offline fallback to ensure uninterrupted operation.

### 📄 Invoicing & Receipts

- **Itemized Invoicing**: Build clean invoices with dynamic line items, taxes, notes, and custom dates.
- **Payment Lifecycle**: Track statuses across `Draft`, `Pending`, `Paid`, and `Overdue`.
- **PDF Generation**: Download and print styled, high-resolution PDF invoices and payment receipts powered by `@react-pdf/renderer`.

### 📉 Expenses & Recurring Schedules

- **One-off & Recurring Expenses**: Record one-time operational costs or configure recurring intervals (Weekly, Monthly, Quarterly, Yearly).
- **Batch Schedule Generation**: Automatically generates individual expense records across all scheduled occurrences.
- **Category Grouping**: Tag expenses (Software, Marketing, Office, Travel, Legal, Taxes, Utilities, etc.) for clear reporting.

### 📊 Dashboard & Financial Trends

- **Lifetime Financial Cards**: Instant visibility into Lifetime Net Revenue, Lifetime Expenses, Total Invoiced, and Active Clients.
- **Financial Trends Line Chart**: Interactive responsive SVG chart comparing **Income** vs **Expenses** vs **Invoiced** amounts over 6 or 12 months with interactive tooltips and net margin analysis.
- **Recent Invoices**: Quick view of recent invoices with status badges and quick actions.

### 📱 Progressive Web App (PWA)

- **Desktop & Mobile Installable**: Compliant Web App Manifest and Service Worker (`/sw.js`) enabling Chrome, Edge, and mobile install prompts.
- **Offline Shell Caching**: Network-first strategy with cache fallback for fast loading and offline resilience.

### 🤖 WebMCP Agent Support

- Built-in tool integration (`components/webmcp-tools.tsx`) exposing workspace actions for AI agent workflows.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Static Export)
- **UI & State**: [React 19](https://react.dev/), React Hook Form, Zod
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/), Radix UI primitives, [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Firebase](https://firebase.google.com/) (Authentication, Cloud Firestore, Cloud Storage)
- **PDF Generation**: [`@react-pdf/renderer`](https://react-pdf.org/)
- **Notifications**: [Sonner](https://sonner.emilkowal.ski/)
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ (tested on Node v20+)
- npm, pnpm, or yarn
- A Firebase project with Auth and Firestore enabled

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/business.git
cd business
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Build & Production

To generate a static production build:

```bash
npm run build
```

Static output is generated in the `/out` directory, ready to be hosted on Firebase Hosting, Vercel, Netlify, Cloudflare Pages, or any static file server.

To run linting:

```bash
npm run lint
```

---

## 📂 Project Structure

```
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout with metadata & favicons
│   ├── manifest.ts           # Dynamic PWA Web App Manifest
│   ├── page.tsx              # Application entry
│   ├── providers.tsx         # Auth, Business, and Currency providers
│   └── globals.css           # Global Tailwind CSS styles
├── components/               # UI components
│   ├── entity-dialogs.tsx    # Dialogs for creating/editing clients and products
│   ├── expenses-view.tsx     # Expenses tracking & recurring expense scheduler
│   ├── financial-chart.tsx   # Income vs Expense vs Invoiced SVG line chart
│   ├── invoice-composer.tsx  # Invoice builder & line-item editor
│   ├── invoice-detail.tsx    # Invoice review & payment recorder
│   ├── pwa-register.tsx      # Service worker registration & install prompt handler
│   ├── settings-view.tsx     # Business settings & customization
│   ├── workspace.tsx         # Main dashboard and navigation layout
│   └── ui/                   # Reusable Radix UI & primitive elements
├── contexts/                 # React Context providers
│   ├── auth-context.tsx      # Firebase user authentication
│   ├── business-context.tsx  # Business entity switching & state
│   └── currency-context.tsx  # Live currency rates & conversion
├── hooks/                    # Custom hooks
│   ├── use-business-collection.ts # Firestore collection synchronization
│   └── use-expenses.ts       # Expense data management & filtering
├── lib/                      # Utilities and services
│   ├── currency-exchange.ts  # Open exchange rate fetcher & caching
│   ├── currency.ts           # Formatting and conversion utilities
│   ├── data.ts               # Firestore CRUD operations
│   ├── expenses.ts           # Recurrence calculations
│   ├── firebase.ts           # Firebase client initialization
│   ├── invoice-pdf.tsx       # PDF invoice & receipt templates
│   └── types.ts              # TypeScript domain schemas
└── public/                   # Static assets, icons, and service worker
    ├── favicon.ico           # Application favicon
    ├── favicon.svg           # Vector favicon
    ├── manifest.json         # Static Web App Manifest
    ├── sw.js                 # PWA Service Worker
    └── icons/                # 192x192, 512x512, and Apple touch icons
```

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
