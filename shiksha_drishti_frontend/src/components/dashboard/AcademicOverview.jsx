/**
 * AcademicOverview.jsx
 * Overall Academic Marks & UDISE Analytics Dashboard
 * Light Modern Theme with 2-Row 8-KPI Grid & Interactive Analytics
 * Based on 5.75M active student records (studentstatus = 1) from student_data DB.
 * State: Chhattisgarh (UDISE code prefix 22)
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Button, CircularProgress,
  Alert, MenuItem, Select, FormControl, InputLabel, Stack, Divider,
  LinearProgress, alpha, Grid, Tooltip, Breadcrumbs
} from "@mui/material";
import {
  School, People, TrendingUp, EmojiEvents, Female, Male, Refresh,
  BarChart as BarChartIcon, PieChart as PieChartIcon, Insights,
  Groups, Star, WorkspacePremium, Accessible, VolunteerActivism,
  FilterAlt, AccountBalance, Domain, CheckCircle, Cancel,
  PendingActions, PersonOff, ChevronRight, LocationCity, ClassOutlined
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  PieChart, Pie, Cell,
  ComposedChart, Line, ReferenceLine
} from "recharts";
import { motion } from "framer-motion";
import { academicApi, masterApi } from "../../services/api";

/* ─── Color Palette (Light Theme) ─────────────────────────────────────────── */
const PALETTE = {
  primary:    "#0f172a", // Slate 900
  secondary:  "#475569", // Slate 600
  muted:      "#64748b", // Slate 500
  border:     "#e2e8f0", // Slate 200
  bgSoft:     "#f8fafc", // Slate 50
  bgHover:    "#f1f5f9", // Slate 100

  // Brand Accents
  sky:        "#0284c7", // Sky 600
  emerald:    "#059669", // Emerald 600
  amber:      "#d97706", // Amber 600
  rose:       "#e11d48", // Rose 600
  violet:     "#7c3aed", // Violet 600
  indigo:     "#4f46e5", // Indigo 600
  teal:       "#0d9488", // Teal 600
  orange:     "#ea580c", // Orange 600
  blue:       "#2563eb", // Blue 600
};

const GENDER_COLORS = { Male: "#0284c7", Female: "#e11d48" };
const CAT_COLORS    = ["#0284c7", "#059669", "#d97706", "#7c3aed"];
const RESULT_COLORS = {
  Pass:           "#059669",
  Fail:           "#e11d48",
  Compartment:    "#d97706",
  Absent:         "#64748b",
  "Not Appeared": "#94a3b8",
  Detained:       "#ea580c",
  Other:          "#7c3aed"
};

const GRADE_COLORS = {
  "A+ (90-100)": "#059669",
  "A  (75-89)":  "#0284c7",
  "B  (60-74)":  "#4f46e5",
  "C  (45-59)":  "#d97706",
  "D  (33-44)":  "#ea580c",
  "Fail (<33)":  "#e11d48"
};

const CLASS_PALETTE = [
  "#0284c7", "#059669", "#7c3aed", "#d97706", "#e11d48",
  "#0d9488", "#ea580c", "#4f46e5", "#0f172a", "#64748b",
  "#2563eb", "#a855f7", "#10b981"
];

const MANAGEMENT_OPTIONS = [
  { value: "",   label: "All School Managements (Govt + Private + Others)" },
  { value: "1",  label: "🏛️ Govt Schools (Dept. of Education - sch_mgmt_id = 1)" },
  { value: "5",  label: "🏫 Private Unaided (Recognized - sch_mgmt_id = 5)" },
  { value: "4",  label: "🏫 Govt Aided Schools (sch_mgmt_id = 4)" },
  { value: "11", label: "🏛️ Other State Govt. Managed (sch_mgmt_id = 11)" },
  { value: "2",  label: "🏛️ Tribal Development Dept. (sch_mgmt_id = 2)" },
  { value: "6",  label: "🏛️ Social Welfare Dept. (sch_mgmt_id = 6)" },
  { value: "95", label: "🏢 Kendriya Vidyalaya (sch_mgmt_id = 95)" },
  { value: "94", label: "🏢 Jawahar Navodaya Vidyalaya (sch_mgmt_id = 94)" },
];

const fade  = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: "easeOut" } };
const stagger = (i) => ({ ...fade, transition: { duration: 0.3, delay: i * 0.05, ease: "easeOut" } });

