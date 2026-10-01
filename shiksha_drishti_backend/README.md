# 🎓 Shiksha Drishti — Backend API

> **Chhattisgarh State Education Intelligence & Student Performance Monitoring Platform**  
> A high-performance RESTful API backend powering state-wide, district, block, cluster, and school-level educational analytics.

---

## 📌 Overview

**Shiksha Drishti** (शिक्षा दृष्टि) is an end-to-end academic evaluation and intelligence monitoring platform developed for the Department of School Education, Government of Chhattisgarh. It processes student assessments, generates diagnostic metrics, monitors teacher compliance, and tracks state-wide learning outcomes in real time.

---

## 🚀 Key Features & Capabilities

- 🏛️ **Multi-Tier Role-Based Access Control (RBAC)**:
  - `STATE_ADMIN` / `SUPER_ADMIN`: Comprehensive state-wide executive command center and macro analytics.
  - `DISTRICT_OFFICER` (`DEO`): District-level performance, inter-block comparisons, and school rankings.
  - `BLOCK_OFFICER` (`BEO`): Block-level monitoring and cluster diagnostics.
  - `CAC` / `CLUSTER_COORDINATOR`: Cluster-level monitoring and field visit tracking.
  - `SCHOOL_ADMIN` (Principal): School dashboard, teacher evaluations, and class report cards.
  - `TEACHER`: Assessment creation, student marks entry, and question-level diagnostic capture.
- 📊 **State-Wide Student Performance Engine**:
  - Full grade distributions (`A+`, `A`, `B`, `C`, `Remedial`) and pass percentages.
  - Subject and class performance benchmarking matrices.
  - Honor Roll (top rankers) and urgent Remedial Priority Cohort identification.
  - Gender equity analytics and district league standings.
- ⚡ **Optimized Database Architecture**:
  - High-throughput PostgreSQL connection pooling (`pg-pool`) with pipelined query batching.
  - Resilient session management via Redis with in-memory fallback for local development.
  - Rate limiting, security headers via Helmet, and CORS origin protection.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+) / Express.js
- **Database**: PostgreSQL (v14+)
- **Cache & Sessions**: Redis (via `ioredis`) with in-memory fallback
- **Authentication**: JWT (JSON Web Tokens) with cryptographically signed tokens
- **Security**: `helmet`, `cors`, `bcryptjs`, `express-rate-limit`

---

## 📁 Project Structure

```
shiksha_drishti_backend/
├── migrations/                # SQL migrations & database seed scripts
│   ├── run_migrations.js      # Migration runner
│   └── seed_from_attendance.js# Database seeder
├── src/
│   ├── app.js                 # Express application setup & middleware
│   ├── config/
│   │   ├── db.js              # PostgreSQL pool configuration
│   │   └── redis.js           # Redis client & memory fallback
│   ├── controllers/
│   │   ├── auth.controller.js       # Authentication & profile
│   │   ├── state.controller.js      # State admin student & school analytics
│   │   ├── district.controller.js   # District officer analytics
│   │   ├── block.controller.js      # Block officer analytics
│   │   ├── cluster.controller.js    # CAC / cluster monitoring
│   │   ├── principal.controller.js  # School principal dashboard
│   │   └── assessment.controller.js # Assessment & marks management
│   ├── middleware/
│   │   ├── auth.js            # JWT verification & session validation
│   │   └── errorHandler.js    # Centralized error handler
│   ├── routes/                # Express route declarations
│   └── utils/                 # Token helpers, response formatters
├── server.js                  # Entry point
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (>= 18.x)
- PostgreSQL (>= 14.x)
- Redis (Optional, fallback enabled)

### 2. Clone and Install Dependencies
```bash
cd shiksha_drishti_backend
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the root directory:
```env
PORT=4000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shiksha_drishti
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MAX=25

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=sd:

# Security & JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=12h
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

### 4. Database Setup & Migrations
```bash
# Run database migrations
npm run migrate

# Seed sample data (optional)
npm run seed
```

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```
Server will be running at `http://localhost:4000`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description | Access Role |
|---|---|---|---|
| `POST` | `/api/auth/login` | User login & token generation | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | All authenticated |
| `GET` | `/api/state/overview` | State-wide summary & KPIs | `STATE_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/state/districts` | District rankings & metrics | `STATE_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/state/students` | State-wide student performance intelligence | `STATE_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/state/questions` | Question-level LO analytics | `STATE_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/state/teachers` | Teacher evaluation compliance matrix | `STATE_ADMIN`, `SUPER_ADMIN` |
| `GET` | `/api/district/overview` | District-level analytics | `DISTRICT_OFFICER` |
| `GET` | `/api/block/overview` | Block-level analytics | `BLOCK_OFFICER` |
| `GET` | `/api/cluster/overview` | Cluster-level analytics | `CAC` |
| `GET` | `/api/principal/overview`| School-level overview | `SCHOOL_ADMIN` |
| `GET` | `/api/assessments` | List & filter assessments | Authenticated roles |

---

## 🔒 Security & Performance
- Parameterized SQL queries preventing SQL injection.
- Pooled connection management with auto-reconnection and timeout guards.
- Protected CORS and Rate-Limiting endpoints to prevent DDoS attacks.
