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
  LocationOn, Assessment, MenuBook, Business, FactCheck, Lightbulb,
  MilitaryTech, HelpOutlineOutlined, ArrowUpward, ArrowDownward, FilterAlt,
  Download, Send, Build, WorkspacePremium, Gavel, Layers
} from '@mui/icons-material';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, AreaChart, Area, RadarChart,
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { districtApi } from '../../services/api';
import { useSnackbar } from 'notistack';

const GRADE_COLORS = {
  a_plus: '#10b981', // Emerald
  a: '#0284c7',      // Sky Blue
  b: '#6366f1',      // Indigo
  c: '#f59e0b',      // Amber
  remedial: '#ef4444'// Rose
};

// ── Micro-Sparkline KPI Card Component ──
function DistrictKpiCard({ label, value, sub, color, gradientTo, icon, badge, wavePoints, onClick, actionText }) {
  const gradId = `dist-kpi-grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokeGradId = `dist-kpi-stroke-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

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
                px: 0.3,
              }}
            />
          )}
        </Box>

        {/* Label with colored bullet dot */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.25 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
          <Typography sx={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {label}
          </Typography>
        </Box>

        {/* Big Metric Value & Action */}
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

export default function DistrictDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab
  const activeTabParam = parseInt(searchParams.get('tab') || '0', 10);
  const [activeTab, setActiveTab] = useState(isNaN(activeTabParam) ? 0 : activeTabParam);

  // Filters State
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Data State
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [schools, setSchools] = useState([]);
  const [questionAnalytics, setQuestionAnalytics] = useState(null);
  const [faculty, setFaculty] = useState([]);

  // Selected School Modal State
  const [selectedSchool, setSelectedSchool] = useState(null);

  // Sync tab with URL query
  useEffect(() => {
    const tabFromUrl = parseInt(searchParams.get('tab') || '0', 10);
    if (!isNaN(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setSearchParams({ tab: newValue.toString() });
  };

  // Fetch all District Intelligence
  const fetchDistrictData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, scRes, qRes, facRes] = await Promise.all([
        districtApi.getOverview(),
        districtApi.getSchools(),
        districtApi.getQuestions(),
        districtApi.getFaculty(),
      ]);

      setOverview(ovRes.data);
      setSchools(scRes.data?.schools || []);
      setQuestionAnalytics(qRes.data);
      setFaculty(facRes.data?.teachers || []);
    } catch (err) {
      console.error('Failed to load district data:', err);
      enqueueSnackbar('Error loading district intelligence data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchDistrictData();
  }, [fetchDistrictData]);

  // Derived filtered schools
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchBlock = selectedBlock === 'ALL' || s.block_name === selectedBlock;
      const matchSearch = searchQuery.trim() === '' ||
        s.school_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.udise_code?.includes(searchQuery) ||
        s.cluster_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchBlock && matchSearch;
    });
  }, [schools, selectedBlock, searchQuery]);

  // Derived filtered questions
  const filteredQuestions = useMemo(() => {
    if (!questionAnalytics?.questions) return [];
    return questionAnalytics.questions.filter(q => {
      if (priorityFilter === 'ALL') return true;
      if (priorityFilter === 'URGENT') return q.revision_priority === 'DISTRICT_WORKSHOP_URGENT';
      if (priorityFilter === 'PRACTICE') return q.revision_priority === 'MODERATE_PRACTICE';
      if (priorityFilter === 'ON_TRACK') return q.revision_priority === 'ON_TRACK';
      return true;
    });
  }, [questionAnalytics, priorityFilter]);

  // Handle Directive Trigger
  const handleTriggerDirective = (directive) => {
    enqueueSnackbar(`Directive Dispatched: "${directive.title}" sent to ${directive.block || 'BEO / DIET'}`, { variant: 'success' });
  };

  if (loading && !overview) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: '#0284c7' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
          District Education Command Center • Loading Intelligence Datasets...
        </Typography>
      </Box>
    );
  }

  const kpis = overview?.kpis || {};
  const districtInfo = overview?.district || {};
  const blocks = overview?.blocks || [];
  const subjects = overview?.subjects || [];
  const gradeDist = overview?.grade_distribution || {};
  const deoDirectives = overview?.deo_directives || [];
  const correlationData = overview?.correlation_data || [];

  // Grade Pie Data
  const gradePieData = [
    { name: 'Grade A+ (>=85%)', value: gradeDist.a_plus || 0, color: GRADE_COLORS.a_plus },
    { name: 'Grade A (70-84%)', value: gradeDist.a || 0, color: GRADE_COLORS.a },
    { name: 'Grade B (55-69%)', value: gradeDist.b || 0, color: GRADE_COLORS.b },
    { name: 'Grade C (40-54%)', value: gradeDist.c || 0, color: GRADE_COLORS.c },
    { name: 'Remedial (<40%)', value: gradeDist.remedial || 0, color: GRADE_COLORS.remedial },
  ].filter(d => d.value > 0);

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER: DISTRICT COMMAND BANNER & QUICK CONTROLS
          ═══════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          mb: 2.5,
          p: { xs: 2, md: 2.5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 50%, #1e293b 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(7, 21, 38, 0.2)',
          width: '100%',
        }}
      >
        {/* Glow ambient circle */}
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, rgba(2, 132, 199, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, width: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                icon={<VerifiedUser sx={{ fontSize: '14px !important', color: '#38bdf8' }} />}
                label="जिला शिक्षा कमान केंद्र (DEO Raipur)"
                size="small"
                sx={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  color: '#7dd3fc',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  height: 24,
                }}
              />
              <Chip
                label="Academic Year 2025-26"
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  height: 24,
                }}
              />
              <Chip
                label="State Board Assessment Analytics"
                size="small"
                sx={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#6ee7b7',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  height: 24,
                }}
              />
            </Stack>

            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.4, color: '#f8fafc', fontSize: { xs: '1.3rem', md: '1.65rem' } }}>
              District {districtInfo.district_name || 'RAIPUR'} Education Analytics
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.3, fontWeight: 500, display: 'block' }}>
              Samagra Shiksha Chhattisgarh • District Code: {districtInfo.district_cd || '2205'} | DEO: {districtInfo.officer_name || 'Dr. Surendra Kumar Pandey'}
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchDistrictData}
                size="small"
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  backdropFilter: 'blur(8px)',
                  '&:hover': { borderColor: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }
                }}
              >
                Refresh Data
              </Button>
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={() => window.print()}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                }}
              >
                Export DEO Report
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: 6 DISTRICT KPI TILES (GUARANTEED 100% FULL-WIDTH 6-COL GRID)
          ═══════════════════════════════════════════════════════════ */}
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
          width: '100%',
          mb: 2.5,
        }}
      >
        {/* KPI 1: Schools & Blocks */}
        <DistrictKpiCard
          label="Total Schools"
          value={kpis.total_schools || schools.length}
          sub={`Across ${districtInfo.total_blocks || blocks.length} Blocks`}
          color="#0284c7"
          gradientTo="#38bdf8"
          icon={<School sx={{ fontSize: 18 }} />}
          badge="100% Onboarded"
          wavePoints="M0,32 Q40,12 80,24 T160,14 T220,28 T280,8 L280,45 L0,45 Z"
          actionText="Schools"
          onClick={() => handleTabChange(null, 2)}
        />

        {/* KPI 2: Evaluated Students */}
        <DistrictKpiCard
          label="Tested Students"
          value={kpis.total_students || 0}
          sub={`M: ${kpis.male_students || 0} | F: ${kpis.female_students || 0}`}
          color="#10b981"
          gradientTo="#34d399"
          icon={<People sx={{ fontSize: 18 }} />}
          badge="Evaluated"
          wavePoints="M0,30 Q40,16 80,10 T160,22 T220,12 T280,6 L280,45 L0,45 Z"
          actionText="Matrix"
          onClick={() => handleTabChange(null, 1)}
        />

        {/* KPI 3: District Average Score */}
        <DistrictKpiCard
          label="District Avg Score"
          value={`${kpis.district_avg_score || 72.5}%`}
          sub={`State Bench: 70.0%`}
          color="#8b5cf6"
          gradientTo="#c084fc"
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          badge={kpis.district_avg_score >= 75 ? "Top Tier" : "Pass"}
          wavePoints="M0,35 Q40,20 80,26 T160,15 T220,10 T280,5 L280,45 L0,45 Z"
        />

        {/* KPI 4: Remedial Needs */}
        <DistrictKpiCard
          label="Remedial Cohort"
          value={kpis.remedial_count || 0}
          sub={`Pass Rate: ${kpis.pass_rate_pct || 88}%`}
          color="#ef4444"
          gradientTo="#f87171"
          icon={<Warning sx={{ fontSize: 18 }} />}
          badge="Needs Action"
          wavePoints="M0,20 Q40,28 80,18 T160,30 T220,22 T280,28 L280,45 L0,45 Z"
          actionText="Directives"
          onClick={() => handleTabChange(null, 3)}
        />

        {/* KPI 5: High Achievers Mastery */}
        <DistrictKpiCard
          label="High Achievers"
          value={`${kpis.high_achievers_pct || 42}%`}
          sub={`Grade A/A+: ${kpis.high_achievers_count || 0}`}
          color="#f59e0b"
          gradientTo="#fbbf24"
          icon={<MilitaryTech sx={{ fontSize: 18 }} />}
          badge="Top Scorers"
          wavePoints="M0,28 Q40,15 80,22 T160,12 T220,18 T280,10 L280,45 L0,45 Z"
          actionText="Matrix"
          onClick={() => handleTabChange(null, 1)}
        />

        {/* KPI 6: Active Faculty */}
        <DistrictKpiCard
          label="Active Faculty"
          value={kpis.total_teachers || faculty.length}
          sub="Subject Specialists"
          color="#ec4899"
          gradientTo="#f472b6"
          icon={<MilitaryTech sx={{ fontSize: 18 }} />}
          badge="100% Active"
          wavePoints="M0,26 Q40,14 80,18 T160,10 T220,14 T280,8 L280,45 L0,45 Z"
          actionText="Faculty"
          onClick={() => handleTabChange(null, 4)}
        />
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          NAVIGATION TABS (FULL-WIDTH MODERN CONTAINER)
          ═══════════════════════════════════════════════════════════ */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          mb: 2.5,
          background: '#ffffff',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1.5,
            minHeight: 50,
            '& .MuiTab-root': {
              minHeight: 50,
              fontWeight: 700,
              fontSize: '0.84rem',
              textTransform: 'none',
              color: '#64748b',
              transition: 'all 0.2s',
              '&.Mui-selected': {
                color: '#0284c7',
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: '#0284c7',
            }
          }}
        >
          <Tab icon={<Dashboard sx={{ fontSize: 18, mr: 0.8 }} />} iconPosition="start" label="जिला विहंगावलोकन (Overview)" />
          <Tab icon={<BarChart sx={{ fontSize: 18, mr: 0.8 }} />} iconPosition="start" label="विकासखंड रैंकिंग (Block Benchmarks)" />
          <Tab icon={<School sx={{ fontSize: 18, mr: 0.8 }} />} iconPosition="start" label="शाला तालिका (School League Table)" />
          <Tab
            icon={<AutoAwesome sx={{ fontSize: 18, mr: 0.8 }} />}
            iconPosition="start"
            label={
              <Stack direction="row" spacing={0.8} alignItems="center">
                <span>प्रश्न एवं DIET कार्यशाला (LO & Workshops)</span>
                {questionAnalytics?.summary?.urgent_workshop_count > 0 && (
                  <Chip
                    label={`${questionAnalytics.summary.urgent_workshop_count} Urgent`}
                    size="small"
                    sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, background: '#fee2e2', color: '#ef4444' }}
                  />
                )}
              </Stack>
            }
          />
          <Tab icon={<People sx={{ fontSize: 18, mr: 0.8 }} />} iconPosition="start" label="शिक्षक क्षमता मैट्रिक्स (Faculty Matrix)" />
        </Tabs>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════
          TAB 0: DISTRICT OVERVIEW & STRATEGIC DIRECTIVES
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* DEO DIRECTIVES BANNER */}
          {deoDirectives.length > 0 && (
            <Card
              elevation={0}
              sx={{
                mb: 2.5,
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #fed7aa',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Lightbulb sx={{ color: '#d97706', fontSize: 22 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400e', fontSize: '0.94rem' }}>
                    जिला शिक्षा अधिकारी रणनीतिक निर्देश (DEO Strategic Action Directives)
                  </Typography>
                </Stack>
                <Chip
                  label={`${deoDirectives.length} Action Directives`}
                  size="small"
                  sx={{ background: '#d97706', color: '#ffffff', fontWeight: 800, fontSize: '0.7rem', height: 22 }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 1.75,
                  width: '100%',
                }}
              >
                {deoDirectives.map((dir, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: 2.2,
                      background: '#ffffff',
                      border: '1px solid #fde68a',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Chip
                          label={dir.badge || dir.priority}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            background: dir.priority === 'HIGH' ? '#fee2e2' : '#fef3c7',
                            color: dir.priority === 'HIGH' ? '#b91c1c' : '#b45309',
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                          {dir.block}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.6 }}>
                        {dir.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block' }}>
                        {dir.detail}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 1.5, pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Send sx={{ fontSize: '13px !important' }} />}
                        onClick={() => handleTriggerDirective(dir)}
                        sx={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          borderRadius: 1.8,
                          borderColor: '#d97706',
                          color: '#b45309',
                          textTransform: 'none',
                          py: 0.2,
                          '&:hover': { background: '#fffbeb', borderColor: '#b45309' }
                        }}
                      >
                        {dir.action}
                      </Button>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Card>
          )}

          {/* CHARTS ROW 1: BLOCK BENCHMARKS (2fr) & GRADE DISTRIBUTION (1fr) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '2fr 1fr',
              },
              gap: 2.5,
              width: '100%',
              mb: 2.5,
            }}
          >
            {/* Block Performance Comparison Bar Chart */}
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                height: '100%',
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    विकासखंड-वार शैक्षणिक प्रदर्शन तुलना (Block-Wise Academic Benchmark)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Average Score % vs Pass Rate % across blocks
                  </Typography>
                </Box>
                <Chip label="Composite Benchmark" size="small" sx={{ background: '#f1f5f9', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
              </Box>

              <Box sx={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={blocks}
                    margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="block_name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                    <RechartsTooltip
                      contentStyle={{
                        background: '#ffffff',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        fontSize: 12
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                    <Bar dataKey="avg_score_pct" name="Average Score %" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pass_rate_pct" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* District Grade Breakdown Doughnut */}
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                height: '100%',
                width: '100%',
              }}
            >
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                  ग्रेड स्तर वितरण (Grade Distribution)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  District student mastery categories
                </Typography>
              </Box>

              <Box sx={{ height: 190, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradePieData}
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {gradePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Grade Legend Pills */}
              <Stack spacing={0.6} sx={{ mt: 1 }}>
                {gradePieData.map((g, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                      <Typography variant="caption" sx={{ color: '#334155', fontWeight: 600 }}>{g.name}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0f172a' }}>{g.value} Students</Typography>
                  </Box>
                ))}
              </Stack>
            </Card>
          </Box>

          {/* CHARTS ROW 2: SUBJECT MASTERY (1fr) & EVALUATION / REMEDIAL (1fr) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '1fr 1fr',
              },
              gap: 2.5,
              width: '100%',
            }}
          >
            {/* Subject Mastery Across District */}
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    विषय-वार जिला औसत (Subject Mastery Breakdown)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Subject performance and weak student volume
                  </Typography>
                </Box>
                <MenuBook sx={{ color: '#0284c7', fontSize: 20 }} />
              </Box>

              <Stack spacing={1.75}>
                {subjects.map((s, idx) => {
                  const avg = Number(s.avg_score_pct || 65);
                  const color = avg >= 75 ? '#10b981' : avg >= 65 ? '#0284c7' : avg >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <Box key={idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                          {s.subject_name} ({s.subject_code})
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {s.weak_students_count > 0 && (
                            <Chip
                              label={`${s.weak_students_count} Weak`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, background: '#fee2e2', color: '#ef4444' }}
                            />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 800, color: color, fontSize: '0.84rem' }}>
                            {avg}%
                          </Typography>
                        </Stack>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={avg}
                        sx={{
                          height: 6,
                          borderRadius: 4,
                          backgroundColor: '#f1f5f9',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: color,
                            borderRadius: 4,
                          }
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Card>

            {/* Block Evaluation & Remedial Breakdown */}
            <Card
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                width: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    ब्लॉक-वार मूल्यांकन एवं उपचारात्मक विश्लेषण (Block Evaluation & Remedial Breakdown)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Evaluated cohort vs remedial support requirement
                  </Typography>
                </Box>
                <Assessment sx={{ color: '#0284c7', fontSize: 20 }} />
              </Box>

              <Box sx={{ height: 230, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={blocks}
                    margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="block_name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar dataKey="evaluated_students" name="Evaluated Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="high_achievers_count" name="High Achievers (A/A+)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="remedial_students" name="Remedial (<40%)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>

              <Box sx={{ p: 1.2, mt: 1, borderRadius: 2, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                  💡 <strong>DEO Insight:</strong> Focus SCERT and DIET remedial coaching modules on blocks with highest remedial density to elevate district academic average.
                </Typography>
              </Box>
            </Card>
          </Box>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: BLOCK BENCHMARKS & RANKING MATRIX
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 2.8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  विकासखंड प्रदर्शन एवं रैंकिंग मैट्रिक्स (Block Performance Matrix)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Ranked by overall composite academic index and evaluation coverage
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>RANK & BLOCK</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>BLOCK CODE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>SCHOOLS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>EVALUATED STUDENTS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>AVG SCORE %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>PASS RATE %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>HIGH ACHIEVERS (A/A+)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>REMEDIAL COUNT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>PERFORMANCE TIER</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {blocks.map((b, idx) => {
                    const score = Number(b.avg_score_pct || 70);
                    const isTop = idx === 0;
                    return (
                      <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={1.2} alignItems="center">
                            <Avatar
                              sx={{
                                width: 26,
                                height: 26,
                                fontSize: '0.75rem',
                                fontWeight: 800,
                                background: isTop ? '#0284c7' : '#f1f5f9',
                                color: isTop ? '#ffffff' : '#64748b'
                              }}
                            >
                              {idx + 1}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {b.block_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                            {b.block_cd || '220509'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {b.school_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {b.evaluated_students}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${score}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              background: score >= 75 ? '#dcfce7' : score >= 65 ? '#e0f2fe' : '#fee2e2',
                              color: score >= 75 ? '#15803d' : score >= 65 ? '#0369a1' : '#b91c1c',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                            {b.pass_rate_pct}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                            {b.high_achievers_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: b.remedial_students > 0 ? '#ef4444' : '#64748b' }}>
                            {b.remedial_students}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {b.teacher_attendance_pct}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {b.student_attendance_pct}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={b.performance_tier}
                            size="small"
                            sx={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: b.performance_tier === 'Top Performing' ? '#ecfdf5' : '#f8fafc',
                              color: b.performance_tier === 'Top Performing' ? '#059669' : '#64748b',
                              border: '1px solid #e2e8f0',
                              height: 22,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: SCHOOL LEAGUE TABLE (WITH 360° INSPECTION MODAL)
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 2 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 2.8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              width: '100%',
            }}
          >
            {/* Filter and Search Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  जिला शाला लीग तालिका (District School League Table)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Showing {filteredSchools.length} of {schools.length} schools across Raipur District
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* Block Filter */}
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel id="block-select-label">विकासखंड (Block)</InputLabel>
                  <Select
                    labelId="block-select-label"
                    value={selectedBlock}
                    label="विकासखंड (Block)"
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                  >
                    <MenuItem value="ALL">All Blocks (सभी विकासखंड)</MenuItem>
                    {blocks.map((b, idx) => (
                      <MenuItem key={idx} value={b.block_name}>{b.block_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Search Bar */}
                <TextField
                  size="small"
                  placeholder="Search School, UDISE..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.82rem' } }}
                />
              </Stack>
            </Box>

            {/* School League Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>UDISE & SCHOOL</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>BLOCK / CLUSTER</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>HEAD OF SCHOOL (HOS)</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>ENROLLED</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>EVALUATED</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>AVG SCORE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>PASS RATE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>REMEDIAL</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>ACTION</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.map((s, idx) => {
                    const score = Number(s.avg_score_pct || 68);
                    return (
                      <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {s.school_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                              UDISE: {s.udise_code} • {s.school_type || 'Govt HSS'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {s.block_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {s.cluster_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {s.hos_name || 'Principal Incharge'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            📞 {s.hos_mobile || '9827000000'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {s.total_enrolled || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {s.evaluated_students || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${score}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              background: score >= 75 ? '#dcfce7' : score >= 60 ? '#e0f2fe' : '#fee2e2',
                              color: score >= 75 ? '#15803d' : score >= 60 ? '#0369a1' : '#b91c1c',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#16a34a' }}>
                            {s.pass_rate_pct || 85}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: s.remedial_students > 0 ? '#ef4444' : '#64748b' }}>
                            {s.remedial_students || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Visibility sx={{ fontSize: '13px !important' }} />}
                            onClick={() => setSelectedSchool(s)}
                            sx={{
                              fontSize: '0.7rem',
                              borderRadius: 1.8,
                              textTransform: 'none',
                              fontWeight: 700,
                              py: 0.2,
                            }}
                          >
                            360° View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: QUESTION-WISE DIAGNOSTICS & TEACHER WORKSHOPS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 3 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 2.8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  जिला स्तरीय प्रश्न-वार एवं अवधारणा विश्लेषण (Question-Wise & Workshop Analytics)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Pinpointing student learning outcome failures to trigger DIET/SCERT teacher training workshops
                </Typography>
              </Box>

              {/* Priority Filter */}
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel id="prio-select-label">प्रशिक्षण प्राथमिकता (Workshop Priority)</InputLabel>
                <Select
                  labelId="prio-select-label"
                  value={priorityFilter}
                  label="प्रशिक्षण प्राथमिकता (Workshop Priority)"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                >
                  <MenuItem value="ALL">All Tracked Questions (सभी प्रश्न)</MenuItem>
                  <MenuItem value="URGENT">🚨 Urgent DIET Workshop Required (&lt;55%)</MenuItem>
                  <MenuItem value="PRACTICE">⚠️ Moderate Worksheet Practice (55-72%)</MenuItem>
                  <MenuItem value="ON_TRACK">✅ Concept Mastered (&gt;72%)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, 1fr)',
                },
                gap: 2,
                width: '100%',
              }}
            >
              {filteredQuestions.map((q, idx) => {
                const isUrgent = q.revision_priority === 'DISTRICT_WORKSHOP_URGENT';
                const isPractice = q.revision_priority === 'MODERATE_PRACTICE';
                const color = isUrgent ? '#ef4444' : isPractice ? '#f59e0b' : '#10b981';

                return (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: 2.4,
                      border: `1px solid ${alpha(color, 0.3)}`,
                      background: isUrgent ? '#fff5f5' : isPractice ? '#fffbeb' : '#f8fafc',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${q.class_name} • ${q.subject_name}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.7rem', background: '#ffffff', border: '1px solid #e2e8f0', height: 22 }}
                          />
                          <Chip
                            label={`Question ${q.question_number}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: '0.7rem', background: alpha(color, 0.15), color: color, height: 22 }}
                          />
                        </Stack>

                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: color }}>
                          {q.avg_score_pct}% Mastery
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.6 }}>
                        {q.description} (Max Marks: {q.max_marks})
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.5, display: 'block', mb: 1.2 }}>
                        📋 <strong>DEO Directive:</strong> {q.deo_directive}
                      </Typography>
                    </Box>

                    <Box sx={{ pt: 1.2, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Tested in {q.evaluated_schools_count} schools across {q.affected_blocks_count} blocks
                      </Typography>

                      {isUrgent && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Build sx={{ fontSize: '13px !important' }} />}
                          onClick={() => enqueueSnackbar(`DIET Workshop Scheduled for ${q.subject_name} (${q.class_name})`, { variant: 'success' })}
                          sx={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            borderRadius: 1.8,
                            background: '#ef4444',
                            textTransform: 'none',
                            py: 0.2,
                            '&:hover': { background: '#dc2626' }
                          }}
                        >
                          Schedule DIET Workshop
                        </Button>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4: FACULTY ROSTER & CAPACITY BUILDING MATRIX
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 4 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.2,
              borderRadius: 2.8,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              width: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  जिला शिक्षक कार्यभार एवं क्षमता मैट्रिक्स (District Faculty Matrix)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Monitoring assessment submission compliance and student learning outcomes by teacher
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>TEACHER NAME</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>ASSIGNED SCHOOL</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>BLOCK</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>ASSESSMENTS CONDUCTED</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>SUBMISSION COMPLIANCE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>STUDENT AVG SCORE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>TRAINING STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {faculty.map((t, idx) => {
                    const score = Number(t.avg_student_score || 70);
                    return (
                      <TableRow key={idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                              {t.full_name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              @{t.username} • 📞 {t.mobile || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                            {t.school_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#475569' }}>
                            {t.block_name}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {t.submitted_assessments} / {t.total_assessments || t.submitted_assessments}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${t.compliance_rate}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              background: t.compliance_rate >= 90 ? '#dcfce7' : '#fef3c7',
                              color: t.compliance_rate >= 90 ? '#15803d' : '#b45309',
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 800, color: score >= 75 ? '#16a34a' : score >= 60 ? '#0284c7' : '#ef4444' }}>
                            {score}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={t.rating}
                            size="small"
                            sx={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: t.rating === 'Top Educator' ? '#ecfdf5' : t.rating === 'Standard' ? '#f0f9ff' : '#fef2f2',
                              color: t.rating === 'Top Educator' ? '#059669' : t.rating === 'Standard' ? '#0284c7' : '#dc2626',
                              border: '1px solid #e2e8f0',
                              height: 22,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODAL: 360° SCHOOL INSPECTION POPUP
          ═══════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(selectedSchool)}
        onClose={() => setSelectedSchool(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {selectedSchool?.school_name}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>
              UDISE: {selectedSchool?.udise_code} • Block: {selectedSchool?.block_name} • Cluster: {selectedSchool?.cluster_name}
            </Typography>
          </Box>
          <IconButton onClick={() => setSelectedSchool(null)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {selectedSchool && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2.5 }}>
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Enrolled</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.3 }}>{selectedSchool.total_enrolled || 0}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Avg Score %</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0284c7', mt: 0.3 }}>{selectedSchool.avg_score_pct || 68}%</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Pass Rate</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#16a34a', mt: 0.3 }}>{selectedSchool.pass_rate_pct || 85}%</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Remedial Needs</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.3 }}>{selectedSchool.remedial_students || 0}</Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                School Leadership & Administration
              </Typography>
              <Paper elevation={0} sx={{ p: 1.8, borderRadius: 2, border: '1px solid #e2e8f0', background: '#ffffff', mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>Head of School (HOS)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>{selectedSchool.hos_name || 'Principal Incharge'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>HOS Contact Mobile</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>📞 {selectedSchool.hos_mobile || '9827000000'}</Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setSelectedSchool(null)} sx={{ fontWeight: 700, color: '#64748b' }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => {
              enqueueSnackbar(`Direct inspection notice issued to ${selectedSchool?.school_name}`, { variant: 'success' });
              setSelectedSchool(null);
            }}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Issue DEO Notice to HOS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
