import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, LinearProgress, CircularProgress, Alert,
  Avatar, TextField, InputAdornment, MenuItem, Select, FormControl,
  InputLabel, Tooltip, Stack, Divider, useTheme, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, alpha
} from '@mui/material';
import {
  School, People, AssignmentTurnedIn, TrendingUp, TrendingDown, Warning,
  CheckCircle, Search, Refresh, Star, Person,
  Email, Phone, AutoAwesome, ClassOutlined,
  VerifiedUser, Print, Close, Visibility, BarChart, Dashboard,
  PieChart as PieIcon, Insights, ShowChart, Timeline, EmojiEvents,
  CompareArrows, Download, TableView, Speed, FilterList, Tune,
  ArrowUpward, ArrowDownward, WorkspacePremium, MilitaryTech, Calculate,
  MenuBook, ArrowForward,
  FilterAlt, FilterAltOff, Assessment
} from '@mui/icons-material';
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { principalApi } from '../../services/api';
import { exportSchoolSubjectBenchmarkXlsx } from '../../utils/excelExport';
import ClassWiseAnalysisTab from './ClassWiseAnalysisTab';
import AcademicOverview from './AcademicOverview';

const GRADE_COLORS = {
  a_plus: '#10b981', // Emerald
  a: '#0284c7',      // Sky Blue
  b: '#6366f1',      // Indigo
  c: '#f59e0b',      // Amber
  remedial: '#ef4444'// Rose
};

const PIE_PALETTE = ['#10b981', '#0284c7', '#6366f1', '#f59e0b', '#ef4444'];

