# 🎓 Shiksha Drishti — Frontend Dashboard

> **State-Wide Education Intelligence & Academic Analytics Web Application**  
> Built with React 19, Material-UI (MUI v9), Framer Motion, and Recharts.

---

## 📌 Overview

The **Shiksha Drishti** frontend provides an intuitive, high-performance command center for educational administrators, officers, school principals, and teachers across Chhattisgarh. It delivers real-time data visualizations, diagnostic report cards, multi-district benchmarking, and student learning outcome monitoring.

---

## 🌟 Key Features

### 1. 🏛️ State Administrator Command Center
- **Executive Overview**: High-level KPIs, grade band distribution charts, critical school alert tracking.
- **State Student Performance (Macro & Micro)**:
  - 4 sub-analytical dimensions: Performance Analytics, District & Block Breakdown, Student Roster Explorer, and Honor Roll vs. Remedial Priority Cohorts.
  - Multi-dimensional filters (District, Class, Subject, Performance Band, Student Search).
- **District Performance League & Radar Benchmarking**: Head-to-head district comparisons on multi-metric radar charts.
- **Question-Level Diagnostics (LOs)**: Identifying state-wide learning outcome weaknesses.
- **Teacher Compliance Matrix**: Evaluation completion monitoring.
- **Automated Dossier & Report Builder**: Styled Excel (.xlsx) and printable executive PDF/HTML report generation.

### 2. 🏫 Role-Adaptive Dashboards
- **District Dashboard (`DEO`)**: District metrics, inter-block benchmarking, school performance rankings.
- **Block Dashboard (`BEO`)**: Block-level indicators and cluster rankings.
- **Cluster Dashboard (`CAC`)**: Cluster school performance and school academic visit tracker.
- **Principal Dashboard (`SCHOOL_ADMIN`)**: Class-wise performance, teacher compliance, student grade distributions, and remedial intervention rosters.
- **Teacher Dashboard**: Student roster, marks entry portal, and class report cards.

### 3. 🎨 Modern Design & User Experience
- Material-UI v9 customized theme with modern color palettes and micro-interactions.
- Fluid transitions and entry animations via Framer Motion.
- Rich responsive chart visualizations (Recharts): Area, Bar, Line, Pie, Radar charts with custom tooltips.
- TV Kiosk full-screen presentation mode for state control rooms.

---

## 🛠️ Tech Stack

- **Framework**: React 19 (`react`, `react-dom`, `react-router-dom`)
- **Build Tool**: Vite 8
- **UI & Icons**: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `lucide-react`
- **Charts & Visualizations**: `recharts`
- **Animations**: `framer-motion`, `@tsparticles/react`
- **HTTP Client**: `axios` with JWT interceptors
- **Excel Exporting**: `exceljs`, `file-saver`
- **Notifications**: `notistack`

---

## 📁 Project Structure

```
shiksha_drishti_frontend/
├── src/
│   ├── assets/                # Logos, graphics, SVG illustrations
│   ├── components/
│   │   ├── auth/              # Login page & authentication components
│   │   ├── common/            # AppLayout, Navbar, Sidebar, ProtectedRoute
│   │   ├── dashboard/         # Role-specific dashboards:
│   │   │   ├── StateDashboard.jsx           # State Command Center (8 tabs)
│   │   │   ├── AdminStudentPerformance.jsx  # State-wide student intelligence
│   │   │   ├── DistrictDashboard.jsx        # DEO Dashboard
│   │   │   ├── BlockDashboard.jsx           # BEO Dashboard
│   │   │   ├── CacDashboard.jsx             # Cluster Coordinator Dashboard
│   │   │   ├── PrincipalDashboard.jsx       # School Principal Dashboard
│   │   │   └── TeacherDashboard.jsx         # Teacher Dashboard
│   │   ├── marks/             # Mark entry, assessments, student list, report cards
│   │   └── school/            # School profile and infrastructure
│   ├── context/               # AuthContext (JWT & profile state)
│   ├── services/              # Axios API service definitions
│   ├── theme/                 # MUI custom theme & color tokens
│   ├── utils/                 # Excel exports, formatters, calculations
│   ├── App.jsx                # Router configuration & dynamic routing
│   └── main.jsx               # Entry point
├── index.html
├── vite.config.js
└── package.json
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (>= 18.x)
- Running backend API server (`shiksha_drishti_backend` at port `4000`)

### 2. Install Dependencies
```bash
cd shiksha_drishti_frontend
npm install
```

### 3. Environment Variables Configuration
Create a `.env` file in the frontend root:
```env
VITE_API_URL=http://localhost:4000/api
```

### 4. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## 📊 Export Capabilities
- **District Performance League (`.xlsx`)**: Formatted rankings with conditional grade coloring.
- **Critical Intervention Schools (`.xlsx`)**: Underperforming school roster with UDISE and principal contacts.
- **Question LO Diagnostics (`.xlsx`)**: Learning outcome error-rate breakdowns.
- **Executive State Dossier (`.xlsx` & `.html`)**: Multi-sheet formatted workbook for Directorate review meetings.
