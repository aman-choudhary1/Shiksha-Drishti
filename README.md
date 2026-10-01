# 🎓 Shiksha Drishti (शिक्षा दृष्टि)
### Chhattisgarh State Student Performance & Academic Monitoring Platform

[![React](https://img.shields.io/badge/Frontend-React%2019-blue.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![MUI](https://img.shields.io/badge/UI-Material--UI%20v9-007FFF.svg)](https://mui.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%2F%20Govt%20of%20CG-orange.svg)](#)

---

## 🏛️ Executive Summary

**Shiksha Drishti** is an enterprise-grade education intelligence ecosystem built for the Department of School Education, Government of Chhattisgarh. The platform provides data-driven decision-support mechanisms, monitoring student learning outcomes (LOs), school health, teacher evaluation compliance, and district rankings across all 33 districts and 146 blocks of the state.

```
                  ┌─────────────────────────────────────────────────────────┐
                  │          SHIKSHA DRISHTI COMMAND CENTER                 │
                  └──────────────────────────┬──────────────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               │                             │                             │
    ┌──────────▼──────────┐       ┌──────────▼──────────┐       ┌──────────▼──────────┐
    │ State Administrator │       │  District / Block   │       │ School Principal &  │
    │   Executive Hub     │       │   Officer Portal    │       │   Teacher Portal    │
    └─────────────────────┘       └─────────────────────┘       └─────────────────────┘
```

---

## 📂 Monorepo Architecture

This monorepo repository comprises two primary modules:

| Sub-Project | Directory | Description | Port |
|---|---|---|---|
| **Backend API** | [`/shiksha_drishti_backend`](./shiksha_drishti_backend) | RESTful API, PostgreSQL query engine, RBAC auth, and analytics services | `4000` |
| **Frontend Web App** | [`/shiksha_drishti_frontend`](./shiksha_drishti_frontend) | React 19 single-page application with interactive chart dashboards | `5173` |

---

## ✨ System Highlights

- 📊 **State-Wide Student Intelligence**:
  - Macro-to-micro drill-down across 12,000+ student evaluations.
  - Multi-dimensional filters by District, Class (1-12), Subject, and Grade Band (`A+`, `A`, `B`, `C`, `Remedial`).
  - Honor Roll top rankers alongside prioritized Remedial Intervention Cohorts.
- 🎯 **District Performance League & Radar Benchmarking**:
  - Head-to-head multi-metric district comparisons across 6 key indicators.
- 🔍 **Question-Level LO Diagnostics**:
  - Direct identification of struggling learning outcomes state-wide for curriculum intervention.
- 📋 **Automated Executive Dossier & Report Builder**:
  - Formatted multi-sheet Excel workbooks (`.xlsx`), offline printable HTML dossiers, and CSV data export.
- 🔒 **Role-Based Dynamic Access**:
  - Role-adaptive interfaces for State Admin, DEO, BEO, Cluster Coordinator, School Principal, and Teacher.

---

## 🚀 Quick Start & Local Development

### 1. Clone the Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd shiksha-drishti
```

### 2. Backend Setup
```bash
cd shiksha_drishti_backend

# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env   # Or create .env based on the documentation

# 3. Run database migrations
npm run migrate

# 4. Start backend in development mode
npm run dev
```
Backend API will be running on: **`http://localhost:4000`**

### 3. Frontend Setup
```bash
cd ../shiksha_drishti_frontend

# 1. Install dependencies
npm install

# 2. Configure environment variables
# Ensure VITE_API_URL=http://localhost:4000/api in .env

# 3. Start development server
npm run dev
```
Frontend Web Dashboard will be available at: **`http://localhost:5173`**

---

## 🛠️ Technology Stack Summary

### Backend
- **Framework**: Node.js & Express.js
- **Database**: PostgreSQL with connection pooling & query pipelining
- **Authentication**: Signed JSON Web Tokens (JWT) with session control
- **Security**: Rate limiting, CORS protection, Helmet headers

### Frontend
- **Framework**: React 19 + Vite 8
- **UI Library**: Material UI (MUI v9) + Emotion
- **Charts & Visualizations**: Recharts
- **Animations**: Framer Motion
- **Export Engines**: ExcelJS & FileSaver

---

## 📄 Documentation Links
- [Backend Detailed Documentation](./shiksha_drishti_backend/README.md)
- [Frontend Detailed Documentation](./shiksha_drishti_frontend/README.md)
