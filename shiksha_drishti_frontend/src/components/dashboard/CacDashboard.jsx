import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, LinearProgress, CircularProgress, Alert,
  Avatar, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, Tooltip, Stack, Divider, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Rating, alpha
} from '@mui/material';
import {
  School, People, AssignmentTurnedIn, TrendingUp, Warning,
  CheckCircle, Search, Refresh, Star, Person,
  Email, Phone, AutoAwesome, ClassOutlined,
  VerifiedUser, Print, Close, Visibility, BarChart, Dashboard,
  PieChart as PieIcon, Insights, ShowChart, Timeline, EmojiEvents,
  LocationOn, Assessment, MenuBook, Business, FactCheck
} from '@mui/icons-material';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { clusterApi } from '../../services/api';

const GRADE_COLORS = {
  a_plus: '#10b981', // Emerald
  a: '#0284c7',      // Sky Blue
  b: '#6366f1',      // Indigo
  c: '#f59e0b',      // Amber
  remedial: '#ef4444'// Rose
};

const PIE_PALETTE = ['#10b981', '#0284c7', '#6366f1', '#f59e0b', '#ef4444'];

// ── Micro-Sparkline KPI Card Component ──
function CacKpiCard({ label, value, sub, color, gradientTo, icon, badge, wavePoints, onClick, actionText }) {
  const gradId = `cac-kpi-grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokeGradId = `cac-kpi-stroke-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
      <Card
        elevation={0}
        sx={{
          p: 1.6,
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          background: '#ffffff',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
          '&:hover': {
            borderColor: color,
            boxShadow: `0 8px 24px ${alpha(color, 0.12)}`,
          },
        }}
      >
        {/* Top Header: Icon & Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${color} 0%, ${gradientTo || color} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 3px 10px ${alpha(color, 0.25)}`,
              color: '#ffffff',
            }}
          >
            {icon}
          </Box>

          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                background: alpha(color, 0.08),
                color: color,
                fontWeight: 800,
                height: 20,
                borderRadius: 1.5,
                border: `1px solid ${alpha(color, 0.2)}`,
                fontSize: '0.66rem',
                px: 0.2,
              }}
            />
          )}
        </Box>

        {/* Label */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.25 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
          <Typography sx={{
            fontSize: '0.67rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {label}
          </Typography>
        </Box>

        {/* Big Metric Value */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            {value}
          </Typography>
          {actionText && onClick && (
            <Button
              size="small"
              variant="outlined"
              onClick={onClick}
              sx={{
                fontSize: '0.65rem',
                py: 0.1,
                px: 0.8,
                borderRadius: 1.5,
                borderColor: color,
                color: color,
                fontWeight: 700,
                textTransform: 'none',
                minWidth: 'auto',
                '&:hover': { background: alpha(color, 0.08), borderColor: color }
              }}
            >
              {actionText}
            </Button>
          )}
        </Box>

        {/* Subtitle / Context */}
        <Typography sx={{
          fontSize: '0.72rem',
          color: '#64748b',
          mt: 0.4,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sub}
        </Typography>

        {/* Embedded Wave Sparkline */}
        <Box sx={{ width: '100%', height: 26, mt: 0.8, mx: -1.6, mb: -1.6 }}>
          <svg
            viewBox="0 0 280 45"
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={color} stopOpacity="0.01" />
              </linearGradient>
              <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} />
                <stop offset="100%" stopColor={gradientTo || color} />
              </linearGradient>
            </defs>
            <path
              d={wavePoints || "M0,32 Q40,12 80,24 T160,14 T220,28 T280,8 L280,45 L0,45 Z"}
              fill={`url(#${gradId})`}
            />
            <path
              d={wavePoints ? wavePoints.split(' L280')[0] : "M0,32 Q40,12 80,24 T160,14 T220,28 T280,8"}
              fill="none"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />
          </svg>
        </Box>
      </Card>
    </motion.div>
  );
}

export default function CacDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State (synced with URL ?tab=0,1,2,3)
  const tabFromUrl = parseInt(searchParams.get('tab') || '0', 10);
  const [currentTab, setCurrentTab] = useState(isNaN(tabFromUrl) ? 0 : tabFromUrl);

  useEffect(() => {
    const t = parseInt(searchParams.get('tab') || '0', 10);
    if (!isNaN(t) && t !== currentTab) {
      setCurrentTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setSearchParams({ tab: newValue.toString() });
  };

  // Main Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [overview, setOverview] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);

  // Search & Filter States
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [schoolSearch, setSchoolSearch] = useState('');
  const [selectedSchoolModal, setSelectedSchoolModal] = useState(null);
  const [loFilterPriority, setLoFilterPriority] = useState('ALL');
  const [loSearch, setLoSearch] = useState('');
  const [loSelectedClass, setLoSelectedClass] = useState('ALL');

  // Load All Cluster Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [ovRes, subRes, loRes] = await Promise.all([
        clusterApi.getOverview(),
        clusterApi.getSubjects(),
        clusterApi.getLearningOutcomes(),
      ]);

      setOverview(ovRes.data);
      setSubjects(subRes.data.subjects || []);
      setLearningOutcomes(loRes.data.learning_outcomes || []);
    } catch (err) {
      console.error('Failed to load Cluster analytics:', err);
      setError(err.response?.data?.error || 'Unable to load Cluster dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePrint = () => {
    window.print();
  };

  // Safe data accessors
  const cluster = overview?.cluster || {};
  const kpis = overview?.kpis || {};
  const schools = overview?.schools || [];
  const gradeDist = overview?.grade_distribution || {};
  const aiRecommendations = overview?.ai_recommendations || [];

  // Filtered Schools for Tab 1
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchesType = schoolFilter === 'ALL' || s.performance_category === schoolFilter || (schoolFilter === 'CRITICAL' && s.avg_score_pct < 60);
      const matchesSearch = !schoolSearch || 
        s.school_name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
        String(s.udise).includes(schoolSearch) ||
        s.hos_name?.toLowerCase().includes(schoolSearch.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [schools, schoolFilter, schoolSearch]);

  // Chart Data: School Comparative Bar Chart
  const schoolBarData = useMemo(() => {
    return schools.map(s => ({
      name: s.school_name.replace('GOVT ', '').replace('HIGHER SECONDARY SCHOOL', 'HSS').replace('MIDDLE SCHOOL', 'MS').replace('PRIMARY SCHOOL', 'PS').replace('HIGH SCHOOL', 'HS').slice(0, 18),
      fullName: s.school_name,
      'School Avg %': s.avg_score_pct,
      'Cluster Avg %': kpis.cluster_avg_score || 72,
      'Pass Rate %': s.pass_rate_pct,
      remedial: s.remedial_count,
    }));
  }, [schools, kpis.cluster_avg_score]);

  // Chart Data: Grade Distribution Pie
  const gradePieData = useMemo(() => {
    return [
      { name: 'A+ (85%+)', value: gradeDist.a_plus || 0, color: GRADE_COLORS.a_plus },
      { name: 'A (70-84%)', value: gradeDist.a || 0, color: GRADE_COLORS.a },
      { name: 'B (55-69%)', value: gradeDist.b || 0, color: GRADE_COLORS.b },
      { name: 'C (40-54%)', value: gradeDist.c || 0, color: GRADE_COLORS.c },
      { name: 'Remedial (<40%)', value: gradeDist.remedial || 0, color: GRADE_COLORS.remedial },
    ].filter(d => d.value > 0);
  }, [gradeDist]);

  const totalEvaluatedStudents = useMemo(() => {
    return (gradeDist.a_plus || 0) + (gradeDist.a || 0) + (gradeDist.b || 0) + (gradeDist.c || 0) + (gradeDist.remedial || 0);
  }, [gradeDist]);

  // Filtered Cluster LOs and Summary Stats for Tab 2
  const filteredClusterLOs = useMemo(() => {
    return learningOutcomes.filter(lo => {
      if (loSelectedClass !== 'ALL' && String(lo.class_num) !== String(loSelectedClass) && String(lo.class_id) !== String(loSelectedClass)) {
        return false;
      }
      if (loFilterPriority !== 'ALL' && lo.revision_priority !== loFilterPriority) {
        return false;
      }
      if (loSearch) {
        const q = loSearch.toLowerCase();
        const match = (lo.description || '').toLowerCase().includes(q) ||
                      (lo.lo_code || '').toLowerCase().includes(q) ||
                      (lo.subject_name || '').toLowerCase().includes(q) ||
                      (lo.class_name || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [learningOutcomes, loSelectedClass, loFilterPriority, loSearch]);

  const loClusterStats = useMemo(() => {
    const total = learningOutcomes.length;
    const urgent = learningOutcomes.filter(l => l.revision_priority === 'CLUSTER_REVISION_URGENT').length;
    const moderate = learningOutcomes.filter(l => l.revision_priority === 'MODERATE_PRACTICE').length;
    const onTrack = learningOutcomes.filter(l => l.revision_priority === 'ON_TRACK').length;
    const avgScore = total > 0 ? Math.round(learningOutcomes.reduce((acc, l) => acc + (Number(l.mastery_pct) || 0), 0) / total) : 0;
    return { total, urgent, moderate, onTrack, avgScore };
  }, [learningOutcomes]);

  if (loading && !overview) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <CircularProgress size={48} sx={{ color: '#0284c7', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#0f3460', fontWeight: 800 }}>
          Loading Cluster Command Center (संकुल डैशबोर्ड)...
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Shiksha Drishti — Vidya Samiksha Kendra • Cluster Monitoring Intelligence
        </Typography>
      </Box>
    );
  }

  const kpiCardsData = [
    {
      label: 'Cluster Schools (संकुल विद्यालय)',
      value: kpis.total_schools || 5,
      sub: '5 Allocated · Raipur Urban Block',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      icon: <Business sx={{ fontSize: 18 }} />,
      badge: 'Cluster',
      wavePoints: 'M0,32 Q35,14 70,26 T140,16 T210,24 T280,10 L280,45 L0,45 Z',
    },
    {
      label: 'Total Enrolled (कुल छात्र)',
      value: kpis.total_students || 0,
      sub: `Boys: ${kpis.male_students || 0} · Girls: ${kpis.female_students || 0}`,
      color: '#10b981',
      gradientTo: '#34d399',
      icon: <People sx={{ fontSize: 18 }} />,
      badge: 'Students',
      wavePoints: 'M0,28 Q45,8 90,22 T180,12 T250,20 T280,6 L280,45 L0,45 Z',
    },
    {
      label: 'Active Faculty (शिक्षक दल)',
      value: kpis.total_teachers || 12,
      sub: 'PTR: 1:26 (Compliant)',
      color: '#8b5cf6',
      gradientTo: '#a78bfa',
      icon: <Person sx={{ fontSize: 18 }} />,
      badge: 'Faculty',
      wavePoints: 'M0,34 Q30,16 75,30 T150,18 T225,26 T280,12 L280,45 L0,45 Z',
    },
    {
      label: 'Cluster Avg Score (संकुल औसत)',
      value: `${kpis.cluster_avg_score || 72}%`,
      sub: `Pass Rate: ${kpis.pass_rate_pct || 88}%`,
      color: '#f59e0b',
      gradientTo: '#fbbf24',
      icon: <TrendingUp sx={{ fontSize: 18 }} />,
      badge: 'Score',
      wavePoints: 'M0,30 Q40,10 80,24 T160,14 T230,22 T280,8 L280,45 L0,45 Z',
    },
    {
      label: 'FLN Proficiency (बुनियादी दक्षता)',
      value: `${kpis.fln_proficiency_index || 76}%`,
      sub: 'NIPUN Bharat Standard',
      color: '#06b6d4',
      gradientTo: '#22d3ee',
      icon: <FactCheck sx={{ fontSize: 18 }} />,
      badge: 'FLN',
      wavePoints: 'M0,28 Q35,8 80,20 T160,10 T240,18 T280,6 L280,45 L0,45 Z',
    },
    {
      label: 'Intervention Priority (उपचारात्मक)',
      value: kpis.critical_schools_count || 1,
      sub: '1 School with Avg < 60%',
      color: '#ef4444',
      gradientTo: '#f87171',
      icon: <Warning sx={{ fontSize: 18 }} />,
      badge: 'Action Required',
      wavePoints: 'M0,34 Q40,18 80,32 T160,20 T240,28 T280,14 L280,45 L0,45 Z',
    },
  ];

  return (
    <Box sx={{ width: '100%', pb: 4, maxWidth: '100%', overflowX: 'hidden' }}>
      {/* ── 1. Executive CAC Cluster Banner ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 3.2,
          mb: 2.2,
          p: { xs: 2, sm: 2.4 },
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 55%, #0284c7 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(7, 21, 38, 0.4)',
          border: '1px solid rgba(56, 189, 248, 0.22)',
        }}
      >
        {/* Glow ambient spot */}
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(2, 132, 199, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, position: 'relative', zIndex: 1 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8, flexWrap: 'wrap', gap: 0.8 }}>
              <Chip
                icon={<VerifiedUser sx={{ fontSize: '14px !important', color: '#38bdf8 !important' }} />}
                label="Cluster Academic Coordinator (संकुल अकादमिक समन्वयक)"
                size="small"
                sx={{
                  background: 'rgba(56, 189, 248, 0.16)',
                  color: '#7dd3fc',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  height: 24,
                }}
              />
              <Chip
                label={`Cluster CD: ${cluster.cluster_cd || '220509001'}`}
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 24,
                }}
              />
              <Chip
                label={`${cluster.block_name || 'RAIPUR URBAN'} • ${cluster.district_name || 'RAIPUR'}`}
                size="small"
                sx={{
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 24,
                }}
              />
            </Stack>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: '#ffffff',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 0.5,
              }}
            >
              {cluster.cluster_name || 'RAIPUR CLUSTER 1'} — Academic Command Center
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.82rem', fontWeight: 500 }}>
              Cluster Coordinator: <strong style={{ color: '#ffffff' }}>{user?.full_name || 'Shri Sunil Sharma'}</strong> · Academic Session 2026-27 · Vidya Samiksha Kendra CG
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.2} sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'none',
                borderRadius: 2,
                px: 1.6,
                '&:hover': { borderColor: '#ffffff', background: 'rgba(255,255,255,0.08)' }
              }}
            >
              Export Cluster Dossier
            </Button>
            <IconButton
              size="small"
              onClick={() => loadData(true)}
              disabled={refreshing}
              sx={{
                background: 'rgba(255,255,255,0.12)',
                color: '#ffffff',
                borderRadius: 2,
                p: 0.9,
                '&:hover': { background: 'rgba(255,255,255,0.22)' }
              }}
            >
              <Refresh sx={{ fontSize: 18, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Stack>
        </Box>
      </Card>

      {/* ── 2. Micro-Sparkline 6-Card KPI Grid ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(6, 1fr)',
          },
          gap: 1.5,
          mb: 2.2,
          width: '100%',
        }}
      >
        {kpiCardsData.map((kpi, idx) => (
          <CacKpiCard key={idx} {...kpi} />
        ))}
      </Box>

      {/* ── 3. Navigation Tabs ── */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2.8,
          mb: 2.2,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            px: 1.5,
            borderBottom: '1px solid #f1f5f9',
            '& .MuiTab-root': {
              minHeight: 46,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.82rem',
              color: '#64748b',
              py: 0.8,
              px: 2,
              '&.Mui-selected': {
                color: '#0284c7',
                fontWeight: 800,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#0284c7',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab icon={<Dashboard sx={{ fontSize: 17 }} />} iconPosition="start" label="Cluster Overview (संकुल अवलोकन)" />
          <Tab icon={<Business sx={{ fontSize: 17 }} />} iconPosition="start" label="School Performance Matrix (विद्यालय समीक्षा)" />
          <Tab icon={<AutoAwesome sx={{ fontSize: 17 }} />} iconPosition="start" label="Subject & LO Diagnostics (दक्षता विश्लेषण)" />
          <Tab icon={<People sx={{ fontSize: 17 }} />} iconPosition="start" label="HOS & Faculty Directory (संपर्क निर्देशिका)" />
        </Tabs>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          TAB 0: CLUSTER OVERVIEW & INTER-SCHOOL COMPARISON
          ═══════════════════════════════════════════════════════════════ */}
      {currentTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Top Charts Row: Inter-School Bar vs Grade Distribution Donut */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.7fr 1fr' },
              gap: 2,
              width: '100%',
            }}
          >
            {/* Chart 1: Inter-School Performance Comparison */}
            <Card elevation={0} sx={{
              p: 2,
              borderRadius: 2.8,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
                    <BarChart sx={{ color: '#0284c7', fontSize: 18 }} />
                    Inter-School Comparative Performance (विद्यालय तुलनात्मक प्रगति)
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                    School Average % vs Cluster Benchmark ({kpis.cluster_avg_score || 72}%)
                  </Typography>
                </Box>
                <Chip label={`${schools.length} Schools`} size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', height: 20, fontSize: '0.68rem', border: '1px solid rgba(16,185,129,0.2)' }} />
              </Box>

              <Box sx={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={schoolBarData} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9.5, fill: '#475569' }} angle={-15} textAnchor="end" />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val, name) => [`${val}%`, name]} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="School Avg %" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* Chart 2: Cluster Grade Distribution Donut */}
            <Card elevation={0} sx={{
              p: 2,
              borderRadius: 2.8,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
                  <PieIcon sx={{ color: '#8b5cf6', fontSize: 18 }} />
                  Cluster Grade Bands (ग्रेड वितरण)
                </Typography>
                <Chip label="NIPUN Bands" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#faf5ff', color: '#7c3aed', height: 20, fontSize: '0.68rem', border: '1px solid rgba(139,92,246,0.2)' }} />
              </Box>

              <Box sx={{ position: 'relative', width: '100%', height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {gradePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [`${val} Students`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}>
                  <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
                    {totalEvaluatedStudents}
                  </Typography>
                  <Typography sx={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 600 }}>
                    Students
                  </Typography>
                </Box>
              </Box>

              {/* Mini Legend Row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'center', mt: 1 }}>
                {gradePieData.map((g, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                    <Typography sx={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600 }}>
                      {g.name.split(' ')[0]}: <strong>{g.value}</strong>
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Box>

          {/* 5-Column School Summary Cards Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(5, 1fr)',
              },
              gap: 1.5,
              width: '100%',
            }}
          >
            {schools.map((sc) => {
              const isTop = sc.avg_score_pct >= 80;
              const isCritical = sc.avg_score_pct < 60;
              const cardColor = isTop ? '#10b981' : isCritical ? '#ef4444' : '#0284c7';

              return (
                <Card
                  key={sc.udise}
                  elevation={0}
                  sx={{
                    p: 1.6,
                    borderRadius: 2.5,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderTop: `3px solid ${cardColor}`,
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: cardColor,
                      boxShadow: `0 6px 18px ${alpha(cardColor, 0.12)}`,
                    }
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.6 }}>
                      <Chip
                        label={sc.performance_category}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          background: alpha(cardColor, 0.1),
                          color: cardColor,
                          border: `1px solid ${alpha(cardColor, 0.25)}`,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 600 }}>
                        UDISE: {String(sc.udise).slice(-5)}
                      </Typography>
                    </Box>

                    <Typography sx={{
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      color: '#0f2744',
                      lineHeight: 1.25,
                      mb: 0.4,
                      minHeight: 34,
                    }}>
                      {sc.school_name.replace('GOVT ', '')}
                    </Typography>

                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', mb: 1 }}>
                      HOS: {sc.hos_name}
                    </Typography>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.4 }}>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                        Avg Score
                      </Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: cardColor, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {sc.avg_score_pct}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={sc.avg_score_pct}
                      sx={{
                        height: 5,
                        borderRadius: 3,
                        bgcolor: '#f1f5f9',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: cardColor,
                          borderRadius: 3,
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 0.8, borderTop: '1px solid #f1f5f9' }}>
                      <Typography sx={{ fontSize: '0.66rem', color: '#64748b' }}>
                        Pass: <strong>{sc.pass_rate_pct}%</strong>
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setSelectedSchoolModal(sc)}
                        sx={{
                          fontSize: '0.64rem',
                          py: 0,
                          px: 0.6,
                          minWidth: 'auto',
                          fontWeight: 700,
                          color: '#0284c7',
                          textTransform: 'none'
                        }}
                      >
                        Inspect 360°
                      </Button>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Box>

          {/* Smart CAC AI Diagnostic Action Center */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            p: 2.2,
            background: 'linear-gradient(135deg, #071526 0%, #0f2744 100%)',
            color: '#ffffff',
            border: '1px solid rgba(56, 189, 248, 0.18)',
            boxShadow: '0 4px 20px rgba(7, 21, 38, 0.35)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'rgba(56, 189, 248, 0.18)', width: 34, height: 34, color: '#38bdf8' }}>
                  <AutoAwesome sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#ffffff' }}>
                    CAC Smart Diagnostic & Remedial Action Center (संकुल कार्य योजना)
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Automated pedagogical & learning outcome interventions prioritized for Raipur Cluster 1
                  </Typography>
                </Box>
              </Box>
              <Chip label="AI Real-Time Diagnostics" size="small" sx={{ background: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 800, fontSize: '0.68rem' }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {aiRecommendations.map((rec, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 1.5,
                    borderRadius: 2.2,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                      <Chip
                        label={rec.badge}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          background: rec.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.22)' : rec.priority === 'POSITIVE' ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)',
                          color: rec.priority === 'HIGH' ? '#fca5a5' : rec.priority === 'POSITIVE' ? '#6ee7b7' : '#fde047',
                          border: `1px solid ${rec.priority === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : rec.priority === 'POSITIVE' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                        }}
                      />
                      <Typography sx={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.5)' }}>
                        Priority: {rec.priority}
                      </Typography>
                    </Box>

                    <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#ffffff', mb: 0.3 }}>
                      {rec.title}
                    </Typography>

                    <Typography sx={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600, mb: 0.6 }}>
                      📍 {rec.school}
                    </Typography>

                    <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.78)', lineHeight: 1.45 }}>
                      {rec.detail}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.2, pt: 0.8, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#7dd3fc', fontWeight: 700 }}>
                      Academic Focus: Remedial Mentoring Active
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 1: SCHOOL PERFORMANCE MATRIX (COMPARATIVE TABLE)
          ═══════════════════════════════════════════════════════════════ */}
      {currentTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Search & Filter Ribbon */}
          <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
              <TextField
                size="small"
                placeholder="Search school name, UDISE code, or Principal..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                sx={{
                  flex: 1,
                  maxWidth: { xs: '100%', sm: 380 },
                  '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' }
                }}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>
                }}
              />

              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.8 }}>
                {[
                  { label: 'All Schools', val: 'ALL' },
                  { label: 'Top Tier (80%+)', val: 'Top Performing' },
                  { label: 'Moderate (60-79%)', val: 'Moderate' },
                  { label: 'Critical (<60%)', val: 'CRITICAL' },
                ].map((item) => (
                  <Chip
                    key={item.val}
                    label={item.label}
                    onClick={() => setSchoolFilter(item.val)}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      borderRadius: 2,
                      background: schoolFilter === item.val ? '#0284c7' : '#f1f5f9',
                      color: schoolFilter === item.val ? '#ffffff' : '#475569',
                      '&:hover': { background: schoolFilter === item.val ? '#0284c7' : '#e2e8f0' }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Card>

          {/* School Comparison Data Table (No inspection visit column) */}
          <Card elevation={0} sx={{ borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', py: 1.2 }}>UDISE / SCHOOL</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>CATEGORY</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>HEAD OF SCHOOL (HOS)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>STUDENTS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>AVG SCORE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>PASS RATE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>REMEDIAL</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.map((sc) => {
                    const isTop = sc.avg_score_pct >= 80;
                    const isCritical = sc.avg_score_pct < 60;
                    const statusColor = isTop ? '#10b981' : isCritical ? '#ef4444' : '#0284c7';

                    return (
                      <TableRow key={sc.udise} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ py: 1.2 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#0f2744' }}>
                            {sc.school_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                            UDISE: {sc.udise}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={sc.school_type.replace('Government ', '')}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              borderRadius: 1.5,
                              background: '#f1f5f9',
                              color: '#334155',
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                            {sc.hos_name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                            📞 {sc.hos_mobile}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f172a' }}>
                            {sc.enrolled_students}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={`${sc.avg_score_pct}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.74rem',
                              background: alpha(statusColor, 0.1),
                              color: statusColor,
                              border: `1px solid ${alpha(statusColor, 0.25)}`,
                              borderRadius: 1.5,
                              height: 22,
                            }}
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: sc.pass_rate_pct >= 80 ? '#10b981' : '#f59e0b' }}>
                            {sc.pass_rate_pct}%
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: sc.remedial_count > 4 ? '#ef4444' : '#64748b' }}>
                            {sc.remedial_count}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility sx={{ fontSize: '13px !important' }} />}
                            onClick={() => setSelectedSchoolModal(sc)}
                            sx={{
                              fontSize: '0.68rem',
                              textTransform: 'none',
                              py: 0.2,
                              px: 0.9,
                              borderRadius: 1.5,
                              borderColor: '#cbd5e1',
                              color: '#0f3460',
                              fontWeight: 700,
                              '&:hover': { borderColor: '#0284c7', background: 'rgba(2, 132, 199, 0.05)' }
                            }}
                          >
                            Inspect 360°
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 2: SUBJECT & CHAPTER/LO REMEDIAL DIAGNOSTICS
          ═══════════════════════════════════════════════════════════════ */}
      {currentTab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Subject-Wise Comparative Bar Chart */}
          <Card elevation={0} sx={{ p: 2, borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.9rem' }}>
                <MenuBook sx={{ color: '#0284c7', fontSize: 19 }} />
                Cluster-Wide Subject Mastery Benchmarking (विषयवार संकुल औसत)
              </Typography>
              <Chip label="All 5 Cluster Schools Evaluated" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', height: 20, fontSize: '0.68rem' }} />
            </Box>

            <Box sx={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={subjects} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="subject_name" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(val) => [`${val}%`, 'Avg Mastery']} />
                  <Bar dataKey="avg_score_pct" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {subjects.map((entry, index) => (
                      <Cell key={`sub-cell-${index}`} fill={entry.avg_score_pct >= 75 ? '#10b981' : entry.avg_score_pct >= 60 ? '#0284c7' : '#ef4444'} />
                    ))}
                  </Bar>
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Cluster Question Summary Cards */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}>
            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #e2e8f0', background: '#ffffff' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Questions Evaluated
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.35rem', my: 0.3 }}>
                {loClusterStats.total} Questions
              </Typography>
              <Typography sx={{ color: '#0284c7', fontSize: '0.68rem', fontWeight: 600 }}>
                Cluster Average: {loClusterStats.avgScore}%
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #fecaca', background: '#fef2f2' }}>
              <Typography sx={{ color: '#b91c1c', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                🚨 Questions Needing Remedial
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#dc2626', fontSize: '1.35rem', my: 0.3 }}>
                {loClusterStats.urgent} Questions
              </Typography>
              <Typography sx={{ color: '#991b1b', fontSize: '0.68rem', fontWeight: 600 }}>
                Score &lt; 55% · Joint workshop required
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #fde68a', background: '#fffbeb' }}>
              <Typography sx={{ color: '#b45309', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ⚡ Moderate Reinforcement
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.35rem', my: 0.3 }}>
                {loClusterStats.moderate} Questions
              </Typography>
              <Typography sx={{ color: '#92400e', fontSize: '0.68rem', fontWeight: 600 }}>
                Score 55–72% · Worksheets needed
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
              <Typography sx={{ color: '#15803d', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ⭐ On Track Questions
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1.35rem', my: 0.3 }}>
                {loClusterStats.onTrack} Questions
              </Typography>
              <Typography sx={{ color: '#166534', fontSize: '0.68rem', fontWeight: 600 }}>
                Score &gt; 72% · Concept mastered
              </Typography>
            </Card>
          </Box>

          {/* Question Diagnostic Table Card with Filter Ribbon */}
          <Card elevation={0} sx={{ borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0', p: 1.8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.8, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.92rem' }}>
                  Cluster Question-Wise Performance Diagnostics (संकुल स्तरीय प्रश्नवार विश्लेषण)
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.2 }}>
                  Question error patterns aggregated across cluster schools. Identifies questions where students struggle across schools to guide cluster remedial sessions.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search question, subject..."
                  value={loSearch}
                  onChange={(e) => setLoSearch(e.target.value)}
                  sx={{
                    width: { xs: '100%', sm: 220 },
                    '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.78rem', height: 34 }
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: '#94a3b8' }} /></InputAdornment>
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={loSelectedClass}
                    onChange={(e) => setLoSelectedClass(e.target.value)}
                    sx={{ borderRadius: 2, fontSize: '0.78rem', height: 34 }}
                  >
                    <MenuItem value="ALL">All Classes</MenuItem>
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(c => (
                      <MenuItem key={c} value={c}>Class {c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* Quick Filter Badges */}
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.8, flexWrap: 'wrap' }}>
              {[
                { label: 'All Questions', val: 'ALL', count: loClusterStats.total },
                { label: '🚨 Cluster Urgent Remedial', val: 'CLUSTER_REVISION_URGENT', count: loClusterStats.urgent },
                { label: '⚡ Moderate Practice', val: 'MODERATE_PRACTICE', count: loClusterStats.moderate },
                { label: '⭐ On Track', val: 'ON_TRACK', count: loClusterStats.onTrack },
              ].map(item => (
                <Chip
                  key={item.val}
                  label={`${item.label} (${item.count})`}
                  onClick={() => setLoFilterPriority(item.val)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    borderRadius: 1.8,
                    height: 26,
                    background: loFilterPriority === item.val ? '#0284c7' : '#f1f5f9',
                    color: loFilterPriority === item.val ? '#ffffff' : '#475569',
                    border: loFilterPriority === item.val ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    '&:hover': { background: loFilterPriority === item.val ? '#0284c7' : '#e2e8f0' }
                  }}
                />
              ))}
            </Box>

            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', py: 1.2 }}>QUESTION & MARKS</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>CLASS & SUBJECT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>SCHOOLS TESTED</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>STUDENTS &lt; 40%</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>CLUSTER AVG & %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', minWidth: 260 }}>CAC REMEDIAL DIRECTIVE</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredClusterLOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                          No questions match the selected filter criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClusterLOs.map((lo, idx) => {
                      const isUrgent = lo.revision_priority === 'CLUSTER_REVISION_URGENT';
                      const isModerate = lo.revision_priority === 'MODERATE_PRACTICE';
                      const statusColor = isUrgent ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

                      return (
                        <TableRow key={lo.id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                              <Chip
                                label={`Question ${lo.question_number || 'Q01'}`}
                                size="small"
                                sx={{
                                  borderRadius: 1.2,
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  height: 22,
                                  background: isUrgent ? '#fee2e2' : '#f1f5f9',
                                  color: isUrgent ? '#b91c1c' : '#0f3460',
                                }}
                              />
                              <Chip
                                label={`Max: ${lo.max_marks || 10} M`}
                                size="small"
                                sx={{
                                  borderRadius: 1.2,
                                  fontWeight: 700,
                                  fontSize: '0.64rem',
                                  height: 20,
                                  background: '#f8fafc',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                }}
                              />
                            </Box>
                          </TableCell>

                          <TableCell>
                            <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.78rem' }}>
                              {lo.class_name}
                            </Typography>
                            <Typography sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>
                              {lo.subject_name}
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={`${lo.evaluated_schools_count || 1} School${(lo.evaluated_schools_count || 1) > 1 ? 's' : ''}`}
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 700,
                                fontSize: '0.68rem',
                                height: 20,
                                background: '#f8fafc',
                                color: '#475569',
                                border: '1px solid #e2e8f0',
                              }}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: lo.weak_students_count >= 8 ? '#ef4444' : '#64748b' }}>
                              {lo.weak_students_count} Students
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontWeight: 800, minWidth: 34, fontSize: '0.8rem', color: statusColor }}>
                                {lo.mastery_pct}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={lo.mastery_pct}
                                sx={{
                                  width: 55,
                                  height: 5,
                                  borderRadius: 2,
                                  bgcolor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': { bgcolor: statusColor, borderRadius: 2 }
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.2 }}>
                              Avg: {lo.avg_marks_obtained || Math.round(((lo.mastery_pct || 0) * (lo.max_marks || 10)) / 100)} / {lo.max_marks || 10} M
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={isUrgent ? '🚨 Urgent Remedial' : isModerate ? '⚡ Moderate' : '⭐ On Track'}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.66rem',
                                fontWeight: 800,
                                background: isUrgent ? '#fef2f2' : isModerate ? '#fffbeb' : '#f0fdf4',
                                color: isUrgent ? '#dc2626' : isModerate ? '#d97706' : '#16a34a',
                                border: `1px solid ${isUrgent ? '#fecaca' : isModerate ? '#fde68a' : '#bbf7d0'}`,
                                borderRadius: 1.5,
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ py: 1.2 }}>
                            <Box sx={{
                              p: 0.8,
                              borderRadius: 1.5,
                              background: isUrgent ? '#fff1f2' : isModerate ? '#fffdf5' : '#f8fafc',
                              border: `1px solid ${isUrgent ? '#ffe4e6' : isModerate ? '#fef3c7' : '#edf2f7'}`,
                            }}>
                              <Typography sx={{
                                fontSize: '0.7rem',
                                color: isUrgent ? '#9f1239' : isModerate ? '#92400e' : '#334155',
                                fontWeight: 600,
                                lineHeight: 1.35
                              }}>
                                {lo.recommendation}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          TAB 3: HOS & FACULTY DIRECTORY
          ═══════════════════════════════════════════════════════════════ */}
      {currentTab === 3 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 1.8 }}>
          {schools.map((sc) => (
            <Card
              key={sc.udise}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: '#0284c7', fontWeight: 800, fontSize: '0.9rem' }}>
                    {sc.school_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#0f2744', lineHeight: 1.2 }}>
                      {sc.school_name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                      UDISE: {sc.udise} · {sc.school_type}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 1.2 }} />

                <Stack spacing={0.8}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Person sx={{ fontSize: 16, color: '#64748b' }} />
                    <Typography sx={{ fontSize: '0.76rem', color: '#1e293b', fontWeight: 700 }}>
                      Principal / HOS: {sc.hos_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Phone sx={{ fontSize: 16, color: '#10b981' }} />
                    <Typography sx={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700 }}>
                      {sc.hos_mobile}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <LocationOn sx={{ fontSize: 16, color: '#ef4444' }} />
                    <Typography sx={{ fontSize: '0.74rem', color: '#64748b' }}>
                      Raipur Urban Block • Raipur District
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>
                  Students: <strong>{sc.enrolled_students}</strong>
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setSelectedSchoolModal(sc)}
                  sx={{
                    fontSize: '0.68rem',
                    textTransform: 'none',
                    py: 0.2,
                    px: 0.9,
                    borderRadius: 1.5,
                    borderColor: '#cbd5e1',
                    color: '#0f3460',
                    fontWeight: 700,
                  }}
                >
                  View Profile
                </Button>
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* ── Dialog: School 360° Inspection Drill-Down ── */}
      <Dialog open={Boolean(selectedSchoolModal)} onClose={() => setSelectedSchoolModal(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.05rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          School Academic Profile & Diagnostics
          <IconButton onClick={() => setSelectedSchoolModal(null)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {selectedSchoolModal && (
            <Stack spacing={2}>
              <Box sx={{ p: 1.6, borderRadius: 2.2, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f2744' }}>
                  {selectedSchoolModal.school_name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.3 }}>
                  UDISE: {selectedSchoolModal.udise} · Category: {selectedSchoolModal.school_type}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#334155', mt: 0.3 }}>
                  Head of School (HOS): <strong>{selectedSchoolModal.hos_name}</strong> (📞 {selectedSchoolModal.hos_mobile})
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.2 }}>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#f0fdf4', textAlign: 'center', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#166534', fontWeight: 600 }}>Avg Score</Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: '#16a34a' }}>{selectedSchoolModal.avg_score_pct}%</Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#f0f9ff', textAlign: 'center', border: '1px solid rgba(2,132,199,0.2)' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 600 }}>Pass Rate</Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284c7' }}>{selectedSchoolModal.pass_rate_pct}%</Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: 2, bgcolor: '#fef2f2', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <Typography sx={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 600 }}>Remedial Needs</Typography>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: '#ef4444' }}>{selectedSchoolModal.remedial_count}</Typography>
                </Box>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#0f3460', mb: 0.6 }}>
                  CAC Advisory & Next Steps
                </Typography>
                <Typography sx={{ fontSize: '0.74rem', color: '#475569', lineHeight: 1.45 }}>
                  {selectedSchoolModal.avg_score_pct >= 80 
                    ? 'Performance exceeds cluster baseline. Eligible for best practice showcase in cluster academic meets.' 
                    : selectedSchoolModal.avg_score_pct < 60
                    ? 'Targeted FLN and remedial math mentorship required. Recommend scheduling bi-weekly academic review.'
                    : 'Performance is steady. Focus on reducing students in the 35-45% band through active classroom assessments.'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setSelectedSchoolModal(null)} sx={{ textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