/* ─── Light Chart Tooltip ─────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: "#0f172a",
      color: "#ffffff",
      borderRadius: 2,
      p: 1.5,
      boxShadow: "0 10px 30px rgba(15,23,42,0.3)",
      minWidth: 160,
      border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <Typography sx={{ color: "#94a3b8", fontSize: "0.72rem", fontWeight: 700, mb: 0.75, pb: 0.5, borderBottom: "1px solid #334155" }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 0.4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill }} />
            <Typography sx={{ color: "#cbd5e1", fontSize: "0.72rem", fontWeight: 600 }}>{p.name}:</Typography>
          </Box>
          <Typography sx={{ color: "#ffffff", fontSize: "0.75rem", fontWeight: 800 }}>
            {typeof p.value === "number" ? (p.value % 1 !== 0 ? p.value.toFixed(1) : Number(p.value).toLocaleString("en-IN")) : p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ─── Premium Light KPI Card ──────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color = PALETTE.sky, delay = 0, badgeText = "" }) {
  return (
    <motion.div {...stagger(delay)} style={{ height: "100%" }}>
      <Card
        elevation={0}
        sx={{
          background: "#ffffff",
          border: `1px solid ${PALETTE.border}`,
          borderRadius: 3.5,
          height: "100%",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(15, 23, 42, 0.04)",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: `0 12px 24px -4px ${alpha(color, 0.16)}, 0 4px 12px -2px rgba(15, 23, 42, 0.06)`,
            borderColor: alpha(color, 0.4),
          },
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3.5,
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.4)})`,
          }
        }}
      >
        <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: alpha(color, 0.09),
                border: `1px solid ${alpha(color, 0.18)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: color,
              }}
            >
              {icon}
            </Box>
            {badgeText && (
              <Chip
                size="small"
                label={badgeText}
                sx={{
                  height: 20,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  background: alpha(color, 0.08),
                  color: color,
                  border: `1px solid ${alpha(color, 0.2)}`,
                  borderRadius: 1.5,
                }}
              />
            )}
          </Box>
          <Typography
            sx={{
              color: "#0f172a",
              fontSize: "1.75rem",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif'
            }}
          >
            {value}
          </Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, mt: 0.5 }}>
            {label}
          </Typography>
          {sub && (
            <Typography sx={{ color: color, fontSize: "0.72rem", fontWeight: 700, mt: 0.3 }}>
              {sub}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Premium Light Section Card ──────────────────────────────────────────── */