// ── Wave Sparkline KPI Card Component ──
function PrincipalKpiCard({ label, value, sub, color, gradientTo, icon, badge, trend, wavePoints, onClick, actionText }) {
  const gradId = `kpi-grad-${label.replace(/[^a-zA-Z0-9]/g, '')}`;
  const strokeGradId = `kpi-stroke-${label.replace(/[^a-zA-Z0-9]/g, '')}`;

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
                height: 20,
                '&:hover': {
                  borderColor: color,
                  background: alpha(color, 0.08),
                }
              }}
            >
              {actionText}
            </Button>
          )}
        </Box>

        {/* Subtitle / Context */}
        <Typography sx={{
          fontSize: '0.68rem',
          color: '#64748b',
          fontWeight: 600,
          mt: 0.4,
          mb: 0.8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sub}
        </Typography>

        {/* Sparkline Wave at bottom */}
        <Box sx={{ width: '100%', height: 16, mt: 'auto', position: 'relative', opacity: 0.7 }}>
          <svg width="100%" height="100%" viewBox="0 0 280 45" preserveAspectRatio="none" style={{ display: 'block' }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={strokeGradId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={gradientTo || color} stopOpacity="0.85" />
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

export default function PrincipalDashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab State (synced with URL ?tab=0,1,2,3,4)
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
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);

  // Filters
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedBand, setSelectedBand] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('ALL');
  const [selectedLoClass, setSelectedLoClass] = useState('ALL');
  const [selectedLoPriority, setSelectedLoPriority] = useState('ALL');
  const [loSearch, setLoSearch] = useState('');

  // Dialog States
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [selectedTeacherForModal, setSelectedTeacherForModal] = useState(null);

  // Tab 5: Subject & Class Benchmark Module State
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkClass, setBenchmarkClass] = useState('');
  const [benchmarkSubject, setBenchmarkSubject] = useState('');
  const [benchmarkAssessment, setBenchmarkAssessment] = useState('ALL');
  const [customBenchmarkInput, setCustomBenchmarkInput] = useState('');
  const [benchmarkPreset, setBenchmarkPreset] = useState('AUTO'); // 'AUTO', '75', '80', '60', 'CUSTOM'
  const [cohortViewMode, setCohortViewMode] = useState('split'); // 'split' | 'above' | 'below' | 'all'
  const [cohortSearch, setCohortSearch] = useState('');
  const [cohortGenderFilter, setCohortGenderFilter] = useState('ALL');
  const [cohortCriticalOnly, setCohortCriticalOnly] = useState(false);
  const [benchmarkSuccessMsg, setBenchmarkSuccessMsg] = useState('');

  // Fetch Benchmark Data
  const loadBenchmarkData = useCallback(async (overrides = {}) => {
    setBenchmarkLoading(true);
    try {
      const cls = overrides.class_id !== undefined ? overrides.class_id : benchmarkClass;
      const sub = overrides.subject_id !== undefined ? overrides.subject_id : benchmarkSubject;
      const asmt = overrides.assessment_id !== undefined ? overrides.assessment_id : benchmarkAssessment;
      const preset = overrides.benchmarkPreset !== undefined ? overrides.benchmarkPreset : benchmarkPreset;
      const customInput = overrides.custom_benchmark !== undefined ? overrides.custom_benchmark : customBenchmarkInput;
      const bench = preset === 'CUSTOM' ? customInput : preset !== 'AUTO' ? preset : '';

      const res = await principalApi.getSubjectBenchmark({
        class_id: cls || undefined,
        subject_id: sub || undefined,
        assessment_id: asmt !== 'ALL' ? asmt : undefined,
        custom_benchmark: bench || undefined,
      });

      setBenchmarkData(res.data);
      if (res.data.selected_class && !benchmarkClass) {
        setBenchmarkClass(String(res.data.selected_class.id));
      }
      if (res.data.selected_subject && !benchmarkSubject) {
        setBenchmarkSubject(String(res.data.selected_subject.id));
      }
    } catch (err) {
      console.error('Error loading subject benchmark data:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  }, [benchmarkClass, benchmarkSubject, benchmarkAssessment, benchmarkPreset, customBenchmarkInput]);

  useEffect(() => {
    if (currentTab === 5 && !benchmarkData) {
      loadBenchmarkData();
    }
  }, [currentTab, benchmarkData, loadBenchmarkData]);

  // Handle Export to Excel
  const handleExportBenchmarkExcel = async () => {
    if (!benchmarkData) return;
    try {
      await exportSchoolSubjectBenchmarkXlsx({
        school: benchmarkData.school || overview?.school || {},
        selectedClass: benchmarkData.selected_class || {},
        selectedSubject: benchmarkData.selected_subject || {},
        stats: benchmarkData.benchmark_stats || {},
        aboveStudents: benchmarkData.above_benchmark_students || [],
        belowStudents: benchmarkData.below_benchmark_students || [],
        matrix: benchmarkData.class_subject_matrix || [],
      });
      setBenchmarkSuccessMsg('Class Subject Benchmark Analysis exported to styled Excel workbook (.xlsx)!');
      setTimeout(() => setBenchmarkSuccessMsg(''), 4500);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  // Load All Principal Data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [ovRes, tRes, sRes, exRes, loRes] = await Promise.all([
        principalApi.getOverview(),
        principalApi.getTeachers(),
        principalApi.getStudents({ class_id: selectedClass, band: selectedBand, search: studentSearch }),
        principalApi.getExams(),
        principalApi.getLearningOutcomes()
      ]);

      setOverview(ovRes.data);
      setTeachers(tRes.data.teachers || []);
      setStudents(sRes.data.students || []);
      setExams(exRes.data.exams || []);
      setLearningOutcomes(loRes.data.learning_outcomes || []);
    } catch (err) {
      console.error('Error loading principal data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data. Please refresh and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedClass, selectedBand, studentSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived KPI & Filtered Data
  const kpis = overview?.kpis || {};
  const school = overview?.school || {};
  const gradeDist = overview?.grade_distribution || {};
  const classPerf = overview?.class_performance || [];
  const subjectPerf = overview?.subject_performance || [];

  // Chart Data: Grade Distribution Pie Data
  const gradePieData = useMemo(() => [
    { name: 'A+ (≥90%)', value: gradeDist.a_plus || 0, color: '#10b981' },
    { name: 'A (75-89%)', value: gradeDist.a || 0, color: '#0284c7' },
    { name: 'B (60-74%)', value: gradeDist.b || 0, color: '#6366f1' },
    { name: 'C (40-59%)', value: gradeDist.c || 0, color: '#f59e0b' },
    { name: 'Remedial (<40%)', value: gradeDist.remedial || 0, color: '#ef4444' },
  ], [gradeDist]);

  // Chart Data: Class-wise Comparative Bar Chart Data
  const classBarData = useMemo(() => {
    return classPerf.map(c => ({
      name: c.class_name,
      'Class Average %': c.avg_score_pct,
      'Pass Rate %': c.enrolled_count > 0 ? Math.round(((c.enrolled_count - c.remedial_count) / c.enrolled_count) * 100) : 0,
      'At Risk Students': c.remedial_count,
    }));
  }, [classPerf]);

  // Chart Data: Subject Performance Radar / Bar Data
  const subjectChartData = useMemo(() => {
    return subjectPerf.map(s => ({
      subject: s.subject_name || s.name,
      average: s.avg_score_pct,
      weakCount: s.weak_students_count || 0
    }));
  }, [subjectPerf]);

  // Chart Data: Exam Trajectory Area Chart Data
  const examTrajectoryData = useMemo(() => {
    return exams.map((ex, idx) => ({
      name: `${ex.class_name} ${ex.assessment_name.replace('Assessment', '').replace('Periodic Test', 'PT').slice(0, 14)}`,
      average: ex.avg_score_pct,
      passRate: ex.evaluated_students > 0 ? Math.round((ex.pass_students / ex.evaluated_students) * 100) : 0,
      remedial: ex.remedial_students || 0
    }));
  }, [exams]);

  // Chart Data: Teacher Score Matrix
  const teacherChartData = useMemo(() => {
    return teachers.map(t => ({
      name: t.full_name.split(' ')[0],
      score: t.avg_student_score || 0,
      compliance: t.compliance_rate || 0
    }));
  }, [teachers]);

  const filteredLOs = useMemo(() => {
    return learningOutcomes.filter(lo => {
      if (selectedLoClass !== 'ALL' && String(lo.class_id) !== String(selectedLoClass) && String(lo.class_num) !== String(selectedLoClass)) {
        return false;
      }
      if (selectedLoPriority !== 'ALL' && lo.revision_priority !== selectedLoPriority) {
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
  }, [learningOutcomes, selectedLoClass, selectedLoPriority, loSearch]);

  const loStats = useMemo(() => {
    const total = learningOutcomes.length;
    const urgent = learningOutcomes.filter(l => l.revision_priority === 'URGENT_REVISION').length;
    const moderate = learningOutcomes.filter(l => l.revision_priority === 'MODERATE_PRACTICE').length;
    const mastered = learningOutcomes.filter(l => l.revision_priority === 'MASTERED').length;
    const avgScore = total > 0 ? Math.round(learningOutcomes.reduce((acc, l) => acc + (Number(l.mastery_pct) || 0), 0) / total) : 0;
    return { total, urgent, moderate, mastered, avgScore };
  }, [learningOutcomes]);

  const handlePrint = () => {
    window.print();
  };

  if (loading && !overview) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '65vh' }}>
        <CircularProgress size={48} sx={{ color: '#0284c7', mb: 2 }} />
        <Typography variant="h6" sx={{ color: '#0f3460', fontWeight: 800 }}>
          Loading Principal Command Center...
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Shiksha Drishti — Unified School Analytics & Performance Intelligence
        </Typography>
      </Box>
    );
  }

  const kpiCardsData = [
    {
      label: 'Total Students (कुल छात्र)',
      value: kpis.total_students || 0,
      sub: `Boys: ${kpis.male_students || 0} · Girls: ${kpis.female_students || 0}`,
      color: '#0284c7',
      gradientTo: '#38bdf8',
      icon: <People sx={{ fontSize: 18 }} />,
      badge: 'Enrolled',
      wavePoints: 'M0,32 Q35,14 70,26 T140,16 T210,24 T280,10 L280,45 L0,45 Z',
    },
    {
      label: 'Active Faculty (शिक्षक)',
      value: kpis.total_teachers || 0,
      sub: '100% Classes Allocated',
      color: '#10b981',
      gradientTo: '#34d399',
      icon: <Person sx={{ fontSize: 18 }} />,
      badge: 'Faculty',
      wavePoints: 'M0,28 Q40,32 80,18 T160,22 T220,10 T280,14 L280,45 L0,45 Z',
    },
    {
      label: 'School Average (औसत अंक)',
      value: `${kpis.overall_avg_pct || 0}%`,
      sub: 'Academic Grade B+',
      color: '#6366f1',
      gradientTo: '#818cf8',
      icon: <TrendingUp sx={{ fontSize: 18 }} />,
      badge: 'Score',
      wavePoints: 'M0,30 Q35,18 70,28 T140,12 T210,22 T280,8 L280,45 L0,45 Z',
    },
    {
      label: 'Pass Rate (उत्तीर्ण दर)',
      value: `${kpis.pass_rate_pct || 0}%`,
      sub: `${Math.round(((kpis.total_students || 125) * (kpis.pass_rate_pct || 88)) / 100)} students passed`,
      color: '#059669',
      gradientTo: '#10b981',
      icon: <CheckCircle sx={{ fontSize: 18 }} />,
      badge: 'Target Met',
      wavePoints: 'M0,25 Q45,15 90,30 T180,10 T240,20 T280,6 L280,45 L0,45 Z',
    },
    {
      label: 'Needs Remedial (उपचारात्मक)',
      value: kpis.remedial_count || 0,
      sub: 'Special support required',
      color: '#ef4444',
      gradientTo: '#f87171',
      icon: <Warning sx={{ fontSize: 18 }} />,
      badge: 'Action Needed',
      actionText: 'View',
      onClick: () => handleTabChange(null, 2),
      wavePoints: 'M0,34 Q30,22 60,30 T120,20 T180,32 T240,14 T280,22 L280,45 L0,45 Z',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── 1. Executive School Banner & Control Hub ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card sx={{
          mb: 2,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 55%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 52, 96, 0.25)',
          overflow: 'hidden',
          border: 'none',
          position: 'relative',
        }}>
          {/* Ambient Glow */}
          <Box sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <CardContent sx={{ p: { xs: 2, md: 2.2 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} lg={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Avatar sx={{
                    width: 44, height: 44,
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                  }}>
                    <School sx={{ fontSize: 24, color: '#ffffff' }} />
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.4 }}>
                      <Typography variant="h5" sx={{
                        fontWeight: 800,
                        fontSize: { xs: '1.15rem', sm: '1.35rem' },
                        letterSpacing: '-0.01em',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        lineHeight: 1.2,
                      }}>
                        {school.school_name || 'GOVT MODEL HIGHER SECONDARY SCHOOL'}
                      </Typography>
                      <Chip
                        icon={<VerifiedUser sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />}
                        label={`UDISE: ${school.udise_code || '22050904705'}`}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          background: 'rgba(255, 255, 255, 0.14)',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 22,
                          border: '1px solid rgba(255, 255, 255, 0.25)'
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap', fontSize: '0.78rem' }}>
                      <span>📍 संकुल: <strong>{school.cluster_name || 'Cluster 1'}</strong></span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span>ब्लॉक: <strong>{school.block_name || 'Urban'}</strong></span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span>जिला: <strong>{school.district_name || 'Raipur'}</strong></span>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <span>संस्था प्रमुख: <strong>{school.hos_name || user?.full_name}</strong></span>
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Action Buttons in Banner */}
              <Grid item xs={12} lg={4} sx={{ textAlign: { xs: 'left', lg: 'right' } }}>
                <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', lg: 'flex-end' }} flexWrap="wrap">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={refreshing ? <CircularProgress size={13} color="inherit" /> : <Refresh sx={{ fontSize: 16 }} />}
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    sx={{
                      borderRadius: 2,
                      background: 'rgba(255, 255, 255, 0.14)',
                      border: '1px solid rgba(255, 255, 255, 0.28)',
                      color: '#ffffff',
                      fontWeight: 700,
                      py: 0.5,
                      px: 1.4,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      '&:hover': { background: 'rgba(255, 255, 255, 0.25)' }
                    }}
                  >
                    {refreshing ? 'Syncing...' : 'Refresh'}
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Print sx={{ fontSize: 16 }} />}
                    onClick={handlePrint}
                    sx={{
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #e89005 0%, #f59e0b 100%)',
                      color: '#ffffff',
                      fontWeight: 800,
                      py: 0.5,
                      px: 1.4,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      boxShadow: '0 2px 8px rgba(232, 144, 5, 0.35)',
                      '&:hover': { background: '#d97706' }
                    }}
                  >
                    Print Report (PDF)
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── 2. Compact 5-KPI Wave Metric Row ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
        gap: 1.5,
        mb: 2,
        width: '100%',
      }}>
        {kpiCardsData.map((kpi, idx) => (
          <PrincipalKpiCard key={idx} {...kpi} />
        ))}
      </Box>

      {/* ── 3. Tab Navigation (Fits 100% on Screen) ── */}
      <Card sx={{
        borderRadius: 2.5,
        mb: 2,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
        overflow: 'hidden'
      }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            width: '100%',
            '& .MuiTabs-flexContainer': {
              width: '100%',
              display: 'flex',
            },
            '& .MuiTab-root': {
              flex: 1,
              minWidth: 0,
              maxWidth: 'none',
              py: 1,
              px: { xs: 0.5, sm: 0.8, md: 1.2 },
              fontWeight: 700,
              fontSize: { xs: '0.68rem', sm: '0.72rem', md: '0.76rem', lg: '0.78rem' },
              textTransform: 'none',
              minHeight: 44,
              color: '#64748b',
              gap: 0.6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s ease',
              '&.Mui-selected': {
                color: '#0f3460',
                fontWeight: 800,
                background: 'rgba(2, 132, 199, 0.04)',
              },
              '&:hover': {
                background: 'rgba(241, 245, 249, 0.6)',
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #0f3460, #0284c7)',
            }
          }}
        >
          <Tab
            icon={<Dashboard sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="School Overview"
          />
          <Tab
            icon={<ClassOutlined sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Class-Wise Analysis"
          />
          <Tab
            icon={<People sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Students (${students.length})`}
          />
          <Tab
            icon={<BarChart sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Exams (${exams.length})`}
          />
          <Tab
            icon={<AutoAwesome sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Question Diagnostics"
          />
          <Tab
            icon={<CompareArrows sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label="Subject Benchmark"
          />
          <Tab
            icon={<AssignmentTurnedIn sx={{ fontSize: 16 }} />}
            iconPosition="start"
            label={`Faculty (${teachers.length})`}
          />
        </Tabs>
      </Card>

      {/* ── TAB 0: Comprehensive School Overview & Visual Analytics ── */}
      {currentTab === 0 && (
        <Box>
          {/* Visual Charts Row 1: Grade Doughnut & Class Performance Bars */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
            gap: 2,
            mb: 2,
            width: '100%',
          }}>
            {/* Chart 1: Grade Distribution Doughnut Chart */}
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
                  <PieIcon sx={{ color: '#0284c7', fontSize: 18 }} />
                  Grade Distribution (ग्रेड वितरण)
                </Typography>
                <Chip label={`${kpis.total_students || 0} Students`} size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#f0f9ff', color: '#0284c7', height: 20, fontSize: '0.68rem', border: '1px solid rgba(2,132,199,0.2)' }} />
              </Box>

              {/* Pie Chart Container */}
              <Box sx={{ width: '100%', height: 200, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gradePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {gradePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(val, name) => [`${val} Students`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none'
                }}>
                  <Typography sx={{ fontWeight: 800, color: '#0f3460', lineHeight: 1, fontSize: '1.25rem' }}>
                    {kpis.total_students || 0}
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>
                    Students
                  </Typography>
                </Box>
              </Box>

              {/* Custom Color Badges */}
              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 0.6, mt: 0.5 }}>
                {gradePieData.map((g, idx) => (
                  <Chip
                    key={idx}
                    label={`${g.name}: ${g.value}`}
                    size="small"
                    sx={{
                      borderRadius: 1.5,
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      background: g.color + '15',
                      color: g.color,
                      border: `1px solid ${g.color}30`,
                      height: 20
                    }}
                  />
                ))}
              </Box>
            </Card>

            {/* Chart 2: Class Performance Comparative Bar Chart */}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
                  <BarChart sx={{ color: '#e89005', fontSize: 18 }} />
                  Class-wise Performance & Pass Rate (कक्षा-वार प्रदर्शन)
                </Typography>
                <Chip label="Class 6 to 8" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#eff6ff', color: '#0284c7', height: 20, fontSize: '0.68rem', border: '1px solid rgba(2,132,199,0.2)' }} />
              </Box>

              <Box sx={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={classBarData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend wrapperStyle={{ paddingTop: 4, fontSize: 11, fontWeight: 700 }} />
                    <Bar dataKey="Class Average %" fill="#0284c7" radius={[3, 3, 0, 0]} maxBarSize={26} />
                    <Bar dataKey="Pass Rate %" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={26} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Box>

          {/* Class-wise Matrix Cards Grid (4-4-4 or 5-Column Responsive Grid) */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontWeight: 800, color: '#0f3460', mb: 1.2, display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
              <ClassOutlined sx={{ color: '#0284c7', fontSize: 18 }} />
              Class-wise Academic Achievement (कक्षा-वार शैक्षणिक उपलब्धि)
            </Typography>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: 1.5,
              width: '100%',
            }}>
              {classPerf.map((c) => {
                const passPct = c.enrolled_count > 0 ? Math.round(((c.enrolled_count - c.remedial_count) / c.enrolled_count) * 100) : 0;
                const statusColor = c.avg_score_pct >= 65 ? '#10b981' : c.avg_score_pct >= 50 ? '#0284c7' : '#e11d48';
                return (
                  <Card key={c.class_id} elevation={0} sx={{
                    borderRadius: 2.5,
                    p: 1.5,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    '&:hover': {
                      borderColor: statusColor,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 18px ${alpha(statusColor, 0.12)}`,
                    }
                  }}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.85rem' }}>
                          {c.class_name}
                        </Typography>
                        <Chip
                          label={`${c.enrolled_count} Students`}
                          size="small"
                          sx={{ borderRadius: 1.5, background: '#f0f9ff', color: '#0284c7', fontWeight: 700, fontSize: '0.67rem', height: 20, border: '1px solid rgba(2,132,199,0.15)' }}
                        />
                      </Box>

                      <Box sx={{ my: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                          <Typography sx={{ fontWeight: 800, color: statusColor, fontSize: '1.25rem', lineHeight: 1 }}>
                            {c.avg_score_pct}%
                          </Typography>
                          <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>
                            Pass: <strong style={{ color: '#0f172a' }}>{passPct}%</strong>
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Number(c.avg_score_pct)}
                          sx={{
                            height: 4,
                            borderRadius: 2,
                            mt: 0.6,
                            backgroundColor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: statusColor,
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{ pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ color: c.remedial_count > 0 ? '#e11d48' : '#10b981', fontWeight: 800, fontSize: '0.68rem' }}>
                        {c.remedial_count > 0 ? `🚨 At Risk: ${c.remedial_count}` : '✅ All on Track'}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedClass(c.class_id);
                          handleTabChange(null, 1);
                        }}
                        sx={{ fontSize: '0.68rem', fontWeight: 800, p: 0, minWidth: 'auto', color: '#0284c7', textTransform: 'none' }}
                      >
                        Details →
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          </Box>

          {/* Visual Charts Row 2: Subject Mastery Heatmap & Exam Trajectory */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 2,
            mb: 2,
            width: '100%',
          }}>
            {/* Chart 3: Subject Performance Horizontal Bars */}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
                  <AutoAwesome sx={{ color: '#8b5cf6', fontSize: 18 }} />
                  Subject Mastery Ranking (विषय-वार दक्षता)
                </Typography>
                <Chip label="All Subjects" size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#f5f3ff', color: '#7c3aed', height: 20, fontSize: '0.68rem', border: '1px solid rgba(139,92,246,0.2)' }} />
              </Box>

              <Box sx={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={subjectChartData} layout="vertical" margin={{ top: 5, right: 25, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="subject" type="category" stroke="#0f172a" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <RechartsTooltip formatter={(val) => [`${val}%`, 'Avg Score']} />
                    <Bar dataKey="average" fill="#8b5cf6" radius={[0, 3, 3, 0]} maxBarSize={18}>
                      {subjectChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.average >= 65 ? '#10b981' : entry.average >= 60 ? '#0284c7' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* Chart 4: Exam-by-Exam Trajectory Area Chart */}
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
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.88rem' }}>
                  <ShowChart sx={{ color: '#10b981', fontSize: 18 }} />
                  Assessment Progress Trajectory (आकलन प्रगति)
                </Typography>
                <Chip label={`${exams.length} Exams`} size="small" sx={{ borderRadius: 1.5, fontWeight: 700, background: '#f0fdf4', color: '#16a34a', height: 20, fontSize: '0.68rem', border: '1px solid rgba(16,185,129,0.2)' }} />
              </Box>

              <Box sx={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={examTrajectoryData.slice(0, 8)} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                    <RechartsTooltip formatter={(val) => [`${val}%`]} />
                    <Area type="monotone" dataKey="average" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" name="Avg Score %" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Box>

          {/* Smart Principal AI Action Center */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            p: 2.2,
            background: 'linear-gradient(135deg, #071526 0%, #0f2744 100%)',
            color: '#ffffff',
            border: '1px solid rgba(56, 189, 248, 0.18)',
            boxShadow: '0 4px 20px rgba(7, 21, 38, 0.35)',
            mb: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 2, background: 'linear-gradient(135deg, #e89005, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AutoAwesome sx={{ fontSize: 17, color: '#ffffff' }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.2, fontSize: '0.88rem' }}>
                  AI Action Insights · Principal Command Center
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                  Automated remedial guidance & institutional recommendations
                </Typography>
              </Box>
            </Box>

            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 1.5,
              width: '100%',
            }}>
              <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.78rem' }}>
                  📐 Class 6 & 7 — Mathematics (Fractions & Integers)
                </Typography>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', mt: 0.5, lineHeight: 1.5 }}>
                  4 students in Class 6 scored below 40% in Fractions. Direct Teacher Ananya to issue remedial worksheets for targeted intervention.
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#fde047', fontWeight: 800, fontSize: '0.78rem' }}>
                  🔬 Class 8 — Science (Motion & Chemical Reactions)
                </Typography>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', mt: 0.5, lineHeight: 1.5 }}>
                  Periodic Test 1 for Class 8 remains in Draft status. Send a reminder to Teacher Vikram to complete marks entry promptly.
                </Typography>
              </Box>

              <Box sx={{ p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Typography sx={{ color: '#4ade80', fontWeight: 800, fontSize: '0.78rem' }}>
                  ⭐ Top Performance Highlight
                </Typography>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.74rem', mt: 0.5, lineHeight: 1.5 }}>
                  School average in Hindi Language stands at 68.4%. 24 students have achieved 90%+ marks — acknowledge teacher efforts.
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>
      )}

      {/* ── TAB 1: Class-Wise Comprehensive Performance Analysis & Report ── */}
      {currentTab === 1 && (
        <ClassWiseAnalysisTab
          classPerf={classPerf}
          students={students}
          exams={exams}
          teachers={teachers}
          learningOutcomes={learningOutcomes}
          school={school}
          onSelectStudent={setSelectedStudentForModal}
          onSelectTeacher={setSelectedTeacherForModal}
          initialClassId={selectedClass}
        />
      )}

      {/* ── TAB 2: Student 360° & Remedial Hub ── */}
      {currentTab === 2 && (
        <Card elevation={0} sx={{ borderRadius: 2.8, p: { xs: 2, md: 2.5 }, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                Student 360° & Remedial Hub (विद्यार्थी प्रोफाइल एवं उपचारात्मक डैशबोर्ड)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.2 }}>
                Exam-wise performance record and remedial status for all students (Class 6–8)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Print sx={{ fontSize: 16 }} />}
              onClick={handlePrint}
              sx={{ borderRadius: 2, fontWeight: 700, py: 0.4, px: 1.2, fontSize: '0.75rem', textTransform: 'none', borderColor: '#cbd5e1' }}
            >
              Print Remedial List
            </Button>
          </Box>

          {/* Search & Filter Ribbon */}
          <Grid container spacing={1.2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by student name or roll number..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94a3b8', fontSize: 17 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiInputBase-root': { height: 38, fontSize: '0.8rem', borderRadius: 2 } }}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8rem' }}>Filter by Class</InputLabel>
                <Select value={selectedClass} label="Filter by Class" onChange={(e) => setSelectedClass(e.target.value)} sx={{ height: 38, fontSize: '0.8rem', borderRadius: 2 }}>
                  <MenuItem value="ALL">All Classes</MenuItem>
                  {classPerf.map((c) => (
                    <MenuItem key={c.class_id} value={c.class_id}>{c.class_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8rem' }}>Performance Band</InputLabel>
                <Select value={selectedBand} label="Performance Band" onChange={(e) => setSelectedBand(e.target.value)} sx={{ height: 38, fontSize: '0.8rem', borderRadius: 2 }}>
                  <MenuItem value="ALL">All Bands</MenuItem>
                  <MenuItem value="TOP">⭐ Star (≥80%)</MenuItem>
                  <MenuItem value="GOOD">Consistent (60–79%)</MenuItem>
                  <MenuItem value="NEEDS_GUIDANCE">Needs Guidance (40–59%)</MenuItem>
                  <MenuItem value="AT_RISK">🚨 At Risk (&lt;40%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
              <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.78rem' }}>
                कुल छात्र: <strong style={{ color: '#0f172a' }}>{students.length}</strong>
              </Typography>
            </Grid>
          </Grid>

          {/* Student Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ background: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Roll #</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Class</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Guardian</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Avg Score (%)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Weak Subjects</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Band</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((st) => (
                  <TableRow
                    key={st.id}
                    hover
                    sx={{
                      background: st.band === 'AT_RISK' ? 'rgba(254, 242, 242, 0.4)' : 'inherit',
                      '&:last-child td': { border: 0 }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.78rem' }}>#{st.roll_number}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{
                          width: 26, height: 26, borderRadius: 1.5, fontSize: '0.72rem', fontWeight: 800,
                          background: st.gender === 'F' ? '#fdf2f8' : '#eff6ff',
                          color: st.gender === 'F' ? '#db2777' : '#0284c7'
                        }}>
                          {st.student_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                            {st.student_name}
                          </Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.67rem' }}>
                            {st.gender === 'F' ? 'Girl' : 'Boy'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0f3460', fontSize: '0.78rem' }}>{st.class_name}</TableCell>
                    <TableCell sx={{ color: '#475569', fontSize: '0.75rem' }}>{st.guardian_name || 'N/A'}</TableCell>
                    <TableCell>
                      <Typography sx={{
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        color: st.avg_pct >= 75 ? '#10b981' : st.avg_pct >= 40 ? '#0284c7' : '#e11d48'
                      }}>
                        {st.avg_pct > 0 ? `${st.avg_pct}%` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {st.weak_subjects && st.weak_subjects.length > 0 ? (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                          {st.weak_subjects.map((ws, i) => (
                            <Chip key={i} label={ws} size="small" sx={{ height: 18, fontSize: '0.65rem', borderRadius: 1.2, background: '#ffe4e6', color: '#be123c', fontWeight: 700 }} />
                          ))}
                        </Stack>
                      ) : (
                        <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.72rem' }}>
                          ✅ No weak subjects
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={st.band_label}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 20,
                          background: st.badge_color + '15',
                          color: st.badge_color,
                          border: `1px solid ${st.badge_color}35`
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => setSelectedStudentForModal(st)} sx={{ color: '#0284c7', p: 0.5 }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ── TAB 3: Exam-by-Exam Deep Dive & Cross-Exam Trends (Full Width 4-4-4 Grid) ── */}
      {currentTab === 3 && (
        <Card elevation={0} sx={{ borderRadius: 2.8, p: { xs: 2, md: 2.5 }, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                Exam-wise Deep Dive & Analytics (आकलन-वार विस्तृत विश्लेषण)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.2 }}>
                Comparative record of all Formative, Periodic, and Unit Tests conducted in Session 2026–27
              </Typography>
            </Box>
            <Chip label={`${exams.length} Exams`} size="small" sx={{ borderRadius: 1.5, background: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: '0.72rem', border: '1px solid rgba(16,185,129,0.2)' }} />
          </Box>

          {/* 4-4-4 Grid: 3 Equal Width Cards per row */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 2,
            width: '100%',
          }}>
            {exams.map((ex) => (
              <Card key={ex.assessment_id} elevation={0} sx={{
                p: 2,
                borderRadius: 2.8,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#0284c7',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 18px rgba(2,132,199,0.1)',
                }
              }}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ minWidth: 0, flex: 1, pr: 1 }}>
                      <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ex.assessment_name}
                      </Typography>
                      <Typography sx={{ color: '#0284c7', fontWeight: 700, fontSize: '0.72rem' }}>
                        {ex.class_name} · Teacher: {ex.teacher_name}
                      </Typography>
                    </Box>
                    <Chip
                      label={ex.status === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                      size="small"
                      sx={{
                        borderRadius: 1.5,
                        fontWeight: 800,
                        fontSize: '0.67rem',
                        height: 20,
                        background: ex.status === 'SUBMITTED' ? '#ecfdf5' : '#fffbeb',
                        color: ex.status === 'SUBMITTED' ? '#10b981' : '#b45309',
                        border: `1px solid ${ex.status === 'SUBMITTED' ? '#bbf7d0' : '#fde68a'}`,
                        flexShrink: 0,
                      }}
                    />
                  </Box>

                  <Box sx={{ my: 1.2, p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #edf2f7' }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Exam Average</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.2rem', lineHeight: 1.2 }}>
                          {ex.avg_score_pct}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Evaluated</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.2rem', lineHeight: 1.2 }}>
                          {ex.evaluated_students} / {ex.total_students}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Subject-wise breakdown for this exam */}
                  <Typography sx={{ fontWeight: 800, color: '#475569', display: 'block', mb: 0.6, fontSize: '0.72rem' }}>
                    Subject-wise Avg Score:
                  </Typography>
                  <Stack spacing={0.4}>
                    {ex.subject_breakdown?.map((sb, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>{sb.subject_name}</Typography>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.72rem', color: sb.avg_marks >= 60 ? '#10b981' : sb.avg_marks >= 40 ? '#0284c7' : '#e11d48' }}>
                          {sb.avg_marks}%
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                <Box sx={{ mt: 1.2, pt: 1, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#e11d48', fontWeight: 800, fontSize: '0.7rem' }}>
                    🚨 {ex.remedial_students || 0} At Risk
                  </Typography>
                  <Chip
                    label={`Passed: ${ex.pass_students || 0}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.67rem', borderRadius: 1.5, background: '#ecfdf5', color: '#16a34a', fontWeight: 800, border: '1px solid #bbf7d0' }}
                  />
                </Box>
              </Card>
            ))}
          </Box>
        </Card>
      )}

      {/* ── TAB 4: Question-Wise Marks & Revision Diagnostics (प्रश्नवार प्राप्तांक एवं पुनरावृत्ति विश्लेषण) ── */}
      {currentTab === 4 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Question Diagnostics KPI Summary */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
          }}>
            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #e2e8f0', background: '#ffffff', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
              <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Questions Evaluated
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.4rem', my: 0.3 }}>
                {loStats.total} Questions
              </Typography>
              <Typography sx={{ color: '#0284c7', fontSize: '0.7rem', fontWeight: 600 }}>
                School Average: {loStats.avgScore}%
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #fecaca', background: '#fef2f2', boxShadow: '0 1px 3px rgba(239,68,68,0.06)' }}>
              <Typography sx={{ color: '#b91c1c', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                🚨 Questions Needing Revision
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#dc2626', fontSize: '1.4rem', my: 0.3 }}>
                {loStats.urgent} Questions
              </Typography>
              <Typography sx={{ color: '#991b1b', fontSize: '0.7rem', fontWeight: 600 }}>
                Score &lt; 55% · Special revision required
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #fde68a', background: '#fffbeb', boxShadow: '0 1px 3px rgba(245,158,11,0.06)' }}>
              <Typography sx={{ color: '#b45309', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ⚡ Moderate Practice Questions
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#d97706', fontSize: '1.4rem', my: 0.3 }}>
                {loStats.moderate} Questions
              </Typography>
              <Typography sx={{ color: '#92400e', fontSize: '0.7rem', fontWeight: 600 }}>
                Score 55–72% · Worksheets recommended
              </Typography>
            </Card>

            <Card elevation={0} sx={{ p: 1.6, borderRadius: 2.5, border: '1px solid #bbf7d0', background: '#f0fdf4', boxShadow: '0 1px 3px rgba(16,185,129,0.06)' }}>
              <Typography sx={{ color: '#15803d', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>
                ⭐ Mastered Questions
              </Typography>
              <Typography sx={{ fontWeight: 800, color: '#16a34a', fontSize: '1.4rem', my: 0.3 }}>
                {loStats.mastered} Questions
              </Typography>
              <Typography sx={{ color: '#166534', fontSize: '0.7rem', fontWeight: 600 }}>
                Score &gt; 72% · Strong concept retention
              </Typography>
            </Card>
          </Box>

          {/* Table Container Card with Filter Controls */}
          <Card elevation={0} sx={{ borderRadius: 2.8, p: { xs: 1.8, md: 2.2 }, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AutoAwesome sx={{ color: '#0284c7', fontSize: 20 }} />
                  Question-Wise Marks & Revision Diagnostics (प्रश्नवार प्राप्तांक एवं पुनरावृत्ति विश्लेषण)
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.2 }}>
                  Direct intelligence from teacher-entered assessment marks. Highlights questions where student error rates are high to guide classroom revision.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <TextField
                  size="small"
                  placeholder="Search question, assessment, subject..."
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
                    value={selectedLoClass}
                    onChange={(e) => setSelectedLoClass(e.target.value)}
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

            {/* Quick Filter Status Badges */}
            <Box sx={{ display: 'flex', gap: 0.8, mb: 1.8, flexWrap: 'wrap' }}>
              {[
                { label: 'All Questions', val: 'ALL', count: loStats.total },
                { label: '🚨 Needs Urgent Revision', val: 'URGENT_REVISION', count: loStats.urgent },
                { label: '⚡ Moderate Practice', val: 'MODERATE_PRACTICE', count: loStats.moderate },
                { label: '⭐ Mastered', val: 'MASTERED', count: loStats.mastered },
              ].map(item => (
                <Chip
                  key={item.val}
                  label={`${item.label} (${item.count})`}
                  onClick={() => setSelectedLoPriority(item.val)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    borderRadius: 1.8,
                    height: 26,
                    background: selectedLoPriority === item.val ? '#0f3460' : '#f1f5f9',
                    color: selectedLoPriority === item.val ? '#ffffff' : '#475569',
                    border: selectedLoPriority === item.val ? '1px solid #0f3460' : '1px solid #e2e8f0',
                    '&:hover': { background: selectedLoPriority === item.val ? '#0f3460' : '#e2e8f0' }
                  }}
                />
              ))}
            </Box>

            {/* Diagnostics Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ background: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', py: 1.2 }}>QUESTION & ASSESSMENT</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>CLASS & SUBJECT</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>STUDENTS TESTED</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>STUDENTS &lt; 40%</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>AVG MARKS & %</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem' }}>REVISION STATUS</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.72rem', minWidth: 260 }}>TEACHER DIRECTIVE / ACTION PLAN</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLOs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                          No questions match the selected filter criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLOs.map((lo, idx) => {
                      const isUrgent = lo.revision_priority === 'URGENT_REVISION';
                      const isModerate = lo.revision_priority === 'MODERATE_PRACTICE';
                      const priorityColor = isUrgent ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';

                      return (
                        <TableRow key={lo.lo_id || idx} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 1.2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
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
                            <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '0.75rem', maxWidth: 280, lineHeight: 1.3 }}>
                              {lo.assessment_name}
                            </Typography>
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
                            <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#1e293b' }}>
                              {lo.students_tested} Students
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: lo.weak_students_count >= 5 ? '#ef4444' : '#64748b' }}>
                              {lo.weak_students_count} Students
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontWeight: 800, minWidth: 34, fontSize: '0.8rem', color: priorityColor }}>
                                {lo.mastery_pct}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={Number(lo.mastery_pct)}
                                sx={{
                                  width: 55,
                                  height: 5,
                                  borderRadius: 2,
                                  backgroundColor: '#f1f5f9',
                                  '& .MuiLinearProgress-bar': {
                                    backgroundColor: priorityColor,
                                    borderRadius: 2,
                                  }
                                }}
                              />
                            </Box>
                            <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.2 }}>
                              Avg: {lo.avg_marks_obtained || Math.round(((lo.mastery_pct || 0) * (lo.max_marks || 10)) / 100)} / {lo.max_marks || 10} M
                            </Typography>
                          </TableCell>

                          <TableCell align="center">
                            <Chip
                              label={isUrgent ? '🚨 Needs Revision' : isModerate ? '⚡ Moderate Practice' : '⭐ Mastered'}
                              size="small"
                              sx={{
                                borderRadius: 1.5,
                                fontWeight: 800,
                                fontSize: '0.67rem',
                                height: 22,
                                background: isUrgent ? '#fef2f2' : isModerate ? '#fffbeb' : '#f0fdf4',
                                color: isUrgent ? '#dc2626' : isModerate ? '#d97706' : '#16a34a',
                                border: `1px solid ${isUrgent ? '#fecaca' : isModerate ? '#fde68a' : '#bbf7d0'}`,
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
                                {lo.teacher_directive}
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

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 5: Subject & Class Benchmark (Above & Below Avg Cohort Segregation) ── */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {currentTab === 5 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ width: '100%' }}>
          
          {/* 1. Module Command Header & Filter Strip */}
          <Card elevation={0} sx={{ p: 2.2, borderRadius: 3, mb: 2, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 44, height: 44, borderRadius: 2, background: 'linear-gradient(135deg, #0f3460, #0284c7)', color: '#ffffff', boxShadow: '0 4px 12px rgba(2,132,199,0.25)' }}>
                  <CompareArrows sx={{ fontSize: 24 }} />
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: { xs: '1rem', sm: '1.18rem' }, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      Class Subject Performance Benchmark & Cohort Segregation Studio
                    </Typography>
                    <Chip
                      label="RELATIVE MEAN ANALYSIS"
                      size="small"
                      sx={{ borderRadius: 1.5, background: '#0284c7', color: '#ffffff', fontWeight: 800, fontSize: '0.64rem', height: 20 }}
                    />
                  </Box>
                  <Typography sx={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 500, mt: 0.2 }}>
                    कक्षा एवं विषय-वार औसत विश्लेषण — प्राप्तांक औसत (e.g. 75%) के आधार पर छात्रों का 'औसत से अधिक' एवं 'उपचारात्मक आवश्यकता' वर्गीकरण
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Download sx={{ fontSize: 16 }} />}
                  onClick={handleExportBenchmarkExcel}
                  sx={{
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    py: 0.6,
                    px: 1.8,
                    boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
                    '&:hover': { background: '#0f3460' }
                  }}
                >
                  Export Excel (.xlsx)
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Print sx={{ fontSize: 16 }} />}
                  onClick={handlePrint}
                  sx={{
                    borderRadius: 2,
                    borderColor: '#cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    textTransform: 'none',
                    py: 0.6,
                    px: 1.6,
                    '&:hover': { background: '#f8fafc', borderColor: '#94a3b8' }
                  }}
                >
                  Print Report
                </Button>
              </Stack>
            </Box>

            {benchmarkSuccessMsg && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontWeight: 700, fontSize: '0.78rem' }}>
                {benchmarkSuccessMsg}
              </Alert>
            )}

            <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

            {/* Interactive Selectors Strip */}
            <Grid container spacing={1.5} alignItems="center">
              {/* Class Selector */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.76rem', fontWeight: 700 }}>Select Class (कक्षा)</InputLabel>
                  <Select
                    value={benchmarkClass || (benchmarkData?.classes?.[0]?.id ? String(benchmarkData.classes[0].id) : '')}
                    label="Select Class (कक्षा)"
                    onChange={(e) => {
                      const newClassId = e.target.value;
                      setBenchmarkClass(newClassId);
                      loadBenchmarkData({ class_id: newClassId });
                    }}
                    sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc' }}
                  >
                    {(benchmarkData?.classes || overview?.class_performance || []).map((c) => (
                      <MenuItem key={c.id || c.class_id} value={String(c.id || c.class_id)} sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {c.class_name} {c.evaluated_students ? `(${c.evaluated_students} Students)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Subject Selector */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.76rem', fontWeight: 700 }}>Select Subject (विषय)</InputLabel>
                  <Select
                    value={benchmarkSubject || (benchmarkData?.subjects?.[0]?.id ? String(benchmarkData.subjects[0].id) : '')}
                    label="Select Subject (विषय)"
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      setBenchmarkSubject(newSubId);
                      loadBenchmarkData({ subject_id: newSubId });
                    }}
                    sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc' }}
                  >
                    {(benchmarkData?.subjects || overview?.subject_performance || []).map((s) => (
                      <MenuItem key={s.id || s.subject_id} value={String(s.id || s.subject_id)} sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {s.name || s.subject_name} {s.avg_score_pct ? `(Avg: ${s.avg_score_pct}%)` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Assessment Filter */}
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '0.76rem', fontWeight: 700 }}>Evaluation Scope</InputLabel>
                  <Select
                    value={benchmarkAssessment}
                    label="Evaluation Scope"
                    onChange={(e) => {
                      const newAsmtId = e.target.value;
                      setBenchmarkAssessment(newAsmtId);
                      loadBenchmarkData({ assessment_id: newAsmtId });
                    }}
                    sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc' }}
                  >
                    <MenuItem value="ALL" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>All Consolidated Evaluations</MenuItem>
                    {(benchmarkData?.assessments || []).map((a) => (
                      <MenuItem key={a.id} value={String(a.id)} sx={{ fontSize: '0.78rem', fontWeight: 600 }}>
                        {a.assessment_name} ({a.assessment_type || 'EXAM'})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Benchmark Preset Mode */}
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ fontSize: '0.76rem', fontWeight: 700 }}>Benchmark Target</InputLabel>
                    <Select
                      value={benchmarkPreset}
                      label="Benchmark Target"
                      onChange={(e) => {
                        const val = e.target.value;
                        setBenchmarkPreset(val);
                        if (val !== 'CUSTOM') {
                          loadBenchmarkData({ benchmarkPreset: val });
                        }
                      }}
                      sx={{ borderRadius: 2, fontSize: '0.78rem', fontWeight: 700, background: '#f8fafc' }}
                    >
                      <MenuItem value="AUTO" sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#0284c7' }}>
                        🎯 Auto Class Avg ({benchmarkData?.benchmark_stats?.class_subject_avg_pct || 75}%)
                      </MenuItem>
                      <MenuItem value="75" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>75% Target Benchmark</MenuItem>
                      <MenuItem value="80" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>80% Star Honors Standard</MenuItem>
                      <MenuItem value="60" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>60% First Division Floor</MenuItem>
                      <MenuItem value="CUSTOM" sx={{ fontSize: '0.78rem', fontWeight: 700 }}>⚙️ Custom Score %</MenuItem>
                    </Select>
                  </FormControl>

                  {benchmarkPreset === 'CUSTOM' && (
                    <TextField
                      size="small"
                      placeholder="%"
                      type="number"
                      value={customBenchmarkInput}
                      onChange={(e) => setCustomBenchmarkInput(e.target.value)}
                      onBlur={() => {
                        if (customBenchmarkInput) {
                          loadBenchmarkData({ custom_benchmark: customBenchmarkInput, benchmarkPreset: 'CUSTOM' });
                        }
                      }}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        sx: { borderRadius: 2, width: 80, fontSize: '0.78rem', fontWeight: 800 }
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Quick Interactive Subject Switcher Pills */}
            {benchmarkData?.class_subject_matrix && benchmarkData.class_subject_matrix.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.8, pt: 1.5, borderTop: '1px dashed #e2e8f0', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MenuBook sx={{ fontSize: 14 }} /> Switch Subject:
                </Typography>
                {benchmarkData.class_subject_matrix.map((sub) => {
                  const isCur = String(sub.subject_id) === String(benchmarkSubject || benchmarkData?.selected_subject?.id);
                  return (
                    <Chip
                      key={sub.subject_id}
                      onClick={() => {
                        setBenchmarkSubject(String(sub.subject_id));
                        loadBenchmarkData({ subject_id: String(sub.subject_id) });
                      }}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                          <span>{sub.subject_name}</span>
                          <span style={{ fontWeight: 800, opacity: 0.9 }}>{sub.avg_score_pct}%</span>
                        </Box>
                      }
                      size="small"
                      sx={{
                        borderRadius: 1.8,
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        background: isCur ? 'linear-gradient(135deg, #0f3460, #0284c7)' : '#f1f5f9',
                        color: isCur ? '#ffffff' : '#334155',
                        border: isCur ? '1px solid #0f3460' : '1px solid #e2e8f0',
                        boxShadow: isCur ? '0 2px 6px rgba(2,132,199,0.25)' : 'none',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: isCur ? '#0f3460' : '#e2e8f0',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Card>

          {/* Loading Indicator */}
          {benchmarkLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={36} sx={{ color: '#0284c7', mb: 1.5 }} />
              <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.84rem' }}>
                Analyzing Class Performance & Calculating Cohort Benchmarks...
              </Typography>
            </Box>
          ) : !benchmarkData || !benchmarkData.benchmark_stats || benchmarkData.benchmark_stats.total_students_tested === 0 ? (
            <Card elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #cbd5e1', background: '#ffffff' }}>
              <CompareArrows sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 0.5 }}>
                No Evaluated Assessment Data Found
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.78rem', maxWidth: 460, mx: 'auto' }}>
                Please choose another class or subject from the dropdown above to view performance metrics.
              </Typography>
            </Card>
          ) : (
            <>
              {/* 2. Executive Benchmark Scorecard (4 Responsive Cards) */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 1.8,
                mb: 2.2,
              }}>
                {/* KPI Card 1: Class Subject Average Benchmark */}
                <Card elevation={0} sx={{
                  p: 2,
                  borderRadius: 2.8,
                  background: 'linear-gradient(135deg, #0f3460 0%, #17467d 100%)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(15,52,96,0.18)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <Box sx={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Class Subject Average
                    </Typography>
                    <Chip
                      label={benchmarkData.benchmark_stats.is_custom_benchmark ? `TARGET ${benchmarkData.benchmark_stats.benchmark_used_pct}%` : 'CALCULATED MEAN'}
                      size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                    />
                  </Box>
                  <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 900, lineHeight: 1, mb: 0.8 }}>
                    {benchmarkData.benchmark_stats.benchmark_used_pct}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                    {benchmarkData.selected_class?.class_name} · {benchmarkData.selected_subject?.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.65)', mt: 0.4 }}>
                    Total Evaluated: {benchmarkData.benchmark_stats.total_students_tested} Students
                  </Typography>
                </Card>

                {/* KPI Card 2: Above Benchmark Cohort (Green) */}
                <Card elevation={0} sx={{
                  p: 2,
                  borderRadius: 2.8,
                  background: '#ffffff',
                  border: '1px solid #bbf7d0',
                  borderTop: '4px solid #10b981',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.08)',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Above Benchmark Cohort
                    </Typography>
                    <Chip
                      label={`${benchmarkData.benchmark_stats.above_ratio_pct}% of Class`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, background: '#ecfdf5', color: '#059669', border: '1px solid #bbf7d0' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 0.8 }}>
                    <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 900, color: '#15803d', lineHeight: 1 }}>
                      {benchmarkData.benchmark_stats.above_count}
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534' }}>
                      Students (≥ {benchmarkData.benchmark_stats.benchmark_used_pct}%)
                    </Typography>
                  </Box>
                  <Box sx={{ p: 0.8, borderRadius: 1.6, background: '#f0fdf4', border: '1px solid #dcfce7' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#166534', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🏆 Top Scorer: <strong>{benchmarkData.benchmark_stats.highest_score?.student_name}</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '0.64rem', color: '#15803d', fontWeight: 800, mt: 0.2 }}>
                      Score: {benchmarkData.benchmark_stats.highest_score?.score_pct}% (+{(benchmarkData.benchmark_stats.highest_score?.score_pct - benchmarkData.benchmark_stats.benchmark_used_pct).toFixed(1)}% ▲)
                    </Typography>
                  </Box>
                </Card>

                {/* KPI Card 3: Below Benchmark Cohort (Red/Rose) */}
                <Card elevation={0} sx={{
                  p: 2,
                  borderRadius: 2.8,
                  background: '#ffffff',
                  border: '1px solid #fecaca',
                  borderTop: '4px solid #ef4444',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.08)',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Below Benchmark Cohort
                    </Typography>
                    <Chip
                      label={`${benchmarkData.benchmark_stats.below_ratio_pct}% of Class`}
                      size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 0.8 }}>
                    <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 900, color: '#b91c1c', lineHeight: 1 }}>
                      {benchmarkData.benchmark_stats.below_count}
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b' }}>
                      Students (&lt; {benchmarkData.benchmark_stats.benchmark_used_pct}%)
                    </Typography>
                  </Box>
                  <Box sx={{ p: 0.8, borderRadius: 1.6, background: '#fef2f2', border: '1px solid #fee2e2' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      🚨 Critical Remedial (&lt;40%): <strong>{benchmarkData.benchmark_stats.critical_remedial_count} Students</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '0.64rem', color: '#b91c1c', fontWeight: 800, mt: 0.2 }}>
                      Priority: {benchmarkData.benchmark_stats.lowest_score?.student_name} ({benchmarkData.benchmark_stats.lowest_score?.score_pct}%)
                    </Typography>
                  </Box>
                </Card>

                {/* KPI Card 4: Subject Health & Pass Rate */}
                <Card elevation={0} sx={{
                  p: 2,
                  borderRadius: 2.8,
                  background: '#ffffff',
                  border: '1px solid #c7d2fe',
                  borderTop: '4px solid #6366f1',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#3730a3', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Evaluation Health & Fidelity
                    </Typography>
                    <Chip
                      label="≥40% THRESHOLD"
                      size="small"
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 900, background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.8, mb: 0.8 }}>
                    <Typography sx={{ fontSize: { xs: '1.75rem', sm: '2rem' }, fontWeight: 900, color: '#4338ca', lineHeight: 1 }}>
                      {benchmarkData.benchmark_stats.pass_rate_pct}%
                    </Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#3730a3' }}>
                      Pass Rate
                    </Typography>
                  </Box>
                  <Box sx={{ p: 0.8, borderRadius: 1.6, background: '#f5f3ff', border: '1px solid #ede9fe' }}>
                    <Typography sx={{ fontSize: '0.68rem', color: '#4338ca', fontWeight: 700 }}>
                      Tested Demographic: <strong>{benchmarkData.benchmark_stats.male_count} Boys · {benchmarkData.benchmark_stats.female_count} Girls</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '0.64rem', color: '#6366f1', fontWeight: 700, mt: 0.2 }}>
                      100% Evaluation Completion Rate
                    </Typography>
                  </Box>
                </Card>
              </Box>

              {/* 3. Visual Charts Section: Score Distribution & Cross-Subject Matrix */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 2,
                mb: 2.2,
              }}>
                {/* Left Chart: Score Distribution vs Benchmark Reference Line */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <BarChart sx={{ color: '#0284c7', fontSize: 18 }} />
                      Student Score Distribution & Benchmark Marker
                    </Typography>
                    <Chip
                      label={`Threshold: ${benchmarkData.benchmark_stats.benchmark_used_pct}%`}
                      size="small"
                      sx={{ borderRadius: 1.5, background: '#f0fdf4', color: '#15803d', fontWeight: 800, fontSize: '0.66rem', border: '1px solid #bbf7d0' }}
                    />
                  </Box>
                  <Box sx={{ width: '100%', height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={benchmarkData.distribution_bins || []}
                        margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="range" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, background: '#0f172a', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                          formatter={(val, name, item) => [`${val} Students`, item.payload.label]}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                          {(benchmarkData.distribution_bins || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#0284c7'} />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>

                {/* Right Chart: Cross-Subject Matrix for this Class */}
                <Card elevation={0} sx={{ p: 2, borderRadius: 2.8, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Insights sx={{ color: '#6366f1', fontSize: 18 }} />
                      {benchmarkData.selected_class?.class_name} Performance Across All Subjects
                    </Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                      Click bar to analyze
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 210 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart
                        data={benchmarkData.class_subject_matrix || []}
                        margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const subId = data.activePayload[0].payload.subject_id;
                            setBenchmarkSubject(String(subId));
                            loadBenchmarkData({ subject_id: String(subId) });
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="subject_name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: 8, background: '#0f172a', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 700 }}
                          formatter={(val) => [`${val}%`, 'Class Average']}
                        />
                        <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'State Target 70%', fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }} />
                        <Bar dataKey="avg_score_pct" radius={[6, 6, 0, 0]}>
                          {(benchmarkData.class_subject_matrix || []).map((entry, index) => (
                            <Cell
                              key={`cell-sub-${index}`}
                              fill={entry.is_current ? '#0f3460' : entry.avg_score_pct >= 75 ? '#10b981' : entry.avg_score_pct >= 60 ? '#0284c7' : '#ef4444'}
                              cursor="pointer"
                            />
                          ))}
                        </Bar>
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </Box>
                </Card>
              </Box>

              {/* 4. Cohort View Switcher & Search Bar */}
              <Card elevation={0} sx={{ p: 1.8, borderRadius: 2.8, mb: 2, background: '#ffffff', border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                  {/* View Mode Switcher */}
                  <Stack direction="row" spacing={0.8} flexWrap="wrap">
                    <Button
                      variant={cohortViewMode === 'split' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCohortViewMode('split')}
                      startIcon={<CompareArrows sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 0.5,
                        px: 1.4,
                        background: cohortViewMode === 'split' ? '#0f3460' : 'transparent',
                        borderColor: '#cbd5e1',
                        color: cohortViewMode === 'split' ? '#ffffff' : '#475569',
                      }}
                    >
                      🔀 Split Dual View (Side-by-Side)
                    </Button>

                    <Button
                      variant={cohortViewMode === 'above' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCohortViewMode('above')}
                      startIcon={<TrendingUp sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 0.5,
                        px: 1.4,
                        background: cohortViewMode === 'above' ? '#10b981' : 'transparent',
                        borderColor: '#bbf7d0',
                        color: cohortViewMode === 'above' ? '#ffffff' : '#15803d',
                      }}
                    >
                      📈 Above Average List ({benchmarkData.above_benchmark_students?.length || 0})
                    </Button>

                    <Button
                      variant={cohortViewMode === 'below' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCohortViewMode('below')}
                      startIcon={<TrendingDown sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 0.5,
                        px: 1.4,
                        background: cohortViewMode === 'below' ? '#ef4444' : 'transparent',
                        borderColor: '#fecaca',
                        color: cohortViewMode === 'below' ? '#ffffff' : '#b91c1c',
                      }}
                    >
                      ⚠️ Below Average List ({benchmarkData.below_benchmark_students?.length || 0})
                    </Button>

                    <Button
                      variant={cohortViewMode === 'all' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setCohortViewMode('all')}
                      startIcon={<People sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        textTransform: 'none',
                        py: 0.5,
                        px: 1.4,
                        background: cohortViewMode === 'all' ? '#0284c7' : 'transparent',
                        borderColor: '#cbd5e1',
                        color: cohortViewMode === 'all' ? '#ffffff' : '#0284c7',
                      }}
                    >
                      📋 Unified Roster ({benchmarkData.benchmark_stats?.total_students_tested || 0})
                    </Button>
                  </Stack>

                  {/* Micro Filters */}
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                    <TextField
                      size="small"
                      placeholder="Search student name / roll..."
                      value={cohortSearch}
                      onChange={(e) => setCohortSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ fontSize: 16, color: '#94a3b8' }} />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: 2, fontSize: '0.74rem', width: { xs: '100%', sm: 200 }, height: 34, background: '#f8fafc' }
                      }}
                    />

                    <FormControl size="small" sx={{ width: 100 }}>
                      <Select
                        value={cohortGenderFilter}
                        onChange={(e) => setCohortGenderFilter(e.target.value)}
                        sx={{ borderRadius: 2, fontSize: '0.74rem', fontWeight: 700, height: 34, background: '#f8fafc' }}
                      >
                        <MenuItem value="ALL" sx={{ fontSize: '0.74rem', fontWeight: 700 }}>All Genders</MenuItem>
                        <MenuItem value="M" sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Boys</MenuItem>
                        <MenuItem value="F" sx={{ fontSize: '0.74rem', fontWeight: 700 }}>Girls</MenuItem>
                      </Select>
                    </FormControl>

                    <Chip
                      clickable
                      onClick={() => setCohortCriticalOnly(!cohortCriticalOnly)}
                      label="Critical Only (<40%)"
                      size="small"
                      sx={{
                        height: 32,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        background: cohortCriticalOnly ? '#fef2f2' : '#f8fafc',
                        color: cohortCriticalOnly ? '#dc2626' : '#64748b',
                        border: `1px solid ${cohortCriticalOnly ? '#fecaca' : '#e2e8f0'}`,
                      }}
                    />
                  </Stack>
                </Box>
              </Card>

              {/* 5. Cohort Tables (Rendered based on cohortViewMode) */}
              {(() => {
                // Filter helper
                const filterStudent = (s) => {
                  if (cohortSearch.trim()) {
                    const q = cohortSearch.toLowerCase();
                    const matchName = s.student_name.toLowerCase().includes(q);
                    const matchRoll = String(s.roll_number).includes(q);
                    if (!matchName && !matchRoll) return false;
                  }
                  if (cohortGenderFilter !== 'ALL' && s.gender !== cohortGenderFilter) {
                    return false;
                  }
                  if (cohortCriticalOnly && s.score_pct >= 40) {
                    return false;
                  }
                  return true;
                };

                const filteredAbove = (benchmarkData.above_benchmark_students || []).filter(filterStudent);
                const filteredBelow = (benchmarkData.below_benchmark_students || []).filter(filterStudent);
                const unifiedList = [...filteredAbove, ...filteredBelow].sort((a, b) => b.score_pct - a.score_pct);

                // ── SPLIT VIEW (Side-by-Side Dual 6-6 Grid Cohort Cards) ──
                if (cohortViewMode === 'split') {
                  return (
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                      gap: 2.5,
                      width: '100%',
                      alignItems: 'stretch',
                      mb: 3
                    }}>
                      {/* Left Column (6 of 12 / 50% Full-Width): Above Benchmark Cohort Card */}
                      <Card elevation={0} sx={{
                        borderRadius: 2.8,
                        border: '1px solid #bbf7d0',
                        background: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(16,185,129,0.08)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%'
                      }}>
                        {/* Header Ribbon */}
                        <Box sx={{ p: 1.8, background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <TrendingUp sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.01em' }}>
                                📈 Above Benchmark Cohort (उच्च प्राप्तांक समूह)
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                Score ≥ {benchmarkData.benchmark_stats.benchmark_used_pct}% Target · {benchmarkData.benchmark_stats.above_ratio_pct}% of Class ({filteredAbove.length} Students)
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={`${filteredAbove.length} Students`}
                            size="small"
                            sx={{ background: '#ffffff', color: '#065f46', fontWeight: 900, fontSize: '0.72rem', height: 24, px: 0.5 }}
                          />
                        </Box>

                        {/* Table Container */}
                        <TableContainer sx={{ maxHeight: 600, flex: 1, width: '100%' }}>
                          <Table size="small" stickyHeader sx={{ width: '100%' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '12%', color: '#334155' }}>Rank</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '40%', color: '#334155' }}>Student Details</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '20%', color: '#334155' }}>Score (%)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '18%', color: '#334155' }}>Delta (vs Target)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '10%', color: '#334155' }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredAbove.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#64748b', fontSize: '0.78rem' }}>
                                    No students match the active filter in the above average cohort.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredAbove.map((s, idx) => (
                                  <TableRow key={s.student_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 800, fontSize: '0.74rem' }}>
                                      {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                                    </TableCell>
                                    <TableCell>
                                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                                        {s.student_name}
                                      </Typography>
                                      <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                        Roll #{s.roll_number} · {s.gender === 'M' ? 'Boy' : 'Girl'} · {s.guardian_name ? `G: ${s.guardian_name}` : ''}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography sx={{ fontWeight: 900, color: '#15803d', fontSize: '0.86rem' }}>
                                        {s.score_pct}%
                                      </Typography>
                                      <Typography sx={{ color: '#64748b', fontSize: '0.64rem' }}>
                                        {s.marks_obtained} / {s.max_marks} M
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip
                                        label={`+${s.delta_pct}% ▲`}
                                        size="small"
                                        sx={{ height: 22, fontSize: '0.64rem', fontWeight: 900, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                                      />
                                    </TableCell>
                                    <TableCell align="center">
                                      <Tooltip title="View Detailed Report Card">
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            const fullSt = students.find(x => String(x.id) === String(s.student_id));
                                            setSelectedStudentForModal(fullSt || s);
                                          }}
                                          sx={{ color: '#0284c7', p: 0.5, '&:hover': { background: '#e0f2fe' } }}
                                        >
                                          <Visibility sx={{ fontSize: 17 }} />
                                        </IconButton>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Card>

                      {/* Right Column (6 of 12 / 50% Full-Width): Below Benchmark Cohort Card */}
                      <Card elevation={0} sx={{
                        borderRadius: 2.8,
                        border: '1px solid #fecaca',
                        background: '#ffffff',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(239,68,68,0.08)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%'
                      }}>
                        {/* Header Ribbon */}
                        <Box sx={{ p: 1.8, background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                            <TrendingDown sx={{ fontSize: 24 }} />
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.01em' }}>
                                ⚠️ Below Benchmark Cohort (उपचारात्मक समूह)
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', opacity: 0.9 }}>
                                Score &lt; {benchmarkData.benchmark_stats.benchmark_used_pct}% Target · {benchmarkData.benchmark_stats.below_ratio_pct}% of Class ({filteredBelow.length} Students)
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={`${filteredBelow.length} Students`}
                            size="small"
                            sx={{ background: '#ffffff', color: '#991b1b', fontWeight: 900, fontSize: '0.72rem', height: 24, px: 0.5 }}
                          />
                        </Box>

                        {/* Table Container */}
                        <TableContainer sx={{ maxHeight: 600, flex: 1, width: '100%' }}>
                          <Table size="small" stickyHeader sx={{ width: '100%' }}>
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '16%', color: '#334155' }}>Priority</TableCell>
                                <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '38%', color: '#334155' }}>Student Details</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '20%', color: '#334155' }}>Score (%)</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '16%', color: '#334155' }}>Deficit</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', background: '#f8fafc', width: '10%', color: '#334155' }}>Action</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {filteredBelow.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#64748b', fontSize: '0.78rem' }}>
                                    No students in the below average cohort match your filter.
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredBelow.map((s, idx) => {
                                  const isCrit = s.score_pct < 40;
                                  return (
                                    <TableRow key={s.student_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                      <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem' }}>
                                        <Chip
                                          label={isCrit ? `🚨 CRIT #${idx + 1}` : `P #${idx + 1}`}
                                          size="small"
                                          sx={{
                                            height: 22,
                                            fontSize: '0.62rem',
                                            fontWeight: 900,
                                            background: isCrit ? '#fee2e2' : '#fffbeb',
                                            color: isCrit ? '#b91c1c' : '#b45309',
                                            border: `1px solid ${isCrit ? '#fca5a5' : '#fde68a'}`,
                                          }}
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                                          {s.student_name}
                                        </Typography>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                          Roll #{s.roll_number} · {s.gender === 'M' ? 'Boy' : 'Girl'} · {s.guardian_name ? `G: ${s.guardian_name}` : ''}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Typography sx={{ fontWeight: 900, color: isCrit ? '#b91c1c' : '#d97706', fontSize: '0.86rem' }}>
                                          {s.score_pct}%
                                        </Typography>
                                        <Typography sx={{ color: '#64748b', fontSize: '0.64rem' }}>
                                          {s.marks_obtained} / {s.max_marks} M
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={`${s.delta_pct}% ▼`}
                                          size="small"
                                          sx={{ height: 22, fontSize: '0.64rem', fontWeight: 900, background: isCrit ? '#fee2e2' : '#fffbeb', color: isCrit ? '#b91c1c' : '#b45309', border: `1px solid ${isCrit ? '#fca5a5' : '#fde68a'}` }}
                                        />
                                      </TableCell>
                                      <TableCell align="center">
                                        <Tooltip title="View Diagnostic Details">
                                          <IconButton
                                            size="small"
                                            onClick={() => {
                                              const fullSt = students.find(x => String(x.id) === String(s.student_id));
                                              setSelectedStudentForModal(fullSt || s);
                                            }}
                                            sx={{ color: '#dc2626', p: 0.5, '&:hover': { background: '#fee2e2' } }}
                                          >
                                            <Visibility sx={{ fontSize: 17 }} />
                                          </IconButton>
                                        </Tooltip>
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
                  );
                }

                // ── SINGLE LIST OR UNIFIED ROSTER VIEW ──
                const activeListToRender = cohortViewMode === 'above' ? filteredAbove : cohortViewMode === 'below' ? filteredBelow : unifiedList;

                return (
                  <Card elevation={0} sx={{ borderRadius: 2.8, border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
                    <Box sx={{ p: 1.5, background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.86rem' }}>
                        {cohortViewMode === 'above' ? '📈 Above Average Cohort Master List' : cohortViewMode === 'below' ? '⚠️ Below Average Remedial Cohort List' : '📋 Unified Class Subject Performance Roster'}
                      </Typography>
                      <Chip label={`${activeListToRender.length} Students Listed`} size="small" sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22 }} />
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ background: '#f8fafc' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Roll No</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Student Name</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Guardian</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Gender</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Raw Marks</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Percentage Score</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Delta vs Class Avg</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Classification / Action</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeListToRender.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} align="center" sx={{ py: 6, color: '#64748b' }}>
                                No students match your search or filter criteria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            activeListToRender.map((s, idx) => {
                              const isAbove = s.is_above_benchmark;
                              const isCrit = s.score_pct < 40;
                              return (
                                <TableRow key={s.student_id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                  <TableCell sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.78rem' }}>
                                    #{s.roll_number}
                                  </TableCell>
                                  <TableCell sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                                    {s.student_name}
                                  </TableCell>
                                  <TableCell sx={{ color: '#64748b', fontSize: '0.74rem' }}>
                                    {s.guardian_name || '—'}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={s.gender === 'M' ? 'Boy' : 'Girl'}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.62rem',
                                        fontWeight: 800,
                                        background: s.gender === 'M' ? '#eff6ff' : '#fdf2f8',
                                        color: s.gender === 'M' ? '#1d4ed8' : '#be185d',
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.76rem' }}>
                                    {s.marks_obtained} / {s.max_marks} M
                                  </TableCell>
                                  <TableCell align="center">
                                    <Typography sx={{
                                      fontWeight: 900,
                                      fontSize: '0.84rem',
                                      color: isAbove ? '#15803d' : isCrit ? '#b91c1c' : '#b45309'
                                    }}>
                                      {s.score_pct}%
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Chip
                                      label={isAbove ? `+${s.delta_pct}% ▲` : `${s.delta_pct}% ▼`}
                                      size="small"
                                      sx={{
                                        height: 22,
                                        fontSize: '0.66rem',
                                        fontWeight: 900,
                                        background: isAbove ? '#dcfce7' : isCrit ? '#fee2e2' : '#fffbeb',
                                        color: isAbove ? '#15803d' : isCrit ? '#b91c1c' : '#b45309',
                                        border: `1px solid ${isAbove ? '#bbf7d0' : isCrit ? '#fca5a5' : '#fde68a'}`,
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.74rem', color: '#1e293b' }}>
                                      {s.action_recommendation}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        const fullSt = students.find(x => String(x.id) === String(s.student_id));
                                        setSelectedStudentForModal(fullSt || s);
                                      }}
                                      sx={{ borderRadius: 1.5, fontSize: '0.68rem', fontWeight: 700, py: 0.2, px: 0.8, textTransform: 'none' }}
                                    >
                                      Details
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                );
              })()}

              {/* 6. Strategic Pedagogical Directives Callout Card */}
              <Card elevation={0} sx={{ p: 2, mt: 2, borderRadius: 2.8, background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: '4px solid #0284c7' }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.84rem', mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <AutoAwesome sx={{ color: '#0284c7', fontSize: 18 }} />
                  Principal Pedagogical Directives for {benchmarkData.selected_class?.class_name} · {benchmarkData.selected_subject?.name}
                </Typography>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1.2, background: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography sx={{ fontWeight: 800, color: '#15803d', fontSize: '0.74rem', mb: 0.2 }}>
                        1. Peer-Assisted Mentorship Pairing
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>
                        Pair high achievers from the Above Average cohort ({benchmarkData.benchmark_stats.above_count} students) with struggling peers to solve daily practice problems together.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1.2, background: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography sx={{ fontWeight: 800, color: '#b45309', fontSize: '0.74rem', mb: 0.2 }}>
                        2. Targeted 30-Min Remedial Concept Clinics
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>
                        Direct the subject teacher to conduct bi-weekly remedial drills for the {benchmarkData.benchmark_stats.below_count} students scoring below the {benchmarkData.benchmark_stats.benchmark_used_pct}% benchmark.
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ p: 1.2, background: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Typography sx={{ fontWeight: 800, color: '#b91c1c', fontSize: '0.74rem', mb: 0.2 }}>
                        3. Parent-Teacher Counseling (PTM Priority)
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#475569' }}>
                        Schedule personal reviews with guardians of the {benchmarkData.benchmark_stats.critical_remedial_count} critical students (&lt;40%) to ensure daily homework tracking at home.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </>
          )}
        </motion.div>
      )}

      {/* ── TAB 6: Teacher Accountability & Faculty Matrix (Placed Last) ── */}
      {currentTab === 6 && (
        <Card elevation={0} sx={{ borderRadius: 2.8, p: { xs: 2, md: 2.5 }, background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                Faculty Performance & Compliance Matrix (शिक्षक निष्पादन सारांश)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.2 }}>
                Assessment entry compliance, student results, and submission timelines for each teacher
              </Typography>
            </Box>
            <Chip label={`${teachers.length} Teachers`} size="small" sx={{ borderRadius: 1.5, background: '#eff6ff', color: '#0284c7', fontWeight: 800, fontSize: '0.72rem', border: '1px solid rgba(2,132,199,0.2)' }} />
          </Box>

          {/* Teacher Visual Chart */}
          <Box sx={{ mb: 2, p: 1.8, background: '#f8fafc', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
            <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.78rem', mb: 1 }}>
              Teacher-wise Average Student Score (%)
            </Typography>
            <Box sx={{ width: '100%', height: 150 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={teacherChartData} margin={{ top: 5, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                  <RechartsTooltip formatter={(val) => [`${val}%`, 'Avg Score']} />
                  <Bar dataKey="score" fill="#0284c7" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ background: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Faculty Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Assigned Classes</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Assessments</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Submitted / Draft</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Student Avg (%)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow key={t.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 30, height: 30, borderRadius: 1.8, background: 'linear-gradient(135deg, #0f3460, #0284c7)', color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>
                          {t.full_name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>{t.full_name}</Typography>
                          <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>@{t.username}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ display: 'block', color: '#334155', fontWeight: 600, fontSize: '0.72rem' }}>
                        <Phone sx={{ fontSize: 11, verticalAlign: 'middle', mr: 0.4, color: '#64748b' }} />{t.mobile || 'N/A'}
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        <Email sx={{ fontSize: 11, verticalAlign: 'middle', mr: 0.4, color: '#64748b' }} />{t.email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                        {t.assigned_classes?.map((ac) => (
                          <Chip key={ac.class_id} label={ac.class_name} size="small" sx={{ height: 20, fontSize: '0.68rem', borderRadius: 1.2, background: '#f1f5f9', fontWeight: 700 }} />
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.85rem' }}>
                      {t.total_assessments}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${t.submitted_assessments} Submitted · ${t.pending_assessments} Draft`}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: 1.5,
                          fontWeight: 700,
                          fontSize: '0.68rem',
                          background: t.pending_assessments === 0 ? '#ecfdf5' : '#fffbeb',
                          color: t.pending_assessments === 0 ? '#10b981' : '#b45309',
                          border: `1px solid ${t.pending_assessments === 0 ? '#bbf7d0' : '#fde68a'}`
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                        {t.avg_student_score > 0 ? `${t.avg_student_score}%` : 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.status === 'EXCELLENT' ? '⭐ Excellent' : t.status === 'IN_PROGRESS' ? 'In Progress' : 'Action Required'}
                        size="small"
                        sx={{
                          borderRadius: 1.5,
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 20,
                          background: t.status === 'EXCELLENT' ? '#ecfdf5' : t.status === 'IN_PROGRESS' ? '#eff6ff' : '#ffe4e6',
                          color: t.status === 'EXCELLENT' ? '#10b981' : t.status === 'IN_PROGRESS' ? '#0284c7' : '#e11d48'
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => setSelectedTeacherForModal(t)} sx={{ color: '#0284c7', p: 0.5 }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* ── TAB 7: Overall Academic Analytics (UDISE – State-wide data) ── */}
      {currentTab === 7 && (
        <AcademicOverview />
      )}

      {/* ── Modal: Student 360° Detailed Performance View ── */}
      <Dialog
        open={Boolean(selectedStudentForModal)}
        onClose={() => setSelectedStudentForModal(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #0f3460, #0284c7)', color: '#ffffff', fontWeight: 800 }}>
              {selectedStudentForModal?.student_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                {selectedStudentForModal?.student_name}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                Roll: #{selectedStudentForModal?.roll_number} · {selectedStudentForModal?.class_name} · Guardian: {selectedStudentForModal?.guardian_name || 'N/A'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedStudentForModal(null)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          <Grid container spacing={1.2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Overall Avg</Typography>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.2rem' }}>{selectedStudentForModal?.avg_pct}%</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Band Status</Typography>
                <Typography sx={{ fontWeight: 800, color: selectedStudentForModal?.badge_color, fontSize: '0.9rem', mt: 0.2 }}>{selectedStudentForModal?.band_label}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Tests Taken</Typography>
                <Typography sx={{ fontWeight: 800, color: '#0284c7', fontSize: '1.2rem' }}>{selectedStudentForModal?.total_tests_taken}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.67rem', fontWeight: 700, textTransform: 'uppercase' }}>Weak Subjects</Typography>
                <Typography sx={{ fontWeight: 800, color: selectedStudentForModal?.weak_subjects?.length > 0 ? '#e11d48' : '#10b981', fontSize: '1.2rem' }}>
                  {selectedStudentForModal?.weak_subjects?.length || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '0.84rem' }}>
            Detailed Subject Scores:
          </Typography>

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead sx={{ background: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Assessment</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Subject</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Marks / Max</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedStudentForModal?.exam_details?.map((ed, idx) => {
                  const pct = ed.marks !== null ? Math.round((ed.marks / ed.max_marks) * 100) : 0;
                  return (
                    <TableRow key={idx} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontWeight: 700, color: '#0f3460', fontSize: '0.78rem' }}>{ed.assessment_name}</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>{ed.subject}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.78rem' }}>
                        {ed.is_absent ? 'Absent' : `${ed.marks} / ${ed.max_marks}`}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={ed.is_absent ? 'ABS' : `${pct}%`}
                          size="small"
                          sx={{
                            borderRadius: 1.2,
                            fontWeight: 800,
                            height: 20,
                            fontSize: '0.68rem',
                            background: ed.is_absent ? '#fee2e2' : pct >= 60 ? '#ecfdf5' : pct >= 40 ? '#eff6ff' : '#ffe4e6',
                            color: ed.is_absent ? '#dc2626' : pct >= 60 ? '#10b981' : pct >= 40 ? '#0284c7' : '#e11d48'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setSelectedStudentForModal(null)} sx={{ fontWeight: 700, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal: Teacher Profile & Class Details View ── */}
      <Dialog
        open={Boolean(selectedTeacherForModal)}
        onClose={() => setSelectedTeacherForModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{ width: 36, height: 36, borderRadius: 2, background: 'linear-gradient(135deg, #0f3460, #0284c7)', color: '#ffffff', fontWeight: 800 }}>
              {selectedTeacherForModal?.full_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>
                {selectedTeacherForModal?.full_name}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                @{selectedTeacherForModal?.username} · Class Teacher
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setSelectedTeacherForModal(null)} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            <Box sx={{ p: 1.2, background: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
              <Typography sx={{ color: '#64748b', display: 'block', fontWeight: 700, fontSize: '0.72rem' }}>Assigned Classes:</Typography>
              <Stack direction="row" spacing={0.8} sx={{ mt: 0.5 }} flexWrap="wrap">
                {selectedTeacherForModal?.assigned_classes?.map((ac) => (
                  <Chip key={ac.class_id} label={ac.class_name} size="small" sx={{ borderRadius: 1.5, fontWeight: 700, fontSize: '0.7rem', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                ))}
              </Stack>
            </Box>

            <Grid container spacing={1.2}>
              <Grid item xs={6}>
                <Box sx={{ p: 1.2, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>Total Assessments</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '1.2rem', mt: 0.2 }}>{selectedTeacherForModal?.total_assessments}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1.2, border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700 }}>Student Avg Score</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem', mt: 0.2 }}>{selectedTeacherForModal?.avg_student_score}%</Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ p: 1.2, background: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0' }}>
              <Typography sx={{ color: '#166534', fontWeight: 800, display: 'block', fontSize: '0.72rem' }}>Submission Compliance:</Typography>
              <Typography sx={{ color: '#15803d', fontWeight: 700, mt: 0.2, fontSize: '0.78rem' }}>
                {selectedTeacherForModal?.submitted_assessments} assessments fully submitted ({selectedTeacherForModal?.compliance_rate}% compliance)
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 1.5 }}>
          <Button onClick={() => setSelectedTeacherForModal(null)} sx={{ fontWeight: 700, textTransform: 'none' }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

