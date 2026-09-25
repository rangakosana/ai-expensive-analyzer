# AI Expense Analyzer

A production-grade, full-stack web application designed to help individuals track their daily spending, categorize transactions, and generate AI-driven financial insights using **Google Gemini** (`@google/genai`).

---

## 🌟 Key Features

* **🔐 Secure User Authentication:** Registration, login, password hashing with `bcrypt` (10 rounds), and JWT-based session authorization with 24-hour expiration.
* **📊 Interactive Financial Dashboard:** Real-time metrics (Total Spend, Top Category, Total Transactions, Average Spend / Day), spending by category chart with Pie/Donut and Bar chart toggles, and recent transactions.
* **💳 Complete Expense Management (CRUD):** Create, read, update, and delete expenses with full field validation.
* **🔍 Search & Multi-Filter:** Filter expenses by month, category enum, and live search by merchant name or notes.
* **🤖 AI Financial Advisor (Google Gemini):** Bundles monthly expenses in the backend and queries Gemini using strict system instructions to generate a structured financial health report with detected waste and 3 actionable tips.
* **📜 AI Insight History:** Persists all generated AI reports into PostgreSQL (`JSONB`), allowing users to revisit past months' financial analyses anytime.
* **🛡️ Row-Level Data Isolation:** Strict backend authorization ensuring users can only read, modify, or delete their own data (`WHERE user_id = $X`). Under no circumstances is `user_id` accepted from the client.
* **📱 Responsive Mobile-First UI:** Built with React (Vite), Tailwind CSS, Lucide React icons, loading skeletons, and interactive alert toasts.

---

## 🛠️ Technology Stack

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Vite, React Router 6, Tailwind CSS, Lucide React, Recharts, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (`pg` pool with SSL support for Replit Postgres / Neon / Supabase) |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` |
| **Validation** | Zod (Schemas for Auth, Expenses, and Gemini JSON output) |
| **Generative AI** | Google Gemini (`@google/genai` SDK - `gemini-2.5-flash`) |

---

## 📁 Repository Structure

```text
├── database/
│   ├── schema.sql              # Production PostgreSQL schema with UUIDs & indexes
│   ├── migrate.js              # Database migration runner script
│   └── seed.js                 # Sample transaction seed script
├── server/
│   ├── config/
│   │   └── db.js               # PostgreSQL connection pool with SSL & health check
│   ├── controllers/
│   │   ├── auth.controller.js  # Registration, login, session check
│   │   ├── expense.controller.js # CRUD, filtering, search, and dashboard summary
│   │   └── insight.controller.js # Gemini financial report generation & history
│   ├── middleware/
│   │   ├── auth.middleware.js  # JWT Bearer token authentication & user context
│   │   └── error.middleware.js # Centralized Zod & HTTP error handling
│   ├── routes/
│   │   ├── auth.routes.js      # /api/auth
│   │   ├── expense.routes.js   # /api/expenses
│   │   ├── insight.routes.js   # /api/insights
│   │   └── health.routes.js    # /api/health
│   ├── services/
│   │   └── ai.service.js       # @google/genai integration with exact system prompt
│   ├── tests/
│   │   ├── auth.test.js        # Auth registration, login, token verification tests
│   │   ├── expense.test.js     # CRUD & data isolation tests (User A vs User B)
│   │   ├── insight.test.js     # AI report validation tests
│   │   └── server.test.js      # Static SPA serving & health check tests
│   ├── validators/
│   │   ├── auth.validator.js   # Zod schemas for register and login
│   │   ├── expense.validator.js# Zod schemas for expense creation & update
│   │   └── insight.validator.js# Zod schemas for month param & Gemini JSON output
│   └── server.js               # Express application entry point & static SPA serving
├── client/
│   ├── src/
│   │   ├── components/         # Navbar, DashboardStats, CategoryChart, ExpenseTable, InsightCard...
│   │   ├── context/            # AuthContext (JWT management & session restore)
│   │   ├── pages/              # LandingPage, LoginPage, RegisterPage, DashboardPage, ExpenseListPage...
│   │   ├── services/           # Axios API wrapper with Bearer token interceptor
│   │   ├── App.jsx             # React Router setup with ProtectedRoute
│   │   └── main.jsx
│   ├── vite.config.js          # Vite config with API proxy
│   └── tailwind.config.js      # Tailwind CSS styling configuration
├── .env.example                # Template with required environment variables
├── .gitignore
├── package.json                # Root orchestrator scripts
└── README.md
```

---

## 🗄️ Database Schema (`database/schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    merchant VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_month VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    insight_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, report_month)
);