function SectionCard({ title, subtitle, icon, children, delay = 0, sx = {}, action = null }) {
  return (
    <motion.div {...stagger(delay)} style={{ width: "100%" }}>
      <Card
        elevation={0}
        sx={{
          background: "#ffffff",
          border: `1px solid ${PALETTE.border}`,
          borderRadius: 3.5,
          overflow: "hidden",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 6px 16px -4px rgba(15, 23, 42, 0.04)",
          transition: "box-shadow 0.2s ease",
          "&:hover": {
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
          },
          ...sx,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 4px 10px rgba(15,23,42,0.15)",
                }}
              >
                {icon}
              </Box>
              <Box>
                <Typography
                  sx={{
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    lineHeight: 1.2
                  }}
                >
                  {title}
                </Typography>
                {subtitle && (
                  <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 500, mt: 0.2 }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            </Box>
            {action}
          </Box>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Light Loading Skeleton ──────────────────────────────────────────────── */
function LoadingCard() {
  return (
    <Card elevation={0} sx={{ background: "#ffffff", border: `1px solid ${PALETTE.border}`, borderRadius: 3.5, p: 3, height: 160 }}>
      <LinearProgress sx={{ borderRadius: 1, mb: 2, height: 6, background: "#f1f5f9", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #0284c7, #059669)" } }} />
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 3 }}>
        {[1, 2, 3].map(i => <Box key={i} sx={{ flex: 1, minWidth: 80, height: 16, borderRadius: 1, background: "#f1f5f9" }} />)}
      </Box>
    </Card>
  );
}

/* ─── Main Academic Overview Component ─────────────────────────────────────── */
export default function AcademicOverview() {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [classGroup, setClassGroup]             = useState("");
  const [schMgmt, setSchMgmt]                   = useState(""); // "" = All, "1" = Govt (Dept of Ed), "5" = Private
  const [districts, setDistricts]               = useState([]);

  const [summary,      setSummary]      = useState(null);
  const [classwise,    setClasswise]    = useState([]);
  const [districtwise, setDistrictwise] = useState([]);
  const [gender,       setGender]       = useState([]);
  const [category,     setCategory]     = useState([]);
  const [results,      setResults]      = useState([]);
  const [marks,        setMarks]        = useState([]);
  const [special,      setSpecial]      = useState(null);
  const [rankings,     setRankings]     = useState([]);

  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  /* Fetch districts for dropdown */
  useEffect(() => {
    masterApi.getDistricts()
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.districts || []);
        setDistricts(list);
      })
      .catch(err => console.error("District fetch error:", err));
  }, []);

  /* Build query params */
  const params = useMemo(() => {
    const p = {};
    if (selectedDistrict) p.district_cd = selectedDistrict;
    if (classGroup)       p.class_group = classGroup;
    if (schMgmt)          p.sch_mgmt_id = schMgmt;
    return p;
  }, [selectedDistrict, classGroup, schMgmt]);

  /* Fetch all analytics */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await academicApi.getBundle(params);
      const b = res.data?.data || {};
      setSummary(b.summary || null);
      setClasswise(b.classwise || []);
      setDistrictwise(b.districtwise || []);
      setGender(b.gender || []);
      setCategory(b.category || []);
      setResults(b.results || []);
      setMarks(b.marks || []);
      setSpecial(b.special || null);
      setRankings(b.rankings || []);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Academic overview fetch error:", e);
      setError(e?.response?.data?.error || "Failed to load academic data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Formatter Helpers ── */
  const fmtN   = (n) => n == null ? "—" : Number(n).toLocaleString("en-IN");
  const fmtPct = (n) => n == null ? "—" : `${Number(n).toFixed(1)}%`;

  const genderPieData = useMemo(() => gender.map(g => ({ name: g.gender_label, value: g.total })), [gender]);
  const resultPieData = useMemo(() => results.filter(r => r.total > 0).map(r => ({ name: r.label, value: r.total })), [results]);

  /* ── Top 12 districts for bar chart ── */
  const topDistricts = useMemo(() =>
    [...districtwise].sort((a, b) => b.pass_pct - a.pass_pct).slice(0, 12),
  [districtwise]);

  const activeMgmtLabel = useMemo(() => {
    if (!schMgmt) return "All School Managements";
    if (schMgmt === "1") return "Govt Schools (Dept. of Education)";
    if (schMgmt === "5") return "Private Unaided Schools";
    const found = MANAGEMENT_OPTIONS.find(o => o.value === schMgmt);
    return found ? found.label : `Management ID: ${schMgmt}`;
  }, [schMgmt]);

  if (loading && !summary) return (
    <Box sx={{ p: 3, minHeight: "100vh", background: "#f8fafc" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2.5, mb: 3 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <LoadingCard key={i} />)}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, gap: 2.5 }}>
        <LoadingCard /><LoadingCard />
      </Box>
    </Box>
  );

  if (error && !summary) return (
    <Box sx={{ p: 3, minHeight: "100vh", background: "#f8fafc" }}>
      <Alert
        severity="error"
        action={<Button onClick={fetchAll} size="small" variant="contained" color="error">Retry</Button>}
        sx={{ borderRadius: 3 }}
      >
        {error}
      </Alert>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
      p: { xs: 2, md: 3.5 },
    }}>

      {/* ── Page Header ── */}
      <motion.div {...fade}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
              <Box sx={{
                width: 46, height: 46, borderRadius: 2.5,
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#ffffff", boxShadow: "0 6px 16px rgba(2,132,199,0.25)",
              }}>
                <Insights sx={{ fontSize: 26 }} />
              </Box>
              <Box>
                <Typography sx={{ color: "#0f172a", fontWeight: 900, fontSize: { xs: "1.35rem", md: "1.65rem" }, fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                  Overall Academic Analytics
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.4, flexWrap: "wrap" }}>
                  <Typography sx={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 500 }}>
                    Chhattisgarh State · Active Students (<code>studentstatus = 1</code>) · <strong style={{ color: "#0f172a" }}>{fmtN(summary?.total_students)}</strong> students
                  </Typography>
                  <Chip
                    size="small"
                    label={activeMgmtLabel}
                    sx={{
                      height: 22,
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      background: schMgmt === "1" ? alpha(PALETTE.emerald, 0.1) : schMgmt === "5" ? alpha(PALETTE.violet, 0.1) : alpha(PALETTE.sky, 0.1),
                      color: schMgmt === "1" ? PALETTE.emerald : schMgmt === "5" ? PALETTE.violet : PALETTE.sky,
                      border: `1px solid ${schMgmt === "1" ? alpha(PALETTE.emerald, 0.3) : alpha(PALETTE.sky, 0.25)}`,
                      borderRadius: 1.5
                    }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {lastRefresh && (
              <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 500 }}>
                Last updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            )}
            <Button
              startIcon={<Refresh />}
              onClick={fetchAll}
              size="small"
              variant="outlined"
              sx={{
                background: "#ffffff",
                borderColor: "#cbd5e1",
                color: "#0f172a",
                borderRadius: 2.5,
                fontWeight: 700,
                fontSize: "0.78rem",
                textTransform: "none",
                px: 2,
                py: 0.6,
                boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                "&:hover": { background: "#f8fafc", borderColor: "#94a3b8" },
              }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* ── Filters Control Bar ── */}
      <motion.div {...stagger(1)}>
        <Card
          elevation={0}
          sx={{
            background: "#ffffff",
            border: `1px solid ${PALETTE.border}`,
            borderRadius: 3.5,
            mb: 3,
            p: 2,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: PALETTE.sky }}>
              <FilterAlt sx={{ fontSize: 20 }} />
              <Typography sx={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 800 }}>
                Filters:
              </Typography>
            </Box>

            {/* Quick Management Selector Pills */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
              <Button
                size="small"
                variant={schMgmt === "" ? "contained" : "outlined"}
                onClick={() => setSchMgmt("")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  py: 0.5,
                  px: 1.5,
                  background: schMgmt === "" ? "#0f172a" : "#ffffff",
                  borderColor: schMgmt === "" ? "transparent" : "#cbd5e1",
                  color: schMgmt === "" ? "#ffffff" : "#475569",
                  boxShadow: schMgmt === "" ? "0 2px 6px rgba(15,23,42,0.2)" : "none",
                  "&:hover": { background: schMgmt === "" ? "#1e293b" : "#f8fafc", borderColor: "#94a3b8" }
                }}
              >
                All Schools (5.20M)
              </Button>
              <Button
                size="small"
                startIcon={<AccountBalance sx={{ fontSize: 16 }} />}
                variant={schMgmt === "1" ? "contained" : "outlined"}
                onClick={() => setSchMgmt("1")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  py: 0.5,
                  px: 1.5,
                  background: schMgmt === "1" ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : "#ffffff",
                  borderColor: schMgmt === "1" ? "transparent" : alpha(PALETTE.emerald, 0.4),
                  color: schMgmt === "1" ? "#ffffff" : PALETTE.emerald,
                  boxShadow: schMgmt === "1" ? "0 2px 8px rgba(5,150,105,0.25)" : "none",
                  "&:hover": { background: schMgmt === "1" ? "#047857" : alpha(PALETTE.emerald, 0.08), borderColor: PALETTE.emerald }
                }}
              >
                Govt Schools (3.39M)
              </Button>
              <Button
                size="small"
                startIcon={<Domain sx={{ fontSize: 16 }} />}
                variant={schMgmt === "5" ? "contained" : "outlined"}
                onClick={() => setSchMgmt("5")}
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  py: 0.5,
                  px: 1.5,
                  background: schMgmt === "5" ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)" : "#ffffff",
                  borderColor: schMgmt === "5" ? "transparent" : alpha(PALETTE.violet, 0.4),
                  color: schMgmt === "5" ? "#ffffff" : PALETTE.violet,
                  boxShadow: schMgmt === "5" ? "0 2px 8px rgba(124,58,237,0.25)" : "none",
                  "&:hover": { background: schMgmt === "5" ? "#6d28d9" : alpha(PALETTE.violet, 0.08), borderColor: PALETTE.violet }
                }}
              >
                Private Unaided (1.73M)
              </Button>
            </Box>

            <Divider orientation="vertical" flexItem sx={{ borderColor: "#e2e8f0", my: 0.5 }} />

            {/* School Management Full Dropdown */}
            <FormControl size="small" sx={{ minWidth: 230 }}>
              <InputLabel sx={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>School Management</InputLabel>
              <Select
                value={schMgmt}
                label="School Management"
                onChange={(e) => setSchMgmt(e.target.value)}
                sx={{
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: "#f8fafc",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
                }}
              >
                {MANAGEMENT_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: "0.8rem" }}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* District Dropdown */}
            <FormControl size="small" sx={{ minWidth: 190 }}>
              <InputLabel sx={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>District</InputLabel>
              <Select
                value={selectedDistrict}
                label="District"
                onChange={(e) => setSelectedDistrict(e.target.value)}
                sx={{
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: "#f8fafc",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
                }}
              >
                <MenuItem value="">All Districts ({districts.length || 33})</MenuItem>
                {districts.map(d => (
                  <MenuItem key={d.district_cd} value={d.district_cd} sx={{ fontSize: "0.8rem" }}>
                    {d.district_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Class Group Dropdown */}
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 600 }}>Class Group</InputLabel>
              <Select
                value={classGroup}
                label="Class Group"
                onChange={(e) => setClassGroup(e.target.value)}
                sx={{
                  color: "#0f172a",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: "#f8fafc",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#cbd5e1" },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
                }}
              >
                <MenuItem value="">All Classes</MenuItem>
                <MenuItem value="preprimary">Pre-Primary (Nursery–KG)</MenuItem>
                <MenuItem value="primary">Primary (1–8)</MenuItem>
                <MenuItem value="secondary">Secondary (9–12)</MenuItem>
              </Select>
            </FormControl>

            {(selectedDistrict || classGroup || schMgmt) && (
              <Button
                size="small"
                onClick={() => { setSelectedDistrict(""); setClassGroup(""); setSchMgmt(""); }}
                sx={{ color: PALETTE.rose, fontSize: "0.75rem", fontWeight: 700, textTransform: "none", ml: "auto" }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Card>
      </motion.div>

      {/* ── 2-Row 8-KPI Grid ── */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gap: 2.5,
        mb: 3
      }}>
        {/* Row 1: Core Enrollment & Infrastructure */}
        <KpiCard
          icon={<People sx={{ fontSize: 24 }} />}
          label="Total Active Students"
          value={fmtN(summary?.total_students)}
          badgeText="Active (Status = 1)"
          color={PALETTE.sky}
          delay={0}
        />
        <KpiCard
          icon={<School sx={{ fontSize: 24 }} />}
          label="Total Schools"
          value={fmtN(summary?.total_schools)}
          badgeText="UDISE Registered"
          color={PALETTE.emerald}
          delay={1}
        />
        <KpiCard
          icon={<TrendingUp sx={{ fontSize: 24 }} />}
          label="Overall Pass %"
          value={fmtPct(summary?.pass_percentage)}
          sub="Previous Academic Year"
          badgeText="State Exam"
          color={PALETTE.violet}
          delay={2}
        />
        <KpiCard
          icon={<EmojiEvents sx={{ fontSize: 24 }} />}
          label="Average Score"
          value={summary?.avg_marks ? `${Number(summary.avg_marks).toFixed(1)}%` : "—"}
          sub="Across all subjects"
          badgeText="Mean Marks"
          color={PALETTE.amber}
          delay={3}
        />

        {/* Row 2: Demographics & Equity */}
        <KpiCard
          icon={<Male sx={{ fontSize: 24 }} />}
          label="Male Students"
          value={fmtN(summary?.male_students)}
          sub={summary?.total_students ? `${fmtPct((summary.male_students / summary.total_students) * 100)} of Total` : null}
          badgeText="Boys Ratio"
          color={PALETTE.blue}
          delay={4}
        />
        <KpiCard
          icon={<Female sx={{ fontSize: 24 }} />}
          label="Female Students"
          value={fmtN(summary?.female_students)}
          sub={summary?.total_students ? `${fmtPct((summary.female_students / summary.total_students) * 100)} of Total` : null}
          badgeText="Girls Ratio"
          color={PALETTE.rose}
          delay={5}
        />
        <KpiCard
          icon={<Accessible sx={{ fontSize: 24 }} />}
          label="CWSN Students"
          value={fmtN(summary?.cwsn_students)}
          sub={special?.cwsn_pct ? `${fmtPct(special.cwsn_pct)} of Enrollment` : "Special Needs"}
          badgeText="Inclusive Ed."
          color={PALETTE.teal}
          delay={6}
        />
        <KpiCard
          icon={<VolunteerActivism sx={{ fontSize: 24 }} />}
          label="EWS Students"
          value={fmtN(summary?.ews_students)}
          sub={special?.ews_pct ? `${fmtPct(special.ews_pct)} of Enrollment` : "Economically Weaker"}
          badgeText="RTE Support"
          color={PALETTE.orange}
          delay={7}
        />
      </Box>

      {/* ── Exam Outcome Pills ── */}
      <motion.div {...stagger(2)}>
        <Card
          elevation={0}
          sx={{
            background: "#ffffff",
            border: `1px solid ${PALETTE.border}`,
            borderRadius: 3.5,
            p: 2.25,
            mb: 3,
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)"
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {[
              { label: "Passed Students", value: fmtN(summary?.passed), color: PALETTE.emerald, bg: "#ecfdf5", border: "#a7f3d0", icon: <CheckCircle sx={{ fontSize: 18, color: PALETTE.emerald }} /> },
              { label: "Failed Students", value: fmtN(summary?.failed), color: PALETTE.rose, bg: "#fff1f2", border: "#fecdd3", icon: <Cancel sx={{ fontSize: 18, color: PALETTE.rose }} /> },
              { label: "Compartment", value: fmtN(summary?.compartment), color: PALETTE.amber, bg: "#fffbeb", border: "#fde68a", icon: <PendingActions sx={{ fontSize: 18, color: PALETTE.amber }} /> },
              { label: "Absent / Not Appeared", value: fmtN(summary?.absent_not_appeared), color: PALETTE.secondary, bg: "#f8fafc", border: "#e2e8f0", icon: <PersonOff sx={{ fontSize: 18, color: PALETTE.secondary }} /> },
            ].map((item, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.75,
                  borderRadius: 2.5,
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  {item.icon}
                  <Box>
                    <Typography sx={{ color: "#475569", fontSize: "0.74rem", fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ color: item.color, fontSize: "1.15rem", fontWeight: 900, fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.1 }}>
                      {item.value}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>
      </motion.div>

      {/* ── Row 1 Charts: Class-wise Bar Chart + Result Outcomes Pie ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.7fr 1fr" }, gap: 2.5, mb: 2.5 }}>
        <SectionCard
          title="Class-wise Student Distribution & Performance"
          subtitle="Enrollment counts (Male / Female) and Pass % across all classes"
          icon={<BarChartIcon sx={{ fontSize: 20 }} />}
          delay={3}
        >
          {classwise.length > 0 ? (
            <ResponsiveContainer width="100%" height={310}>
              <ComposedChart data={classwise.filter(c => c.classid >= 1 && c.classid <= 12)} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="class_label" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={l => l.replace("Class ", "Cl.")} />
                <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <RTooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ color: "#475569", fontSize: "0.75rem", paddingTop: "10px" }} />
                <Bar yAxisId="left" dataKey="total" name="Total Students" fill={PALETTE.sky} radius={[4, 4, 0, 0]} opacity={0.9} />
                <Bar yAxisId="left" dataKey="male" name="Male" fill={PALETTE.blue} radius={[4, 4, 0, 0]} opacity={0.75} />
                <Bar yAxisId="left" dataKey="female" name="Female" fill={PALETTE.rose} radius={[4, 4, 0, 0]} opacity={0.75} />
                <Line yAxisId="right" type="monotone" dataKey="pass_pct" name="Pass %" stroke={PALETTE.emerald} strokeWidth={3} dot={{ r: 3.5, fill: PALETTE.emerald }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ height: 310, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No Class Data Available
            </Box>
          )}
        </SectionCard>

        <SectionCard
          title="Result Distribution"
          subtitle="Previous year overall student outcomes"
          icon={<PieChartIcon sx={{ fontSize: 20 }} />}
          delay={4}
        >
          {resultPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={resultPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                    {resultPieData.map((entry, i) => (
                      <Cell key={i} fill={RESULT_COLORS[entry.name] || "#64748b"} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 1 }}>
                {resultPieData.map((r, i) => (
                  <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.6, px: 1, py: 0.4, borderRadius: 1.5, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: RESULT_COLORS[r.name] || "#64748b" }} />
                    <Typography sx={{ color: "#475569", fontSize: "0.7rem", fontWeight: 600 }}>
                      {r.name}: <strong style={{ color: "#0f172a" }}>{fmtN(r.value)}</strong>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ height: 210, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No Result Data Available
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ── Row 2 Charts: Gender Analytics + Social Category Analysis ── */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
        <SectionCard
          title="Gender-wise Analysis & Equity"
          subtitle="Enrollment, average score, and pass rate comparison"
          icon={<Groups sx={{ fontSize: 20 }} />}
          delay={5}
        >
          {gender.length > 0 ? (
            <Box>
              {gender.map((g, i) => (
                <Box key={i} sx={{ mb: 2, p: 1.5, borderRadius: 2.5, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {g.gender_label === "Male" ? (
                        <Male sx={{ fontSize: 20, color: PALETTE.blue }} />
                      ) : (
                        <Female sx={{ fontSize: 20, color: PALETTE.rose }} />
                      )}
                      <Typography sx={{ color: "#0f172a", fontWeight: 800, fontSize: "0.88rem" }}>
                        {g.gender_label}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography sx={{ color: "#0f172a", fontSize: "0.82rem", fontWeight: 800 }}>
                        {fmtN(g.total)} students
                      </Typography>
                      <Typography sx={{ color: PALETTE.emerald, fontSize: "0.72rem", fontWeight: 700 }}>
                        Pass Rate: {fmtPct(g.pass_pct)}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ width: "100%", background: "#e2e8f0", borderRadius: 1, overflow: "hidden", height: 8, mb: 1 }}>
                    <Box sx={{
                      width: `${g.pass_pct || 0}%`,
                      height: "100%",
                      background: g.gender_label === "Male" ? "linear-gradient(90deg, #2563eb, #0284c7)" : "linear-gradient(90deg, #e11d48, #f43f5e)",
                      borderRadius: 1,
                      transition: "width 0.8s ease"
                    }} />
                  </Box>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    <Typography sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                      Passed: <strong style={{ color: PALETTE.emerald }}>{fmtN(g.passed)}</strong>
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                      Failed: <strong style={{ color: PALETTE.rose }}>{fmtN(g.failed)}</strong>
                    </Typography>
                    <Typography sx={{ color: "#64748b", fontSize: "0.72rem" }}>
                      Avg Marks: <strong style={{ color: PALETTE.amber }}>{g.avg_marks?.toFixed(1)}%</strong>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No Gender Data
            </Box>
          )}
        </SectionCard>

        <SectionCard
          title="Social Category Performance"
          subtitle="Enrollment and passing rates by social category"
          icon={<WorkspacePremium sx={{ fontSize: 20 }} />}
          delay={6}
        >
          {category.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={category} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="category_label" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <RTooltip content={<ChartTip />} />
                  <Bar dataKey="total" name="Total Students" radius={[4, 4, 0, 0]}>
                    {category.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mt: 1.5 }}>
                {category.map((c, i) => (
                  <Box key={i} sx={{ background: alpha(CAT_COLORS[i % CAT_COLORS.length], 0.06), border: `1px solid ${alpha(CAT_COLORS[i % CAT_COLORS.length], 0.2)}`, borderRadius: 2, p: 1.25 }}>
                    <Typography sx={{ color: CAT_COLORS[i % CAT_COLORS.length], fontSize: "0.75rem", fontWeight: 800 }}>
                      {c.category_label}
                    </Typography>
                    <Typography sx={{ color: "#0f172a", fontSize: "1rem", fontWeight: 900, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {fmtN(c.total)}
                    </Typography>
                    <Typography sx={{ color: PALETTE.emerald, fontSize: "0.7rem", fontWeight: 700 }}>
                      Pass: {fmtPct(c.pass_pct)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box sx={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              No Category Data
            </Box>
          )}
        </SectionCard>
      </Box>

      {/* ── Row 3: Marks Histogram ── */}
      <SectionCard
        title="Academic Performance Bands"
        subtitle="Distribution of students across score ranges in previous year examination"
        icon={<Star sx={{ fontSize: 20 }} />}
        delay={7}
        sx={{ mb: 2.5 }}
      >
        {marks.length > 0 ? (
          <Box>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={marks} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="grade_band" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <RTooltip content={<ChartTip />} />
                <Legend wrapperStyle={{ color: "#475569", fontSize: "0.72rem", paddingTop: "6px" }} />
                <Bar dataKey="students" name="Total Students" radius={[4, 4, 0, 0]}>
                  {marks.map((m, i) => <Cell key={i} fill={GRADE_COLORS[m.grade_band] || "#64748b"} />)}
                </Bar>
                <Bar dataKey="male" name="Male" fill={PALETTE.blue} opacity={0.75} radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Female" fill={PALETTE.rose} opacity={0.75} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2 }}>
              {marks.map((m, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    background: alpha(GRADE_COLORS[m.grade_band] || "#64748b", 0.08),
                    border: `1px solid ${alpha(GRADE_COLORS[m.grade_band] || "#64748b", 0.2)}`
                  }}
                >
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: GRADE_COLORS[m.grade_band] || "#64748b" }} />
                  <Typography sx={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>
                    {m.grade_band}: <strong style={{ color: "#0f172a" }}>{fmtN(m.students)}</strong>
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            No Marks Data
          </Box>
        )}
      </SectionCard>

      {/* ── Row 4: District Rankings & Performance Benchmarking ── */}
      <SectionCard
        title="District Performance Rankings"
        subtitle="Ranked by passing percentage across all districts in Chhattisgarh"
        icon={<EmojiEvents sx={{ fontSize: 20 }} />}
        delay={8}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" }, gap: 3 }}>
          {/* Horizontal Ranking Bar */}
          <Box>
            <ResponsiveContainer width="100%" height={Math.max(420, rankings.length * 28)}>
              <BarChart data={rankings} layout="vertical" margin={{ top: 0, right: 50, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="district_name" tick={{ fill: "#64748b", fontSize: 10.5 }} width={130} tickFormatter={n => n.length > 16 ? n.slice(0, 15) + "…" : n} />
                <RTooltip content={<ChartTip />} />
                <Bar dataKey="pass_pct" name="Pass %" radius={[0, 4, 4, 0]}>
                  {rankings.map((r, i) => (
                    <Cell key={i} fill={i < 5 ? PALETTE.emerald : i > rankings.length - 4 ? PALETTE.rose : PALETTE.sky} />
                  ))}
                </Bar>
                <ReferenceLine x={summary?.pass_percentage || 0} stroke={PALETTE.amber} strokeDasharray="6 3" label={{ value: "State Avg", fill: PALETTE.amber, fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Top & Need Attention Lists */}
          <Box>
            <Typography sx={{ color: PALETTE.emerald, fontSize: "0.82rem", fontWeight: 800, mb: 1.25, display: "flex", alignItems: "center", gap: 0.75 }}>
              🏆 Top 5 Performing Districts
            </Typography>
            {rankings.slice(0, 5).map((r, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                  p: 1.25,
                  borderRadius: 2,
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0"
                }}
              >
                <Typography sx={{ color: PALETTE.emerald, fontWeight: 900, fontSize: "0.85rem", width: 22 }}>
                  #{r.rank}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 700 }}>
                    {r.district_name}
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                    {fmtN(r.total)} students
                  </Typography>
                </Box>
                <Chip
                  label={fmtPct(r.pass_pct)}
                  size="small"
                  sx={{
                    background: PALETTE.emerald,
                    color: "#ffffff",
                    fontWeight: 800,
                    height: 22,
                    fontSize: "0.72rem",
                    borderRadius: 1.5
                  }}
                />
              </Box>
            ))}

            <Typography sx={{ color: PALETTE.rose, fontSize: "0.82rem", fontWeight: 800, mb: 1.25, mt: 2.5, display: "flex", alignItems: "center", gap: 0.75 }}>
              📌 Districts Requiring Attention
            </Typography>
            {rankings.slice(-5).reverse().map((r, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  mb: 1,
                  p: 1.25,
                  borderRadius: 2,
                  background: "#fff1f2",
                  border: "1px solid #fecdd3"
                }}
              >
                <Typography sx={{ color: PALETTE.rose, fontWeight: 900, fontSize: "0.85rem", width: 22 }}>
                  #{r.rank}
                </Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: "#0f172a", fontSize: "0.8rem", fontWeight: 700 }}>
                    {r.district_name}
                  </Typography>
                  <Typography sx={{ color: "#64748b", fontSize: "0.7rem" }}>
                    {fmtN(r.total)} students
                  </Typography>
                </Box>
                <Chip
                  label={fmtPct(r.pass_pct)}
                  size="small"
                  sx={{
                    background: PALETTE.rose,
                    color: "#ffffff",
                    fontWeight: 800,
                    height: 22,
                    fontSize: "0.72rem",
                    borderRadius: 1.5
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>

      {/* ── Row 5: District-wise Summary Bar ── */}
      <SectionCard
        title="Top District Performance Comparison"
        subtitle="Pass % overview for top districts relative to state average"
        icon={<Insights sx={{ fontSize: 20 }} />}
        delay={9}
      >
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={topDistricts} margin={{ top: 10, right: 20, left: 0, bottom: 65 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="district_name" tick={{ fill: "#64748b", fontSize: 10.5 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
            <RTooltip content={<ChartTip />} />
            <Bar dataKey="pass_pct" name="Pass %" radius={[4, 4, 0, 0]}>
              {topDistricts.map((_, i) => <Cell key={i} fill={CLASS_PALETTE[i % CLASS_PALETTE.length]} />)}
            </Bar>
            <ReferenceLine y={summary?.pass_percentage || 0} stroke={PALETTE.amber} strokeDasharray="6 3" label={{ value: "State Avg", position: "insideTopRight", fill: PALETTE.amber, fontSize: 10.5 }} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      {/* ── Special Categories Overview (Commented as requested) ──
      {special && (
        <SectionCard title="Special Categories Overview" subtitle="CWSN, EWS, OOSC, Gifted & more" icon={<VolunteerActivism sx={{ fontSize: 20 }} />} delay={10}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 2 }}>
            {[
              { label: "CWSN", value: special.cwsn, pct: special.cwsn_pct, color: PALETTE.teal },
              { label: "EWS", value: special.ews, pct: special.ews_pct, color: PALETTE.orange },
              { label: "Out of School", value: special.oosc, color: PALETTE.rose },
              { label: "Scholarship", value: special.scholarship, color: PALETTE.violet },
              { label: "Gifted Children", value: special.gifted, color: PALETTE.amber },
              { label: "NCC / NSS", value: special.ncc_nss, color: PALETTE.emerald },
            ].map((item, i) => (
              <Box key={i} sx={{
                p: 2, borderRadius: 3,
                background: alpha(item.color, 0.08),
                border: `1px solid ${alpha(item.color, 0.22)}`,
                textAlign: "center",
              }}>
                <Typography sx={{ color: item.color, fontSize: "1.4rem", fontWeight: 900, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {fmtN(item.value)}
                </Typography>
                <Typography sx={{ color: "#94a3b8", fontSize: "0.73rem", fontWeight: 700, mt: 0.25 }}>{item.label}</Typography>
                {item.pct != null && <Typography sx={{ color: item.color, fontSize: "0.68rem", fontWeight: 800, opacity: 0.85 }}>{fmtPct(item.pct)} of total</Typography>}
              </Box>
            ))}
          </Box>
        </SectionCard>
      )}
      ── */}

    </Box>
  );
}
