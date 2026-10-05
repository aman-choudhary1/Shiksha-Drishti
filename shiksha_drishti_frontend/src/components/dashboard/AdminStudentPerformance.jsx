import { useState, useEffect, useCallback, useMemo } from "react";
import { Box, Card, CardContent, Typography, Chip, Button, Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, CircularProgress, Alert, TextField, InputAdornment, MenuItem, Select, IconButton, alpha } from "@mui/material";
import { People, TrendingUp, Warning, CheckCircle, Search, Refresh, EmojiEvents, Insights, CompareArrows, WorkspacePremium, MenuBook, School, MapOutlined, Close, Speed, Groups, Female, Male, BarChart as BarChartIcon } from "@mui/icons-material";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { stateApi, masterApi } from "../../services/api";

const GRADE_COLORS = { "A+": "#10b981", "A": "#0284c7", "B": "#6366f1", "C": "#f59e0b", "Remedial": "#ef4444" };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, ease: "easeOut" } };
const stagger = (i) => ({ ...fadeUp, transition: { duration: 0.35, delay: i * 0.055, ease: "easeOut" } });

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 2.5, p: 1.5, boxShadow: "0 10px 25px -5px rgba(15,23,42,0.12)", minWidth: 160 }}>
      <Typography sx={{ color: "#0f172a", fontSize: "0.78rem", fontWeight: 700, mb: 0.75, pb: 0.5, borderBottom: "1px solid #f1f5f9" }}>{label}</Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mt: 0.4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color || p.fill }} />
            <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 600 }}>{p.name}:</Typography>
          </Box>
          <Typography sx={{ color: "#0f172a", fontSize: "0.75rem", fontWeight: 800 }}>{typeof p.value === "number" && p.value % 1 !== 0 ? p.value.toFixed(1) : Number(p.value).toLocaleString()}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function AdminKpiCard({ label, value, sub, color, gradientTo, icon, badge, delay = 0 }) {
  return (
    <motion.div {...stagger(delay)} style={{ height: "100%" }}>
      <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 1px 3px rgba(15,23,42,0.04)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden", transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)", "&:hover": { transform: "translateY(-3px)", borderColor: color, boxShadow: `0 12px 28px -4px ${alpha(color, 0.18)}` } }}>
        <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3.5, background: `linear-gradient(90deg, ${color}, ${gradientTo || color})` }} />
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, mt: 0.25 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2.2, background: `linear-gradient(135deg, ${color} 0%, ${gradientTo || color} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${alpha(color, 0.28)}`, color: "#ffffff" }}>{icon}</Box>
          {badge && <Chip label={badge} size="small" sx={{ background: alpha(color, 0.08), color, fontWeight: 800, height: 22, borderRadius: 1.5, border: `1px solid ${alpha(color, 0.22)}`, fontSize: "0.68rem" }} />}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
          <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</Typography>
        </Box>
        <Typography sx={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.03em", mb: 0.75 }}>{value}</Typography>
        {sub && <Typography sx={{ fontSize: "0.73rem", color: "#64748b", fontWeight: 500, lineHeight: 1.4, pt: 0.5, borderTop: "1px dashed #f1f5f9" }}>{sub}</Typography>}
      </Card>
    </motion.div>
  );
}

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #0f3460, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 8px rgba(2,132,199,0.2)" }}>{icon}</Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem", fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.2 }}>{title}</Typography>
          {subtitle && <Typography sx={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 500, mt: 0.25 }}>{subtitle}</Typography>}
        </Box>
      </Box>
      {action}
    </Box>
  );
}

