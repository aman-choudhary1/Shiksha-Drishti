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
import { blockApi } from '../../services/api';
import { useSnackbar } from 'notistack';

const GRADE_COLORS = {
  a_plus: '#10b981', // Emerald
  a: '#0284c7',      // Sky Blue
  b: '#6366f1',      // Indigo
  c: '#f59e0b',      // Amber
  remedial: '#ef4444'// Rose
};

// ── Micro-Sparkline KPI Card Component ──
function BlockKpiCard({ label, value, sub, color, gradientTo, icon, badge, wavePoints, onClick, actionText }) {
  const gradId = `block-kpi-grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokeGradId = `block-kpi-stroke-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

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
              width: 38,
              height: 38,
              borderRadius: 2.2,
              background: `linear-gradient(135deg, ${alpha(color, 0.14)} 0%, ${alpha(gradientTo || color, 0.06)} 100%)`,
              color: color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${alpha(color, 0.2)}`,
            }}
          >
            {icon}
          </Box>

          {badge && (
            <Chip
              label={badge}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.62rem',
                fontWeight: 800,
                letterSpacing: 0.2,
                borderRadius: '6px',
                background: alpha(color, 0.1),
                color: color,
                border: `1px solid ${alpha(color, 0.25)}`,
              }}
            />
          )}
        </Box>

        {/* Value and Label */}
        <Box sx={{ zIndex: 2, position: 'relative' }}>
          <Typography
            variant="caption"
            sx={{
              color: '#64748b',
              fontWeight: 700,
              letterSpacing: 0.4,
              fontSize: '0.68rem',
              textTransform: 'uppercase',
              display: 'block',
              mb: 0.2,
            }}
          >
            {label}
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: -0.8,
              color: '#0f172a',
              fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' },
              lineHeight: 1.1,
            }}
          >
            {value}
          </Typography>

          {sub && (
            <Typography
              variant="caption"
              sx={{
                color: '#64748b',
                fontWeight: 600,
                fontSize: '0.7rem',
                mt: 0.3,
                display: 'block',
              }}
            >
              {sub}
            </Typography>
          )}
        </Box>

        {/* Wave Graphic */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -2,
            left: 0,
            right: 0,
            height: 42,
            pointerEvents: 'none',
            opacity: 0.85,
            zIndex: 1,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 280 45" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={gradientTo || color} stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={gradientTo || color} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d={wavePoints || "M0,25 Q70,5 140,20 T280,10 L280,45 L0,45 Z"}
              fill={`url(#${gradId})`}
            />
            <path
              d={wavePoints ? wavePoints.replace(/ L280,45 L0,45 Z$/, "") : "M0,25 Q70,5 140,20 T280,10"}
              fill="none"
              stroke={`url(#${strokeGradId})`}
              strokeWidth="2"
            />
          </svg>
        </Box>

        {/* Optional Action Button */}
        {actionText && onClick && (
          <Box sx={{ mt: 1, pt: 0.8, borderTop: '1px solid #f1f5f9', zIndex: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={onClick}
              sx={{
                fontSize: '0.66rem',
                fontWeight: 700,
                textTransform: 'none',
                py: 0,
                px: 1,
                borderRadius: 1.5,
                color: color,
                '&:hover': { background: alpha(color, 0.08) }
              }}
            >
              {actionText} →
            </Button>
          </Box>
        )}
      </Card>
    </motion.div>
  );
}

export default function BlockDashboard() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  // Tab State: 0: Overview, 1: Clusters, 2: Schools, 3: Questions, 4: Faculty
  const [activeTab, setActiveTab] = useState(0);

  // Data States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockInfo, setBlockInfo] = useState({});
  const [kpis, setKpis] = useState({});
  const [gradeDist, setGradeDist] = useState({});
  const [clusters, setClusters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [directives, setDirectives] = useState([]);

  // Detailed Tab Datasets
  const [clustersTable, setClustersTable] = useState([]);
  const [schools, setSchools] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [faculty, setFaculty] = useState([]);

  // Filtering & Modal State
  const [schoolSearch, setSchoolSearch] = useState('');
  const [selectedClusterFilter, setSelectedClusterFilter] = useState('ALL');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Load Primary Overview Data
  const fetchBlockData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [overviewRes, clustersRes, schoolsRes, questionsRes, facultyRes] = await Promise.all([
        blockApi.getOverview(),
        blockApi.getClusters(),
        blockApi.getSchools(),
        blockApi.getQuestions(),
        blockApi.getFaculty(),
      ]);

      const o = overviewRes.data;
      setBlockInfo(o.block || {});
      setKpis(o.kpis || {});
      setGradeDist(o.grade_distribution || {});
      setClusters(o.clusters || []);
      setSubjects(o.subjects || []);
      setDirectives(o.beo_directives || []);

      setClustersTable(clustersRes.data.clusters || []);
      setSchools(schoolsRes.data.schools || []);
      setQuestions(questionsRes.data.questions || []);
      setFaculty(facultyRes.data.faculty || []);
    } catch (err) {
      console.error('Failed to load Block analytics:', err);
      setError('विकासखंड डेटा लोड करने में त्रुटि। कृपया पुनः प्रयास करें।');
      enqueueSnackbar('Failed to fetch Block Education data', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchBlockData();
  }, [fetchBlockData]);

  const handleTabChange = (e, newTab) => {
    setActiveTab(newTab);
  };

  // Grade Pie Data
  const gradePieData = useMemo(() => [
    { name: 'Grade A+ (>=85%)', value: gradeDist.a_plus || 0, color: GRADE_COLORS.a_plus },
    { name: 'Grade A (70-84%)', value: gradeDist.a || 0, color: GRADE_COLORS.a },
    { name: 'Grade B (55-69%)', value: gradeDist.b || 0, color: GRADE_COLORS.b },
    { name: 'Grade C (40-54%)', value: gradeDist.c || 0, color: GRADE_COLORS.c },
    { name: 'Remedial (<40%)', value: gradeDist.remedial || 0, color: GRADE_COLORS.remedial },
  ], [gradeDist]);

  // Filtered Schools
  const filteredSchools = useMemo(() => {
    return schools.filter(s => {
      const matchSearch = (s.school_name || '').toLowerCase().includes(schoolSearch.toLowerCase()) ||
                          (s.udise || '').includes(schoolSearch);
      const matchCluster = selectedClusterFilter === 'ALL' || s.cluster_cd === selectedClusterFilter;
      return matchSearch && matchCluster;
    });
  }, [schools, schoolSearch, selectedClusterFilter]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      if (priorityFilter === 'ALL') return true;
      if (priorityFilter === 'URGENT') return q.revision_priority === 'CAC_INTERVENTION_URGENT';
      if (priorityFilter === 'PRACTICE') return q.revision_priority === 'MODERATE_PRACTICE';
      if (priorityFilter === 'ON_TRACK') return q.revision_priority === 'ON_TRACK';
      return true;
    });
  }, [questions, priorityFilter]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: '#0284c7' }} />
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
          विकासखंड शिक्षा कमान केंद्र डेटा लोड हो रहा है... (Loading BEO Intelligence...)
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchBlockData}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* ═══════════════════════════════════════════════════════════
          HEADER BANNER: BLOCK COMMAND CENTER (ULTRA MODERN GLASS)
          ═══════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          borderRadius: 3.2,
          p: { xs: 2.2, md: 3 },
          mb: 2.5,
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%)',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.18)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, rgba(0,0,0,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                icon={<VerifiedUser sx={{ color: '#38bdf8 !important', fontSize: '14px !important' }} />}
                label={`विकासखंड शिक्षा कमान केंद्र (BEO ${blockInfo.block_name || 'Block'})`}
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
                label="Block Assessment Analytics"
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
              Block {blockInfo.block_name || 'ABHANPUR'} Education Analytics
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.3, fontWeight: 500, display: 'block' }}>
              Samagra Shiksha Chhattisgarh • Block Code: {blockInfo.block_cd || '220510'} | District: {blockInfo.district_name || 'RAIPUR'} | BEO: {blockInfo.officer_name || 'Shri Rajesh Kumar Sahu'}
            </Typography>
          </Box>

          <Box>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchBlockData}
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
                Export BEO Report
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: 6 BLOCK KPI TILES (GUARANTEED 100% FULL-WIDTH 6-COL GRID)
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
        {/* KPI 1: Clusters */}
        <BlockKpiCard
          label="Total Clusters"
          value={kpis.total_clusters || clusters.length}
          sub={`Across ${blockInfo.block_name || 'Block'}`}
          color="#0284c7"
          gradientTo="#38bdf8"
          icon={<Business sx={{ fontSize: 18 }} />}
          badge="100% Tracked"
          wavePoints="M0,32 Q40,12 80,24 T160,14 T220,28 T280,8 L280,45 L0,45 Z"
          actionText="Clusters"
          onClick={() => handleTabChange(null, 1)}
        />

        {/* KPI 2: Schools */}
        <BlockKpiCard
          label="Total Schools"
          value={kpis.total_schools || schools.length}
          sub={`In ${kpis.total_clusters || clusters.length} Clusters`}
          color="#6366f1"
          gradientTo="#a5b4fc"
          icon={<School sx={{ fontSize: 18 }} />}
          badge="Onboarded"
          wavePoints="M0,28 Q40,15 80,22 T160,12 T220,18 T280,10 L280,45 L0,45 Z"
          actionText="Schools"
          onClick={() => handleTabChange(null, 2)}
        />

        {/* KPI 3: Tested Students */}
        <BlockKpiCard
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

        {/* KPI 4: Block Average Score */}
        <BlockKpiCard
          label="Block Avg Score"
          value={`${kpis.block_avg_score || 71.5}%`}
          sub={`District Bench: 70.0%`}
          color="#8b5cf6"
          gradientTo="#c084fc"
          icon={<TrendingUp sx={{ fontSize: 18 }} />}
          badge={kpis.block_avg_score >= 75 ? "Top Tier" : "Moderate"}
          wavePoints="M0,35 Q40,20 80,26 T160,15 T220,10 T280,5 L280,45 L0,45 Z"
        />

        {/* KPI 5: Remedial Needs */}
        <BlockKpiCard
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

        {/* KPI 6: High Achievers Mastery */}
        <BlockKpiCard
          label="High Achievers"
          value={`${kpis.high_achievers_pct || 40}%`}
          sub={`Grade A/A+: ${kpis.high_achievers_count || 0}`}
          color="#f59e0b"
          gradientTo="#fbbf24"
          icon={<MilitaryTech sx={{ fontSize: 18 }} />}
          badge="Top Scorers"
          wavePoints="M0,26 Q40,14 80,18 T160,10 T220,14 T280,8 L280,45 L0,45 Z"
          actionText="Matrix"
          onClick={() => handleTabChange(null, 1)}
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
          background: '#ffffff',
          mb: 2.5,
          p: 0.6,
          width: '100%',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 46,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              minHeight: 46,
              borderRadius: 2,
              px: 2.2,
              color: '#64748b',
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.08)',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            }
          }}
        >
          <Tab icon={<Dashboard sx={{ fontSize: 18 }} />} iconPosition="start" label="विकासखंड विहंगावलोकन (Overview)" />
          <Tab icon={<Business sx={{ fontSize: 18 }} />} iconPosition="start" label={`संकुल रैंकिंग (${clusters.length} Clusters)`} />
          <Tab icon={<School sx={{ fontSize: 18 }} />} iconPosition="start" label={`शाला तालिका (${schools.length} Schools)`} />
          <Tab icon={<AutoAwesome sx={{ fontSize: 18 }} />} iconPosition="start" label={`प्रश्न एवं LO निदानात्मक (${questions.length})`} />
          <Tab icon={<People sx={{ fontSize: 18 }} />} iconPosition="start" label={`शिक्षक एवं CAC मैट्रिक्स (${faculty.length})`} />
        </Tabs>
      </Paper>

      {/* ═══════════════════════════════════════════════════════════
          TAB 0: BLOCK OVERVIEW & AI ACTION CENTER
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          {/* AI ACTION DIRECTIVES */}
          <Box sx={{ mb: 2.5 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: 2.8,
                border: '1px solid #fde68a',
                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Lightbulb sx={{ color: '#d97706', fontSize: 22 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#92400e', fontSize: '0.95rem' }}>
                    विकासखंड शिक्षा अधिकारी रणनीतिक निर्देश (BEO Strategic Action Directives)
                  </Typography>
                </Stack>
                <Chip
                  label={`${directives.length} Action Directives`}
                  size="small"
                  sx={{ background: '#d97706', color: '#ffffff', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, 1fr)',
                  },
                  gap: 1.5,
                  width: '100%',
                }}
              >
                {directives.map((dir, idx) => (
                  <Card
                    key={idx}
                    elevation={0}
                    sx={{
                      p: 1.8,
                      borderRadius: 2.4,
                      background: '#ffffff',
                      border: '1px solid #fef08a',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%',
                    }}
                  >
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Chip
                          label={dir.badge}
                          size="small"
                          sx={{
                            fontSize: '0.64rem',
                            fontWeight: 800,
                            background: dir.priority === 'HIGH' ? '#fee2e2' : '#ecfdf5',
                            color: dir.priority === 'HIGH' ? '#dc2626' : '#059669',
                            height: 20,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                          {dir.target}
                        </Typography>
                      </Box>

                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.6, fontSize: '0.84rem' }}>
                        {dir.title}
                      </Typography>

                      <Typography variant="caption" sx={{ color: '#475569', lineHeight: 1.45, display: 'block', mb: 1.5 }}>
                        {dir.detail}
                      </Typography>
                    </Box>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Send sx={{ fontSize: '13px !important' }} />}
                      onClick={() => enqueueSnackbar(`Directive issued: "${dir.title}" sent to ${dir.target}`, { variant: 'success' })}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        borderColor: '#f59e0b',
                        color: '#b45309',
                        '&:hover': { background: '#fef3c7', borderColor: '#d97706' }
                      }}
                    >
                      {dir.action}
                    </Button>
                  </Card>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* CHARTS ROW 1: CLUSTER BENCHMARKS (2fr) & GRADE DISTRIBUTION (1fr) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '2fr 1fr',
              },
              gap: 2.5,
              mb: 2.5,
              width: '100%',
            }}
          >
            {/* Cluster Performance Bar Chart */}
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
                    संकुल-वार शैक्षणिक प्रदर्शन तुलना (Cluster-Wise Academic Benchmark)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Average Score % vs Pass Rate % across clusters
                  </Typography>
                </Box>
                <Chip label="Composite Benchmark" size="small" sx={{ background: '#f1f5f9', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
              </Box>

              <Box sx={{ height: 280, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={clusters}
                    margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="cluster_name" tick={{ fontSize: 11, fill: '#64748b' }} />
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

            {/* Block Grade Breakdown Doughnut */}
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
                  Block student mastery categories
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
            {/* Subject Mastery Across Block */}
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
                    विषय-वार विकासखंड औसत (Subject Mastery Breakdown)
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

            {/* Cluster Evaluation & Remedial Breakdown */}
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
                    संकुल-वार मूल्यांकन एवं उपचारात्मक स्थिति (Cluster Evaluation & Remedial Breakdown)
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
                    data={clusters}
                    margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="cluster_name" tick={{ fontSize: 10, fill: '#64748b' }} />
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
                  💡 <strong>BEO Insight:</strong> Direct Cluster Coordinators (CACs) in clusters with high remedial concentration to initiate focused bridge learning modules.
                </Typography>
              </Box>
            </Card>
          </Box>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: CLUSTER BENCHMARKS & RANKING MATRIX
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
                  संकुल प्रदर्शन एवं रैंकिंग मैट्रिक्स (Cluster Performance Matrix)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Ranked by overall composite academic index and evaluation coverage in {blockInfo.block_name} Block
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>RANK & CLUSTER</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>CLUSTER CODE</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>CAC COORDINATOR</TableCell>
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
                  {clustersTable.map((c, idx) => {
                    const score = Number(c.avg_score_pct || 70);
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
                              {c.cluster_name}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ color: '#64748b', fontFamily: 'monospace' }}>
                            {c.cluster_cd}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {c.cac_name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            📞 {c.cac_mobile}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {c.school_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {c.evaluated_students}
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
                            {c.pass_rate_pct}%
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0284c7' }}>
                            {c.high_achievers_count || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: c.remedial_count > 0 ? '#ef4444' : '#64748b' }}>
                            {c.remedial_count}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={c.performance_tier}
                            size="small"
                            sx={{
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              background: c.performance_tier === 'Top Performing' ? '#ecfdf5' : '#f8fafc',
                              color: c.performance_tier === 'Top Performing' ? '#059669' : '#64748b',
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
                  विकासखंड शाला तालिका (Block School League Table)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Showing {filteredSchools.length} of {schools.length} schools in {blockInfo.block_name} Block
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5} alignItems="center">
                {/* Cluster Filter */}
                <FormControl size="small" sx={{ minWidth: 170 }}>
                  <InputLabel id="cluster-filter-label" sx={{ fontSize: '0.8rem' }}>Filter by Cluster</InputLabel>
                  <Select
                    labelId="cluster-filter-label"
                    value={selectedClusterFilter}
                    label="Filter by Cluster"
                    onChange={(e) => setSelectedClusterFilter(e.target.value)}
                    sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                  >
                    <MenuItem value="ALL">All Clusters (सभी संकुल)</MenuItem>
                    {clusters.map((c, idx) => (
                      <MenuItem key={idx} value={c.cluster_cd}>{c.cluster_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Search */}
                <TextField
                  size="small"
                  placeholder="Search school name or UDISE..."
                  value={schoolSearch}
                  onChange={(e) => setSchoolSearch(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#94a3b8', fontSize: 18 }} />
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
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>CLUSTER</TableCell>
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
                              UDISE: {s.udise} • {s.school_type || 'Govt HSS'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
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
                            {s.total_students || 0}
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
                          <Typography variant="body2" sx={{ fontWeight: 700, color: s.remedial_count > 0 ? '#ef4444' : '#64748b' }}>
                            {s.remedial_count || 0}
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
          TAB 3: QUESTION & LEARNING OUTCOME (LO) DIAGNOSTICS
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
                  प्रश्न-वार त्रुटि विश्लेषण एवं CAC उपचारात्मक निर्देश (Question Diagnostics)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Tracking student misconceptions, error hotspots and directing cluster workshops
                </Typography>
              </Box>

              <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel id="prio-select-label" sx={{ fontSize: '0.8rem' }}>प्रशिक्षण प्राथमिकता (Priority)</InputLabel>
                <Select
                  labelId="prio-select-label"
                  value={priorityFilter}
                  label="प्रशिक्षण प्राथमिकता (Priority)"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  sx={{ borderRadius: 2, fontSize: '0.82rem' }}
                >
                  <MenuItem value="ALL">All Tracked Questions (सभी प्रश्न)</MenuItem>
                  <MenuItem value="URGENT">🚨 Urgent CAC Intervention Required (&lt;55%)</MenuItem>
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
                const isUrgent = q.revision_priority === 'CAC_INTERVENTION_URGENT';
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
                        📋 <strong>BEO Directive:</strong> {q.beo_directive}
                      </Typography>
                    </Box>

                    <Box sx={{ pt: 1.2, borderTop: '1px dashed #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                        Tested in {q.evaluated_schools_count} schools across {q.affected_clusters_count} clusters
                      </Typography>

                      {isUrgent && (
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Build sx={{ fontSize: '13px !important' }} />}
                          onClick={() => enqueueSnackbar(`CAC Remedial Session Ordered for ${q.subject_name} (${q.class_name})`, { variant: 'success' })}
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
                          Issue CAC Directive
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
          TAB 4: FACULTY & CAC ROSTER MATRIX
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                  शिक्षक एवं संकुल समन्वयक प्रदर्शन (Faculty & CAC Matrix)
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Evaluation compliance, submissions and subject performance
                </Typography>
              </Box>
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 2 }}>
              <Table size="medium">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>EDUCATOR / COORDINATOR</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>SCHOOL / POSTING</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>CLUSTER</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>EVALUATIONS</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>COMPLIANCE</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>CLASS AVG %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>STATUS</TableCell>
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
                            {t.cluster_name}
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
              UDISE: {selectedSchool?.udise} • Cluster: {selectedSchool?.cluster_name}
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
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.3 }}>{selectedSchool.total_students || 0}</Typography>
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
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#ef4444', mt: 0.3 }}>{selectedSchool.remedial_count || 0}</Typography>
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
              enqueueSnackbar(`BEO Instruction Notice issued to ${selectedSchool?.school_name}`, { variant: 'success' });
              setSelectedSchool(null);
            }}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
              fontWeight: 700,
              borderRadius: 2,
              textTransform: 'none'
            }}
          >
            Issue BEO Notice to HOS
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