CREATE INDEX idx_expenses_user_date ON expenses(user_id, expense_date);
CREATE INDEX idx_expenses_user_category ON expenses(user_id, category);
CREATE INDEX idx_ai_insights_user_month ON ai_insights(user_id, report_month);
```

---

## 🏷️ Supported Expense Categories

* `Housing`
* `Transportation`
* `Food & Dining`
* `Utilities`
* `Entertainment`
* `Healthcare`
* `Shopping`
* `Personal Care`
* `Miscellaneous`

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js** (v18 or higher)
* **PostgreSQL** database (e.g. Replit PostgreSQL, Neon, Supabase, or local PostgreSQL)
* **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in the values:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://username:password@host:5432/database
JWT_SECRET=your_super_secret_jwt_random_key_here
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
npm run install:all
```

### 4. Run Database Migrations
```bash
npm run migrate
```
*(Optional) Seed sample data:*
```bash
npm run seed
```

### 5. Start Development Servers
Runs both the Express API (port 5000) and the Vite React frontend (port 5173):
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 6. Production Build & Deployment
Build the React frontend and run the production Express server:
```bash
npm run build
npm start
```
The Express server will serve both the `/api` endpoints and the optimized React SPA static assets from `client/dist`.

---

## 🧪 Running Automated Tests

Run the full integration test suite (28 passing tests):
```bash
npm test
```

The test suite validates:
1. **User Authentication:** Registration, duplicate email rejection, password validation, login, token verification, and `/api/auth/me`.
2. **Expense CRUD & Validation:** Positive amount checks, category enum validation, updating, and deleting.
3. **Row-Level Security & Data Isolation:** Alice and Bob cannot read, modify, or delete each other's expenses (verified via strict 404 responses).
4. **Gemini Output Schemas:** Zod validation of required fields (`total_analyzed_amount`, `category_breakdown`, `unnecessary_spending_identified`, and exactly 3 `actionable_tips`).
5. **Static Assets & Health:** SPA serving and `/api/health` checks.

---

## 📡 REST API Reference

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register new account (`{name, email, password}`) |
| `POST` | `/api/auth/login` | Public | Login with credentials (`{email, password}`) |
| `GET` | `/api/auth/me` | Bearer Token | Fetch current authenticated user |
| `GET` | `/api/expenses` | Bearer Token | List expenses with optional `?month=YYYY-MM`, `?category=...`, `?search=...` |
| `GET` | `/api/expenses/summary` | Bearer Token | Aggregated stats (total spent, category breakdown, recent 5) |
| `GET` | `/api/expenses/:id` | Bearer Token | Fetch expense by ID (enforces user ownership) |
| `POST` | `/api/expenses` | Bearer Token | Create new expense |
| `PUT` | `/api/expenses/:id` | Bearer Token | Update existing expense |
| `DELETE` | `/api/expenses/:id` | Bearer Token | Delete expense record |
| `GET` | `/api/insights` | Bearer Token | List all saved AI monthly reports |
| `GET` | `/api/insights/:month` | Bearer Token | Get AI report for specific month |
| `POST` | `/api/insights/generate` | Bearer Token | Query Gemini to analyze month (`{month: "YYYY-MM"}`) |
| `GET` | `/api/health` | Public | System status and database connectivity |

---

## 🔒 Security & Data Integrity

1. **Client Security:** Gemini API keys are never exposed to the frontend or included in Vite bundles.
2. **SQL Injection Defense:** All queries strictly use parameterized queries (`$1, $2, ...`) via the `pg` driver.
3. **Data Isolation:** All operations enforce `WHERE user_id = $X` using verified JWT claims. Users cannot manipulate or query other users' data.
4. **XSS Protection:** React JSX automatically escapes content. No `dangerouslySetInnerHTML` is used.
5. **Prompt Injection Mitigation:** Strict system prompt limits the model to mathematical and habit analysis of the provided JSON transactions.