function LightCard({ children, sx = {}, delay = 0 }) {
  return (
    <motion.div {...stagger(delay)} style={{ height: "100%", width: "100%" }}>
      <Card elevation={0} sx={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 3, boxShadow: "0 1px 3px rgba(15,23,42,0.04)", height: "100%", width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", ...sx }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function GradeChip({ grade }) {
  const c = GRADE_COLORS[grade] || "#64748b";
  return <Chip label={grade} size="small" sx={{ background: alpha(c, 0.1), color: c, fontWeight: 800, height: 20, fontSize: "0.7rem", border: `1px solid ${alpha(c, 0.25)}` }} />;
}

function InterventionChip({ level }) {
  const map = { CRITICAL: { bg: "#fef2f2", color: "#dc2626" }, HIGH: { bg: "#fff7ed", color: "#ea580c" }, MODERATE: { bg: "#fffbeb", color: "#d97706" } };
  const c = map[level] || map.MODERATE;
  return <Chip label={level} size="small" sx={{ background: c.bg, color: c.color, fontWeight: 800, height: 20, fontSize: "0.68rem" }} />;
}

const EMPTY_OBJ = {};

export default function AdminStudentPerformance({ filterParams = EMPTY_OBJ }) {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [bandFilter, setBandFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [districtFilter, setDistrictFilter] = useState("ALL");
  const [studentSearch, setStudentSearch] = useState("");
  const [masterDistricts, setMasterDistricts] = useState([]);

  useEffect(() => {
    masterApi.getDistricts()
      .then(res => setMasterDistricts(res.data || []))
      .catch(err => console.error('Failed to load master districts:', err));
  }, []);

  const filterParamsKey = useMemo(() => JSON.stringify(filterParams || {}), [filterParams]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const baseParams = JSON.parse(filterParamsKey);
      const params = { ...baseParams };
      if (bandFilter !== "ALL") params.band = bandFilter;
      if (classFilter !== "ALL") params.class_name = classFilter;
      if (districtFilter !== "ALL") params.district = districtFilter;
      if (studentSearch.trim()) params.search = studentSearch.trim();
      const res = await stateApi.getStudents(params);
      setData(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load student performance data.");
    } finally { setLoading(false); setRefreshing(false); }
  }, [filterParamsKey, bandFilter, classFilter, districtFilter, studentSearch]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(t);
  }, [loadData]);

  const kpis = data?.kpis || {};
  const gradeDist = data?.grade_distribution || {};
  const classPerf = data?.class_performance || [];
  const subjectPerf = data?.subject_performance || [];
  const districtBreakdown = data?.district_breakdown || [];
  const blockBreakdown = data?.block_breakdown || [];
  const topStudents = data?.top_students || [];
  const remedialStudents = data?.remedial_students || [];
  const assessmentTrend = data?.assessment_trend || [];
  const benchmarkMatrix = data?.benchmark_matrix || [];
  const genderAnalysis = data?.gender_analysis || {};
  const students = data?.students || [];

  const pieData = useMemo(() => [
    { name: "A+ (>=90%)", value: gradeDist.a_plus || 0, color: "#10b981" },
    { name: "A (75-89%)", value: gradeDist.a || 0, color: "#0284c7" },
    { name: "B (60-74%)", value: gradeDist.b || 0, color: "#6366f1" },
    { name: "C (40-59%)", value: gradeDist.c || 0, color: "#f59e0b" },
    { name: "Remedial <40%", value: gradeDist.remedial || 0, color: "#ef4444" },
  ], [gradeDist]);

  const classBarData = useMemo(() => classPerf.map(c => ({ name: (c.class_name || "").replace("Class ", "Cl."), "Avg Score %": c.avg_score_pct, "Pass Rate %": c.pass_rate_pct, "High Achievers %": c.high_achiever_pct, "Remedial %": c.remedial_rate_pct })), [classPerf]);
  const distBarData = useMemo(() => districtBreakdown.slice(0, 15).map(d => ({ name: (d.district_name || "").substring(0, 10), "Avg Score": d.avg_score_pct, "Pass Rate": d.pass_rate_pct })), [districtBreakdown]);
  const trendData = useMemo(() => [...assessmentTrend].reverse().map(a => ({ name: `${(a.class_name || "").replace("Class", "Cl.")} ${(a.assessment_name || "").substring(0, 8)}`, "Avg Score": a.avg_score_pct, "Pass Rate": a.pass_rate_pct })), [assessmentTrend]);
  const subjectRadarData = useMemo(() => subjectPerf.slice(0, 7).map(s => ({ subject: (s.subject_name || "").substring(0, 12), score: s.avg_score_pct, fullMark: 100 })), [subjectPerf]);
  const genderBarData = useMemo(() => [
    { metric: "Avg Score", Male: genderAnalysis.male?.avg_score || 0, Female: genderAnalysis.female?.avg_score || 0 },
    { metric: "Pass Rate", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.pass_count || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.pass_count || 0) / genderAnalysis.female.count) * 100) : 0 },
    { metric: "High Achv %", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.high_achievers || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.high_achievers || 0) / genderAnalysis.female.count) * 100) : 0 },
    { metric: "Remedial %", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.remedial_count || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.remedial_count || 0) / genderAnalysis.female.count) * 100) : 0 },
  ], [genderAnalysis]);

  const filteredStudents = useMemo(() => students.filter(s => {
    const matchBand = bandFilter === "ALL" || s.performance_band === bandFilter;
    const matchClass = classFilter === "ALL" || s.class_name === classFilter;
    const matchDistrict = districtFilter === "ALL" || s.district_name === districtFilter;
    const q = studentSearch.toLowerCase();
    const matchSearch = !q || (s.student_name || "").toLowerCase().includes(q) || (s.school_name || "").toLowerCase().includes(q) || (s.district_name || "").toLowerCase().includes(q);
    return matchBand && matchClass && matchDistrict && matchSearch;
  }), [students, bandFilter, classFilter, districtFilter, studentSearch]);

  const filteredBlocks = useMemo(() => {
    if (!blockSearch.trim()) return blockBreakdown;
    const q = blockSearch.toLowerCase();
    return blockBreakdown.filter(b => (b.block_name || "").toLowerCase().includes(q) || (b.district_name || "").toLowerCase().includes(q));
  }, [blockBreakdown, blockSearch]);

  const uniqueClasses = useMemo(() => [...new Set(students.map(s => s.class_name).filter(Boolean))].sort(), [students]);
  const uniqueDistricts = useMemo(() => {
    if (masterDistricts.length > 0) {
      return masterDistricts.map(d => d.district_name).sort();
    }
    const fromBreakdown = districtBreakdown.map(d => d.district_name).filter(Boolean);
    const fromStudents = students.map(s => s.district_name).filter(Boolean);
    return [...new Set([...fromBreakdown, ...fromStudents])].sort();
  }, [masterDistricts, districtBreakdown, students]);

  const tabs = [
    "Performance Overview", "Class-Wise Analysis", "Subject Diagnostics",
    "District Drill-Down", "Block Analysis", "Gender Parity",
    "Assessment Trajectory", `Student Directory (${students.length})`, "Honor Roll & Remedial"
  ];

  const tierChipSx = (tier) => ({ fontSize: "0.63rem", fontWeight: 800, height: 20, background: tier === "Excellent" ? "#ecfdf5" : tier === "Good" ? "#f0f9ff" : tier === "Average" ? "#fffbeb" : "#fef2f2", color: tier === "Excellent" ? "#059669" : tier === "Good" ? "#0284c7" : tier === "Average" ? "#d97706" : "#dc2626" });

  const thSx = { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2, borderBottom: "2px solid #e2e8f0" };
  const trSx = { "& td": { py: 1, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, "&:hover": { background: "#fafafa" } };
  const trBlueSx = { "& td": { py: 0.9, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, "&:hover": { background: "#f0f9ff" } };

  if (loading && !data) return (
    <Box sx={{ p: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", gap: 2 }}>
      <CircularProgress size={48} sx={{ color: "#0284c7" }} />
      <Typography sx={{ color: "#0f3460", fontWeight: 800, fontSize: "1.05rem" }}>Loading State Student Performance Intelligence...</Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.82rem" }}>Aggregating data across all districts, blocks, schools and student cohorts</Typography>
    </Box>
  );

  if (error) return <Alert severity="error" sx={{ borderRadius: 3 }} action={<Button onClick={() => loadData()} color="inherit" size="small">Retry</Button>}>{error}</Alert>;

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      {/* Banner */}
      <motion.div {...fadeUp}>
        <Box sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0284c7 100%)", color: "#ffffff", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(15,52,96,0.22)" }}>
          <Box sx={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, position: "relative" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 50, height: 50, borderRadius: 2.5, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <People sx={{ color: "#ffffff", fontSize: 28 }} />
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 0.4 }}>
                  <Typography sx={{ fontSize: { xs: "1.05rem", sm: "1.3rem" }, fontWeight: 900, color: "#ffffff", fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: "-0.02em" }}>State Student Performance Intelligence Center</Typography>
                  <Chip label="LIVE DATA" size="small" sx={{ background: "#10b981", color: "#fff", fontWeight: 800, fontSize: "0.62rem", height: 20 }} />
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.8)", fontSize: "0.8rem" }}>Comprehensive analysis across {(kpis.total_evaluated || 0).toLocaleString()} evaluated students - Chhattisgarh Samagra Shiksha - AY 2026-27</Typography>
              </Box>
            </Box>
            <Button onClick={() => loadData(true)} startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : <Refresh sx={{ fontSize: 16 }} />} disabled={refreshing} sx={{ background: "rgba(255,255,255,0.14)", color: "#ffffff", fontWeight: 700, fontSize: "0.8rem", borderRadius: 2, px: 2, py: 0.8, border: "1px solid rgba(255,255,255,0.3)", "&:hover": { background: "rgba(255,255,255,0.25)" } }}>
              {refreshing ? "Syncing..." : "Refresh"}
            </Button>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.14)" }}>
            {[{ label: "Evaluated Students", val: (kpis.total_evaluated || 0).toLocaleString() }, { label: "State Avg Score", val: `${kpis.avg_score || 0}%` }, { label: "Pass Rate (>=40%)", val: `${kpis.pass_rate_pct || 0}%` }, { label: "High Achievers", val: (kpis.high_achievers || 0).toLocaleString() }, { label: "Remedial Count", val: (kpis.remedial_count || 0).toLocaleString() }, { label: "Score Std Dev", val: kpis.score_stddev || 0 }].map((s, i) => (
              <Box key={i} sx={{ px: 1.6, py: 0.6, borderRadius: 1.8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}>
                <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase" }}>{s.label}</Typography>
                <Typography sx={{ color: "#ffffff", fontSize: "0.9rem", fontWeight: 800 }}>{s.val}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* KPI Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" }, gap: 2 }}>
        <AdminKpiCard label="Total Evaluated" value={(kpis.total_evaluated || 0).toLocaleString()} sub="Students assessed state-wide" color="#0284c7" gradientTo="#38bdf8" icon={<People sx={{ fontSize: 22 }} />} badge="Evaluated" delay={0} />
        <AdminKpiCard label="State Avg Score" value={`${kpis.avg_score || 0}%`} sub={`Pass Rate: ${kpis.pass_rate_pct || 0}%`} color="#10b981" gradientTo="#34d399" icon={<TrendingUp sx={{ fontSize: 22 }} />} badge={kpis.avg_score >= 70 ? "Good" : "Average"} delay={1} />
        <AdminKpiCard label="Pass Rate (>=40%)" value={`${kpis.pass_rate_pct || 0}%`} sub={`${((kpis.total_evaluated || 0) - (kpis.remedial_count || 0)).toLocaleString()} students passed`} color="#6366f1" gradientTo="#818cf8" icon={<CheckCircle sx={{ fontSize: 22 }} />} badge="Target" delay={2} />
        <AdminKpiCard label="High Achievers" value={(kpis.high_achievers || 0).toLocaleString()} sub={`${kpis.high_achiever_pct || 0}% of cohort (>=75%)`} color="#f59e0b" gradientTo="#fbbf24" icon={<EmojiEvents sx={{ fontSize: 22 }} />} badge=">=75%" delay={3} />
        <AdminKpiCard label="A+ Scholars" value={(kpis.a_plus_count || 0).toLocaleString()} sub="Scoring >=90% - State Toppers" color="#06b6d4" gradientTo="#22d3ee" icon={<WorkspacePremium sx={{ fontSize: 22 }} />} badge=">=90%" delay={4} />
        <AdminKpiCard label="Remedial Cohort" value={(kpis.remedial_count || 0).toLocaleString()} sub={`${kpis.remedial_pct || 0}% need urgent support`} color="#ef4444" gradientTo="#f87171" icon={<Warning sx={{ fontSize: 22 }} />} badge="<40%" delay={5} />
      </Box>

      {/* Tab Nav */}
      <motion.div {...stagger(1)}>
        <Card elevation={0} sx={{ background: "#ffffff", borderRadius: 3, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,0.04)", overflow: "hidden" }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ "& .MuiTab-root": { color: "#64748b", fontWeight: 700, fontSize: "0.78rem", minHeight: 52, py: 1.25, px: 2, textTransform: "none", transition: "all 0.2s ease", "&:hover": { color: "#0f3460" } }, "& .Mui-selected": { color: "#0284c7 !important", fontWeight: 800 }, "& .MuiTabs-indicator": { background: "linear-gradient(90deg, #0f3460, #0284c7)", height: 3.5, borderRadius: "3px 3px 0 0" } }}>
            {tabs.map((t, i) => <Tab key={i} label={t} disableRipple />)}
          </Tabs>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">

        {activeTab === 0 && (
          <motion.div key="t0" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="State Grade Distribution" subtitle={`${(kpis.total_evaluated || 0).toLocaleString()} students evaluated`} />
                <Box sx={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={3} dataKey="value">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="#ffffff" strokeWidth={2} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v, n) => [`${Number(v).toLocaleString()} students`, n]} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mt: 1, pt: 1, borderTop: "1px solid #f1f5f9" }}>
                  {[{ label: "A+/A", val: ((gradeDist.a_plus || 0) + (gradeDist.a || 0)).toLocaleString(), c: "#10b981" }, { label: "B/C", val: ((gradeDist.b || 0) + (gradeDist.c || 0)).toLocaleString(), c: "#6366f1" }, { label: "Remedial", val: (gradeDist.remedial || 0).toLocaleString(), c: "#ef4444" }].map((g, i) => (
                    <Box key={i} sx={{ textAlign: "center", p: 1, borderRadius: 2, background: alpha(g.c, 0.05) }}>
                      <Typography sx={{ fontWeight: 800, color: g.c, fontSize: "1rem" }}>{g.val}</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600 }}>{g.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </LightCard>
              <LightCard delay={1}>
                <SectionHeader icon={<MapOutlined sx={{ fontSize: 20 }} />} title="District-Wise Student Performance" subtitle="Average student score % by district" action={<Button size="small" onClick={() => setActiveTab(3)} sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0284c7" }}>Full Drill-Down</Button>} />
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={distBarData} margin={{ top: 8, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10, fontWeight: 600 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Bar dataKey="Avg Score" radius={[5, 5, 0, 0]}>{distBarData.map((e, i) => <Cell key={i} fill={e["Avg Score"] >= 70 ? "#10b981" : e["Avg Score"] >= 55 ? "#0284c7" : "#f59e0b"} />)}</Bar>
                      <ReferenceLine y={kpis.avg_score || 0} stroke="#ef4444" strokeDasharray="4 4" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
            </Box>
            <LightCard delay={2}>
              <SectionHeader icon={<Speed sx={{ fontSize: 20 }} />} title="State-Wide Student Performance Scorecard" subtitle="Summary across grade bands with pass/remedial breakdown" />
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Grade Band</TableCell><TableCell align="right">Students</TableCell><TableCell align="right">% of Cohort</TableCell><TableCell align="center">Score Range</TableCell><TableCell align="center">Action Required</TableCell></TableRow></TableHead>
                  <TableBody>
                    {[{ band: "A+ (>=90%)", val: gradeDist.a_plus || 0, range: "90-100%", color: "#10b981", action: "Excellence Recognition" }, { band: "A (75-89%)", val: gradeDist.a || 0, range: "75-89%", color: "#0284c7", action: "Enrichment Program" }, { band: "B (60-74%)", val: gradeDist.b || 0, range: "60-74%", color: "#6366f1", action: "Targeted Practice" }, { band: "C (40-59%)", val: gradeDist.c || 0, range: "40-59%", color: "#f59e0b", action: "Additional Support" }, { band: "Remedial (<40%)", val: gradeDist.remedial || 0, range: "<40%", color: "#ef4444", action: "Project ARISE" }].map((row, i) => {
                      const pct = Math.round((row.val / (kpis.total_evaluated || 1)) * 100);
                      return (
                        <TableRow key={i} sx={trSx}>
                          <TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box sx={{ width: 12, height: 12, borderRadius: "50%", background: row.color, flexShrink: 0 }} /><Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.8rem" }}>{row.band}</Typography></Box></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: row.color, fontSize: "0.9rem" }}>{row.val.toLocaleString()}</TableCell>
                          <TableCell align="right"><Box><Typography sx={{ fontWeight: 700, fontSize: "0.8rem" }}>{pct}%</Typography><LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, background: "#f1f5f9", "& .MuiLinearProgress-bar": { background: row.color } }} /></Box></TableCell>
                          <TableCell align="center"><Chip label={row.range} size="small" sx={{ fontSize: "0.68rem", fontWeight: 700, background: alpha(row.color, 0.08), color: row.color }} /></TableCell>
                          <TableCell align="center"><Chip label={row.action} size="small" sx={{ fontSize: "0.68rem", fontWeight: 700, background: "#f8fafc", color: "#475569" }} /></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div key="t1" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<MenuBook sx={{ fontSize: 20 }} />} title="Class-Wise Student Performance Matrix" subtitle="Avg score, pass rate, high achievers & remedial % by grade" />
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={classBarData} margin={{ top: 8, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconSize={10} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                      <Bar dataKey="Avg Score %" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="High Achievers %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Remedial %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
              <LightCard delay={1}>
                <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="Class KPI Scorecard" subtitle="Performance snapshot per grade" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, maxHeight: 340, overflowY: "auto" }}>
                  {classPerf.map((c, i) => (
                    <Box key={i} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #f1f5f9", background: "#fafafa", "&:hover": { background: "#f0f9ff", borderColor: "#bae6fd" } }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
                        <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.82rem" }}>{c.class_name}</Typography>
                        <Typography sx={{ fontWeight: 900, color: c.avg_score_pct >= 70 ? "#10b981" : c.avg_score_pct >= 55 ? "#0284c7" : "#f59e0b", fontSize: "1rem" }}>{c.avg_score_pct}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={c.avg_score_pct} sx={{ height: 5, borderRadius: 3, background: "#e2e8f0", mb: 0.75, "& .MuiLinearProgress-bar": { background: c.avg_score_pct >= 70 ? "#10b981" : c.avg_score_pct >= 55 ? "#0284c7" : "#f59e0b" } }} />
                      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                        <Chip label={`${(c.evaluated_students || 0).toLocaleString()} students`} size="small" sx={{ fontSize: "0.64rem", height: 18, fontWeight: 600, background: "#f0f9ff", color: "#0284c7" }} />
                        <Chip label={`Pass: ${c.pass_rate_pct}%`} size="small" sx={{ fontSize: "0.64rem", height: 18, fontWeight: 600, background: "#ecfdf5", color: "#10b981" }} />
                        <Chip label={`Remedial: ${c.remedial_rate_pct}%`} size="small" sx={{ fontSize: "0.64rem", height: 18, fontWeight: 600, background: "#fef2f2", color: "#ef4444" }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </LightCard>
            </Box>
            <LightCard delay={2}>
              <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="Comprehensive Class Performance Table" subtitle="Detailed metrics for every grade level across the state" />
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Class</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">High Achievers</TableCell><TableCell align="right">A+ Students</TableCell><TableCell align="right">Remedial</TableCell><TableCell align="right">Remedial %</TableCell><TableCell align="center">Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {classPerf.map((c, i) => (
                      <TableRow key={i} sx={trSx}>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>{c.class_name}</TableCell>
                        <TableCell align="right">{(c.evaluated_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: c.avg_score_pct >= 70 ? "#059669" : c.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{c.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{c.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#6366f1", fontWeight: 700 }}>{(c.high_achievers || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#10b981", fontWeight: 700 }}>{(c.a_plus_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(c.remedial_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: c.remedial_rate_pct > 20 ? "#dc2626" : "#64748b", fontWeight: 700 }}>{c.remedial_rate_pct}%</TableCell>
                        <TableCell align="center"><Chip label={c.avg_score_pct >= 70 ? "On Track" : c.avg_score_pct >= 55 ? "Average" : "Attention"} size="small" sx={{ fontSize: "0.65rem", fontWeight: 800, height: 20, background: c.avg_score_pct >= 70 ? "#ecfdf5" : c.avg_score_pct >= 55 ? "#f0f9ff" : "#fef2f2", color: c.avg_score_pct >= 70 ? "#059669" : c.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 2 && (
          <motion.div key="t2" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<Insights sx={{ fontSize: 20 }} />} title="Subject Mastery Radar" subtitle="State-wide average score per subject" />
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={subjectRadarData}><PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} /><Radar name="Avg Score %" dataKey="score" stroke="#0284c7" fill="#0284c7" fillOpacity={0.25} strokeWidth={2} /><RechartsTooltip content={<CustomTooltip />} /></RadarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
              <LightCard delay={1}>
                <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="Subject Avg Score vs Weak %" subtitle="Identify intervention priorities" />
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={subjectPerf.slice(0, 8).map(s => ({ name: (s.subject_name || "").substring(0, 10), "Avg Score": s.avg_score_pct, "Weak %": s.weak_pct }))} margin={{ top: 8, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconSize={10} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                      <Bar dataKey="Avg Score" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Weak %" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
            </Box>
            <LightCard delay={2}>
              <SectionHeader icon={<MenuBook sx={{ fontSize: 20 }} />} title="Subject Performance Diagnostic Table" subtitle="Complete subject-wise analysis with intervention priority" />
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Rank</TableCell><TableCell>Subject</TableCell><TableCell align="right">Students</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">High Achievers</TableCell><TableCell align="right">Weak Students</TableCell><TableCell align="right">Weak %</TableCell><TableCell align="right">Score Range</TableCell><TableCell align="center">Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {subjectPerf.map((s, i) => (
                      <TableRow key={i} sx={trSx}>
                        <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>#{s.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: "#0f172a" }}>{s.subject_name}</TableCell>
                        <TableCell align="right">{(s.student_count || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: s.avg_score_pct >= 70 ? "#059669" : s.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{s.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{s.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#6366f1", fontWeight: 700 }}>{(s.high_achievers_count || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(s.weak_students_count || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: s.weak_pct > 25 ? "#dc2626" : "#64748b", fontWeight: 700 }}>{s.weak_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#64748b", fontSize: "0.7rem" }}>{s.min_score}%-{s.max_score}%</TableCell>
                        <TableCell align="center"><Chip label={s.status === "ON_TRACK" ? "On Track" : s.status === "NEEDS_PRACTICE" ? "Practice" : "Workshop"} size="small" sx={{ fontSize: "0.65rem", fontWeight: 800, height: 20, background: s.status === "ON_TRACK" ? "#ecfdf5" : s.status === "NEEDS_PRACTICE" ? "#fffbeb" : "#fef2f2", color: s.status === "ON_TRACK" ? "#059669" : s.status === "NEEDS_PRACTICE" ? "#d97706" : "#dc2626" }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 3 && (
          <motion.div key="t3" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "3fr 2fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<MapOutlined sx={{ fontSize: 20 }} />} title="District-Wise Student Performance League" subtitle="Ranked by average student score" />
                <TableContainer sx={{ maxHeight: 420 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2 } }}><TableCell>Rank</TableCell><TableCell>District</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">High Achvrs</TableCell><TableCell align="right">A+</TableCell><TableCell align="right">Remedial</TableCell><TableCell align="right">Rem %</TableCell><TableCell align="center">Tier</TableCell></TableRow></TableHead>
                    <TableBody>
                      {districtBreakdown.map((d, i) => (
                        <TableRow key={i} sx={trBlueSx}>
                          <TableCell sx={{ fontWeight: 800, color: i < 3 ? "#f59e0b" : "#64748b" }}>#{d.rank}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{d.district_name}</TableCell>
                          <TableCell align="right">{(d.evaluated_students || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: d.avg_score_pct >= 70 ? "#059669" : d.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{d.avg_score_pct}%</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{d.pass_rate_pct}%</TableCell>
                          <TableCell align="right" sx={{ color: "#6366f1", fontWeight: 700 }}>{(d.high_achievers || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: "#10b981", fontWeight: 700 }}>{(d.a_plus_students || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(d.remedial_students || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: d.remedial_rate_pct > 20 ? "#dc2626" : "#64748b", fontWeight: 700 }}>{d.remedial_rate_pct}%</TableCell>
                          <TableCell align="center"><Chip label={d.performance_tier} size="small" sx={tierChipSx(d.performance_tier)} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <LightCard delay={1}>
                  <SectionHeader icon={<EmojiEvents sx={{ fontSize: 20 }} />} title="Top Performing Districts" subtitle="Leading student cohorts" />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {districtBreakdown.slice(0, 3).map((d, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 2, background: i === 0 ? "#fffbeb" : i === 1 ? "#f0f9ff" : "#f8fafc", border: `1px solid ${i === 0 ? "#fde68a" : i === 1 ? "#bae6fd" : "#e2e8f0"}` }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography sx={{ fontSize: "1.1rem" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</Typography><Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{d.district_name}</Typography></Box>
                          <Typography sx={{ fontWeight: 900, color: "#10b981", fontSize: "1.1rem" }}>{d.avg_score_pct}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                          <Chip label={`${(d.evaluated_students || 0).toLocaleString()} students`} size="small" sx={{ fontSize: "0.62rem", height: 18, fontWeight: 600 }} />
                          <Chip label={`Pass: ${d.pass_rate_pct}%`} size="small" sx={{ fontSize: "0.62rem", height: 18, fontWeight: 600, background: "#ecfdf5", color: "#059669" }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </LightCard>
                <LightCard delay={2}>
                  <SectionHeader icon={<Warning sx={{ fontSize: 20 }} />} title="Districts Needing Attention" subtitle="Priority intervention needed" />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {[...districtBreakdown].slice(-3).reverse().map((d, i) => (
                      <Box key={i} sx={{ p: 1.5, borderRadius: 2, background: "#fef2f2", border: "1px solid #fecaca" }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{d.district_name}</Typography>
                          <Typography sx={{ fontWeight: 900, color: "#dc2626", fontSize: "1rem" }}>{d.avg_score_pct}%</Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.75, mt: 0.75, flexWrap: "wrap" }}>
                          <Chip label={`Remedial: ${d.remedial_rate_pct}%`} size="small" sx={{ fontSize: "0.62rem", height: 18, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }} />
                          <Chip label="DEO Action Required" size="small" sx={{ fontSize: "0.62rem", height: 18, fontWeight: 700, background: "#fff7ed", color: "#ea580c" }} />
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </LightCard>
              </Box>
            </Box>
          </motion.div>
        )}

        {activeTab === 4 && (
          <motion.div key="t4" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <LightCard delay={0}>
              <SectionHeader icon={<School sx={{ fontSize: 20 }} />} title="Block-Wise Student Performance Matrix" subtitle="Geographic drill-down to identify performance gaps" action={<TextField size="small" placeholder="Search block..." value={blockSearch} onChange={(e) => setBlockSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 17 }} /></InputAdornment>, endAdornment: blockSearch && <InputAdornment position="end"><IconButton size="small" onClick={() => setBlockSearch("")}><Close sx={{ fontSize: 14 }} /></IconButton></InputAdornment>, sx: { borderRadius: 2, fontSize: "0.8rem", background: "#f8fafc", width: 200 } }} variant="outlined" />} />
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2 } }}><TableCell>Rank</TableCell><TableCell>Block Name</TableCell><TableCell>District</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">High Achvrs</TableCell><TableCell align="right">Remedial</TableCell><TableCell>Score Bar</TableCell><TableCell align="center">Tier</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredBlocks.map((b, i) => (
                      <TableRow key={i} sx={trBlueSx}>
                        <TableCell sx={{ fontWeight: 800, color: i < 3 ? "#f59e0b" : "#64748b" }}>#{b.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{b.block_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.75rem" }}>{b.district_name}</TableCell>
                        <TableCell align="right">{(b.evaluated_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: b.avg_score_pct >= 70 ? "#059669" : b.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{b.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{b.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#6366f1", fontWeight: 700 }}>{(b.high_achievers || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(b.remedial_students || 0).toLocaleString()}</TableCell>
                        <TableCell sx={{ width: 100 }}><LinearProgress variant="determinate" value={b.avg_score_pct} sx={{ height: 5, borderRadius: 3, background: "#e2e8f0", "& .MuiLinearProgress-bar": { background: b.avg_score_pct >= 70 ? "#10b981" : b.avg_score_pct >= 55 ? "#0284c7" : "#f59e0b" } }} /></TableCell>
                        <TableCell align="center"><Chip label={b.performance_tier} size="small" sx={tierChipSx(b.performance_tier)} /></TableCell>
                      </TableRow>
                    ))}
                    {filteredBlocks.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ py: 3, color: "#94a3b8", fontStyle: "italic" }}>No blocks found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 5 && (
          <motion.div key="t5" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 2 }}>
              <AdminKpiCard label="Male Students" value={(genderAnalysis.male?.count || 0).toLocaleString()} sub={`Avg: ${genderAnalysis.male?.avg_score || 0}%`} color="#0284c7" gradientTo="#38bdf8" icon={<Male sx={{ fontSize: 22 }} />} badge="" delay={0} />
              <AdminKpiCard label="Female Students" value={(genderAnalysis.female?.count || 0).toLocaleString()} sub={`Avg: ${genderAnalysis.female?.avg_score || 0}%`} color="#ec4899" gradientTo="#f472b6" icon={<Female sx={{ fontSize: 22 }} />} badge="" delay={1} />
              <AdminKpiCard label="Male High Achievers" value={(genderAnalysis.male?.high_achievers || 0).toLocaleString()} sub="Scoring >=75%" color="#6366f1" gradientTo="#818cf8" icon={<EmojiEvents sx={{ fontSize: 22 }} />} badge="" delay={2} />
              <AdminKpiCard label="Female High Achievers" value={(genderAnalysis.female?.high_achievers || 0).toLocaleString()} sub="Scoring >=75%" color="#f59e0b" gradientTo="#fbbf24" icon={<EmojiEvents sx={{ fontSize: 22 }} />} badge="" delay={3} />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<Groups sx={{ fontSize: 20 }} />} title="Gender Performance Comparison" subtitle="Male vs Female on key academic metrics" />
                <Box sx={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={genderBarData} margin={{ top: 8, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconSize={10} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                      <Bar dataKey="Male" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
              <LightCard delay={1}>
                <SectionHeader icon={<Speed sx={{ fontSize: 20 }} />} title="Gender Parity Scorecard" subtitle="Male vs female detailed comparison" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
                  {[{ label: "Average Score", male: `${genderAnalysis.male?.avg_score || 0}%`, female: `${genderAnalysis.female?.avg_score || 0}%` }, { label: "Students Evaluated", male: (genderAnalysis.male?.count || 0).toLocaleString(), female: (genderAnalysis.female?.count || 0).toLocaleString() }, { label: "Students Passed", male: (genderAnalysis.male?.pass_count || 0).toLocaleString(), female: (genderAnalysis.female?.pass_count || 0).toLocaleString() }, { label: "Remedial (Need Support)", male: (genderAnalysis.male?.remedial_count || 0).toLocaleString(), female: (genderAnalysis.female?.remedial_count || 0).toLocaleString() }, { label: "High Achievers (>=75%)", male: (genderAnalysis.male?.high_achievers || 0).toLocaleString(), female: (genderAnalysis.female?.high_achievers || 0).toLocaleString() }].map((row, i) => (
                    <Box key={i} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 1, p: 1.25, borderRadius: 2, background: i % 2 === 0 ? "#f8fafc" : "#ffffff", border: "1px solid #f1f5f9" }}>
                      <Typography sx={{ fontWeight: 700, color: "#334155", fontSize: "0.8rem" }}>{row.label}</Typography>
                      <Box sx={{ textAlign: "center" }}><Typography component="span" sx={{ fontWeight: 800, color: "#0284c7", fontSize: "0.8rem" }}>M: {row.male}</Typography></Box>
                      <Box sx={{ textAlign: "center" }}><Typography component="span" sx={{ fontWeight: 800, color: "#ec4899", fontSize: "0.8rem" }}>F: {row.female}</Typography></Box>
                    </Box>
                  ))}
                </Box>
              </LightCard>
            </Box>
          </motion.div>
        )}

        {activeTab === 6 && (
          <motion.div key="t6" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <LightCard delay={0}>
              <SectionHeader icon={<Insights sx={{ fontSize: 20 }} />} title="Assessment-Wise Student Performance Trajectory" subtitle="How student scores and pass rates evolved across assessments" />
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 40 }}>
                    <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0284c7" stopOpacity={0.2} /><stop offset="100%" stopColor="#0284c7" stopOpacity={0} /></linearGradient><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 9 }} angle={-40} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend iconSize={10} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                    <Area type="monotone" dataKey="Avg Score" stroke="#0284c7" fill="url(#sGrad)" strokeWidth={2.5} dot={{ fill: "#0284c7", r: 3 }} />
                    <Area type="monotone" dataKey="Pass Rate" stroke="#10b981" fill="url(#pGrad)" strokeWidth={2.5} dot={{ fill: "#10b981", r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </LightCard>
            <LightCard delay={1}>
              <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="Assessment-Wise Summary Table" subtitle="Performance breakdown per assessment across the state" />
              <TableContainer sx={{ maxHeight: 380 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2 } }}><TableCell>Assessment</TableCell><TableCell>Class</TableCell><TableCell>Period</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">Pass Students</TableCell><TableCell align="right">Remedial</TableCell></TableRow></TableHead>
                  <TableBody>
                    {assessmentTrend.map((a, i) => (
                      <TableRow key={i} sx={trSx}>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a", maxWidth: 200 }}>{(a.assessment_name || "").substring(0, 28)}</TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{a.class_name}</TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{a.period}</TableCell>
                        <TableCell align="right">{(a.evaluated_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: a.avg_score_pct >= 70 ? "#059669" : a.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{a.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{a.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#10b981", fontWeight: 700 }}>{(a.pass_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(a.remedial_students || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 7 && (
          <motion.div key="t7" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", borderLeft: "4px solid #0284c7" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(5, 1fr)" }, gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", mb: 0.4 }}>Performance Band</Typography>
                  <Select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.8rem", background: "#f8fafc" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.8rem" }}>All Bands</MenuItem>
                    <MenuItem value="a_plus" sx={{ fontSize: "0.8rem", color: "#10b981", fontWeight: 700 }}>A+ (above 90%)</MenuItem>
                    <MenuItem value="a" sx={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>A (75-89%)</MenuItem>
                    <MenuItem value="b" sx={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 700 }}>B (60-74%)</MenuItem>
                    <MenuItem value="c" sx={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 700 }}>C (40-59%)</MenuItem>
                    <MenuItem value="remedial" sx={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 700 }}>Remedial (below 40%)</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", mb: 0.4 }}>Class</Typography>
                  <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.8rem", background: "#f8fafc" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.8rem" }}>All Classes</MenuItem>
                    {uniqueClasses.map(c => <MenuItem key={c} value={c} sx={{ fontSize: "0.8rem" }}>{c}</MenuItem>)}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", mb: 0.4 }}>District</Typography>
                  <Select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.8rem", background: "#f8fafc" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.8rem" }}>All Districts</MenuItem>
                    {uniqueDistricts.map(d => <MenuItem key={d} value={d} sx={{ fontSize: "0.8rem" }}>{d}</MenuItem>)}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", mb: 0.4 }}>Search</Typography>
                  <TextField size="small" fullWidth placeholder="Student, school..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 17 }} /></InputAdornment>, endAdornment: studentSearch && <InputAdornment position="end"><IconButton size="small" onClick={() => setStudentSearch("")}><Close sx={{ fontSize: 13 }} /></IconButton></InputAdornment>, sx: { borderRadius: 2, fontSize: "0.8rem", background: "#f8fafc" } }} variant="outlined" />
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                  <Button variant="outlined" onClick={() => { setBandFilter("ALL"); setClassFilter("ALL"); setDistrictFilter("ALL"); setStudentSearch(""); }} sx={{ borderRadius: 2, fontSize: "0.72rem", fontWeight: 700, color: "#64748b", borderColor: "#e2e8f0", height: 40, width: "100%" }}>Reset</Button>
                </Box>
              </Box>
              <Typography sx={{ mt: 1.25, fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Showing <strong>{filteredStudents.length}</strong> of <strong>{students.length}</strong> students</Typography>
            </Card>
            <LightCard delay={0}>
              <SectionHeader icon={<People sx={{ fontSize: 20 }} />} title="State Student Directory" subtitle="Top 200 students by performance across all districts" />
              <TableContainer sx={{ maxHeight: 520 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2 } }}><TableCell>Rank</TableCell><TableCell>Student</TableCell><TableCell>Gender</TableCell><TableCell>Class</TableCell><TableCell>School</TableCell><TableCell>Block</TableCell><TableCell>District</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Assessments</TableCell><TableCell align="center">Grade</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredStudents.map((s, i) => (
                      <TableRow key={i} sx={trBlueSx}>
                        <TableCell sx={{ fontWeight: 800, color: s.rank <= 3 ? "#f59e0b" : "#64748b" }}>#{s.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                        <TableCell><Chip label={["M","MALE","BOY"].includes(s.gender) ? "Male" : ["F","FEMALE","GIRL"].includes(s.gender) ? "Female" : s.gender || "N/A"} size="small" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700, background: ["M","MALE","BOY"].includes(s.gender) ? "#e0f2fe" : "#fce7f3", color: ["M","MALE","BOY"].includes(s.gender) ? "#0284c7" : "#ec4899" }} /></TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                        <TableCell sx={{ color: "#475569", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.school_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.block_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: s.avg_score_pct >= 75 ? "#059669" : s.avg_score_pct >= 55 ? "#0284c7" : "#dc2626", fontSize: "0.88rem" }}>{s.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>{s.assessments_taken}</TableCell>
                        <TableCell align="center"><GradeChip grade={s.grade} /></TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: "#94a3b8", fontStyle: "italic" }}>No students match the selected filters.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {activeTab === 8 && (
          <motion.div key="t8" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<EmojiEvents sx={{ fontSize: 20 }} />} title="State Honor Roll - Top 20 Students" subtitle="Highest scoring students across all districts" />
                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": { background: "#fffbeb", color: "#92400e", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", py: 1.1 } }}><TableCell>Rank</TableCell><TableCell>Student</TableCell><TableCell>Class</TableCell><TableCell>District</TableCell><TableCell align="right">Score</TableCell><TableCell align="center">Grade</TableCell></TableRow></TableHead>
                    <TableBody>
                      {topStudents.map((s, i) => (
                        <TableRow key={i} sx={{ "& td": { py: 0.9, fontSize: "0.78rem", borderBottom: "1px solid #fffbeb" }, background: i < 3 ? alpha("#f59e0b", 0.06) : "transparent", "&:hover": { background: "#fffbeb" } }}>
                          <TableCell sx={{ fontWeight: 900, fontSize: "1rem" }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${s.rank}`}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                          <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#10b981", fontSize: "0.9rem" }}>{s.avg_score_pct}%</TableCell>
                          <TableCell align="center"><GradeChip grade={s.grade} /></TableCell>
                        </TableRow>
                      ))}
                      {topStudents.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: "#94a3b8", fontStyle: "italic" }}>No data available.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>
              <LightCard delay={1}>
                <SectionHeader icon={<Warning sx={{ fontSize: 20 }} />} title="Remedial Priority Cohort" subtitle="Students scoring below 40% - immediate intervention needed" action={<Chip label={`${remedialStudents.length} Students`} size="small" sx={{ background: "#fef2f2", color: "#dc2626", fontWeight: 800 }} />} />
                <TableContainer sx={{ maxHeight: 460 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": { background: "#fef2f2", color: "#7f1d1d", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", py: 1.1 } }}><TableCell>Student</TableCell><TableCell>Class</TableCell><TableCell>District</TableCell><TableCell align="right">Score</TableCell><TableCell align="right">Assessments</TableCell><TableCell align="center">Urgency</TableCell></TableRow></TableHead>
                    <TableBody>
                      {remedialStudents.map((s, i) => (
                        <TableRow key={i} sx={{ "& td": { py: 0.9, fontSize: "0.78rem", borderBottom: "1px solid #fef2f2" }, "&:hover": { background: "#fff1f2" } }}>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                          <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#dc2626", fontSize: "0.9rem" }}>{s.avg_score_pct}%</TableCell>
                          <TableCell align="right" sx={{ color: "#64748b" }}>{s.assessments_taken}</TableCell>
                          <TableCell align="center"><InterventionChip level={s.intervention_level} /></TableCell>
                        </TableRow>
                      ))}
                      {remedialStudents.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3, color: "#94a3b8", fontStyle: "italic" }}>No remedial students found.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>
            </Box>
            {benchmarkMatrix.length > 0 && (
              <LightCard delay={2}>
                <SectionHeader icon={<CompareArrows sx={{ fontSize: 20 }} />} title="Class x Subject Benchmark Matrix" subtitle="State-wide average score by class and subject - identify weak combinations" />
                <TableContainer>
                  <Table size="small">
                    <TableHead><TableRow sx={{ "& th": { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.7rem", textTransform: "uppercase", py: 1.1, borderBottom: "2px solid #e2e8f0" } }}><TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Weak Students</TableCell><TableCell sx={{ minWidth: 120 }}>Score Indicator</TableCell><TableCell align="center">Status</TableCell></TableRow></TableHead>
                    <TableBody>
                      {benchmarkMatrix.slice(0, 40).map((r, i) => (
                        <TableRow key={i} sx={{ "& td": { py: 0.9, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, background: r.status === "danger" ? alpha("#ef4444", 0.03) : "transparent", "&:hover": { background: "#f8fafc" } }}>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{r.class_name}</TableCell>
                          <TableCell sx={{ color: "#475569" }}>{r.subject_name}</TableCell>
                          <TableCell align="right" sx={{ color: "#64748b" }}>{(r.evaluated || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: r.avg_pct >= 70 ? "#059669" : r.avg_pct >= 50 ? "#0284c7" : "#dc2626" }}>{r.avg_pct}%</TableCell>
                          <TableCell align="right" sx={{ color: "#dc2626", fontWeight: 700 }}>{(r.weak_count || 0).toLocaleString()}</TableCell>
                          <TableCell><LinearProgress variant="determinate" value={r.avg_pct} sx={{ height: 6, borderRadius: 3, background: "#e2e8f0", "& .MuiLinearProgress-bar": { background: r.status === "good" ? "#10b981" : r.status === "warning" ? "#f59e0b" : "#ef4444" } }} /></TableCell>
                          <TableCell align="center"><Chip label={r.status === "good" ? "Good" : r.status === "warning" ? "Watch" : "Critical"} size="small" sx={{ fontSize: "0.63rem", fontWeight: 800, height: 20, background: r.status === "good" ? "#ecfdf5" : r.status === "warning" ? "#fffbeb" : "#fef2f2", color: r.status === "good" ? "#059669" : r.status === "warning" ? "#d97706" : "#dc2626" }} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </Box>
  );
}
