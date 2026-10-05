import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, LinearProgress,
  CircularProgress, Alert, TextField, InputAdornment, MenuItem, Select,
  IconButton, alpha, Stack
} from "@mui/material";
import {
  People, TrendingUp, Warning, CheckCircle, Search, Refresh,
  EmojiEvents, Insights, CompareArrows, WorkspacePremium, MenuBook,
  School, MapOutlined, Close, Speed, Groups, Female, Male,
  BarChart as BarChartIcon, FilterAlt, Star, ArrowForward
} from "@mui/icons-material";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart as RechartsBarChart,
  Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { stateApi, masterApi } from "../../services/api";

const GRADE_COLORS = { "A+": "#10b981", "A": "#0284c7", "B": "#6366f1", "C": "#f59e0b", "Remedial": "#ef4444" };
const fadeUp = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: "easeOut" } };
const stagger = (i) => ({ ...fadeUp, transition: { duration: 0.3, delay: i * 0.04, ease: "easeOut" } });

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

function SectionHeader({ icon, title, subtitle, action }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, background: "linear-gradient(135deg, #0f3460, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 2px 6px rgba(2,132,199,0.2)" }}>
          {icon}
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: "#0f172a", fontSize: "0.92rem", fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.2 }}>
            {title}
          </Typography>
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
        <CardContent sx={{ p: { xs: 2, sm: 2.25 }, flex: 1, "&:last-child": { pb: { xs: 2, sm: 2.25 } } }}>{children}</CardContent>
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
  const [blockSearch, setBlockSearch] = useState("");
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

  const classBarData = useMemo(() => classPerf.map(c => ({
    name: (c.class_name || "").replace("Class ", "Cl."),
    "Avg Score %": c.avg_score_pct,
    "Pass Rate %": c.pass_rate_pct,
    "High Achievers %": c.high_achiever_pct,
    "Remedial %": c.remedial_rate_pct
  })), [classPerf]);

  const distBarData = useMemo(() => districtBreakdown.slice(0, 15).map(d => ({
    name: (d.district_name || "").substring(0, 10),
    "Avg Score": d.avg_score_pct,
    "Pass Rate": d.pass_rate_pct
  })), [districtBreakdown]);

  const subjectRadarData = useMemo(() => subjectPerf.slice(0, 7).map(s => ({
    subject: (s.subject_name || "").substring(0, 12),
    score: s.avg_score_pct,
    fullMark: 100
  })), [subjectPerf]);

  const genderBarData = useMemo(() => [
    { metric: "Avg Score (%)", Male: genderAnalysis.male?.avg_score || 0, Female: genderAnalysis.female?.avg_score || 0 },
    { metric: "Pass Rate (%)", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.pass_count || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.pass_count || 0) / genderAnalysis.female.count) * 100) : 0 },
    { metric: "High Achievers (%)", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.high_achievers || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.high_achievers || 0) / genderAnalysis.female.count) * 100) : 0 },
    { metric: "Remedial Rate (%)", Male: genderAnalysis.male?.count ? Math.round(((genderAnalysis.male.remedial_count || 0) / genderAnalysis.male.count) * 100) : 0, Female: genderAnalysis.female?.count ? Math.round(((genderAnalysis.female.remedial_count || 0) / genderAnalysis.female.count) * 100) : 0 },
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

  const primaryTabs = [
    { id: 0, label: "Overview & Grade Mastery", icon: <BarChartIcon sx={{ fontSize: 17 }} /> },
    { id: 1, label: "Subject & Learning Diagnostics", icon: <Insights sx={{ fontSize: 17 }} /> },
    { id: 2, label: "District & Block Drilldown", icon: <MapOutlined sx={{ fontSize: 17 }} /> },
    { id: 3, label: `Student Directory & Honor Roll (${students.length})`, icon: <People sx={{ fontSize: 17 }} /> },
  ];

  const thSx = { background: "#f8fafc", color: "#334155", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2, borderBottom: "2px solid #e2e8f0" };
  const trSx = { "& td": { py: 1, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, "&:hover": { background: "#fafafa" } };
  const trBlueSx = { "& td": { py: 0.9, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, "&:hover": { background: "#f0f9ff" } };

  if (loading && !data) return (
    <Box sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "45vh", gap: 2 }}>
      <CircularProgress size={42} sx={{ color: "#0284c7" }} />
      <Typography sx={{ color: "#0f3460", fontWeight: 800, fontSize: "0.98rem" }}>Aggregating State Student Performance Intelligence...</Typography>
      <Typography sx={{ color: "#64748b", fontSize: "0.78rem" }}>Analyzing marks across all 33 districts and 146 blocks</Typography>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ borderRadius: 3 }} action={<Button onClick={() => loadData()} color="inherit" size="small">Retry</Button>}>
      {error}
    </Alert>
  );

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.2 }}>

      {/* ── Sleek Integrated Sub-Toolbar & Filter Header ── */}
      <motion.div {...fadeUp}>
        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", background: "#ffffff", boxShadow: "0 1px 3px rgba(15,23,42,0.04)" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 1.5, pb: 1.5, borderBottom: "1px solid #f1f5f9" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, background: "linear-gradient(135deg, #0f3460, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 2px 8px rgba(2,132,199,0.2)" }}>
                <People sx={{ fontSize: 20 }} />
              </Box>
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography sx={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>State Student Analytics Command</Typography>
                  <Chip label={`${(kpis.total_evaluated || 0).toLocaleString()} Evaluated`} size="small" sx={{ background: "#ecfdf5", color: "#059669", fontWeight: 800, fontSize: "0.68rem", height: 20 }} />
                </Box>
                <Typography sx={{ color: "#64748b", fontSize: "0.72rem" }}>Real-time student mastery, grade progression & diagnostic intervention</Typography>
              </Box>
            </Box>
            <Button
              size="small"
              onClick={() => loadData(true)}
              startIcon={refreshing ? <CircularProgress size={13} color="inherit" /> : <Refresh sx={{ fontSize: 15 }} />}
              disabled={refreshing}
              variant="outlined"
              sx={{ borderRadius: 2, fontSize: "0.75rem", fontWeight: 700, color: "#0284c7", borderColor: "#bae6fd", background: "#f0f9ff", "&:hover": { background: "#e0f2fe" } }}
            >
              {refreshing ? "Refreshing..." : "Sync Analytics"}
            </Button>
          </Box>

          {/* Clean Segmented Navigation Pills */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {primaryTabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <Button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  startIcon={t.icon}
                  disableRipple
                  sx={{
                    borderRadius: 2.5,
                    px: 2,
                    py: 0.75,
                    fontSize: "0.78rem",
                    fontWeight: active ? 800 : 600,
                    textTransform: "none",
                    background: active ? "linear-gradient(135deg, #0f3460, #0284c7)" : "#f8fafc",
                    color: active ? "#ffffff" : "#64748b",
                    boxShadow: active ? "0 4px 12px rgba(2,132,199,0.25)" : "none",
                    border: `1px solid ${active ? "transparent" : "#e2e8f0"}`,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      background: active ? "linear-gradient(135deg, #0f3460, #0284c7)" : "#f1f5f9",
                      color: active ? "#ffffff" : "#0f172a"
                    }
                  }}
                >
                  {t.label}
                </Button>
              );
            })}
          </Box>
        </Card>
      </motion.div>

      {/* ── Sub-Views ── */}
      <AnimatePresence mode="wait">

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 0: Overview & Grade Mastery */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <motion.div key="view0" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.2 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<BarChartIcon sx={{ fontSize: 20 }} />} title="State Grade Distribution" subtitle={`${(kpis.total_evaluated || 0).toLocaleString()} students categorized`} />
                <Box sx={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={84} paddingAngle={3} dataKey="value">
                        {pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="#ffffff" strokeWidth={2} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v, n) => [`${Number(v).toLocaleString()} students`, n]} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mt: 1, pt: 1, borderTop: "1px solid #f1f5f9" }}>
                  {[{ label: "A+/A (Top)", val: ((gradeDist.a_plus || 0) + (gradeDist.a || 0)).toLocaleString(), c: "#10b981" }, { label: "B/C (Mid)", val: ((gradeDist.b || 0) + (gradeDist.c || 0)).toLocaleString(), c: "#6366f1" }, { label: "Remedial", val: (gradeDist.remedial || 0).toLocaleString(), c: "#ef4444" }].map((g, i) => (
                    <Box key={i} sx={{ textAlign: "center", p: 1, borderRadius: 2, background: alpha(g.c, 0.05) }}>
                      <Typography sx={{ fontWeight: 800, color: g.c, fontSize: "0.95rem" }}>{g.val}</Typography>
                      <Typography sx={{ color: "#64748b", fontSize: "0.65rem", fontWeight: 600 }}>{g.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </LightCard>

              <LightCard delay={1}>
                <SectionHeader icon={<MapOutlined sx={{ fontSize: 20 }} />} title="Top District Score Benchmarks" subtitle="Average student score % across top reporting districts" action={<Button size="small" onClick={() => setActiveTab(2)} endIcon={<ArrowForward sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#0284c7" }}>All 33 Districts</Button>} />
                <Box sx={{ height: 265 }}>
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
              <SectionHeader icon={<Speed sx={{ fontSize: 20 }} />} title="State-Wide Student Performance Scorecard" subtitle="Cohort summary across standard academic grade bands" />
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Grade Band</TableCell><TableCell align="right">Students</TableCell><TableCell align="right">% of Cohort</TableCell><TableCell align="center">Score Range</TableCell><TableCell align="center">Pedagogical Directive</TableCell></TableRow></TableHead>
                  <TableBody>
                    {[{ band: "A+ (>=90%)", val: gradeDist.a_plus || 0, range: "90-100%", color: "#10b981", action: "Excellence Recognition & SCERT Merit" }, { band: "A (75-89%)", val: gradeDist.a || 0, range: "75-89%", color: "#0284c7", action: "Advanced Enrichment Support" }, { band: "B (60-74%)", val: gradeDist.b || 0, range: "60-74%", color: "#6366f1", action: "Targeted Practice Modules" }, { band: "C (40-59%)", val: gradeDist.c || 0, range: "40-59%", color: "#f59e0b", action: "Foundational Bridge Course" }, { band: "Remedial (&lt;40%)", val: gradeDist.remedial || 0, range: "<40%", color: "#ef4444", action: "Project ARISE Remediation Drive" }].map((row, i) => {
                      const pct = Math.round((row.val / (kpis.total_evaluated || 1)) * 100);
                      return (
                        <TableRow key={i} sx={trSx}>
                          <TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Box sx={{ width: 10, height: 10, borderRadius: "50%", background: row.color, flexShrink: 0 }} /><Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "0.8rem" }}>{row.band}</Typography></Box></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: row.color, fontSize: "0.88rem" }}>{row.val.toLocaleString()}</TableCell>
                          <TableCell align="right"><Box sx={{ minWidth: 90 }}><Typography sx={{ fontWeight: 700, fontSize: "0.78rem" }}>{pct}%</Typography><LinearProgress variant="determinate" value={pct} sx={{ height: 4, borderRadius: 2, background: "#f1f5f9", "& .MuiLinearProgress-bar": { background: row.color } }} /></Box></TableCell>
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

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: Subject & Learning Diagnostics */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <motion.div key="view1" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.2 }}>
              <LightCard delay={0}>
                <SectionHeader icon={<Insights sx={{ fontSize: 20 }} />} title="Subject Mastery Radar" subtitle="Average score % across core academic subjects" />
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={subjectRadarData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#334155", fontSize: 11, fontWeight: 700 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                      <Radar name="State Avg %" dataKey="score" stroke="#0284c7" fill="#0284c7" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>

              <LightCard delay={1}>
                <SectionHeader icon={<Groups sx={{ fontSize: 20 }} />} title="Gender Parity in Learning" subtitle="Comparative academic mastery across male and female students" />
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={genderBarData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fill: "#475569", fontSize: 11, fontWeight: 600 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend iconSize={10} formatter={(v) => <span style={{ color: "#475569", fontSize: "0.72rem", fontWeight: 600 }}>{v}</span>} />
                      <Bar dataKey="Male" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Female" fill="#ec4899" radius={[4, 4, 0, 0]} />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Box>
              </LightCard>
            </Box>

            {benchmarkMatrix.length > 0 && (
              <LightCard delay={2}>
                <SectionHeader icon={<CompareArrows sx={{ fontSize: 20 }} />} title="Class × Subject Benchmark Matrix" subtitle="State-wide average score by class and subject" />
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Class</TableCell><TableCell>Subject</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Weak Students</TableCell><TableCell sx={{ minWidth: 120 }}>Score Indicator</TableCell><TableCell align="center">Status</TableCell></TableRow></TableHead>
                    <TableBody>
                      {benchmarkMatrix.slice(0, 30).map((r, i) => (
                        <TableRow key={i} sx={{ "& td": { py: 0.85, fontSize: "0.78rem", borderBottom: "1px solid #f8fafc" }, background: r.status === "danger" ? alpha("#ef4444", 0.03) : "transparent", "&:hover": { background: "#f8fafc" } }}>
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

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: District & Block Drilldown */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 2 && (
          <motion.div key="view2" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            <LightCard delay={0}>
              <SectionHeader icon={<MapOutlined sx={{ fontSize: 20 }} />} title="District Student Performance Standings" subtitle={`Comprehensive ranking of all ${districtBreakdown.length} reporting districts`} />
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Rank</TableCell><TableCell>District</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">High Achievers</TableCell><TableCell align="right">Remedial (&lt;40%)</TableCell><TableCell align="center">Tier</TableCell></TableRow></TableHead>
                  <TableBody>
                    {districtBreakdown.map((d, i) => (
                      <TableRow key={i} sx={trBlueSx}>
                        <TableCell sx={{ fontWeight: 800, color: d.rank <= 3 ? "#f59e0b" : "#64748b" }}>#{d.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{d.district_name}</TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>{(d.evaluated_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: d.avg_score_pct >= 70 ? "#059669" : d.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{d.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#10b981" }}>{d.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#6366f1", fontWeight: 700 }}>{(d.high_achievers || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ color: "#ef4444", fontWeight: 700 }}>{(d.remedial_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="center"><Chip label={d.performance_tier} size="small" sx={{ fontSize: "0.65rem", fontWeight: 800, height: 20, background: d.performance_tier === "Excellent" ? "#ecfdf5" : d.performance_tier === "Good" ? "#f0f9ff" : d.performance_tier === "Average" ? "#fffbeb" : "#fef2f2", color: d.performance_tier === "Excellent" ? "#059669" : d.performance_tier === "Good" ? "#0284c7" : d.performance_tier === "Average" ? "#d97706" : "#dc2626" }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>

            <LightCard delay={1}>
              <SectionHeader icon={<School sx={{ fontSize: 20 }} />} title="Educational Block-Level Drilldown" subtitle="Block performance with instant search" action={<TextField size="small" placeholder="Filter blocks or districts..." value={blockSearch} onChange={(e) => setBlockSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#94a3b8" }} /></InputAdornment>, endAdornment: blockSearch && <InputAdornment position="end"><IconButton size="small" onClick={() => setBlockSearch("")}><Close sx={{ fontSize: 13 }} /></IconButton></InputAdornment>, sx: { borderRadius: 2, fontSize: "0.78rem", background: "#f8fafc", width: 220 } }} />} />
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Rank</TableCell><TableCell>Block</TableCell><TableCell>District</TableCell><TableCell align="right">Evaluated</TableCell><TableCell align="right">Avg Score</TableCell><TableCell align="right">Pass Rate</TableCell><TableCell align="right">Remedial (&lt;40%)</TableCell><TableCell align="center">Tier</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredBlocks.map((b, i) => (
                      <TableRow key={i} sx={trSx}>
                        <TableCell sx={{ fontWeight: 800, color: "#64748b" }}>#{b.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{b.block_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.75rem" }}>{b.district_name}</TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>{(b.evaluated_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: b.avg_score_pct >= 70 ? "#059669" : b.avg_score_pct >= 55 ? "#0284c7" : "#dc2626" }}>{b.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#10b981" }}>{b.pass_rate_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#ef4444", fontWeight: 700 }}>{(b.remedial_students || 0).toLocaleString()}</TableCell>
                        <TableCell align="center"><Chip label={b.performance_tier} size="small" sx={{ fontSize: "0.65rem", fontWeight: 800, height: 20, background: b.performance_tier === "Excellent" ? "#ecfdf5" : b.performance_tier === "Good" ? "#f0f9ff" : b.performance_tier === "Average" ? "#fffbeb" : "#fef2f2", color: b.performance_tier === "Excellent" ? "#059669" : b.performance_tier === "Good" ? "#0284c7" : b.performance_tier === "Average" ? "#d97706" : "#dc2626" }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>
          </motion.div>
        )}

        {/* ════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: Student Roster & Honor Roll Hub */}
        {/* ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 3 && (
          <motion.div key="view3" {...fadeUp} style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
            
            {/* Quick Filter Toolstrip */}
            <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "1.2fr 1fr 1.2fr 1.8fr auto" }, gap: 1.5, alignItems: "center" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", mb: 0.3 }}>Grade Band</Typography>
                  <Select value={bandFilter} onChange={(e) => setBandFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.78rem", background: "#ffffff" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.78rem" }}>All Bands</MenuItem>
                    <MenuItem value="a_plus" sx={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 700 }}>A+ (≥90%)</MenuItem>
                    <MenuItem value="a" sx={{ fontSize: "0.78rem", color: "#0284c7", fontWeight: 700 }}>A (75-89%)</MenuItem>
                    <MenuItem value="b" sx={{ fontSize: "0.78rem", color: "#6366f1", fontWeight: 700 }}>B (60-74%)</MenuItem>
                    <MenuItem value="c" sx={{ fontSize: "0.78rem", color: "#f59e0b", fontWeight: 700 }}>C (40-59%)</MenuItem>
                    <MenuItem value="remedial" sx={{ fontSize: "0.78rem", color: "#ef4444", fontWeight: 700 }}>Remedial (&lt;40%)</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", mb: 0.3 }}>Class Scope</Typography>
                  <Select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.78rem", background: "#ffffff" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.78rem" }}>All Classes</MenuItem>
                    {uniqueClasses.map(c => <MenuItem key={c} value={c} sx={{ fontSize: "0.78rem" }}>{c}</MenuItem>)}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", mb: 0.3 }}>District Scope</Typography>
                  <Select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} size="small" fullWidth sx={{ borderRadius: 2, fontSize: "0.78rem", background: "#ffffff" }}>
                    <MenuItem value="ALL" sx={{ fontSize: "0.78rem" }}>All Districts (33)</MenuItem>
                    {uniqueDistricts.map(d => <MenuItem key={d} value={d} sx={{ fontSize: "0.78rem" }}>{d}</MenuItem>)}
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", mb: 0.3 }}>Search Student / School</Typography>
                  <TextField size="small" fullWidth placeholder="Student name, school..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: "#94a3b8", fontSize: 16 }} /></InputAdornment>, endAdornment: studentSearch && <InputAdornment position="end"><IconButton size="small" onClick={() => setStudentSearch("")}><Close sx={{ fontSize: 13 }} /></IconButton></InputAdornment>, sx: { borderRadius: 2, fontSize: "0.78rem", background: "#ffffff" } }} variant="outlined" />
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-end" }}>
                  <Button variant="outlined" onClick={() => { setBandFilter("ALL"); setClassFilter("ALL"); setDistrictFilter("ALL"); setStudentSearch(""); }} sx={{ borderRadius: 2, fontSize: "0.72rem", fontWeight: 700, color: "#64748b", borderColor: "#cbd5e1", height: 38 }}>Reset</Button>
                </Box>
              </Box>
            </Card>

            {/* Student Directory Table */}
            <LightCard delay={0}>
              <SectionHeader icon={<People sx={{ fontSize: 20 }} />} title="State Student Roster Explorer" subtitle={`Showing ${filteredStudents.length} of ${students.length} evaluated students`} />
              <TableContainer sx={{ maxHeight: 460 }}>
                <Table size="small" stickyHeader>
                  <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Rank</TableCell><TableCell>Student Name</TableCell><TableCell>Gender</TableCell><TableCell>Class</TableCell><TableCell>School</TableCell><TableCell>Block</TableCell><TableCell>District</TableCell><TableCell align="right">Score</TableCell><TableCell align="right">Assessments</TableCell><TableCell align="center">Grade</TableCell></TableRow></TableHead>
                  <TableBody>
                    {filteredStudents.map((s, i) => (
                      <TableRow key={i} sx={trBlueSx}>
                        <TableCell sx={{ fontWeight: 800, color: s.rank <= 3 ? "#f59e0b" : "#64748b" }}>#{s.rank}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                        <TableCell><Chip label={["M","MALE","BOY"].includes(s.gender) ? "Male" : ["F","FEMALE","GIRL"].includes(s.gender) ? "Female" : s.gender || "N/A"} size="small" sx={{ fontSize: "0.65rem", height: 18, fontWeight: 700, background: ["M","MALE","BOY"].includes(s.gender) ? "#e0f2fe" : "#fce7f3", color: ["M","MALE","BOY"].includes(s.gender) ? "#0284c7" : "#ec4899" }} /></TableCell>
                        <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                        <TableCell sx={{ color: "#475569", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.school_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.block_name}</TableCell>
                        <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: s.avg_score_pct >= 75 ? "#059669" : s.avg_score_pct >= 55 ? "#0284c7" : "#dc2626", fontSize: "0.88rem" }}>{s.avg_score_pct}%</TableCell>
                        <TableCell align="right" sx={{ color: "#64748b" }}>{s.assessments_taken}</TableCell>
                        <TableCell align="center"><GradeChip grade={s.grade} /></TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow><TableCell colSpan={10} align="center" sx={{ py: 4, color: "#94a3b8", fontStyle: "italic" }}>No students match your filter criteria.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </LightCard>

            {/* Honor Roll & Remedial Action Dual Panels */}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.2 }}>
              <LightCard delay={1}>
                <SectionHeader icon={<EmojiEvents sx={{ fontSize: 20 }} />} title="State Honor Roll (Top Rankers)" subtitle="Students scoring 90%+ across academic assessments" action={<Chip label={`${topStudents.length} Scholars`} size="small" sx={{ background: "#ecfdf5", color: "#059669", fontWeight: 800 }} />} />
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": thSx }}><TableCell>Rank</TableCell><TableCell>Student</TableCell><TableCell>Class</TableCell><TableCell>District</TableCell><TableCell align="right">Score</TableCell><TableCell align="center">Grade</TableCell></TableRow></TableHead>
                    <TableBody>
                      {topStudents.map((s, i) => (
                        <TableRow key={i} sx={trSx}>
                          <TableCell sx={{ fontWeight: 800, color: "#f59e0b" }}>#{s.rank}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                          <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#059669", fontSize: "0.88rem" }}>{s.avg_score_pct}%</TableCell>
                          <TableCell align="center"><GradeChip grade={s.grade} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>

              <LightCard delay={2}>
                <SectionHeader icon={<Warning sx={{ fontSize: 20 }} />} title="Remedial Priority Cohort" subtitle="Students scoring below 40% — immediate intervention required" action={<Chip label={`${remedialStudents.length} Students`} size="small" sx={{ background: "#fef2f2", color: "#dc2626", fontWeight: 800 }} />} />
                <TableContainer sx={{ maxHeight: 380 }}>
                  <Table size="small" stickyHeader>
                    <TableHead><TableRow sx={{ "& th": { background: "#fef2f2", color: "#7f1d1d", fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", py: 1.2 } }}><TableCell>Student</TableCell><TableCell>Class</TableCell><TableCell>District</TableCell><TableCell align="right">Score</TableCell><TableCell align="center">Urgency</TableCell></TableRow></TableHead>
                    <TableBody>
                      {remedialStudents.map((s, i) => (
                        <TableRow key={i} sx={{ "& td": { py: 0.85, fontSize: "0.78rem", borderBottom: "1px solid #fef2f2" }, "&:hover": { background: "#fff1f2" } }}>
                          <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>{s.student_name}</TableCell>
                          <TableCell sx={{ color: "#64748b" }}>{s.class_name}</TableCell>
                          <TableCell sx={{ color: "#64748b", fontSize: "0.72rem" }}>{s.district_name}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 900, color: "#dc2626", fontSize: "0.88rem" }}>{s.avg_score_pct}%</TableCell>
                          <TableCell align="center"><InterventionChip level={s.intervention_level} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </LightCard>
            </Box>

          </motion.div>
        )}

      </AnimatePresence>
    </Box>
  );
}
