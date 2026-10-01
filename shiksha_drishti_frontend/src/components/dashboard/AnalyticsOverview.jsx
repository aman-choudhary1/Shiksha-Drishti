import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Card, CardContent, Chip,
  Button, Stack, LinearProgress, Divider, TextField,
  InputAdornment, Avatar, Tooltip, IconButton, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, MenuItem, Select, FormControl, alpha,
} from '@mui/material';
import {
  AutoAwesome, School, TrendingUp, BarChart, CheckCircle,
  ArrowBack, OpenInNew, PlayCircle, MenuBook, Lightbulb,
  Search, SmartDisplay, HelpOutlineOutlined, WarningAmber,
  PriorityHigh, Person, EmojiEvents, Assignment, Speed,
  Psychology, Refresh, TrendingDown, ArrowUpward, ArrowForward,
  BookmarkBorder, Layers,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { masterApi, assessmentApi } from '../../services/api';

// Curated high-quality digital learning resources for remedial teaching
const LEARNING_RESOURCES = {
  MATHEMATICS: [
    {
      title: 'दीक्षा छत्तीसगढ़ - कक्षा 6 गणित (DIKSHA CG)',
      platform: 'DIKSHA Portal',
      url: 'https://diksha.gov.in/explore',
      type: 'Video & Interactive Quiz',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      desc: 'छत्तीसगढ़ पाठ्यपुस्तक पर आधारित भिन्नों, दशमलव एवं ज्यामिति के डिजिटल पाठ',
    },
    {
      title: 'खान एकेडमी हिंदी - कक्षा 6 गणित (Khan Academy)',
      platform: 'Khan Academy Hindi',
      url: 'https://hi.khanacademy.org/math/in-in-class-6th-math-cbse',
      type: 'Interactive Practice',
      color: '#10b981',
      gradientTo: '#34d399',
      desc: 'अभ्यास प्रश्न, चरणबद्ध समाधान और अवधारणा स्पष्टीकरण',
    },
    {
      title: 'NCERT ePathshala - गणित प्रकाश',
      platform: 'NCERT ePathshala',
      url: 'https://epathshala.nic.in/',
      type: 'Digital Textbook & Audio',
      color: '#f59e0b',
      gradientTo: '#fbbf24',
      desc: 'ऑडियोबुक, सचित्र पाठ और उपचारात्मक अभ्यास पुस्तिका',
    },
  ],
  SCIENCE: [
    {
      title: 'दीक्षा छत्तीसगढ़ - कक्षा 6 विज्ञान (DIKSHA CG)',
      platform: 'DIKSHA Portal',
      url: 'https://diksha.gov.in/explore',
      type: 'Experiments & Videos',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      desc: 'सजीव जगत, प्रकाश, विद्युत एवं चुंबकत्व के प्रायोगिक वीडियो',
    },
    {
      title: 'पढ़ई तुंहर दुआर - विज्ञान ई-सामग्री (CG School)',
      platform: 'CG School Education',
      url: 'https://cgschool.in/',
      type: 'Worksheets & Notes',
      color: '#f59e0b',
      gradientTo: '#fbbf24',
      desc: 'छत्तीसगढ़ SCERT द्वारा निर्मित वर्कशीट और वीडियो व्याख्यान',
    },
    {
      title: 'NCERT ePathshala - विज्ञान जिज्ञासा',
      platform: 'NCERT ePathshala',
      url: 'https://epathshala.nic.in/',
      type: 'Digital Textbook',
      color: '#8b5cf6',
      gradientTo: '#a78bfa',
      desc: 'सचित्र वैज्ञानिक अवधारणाएं, मॉडल और प्रश्नोत्तर संग्रह',
    },
  ],
  HINDI: [
    {
      title: 'दीक्षा छत्तीसगढ़ - भाषा भारती (DIKSHA)',
      platform: 'DIKSHA CG',
      url: 'https://diksha.gov.in/explore',
      type: 'Stories & Grammar',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      desc: 'हिंदी व्याकरण, पठन कौशल एवं गद्य-पद्य अभिव्यक्ति अभ्यास',
    },
    {
      title: 'NCERT ePathshala - वसंत भाग-1',
      platform: 'NCERT',
      url: 'https://epathshala.nic.in/',
      type: 'Audiobooks',
      color: '#10b981',
      gradientTo: '#34d399',
      desc: 'कहानियां, कविताएं एवं शुद्ध उच्चारण हेतु ऑडियो मार्गदर्शन',
    },
  ],
  ENGLISH: [
    {
      title: 'DIKSHA English Honeysuckle & Grammar',
      platform: 'DIKSHA National',
      url: 'https://diksha.gov.in/explore',
      type: 'Phonics & Reading',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      desc: 'Reading comprehension, vocabulary builder and spoken English tools',
    },
    {
      title: 'British Council LearnEnglish Kids',
      platform: 'LearnEnglish',
      url: 'https://learnenglishkids.britishcouncil.org/',
      type: 'Games & Activities',
      color: '#ec4899',
      gradientTo: '#f472b6',
      desc: 'Interactive grammar games, listening exercises, and spelling cards',
    },
  ],
  SOCIAL_SCIENCE: [
    {
      title: 'दीक्षा छत्तीसगढ़ - हमारा पर्यावरण एवं इतिहास (DIKSHA)',
      platform: 'DIKSHA CG',
      url: 'https://diksha.gov.in/explore',
      type: 'Maps & Visuals',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      desc: 'मानचित्र पठन, स्थानीय स्वशासन एवं प्राचीन सभ्यता के सचित्र पाठ',
    },
    {
      title: 'पढ़ई तुंहर दुआर - सामाजिक अध्ययन पाठ (CG School)',
      platform: 'CG School Education',
      url: 'https://cgschool.in/',
      type: 'E-Textbook',
      color: '#f59e0b',
      gradientTo: '#fbbf24',
      desc: 'छत्तीसगढ़ का भूगोल, संस्कृति एवं इतिहास संकलन',
    },
  ],
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Compact Executive KPI Stat Card ──────────────────────────────────────────
function AnalyticsKpiCard({ icon, label, value, sub, color, gradientTo, badge, index, trend, wavePoints }) {
  const gradId = `analytics-kpi-grad-${index}`;
  const strokeGradId = `analytics-kpi-stroke-grad-${index}`;

  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants} style={{ height: '100%', width: '100%' }}>
      <Card sx={{
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 3,
        background: 'linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)',
        border: `1px solid ${alpha(color, 0.18)}`,
        boxShadow: `0 2px 10px ${alpha(color, 0.05)}, 0 1px 3px rgba(15, 23, 42, 0.03)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'default',
        '&:hover': {
          borderColor: alpha(color, 0.45),
          boxShadow: `0 8px 24px ${alpha(color, 0.12)}`,
          transform: 'translateY(-2px)',
          '& .kpi-icon-badge': {
            transform: 'scale(1.05)',
            boxShadow: `0 4px 14px ${alpha(color, 0.35)}`,
          },
        },
        transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Top Glowing Accent Stripe */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${color} 0%, ${gradientTo || color} 100%)`,
        }} />

        {/* Card Body */}
        <Box sx={{ px: { xs: 1.8, sm: 2 }, pt: { xs: 1.5, sm: 1.7 }, pb: 0.8, position: 'relative', zIndex: 1 }}>
          {/* Header Row: Glowing Icon + Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box
              className="kpi-icon-badge"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2.2,
                background: `linear-gradient(135deg, ${color} 0%, ${gradientTo || color} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${alpha(color, 0.28)}`,
                color: '#ffffff',
                transition: 'all 0.25s ease',
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 19, color: '#ffffff' } })}
            </Box>

            {/* Badge / Trend Indicator */}
            {trend !== undefined ? (
              <Chip
                icon={<ArrowUpward sx={{ fontSize: '11px !important', color: '#10b981 !important' }} />}
                label={`+${trend}%`}
                size="small"
                sx={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#059669',
                  fontWeight: 800,
                  height: 20,
                  borderRadius: 1.5,
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '0.66rem',
                  px: 0.2,
                }}
              />
            ) : badge ? (
              <Chip
                label={badge}
                size="small"
                sx={{
                  background: alpha(color, 0.08),
                  color: color,
                  fontWeight: 700,
                  height: 20,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(color, 0.2)}`,
                  fontSize: '0.66rem',
                  px: 0.2,
                }}
              />
            ) : null}
          </Box>

          {/* Label with Dot Indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.25 }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', background: color }} />
            <Typography sx={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {label}
            </Typography>
          </Box>

          {/* Metric Value */}
          <Typography sx={{
            fontSize: { xs: '1.45rem', sm: '1.65rem' },
            fontWeight: 800,
            color: '#0f172a',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            mb: 0.25,
          }}>
            {value}
          </Typography>

          {/* Subtitle */}
          {sub && (
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
              {sub}
            </Typography>
          )}
        </Box>

        {/* Ambient Bottom Wave Graphic */}
        <Box
          className="kpi-spark-wave"
          sx={{
            width: '100%',
            height: 16,
            mt: 'auto',
            position: 'relative',
            opacity: 0.65,
            transition: 'all 0.25s ease',
          }}
        >
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

export default function AnalyticsOverview() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const [currentTab, setCurrentTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch assessments list and master data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [asmtRes, subRes, loRes] = await Promise.all([
          assessmentApi.list(),
          masterApi.getSubjects(),
          masterApi.getLearningOutcomes({ class_num: 6 }),
        ]);

        const asmtList = asmtRes.data || [];
        setAssessments(asmtList);
        setSubjects(subRes.data || []);
        setLearningOutcomes(loRes.data || []);

        if (subRes.data?.length) setSelectedSubjectId(String(subRes.data[0].id));
        if (asmtList.length) setSelectedAssessmentId(String(asmtList[0].id));
      } catch (err) {
        setError('Failed to load initial analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch analytics for selected assessment
  useEffect(() => {
    if (!selectedAssessmentId) return;

    const fetchAnalytics = async () => {
      setLoadingAnalytics(true);
      setError('');
      try {
        const res = await assessmentApi.getAnalytics(selectedAssessmentId);
        setAnalyticsData(res.data);
      } catch (err) {
        setError('Unable to load analytics data for the selected assessment');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [selectedAssessmentId]);

  const classSummary = analyticsData?.class_summary;
  const subjectAnalytics = analyticsData?.subject_analytics || [];
  const loInsights = analyticsData?.learning_outcome_insights || [];
  const remedialSuggestions = analyticsData?.remedial_suggestions || [];
  const studentRoster = analyticsData?.student_roster || [];

  // Filter student roster
  const filteredStudents = useMemo(() => {
    return studentRoster.filter(st => {
      const matchQuery = (st.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(st.roll_number || '').includes(searchTerm);
      if (!matchQuery) return false;

      if (tierFilter === 'CRITICAL') return st.tier === 'CRITICAL_ATTENTION';
      if (tierFilter === 'AVERAGE') return st.tier === 'AVERAGE' || st.tier === 'NEEDS_PULL';
      if (tierFilter === 'EXCELLENT') return st.tier === 'EXCELLENT' || st.tier === 'GOOD';
      if (tierFilter === 'ABSENT') return st.tier === 'ABSENT';
      return true;
    });
  }, [studentRoster, searchTerm, tierFilter]);

  const fallbackSubjects = useMemo(() => [
    { id: '1', name: 'गणित (Mathematics)', code: 'MATHEMATICS' },
    { id: '2', name: 'विज्ञान (Science)', code: 'SCIENCE' },
    { id: '3', name: 'हिंदी (Hindi)', code: 'HINDI' },
    { id: '4', name: 'अंग्रेजी (English)', code: 'ENGLISH' },
    { id: '5', name: 'सामाजिक विज्ञान (Social Science)', code: 'SOCIAL_SCIENCE' },
  ], []);

  const displaySubjects = (subjects && subjects.length > 0) ? subjects : fallbackSubjects;
  const currentSubjectObj = displaySubjects.find(s => String(s.id) === String(selectedSubjectId)) || displaySubjects[0];
  const rawCode = (currentSubjectObj?.code || currentSubjectObj?.name || 'MATHEMATICS').toUpperCase();
  const resourceKey = rawCode.includes('MATH') ? 'MATHEMATICS' :
    rawCode.includes('SCI') ? 'SCIENCE' :
    rawCode.includes('HIN') ? 'HINDI' :
    rawCode.includes('ENG') ? 'ENGLISH' :
    rawCode.includes('SOC') || rawCode.includes('SST') ? 'SOCIAL_SCIENCE' :
    rawCode;
  const currentResources = LEARNING_RESOURCES[resourceKey] || LEARNING_RESOURCES.MATHEMATICS;

  const kpiCardsData = classSummary ? [
    {
      label: 'Class Average (कक्षा औसत)',
      value: `${classSummary.class_average_pct}%`,
      sub: `High: ${classSummary.highest_pct}% · Low: ${classSummary.lowest_pct}%`,
      color: '#0284c7',
      gradientTo: '#38bdf8',
      icon: <Speed />,
      badge: 'Assessed',
      wavePoints: 'M0,32 Q35,14 70,26 T140,16 T210,24 T280,10 L280,45 L0,45 Z',
    },
    {
      label: 'Pass Rate (उत्तीर्ण दर)',
      value: `${classSummary.pass_rate_pct}%`,
      sub: `${classSummary.pass_count} of ${classSummary.evaluated_students} passed`,
      color: '#10b981',
      gradientTo: '#34d399',
      icon: <CheckCircle />,
      badge: `${classSummary.pass_count} Passed`,
      wavePoints: 'M0,28 Q40,32 80,18 T160,22 T220,10 T280,14 L280,45 L0,45 Z',
    },
    {
      label: 'Needs Attention (सुधार योग्य)',
      value: `${classSummary.grade_distribution?.['D'] || 0} Students`,
      sub: 'Score < 33% (Remedial focus)',
      color: '#ef4444',
      gradientTo: '#f87171',
      icon: <WarningAmber />,
      badge: 'Action Needed',
      wavePoints: 'M0,34 Q45,20 90,28 T180,12 T240,20 T280,6 L280,45 L0,45 Z',
    },
    {
      label: 'High Achievers (उत्कृष्ट A+)',
      value: `${classSummary.grade_distribution?.['A+'] || 0} Students`,
      sub: 'Score >= 80% (Grade A+)',
      color: '#8b5cf6',
      gradientTo: '#a78bfa',
      icon: <EmojiEvents />,
      badge: 'Grade A+',
      wavePoints: 'M0,30 Q30,22 75,28 T150,16 T225,12 T280,4 L280,45 L0,45 Z',
    },
  ] : [];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. Top Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <Paper sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 2.5,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #091a3c 0%, #0f3460 50%, #0284c7 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(15, 52, 96, 0.22)',
        }}>
          {/* Ambient Glow Orbs */}
          <Box sx={{ position: 'absolute', right: -40, top: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', right: 90, bottom: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(2,132,199,0.15)', pointerEvents: 'none' }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <IconButton size="small" onClick={() => navigate('/dashboard')} sx={{ color: '#93c5fd', background: 'rgba(255,255,255,0.1)', '&:hover': { background: 'rgba(255,255,255,0.2)' } }}>
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
              <Chip
                label="Teacher Performance & Remedial Hub"
                size="small"
                sx={{ background: 'rgba(255, 255, 255, 0.15)', color: '#93c5fd', fontWeight: 800, fontSize: '0.68rem', borderRadius: 1.5 }}
              />
              <Chip
                label="Live Learning Outcomes"
                size="small"
                sx={{ background: 'rgba(16,185,129,0.2)', color: '#a7f3d0', fontWeight: 800, fontSize: '0.68rem', borderRadius: 1.5 }}
              />
            </Box>

            <Typography sx={{
              fontWeight: 800,
              fontSize: { xs: '1.35rem', sm: '1.75rem' },
              lineHeight: 1.2,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              mb: 0.75,
            }}>
              Student Performance Analytics & Remedial Guidance
            </Typography>
            <Typography sx={{ color: 'rgba(226, 232, 240, 0.9)', fontSize: '0.84rem', lineHeight: 1.5, maxWidth: 860 }}>
              Real-time intelligence from entered assessment marks. Discover <strong>Class Average</strong>, identify <strong>Students Needing Attention</strong>, and access targeted <strong>DIKSHA remedial learning resources</strong>.
            </Typography>
          </Box>
        </Paper>
      </motion.div>

      {/* ── 2. Compact Assessment Selector Bar ── */}
      <Paper sx={{
        px: { xs: 1.8, sm: 2.2 },
        py: 1.2,
        mb: 2.5,
        borderRadius: 3,
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.84rem' }}>
            📊 Select Assessment:
          </Typography>
          <FormControl size="small" sx={{ minWidth: { xs: 240, sm: 300 } }}>
            <Select
              value={selectedAssessmentId}
              onChange={(e) => setSelectedAssessmentId(e.target.value)}
              sx={{
                borderRadius: 2.2,
                fontWeight: 700,
                fontSize: '0.82rem',
                height: 38,
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                '& .MuiSelect-select': { py: 0.8 },
              }}
            >
              {assessments.map(a => (
                <MenuItem key={a.id} value={String(a.id)}>
                  {a.class_name} — {a.assessment_name} ({a.year_label})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="contained"
            onClick={() => navigate(`/assessments/${selectedAssessmentId}/report-card`)}
            startIcon={<Assignment sx={{ fontSize: 16 }} />}
            sx={{
              borderRadius: 2.2,
              fontWeight: 700,
              fontSize: '0.78rem',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #0f3460, #0284c7)',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
              px: 1.8,
              py: 0.8,
              '&:hover': { background: 'linear-gradient(135deg, #0b2545, #0369a1)' },
            }}
          >
            View Report Card →
          </Button>
        </Stack>
      </Paper>

      {/* ── 3. Top 4 Compact Executive KPI Cards (Full Width 4-Card Equal Grid) ── */}
      {loadingAnalytics ? (
        <LinearProgress sx={{ my: 2.5, borderRadius: 2 }} />
      ) : classSummary ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2,
          width: '100%',
          mb: 2.5,
        }}>
          {kpiCardsData.map((kpi, idx) => (
            <AnalyticsKpiCard key={kpi.label} {...kpi} index={idx} />
          ))}
        </Box>
      ) : null}

      {/* ── 4. Main Navigation Tabs ── */}
      <Paper sx={{
        borderRadius: 3.5,
        mb: 3,
        border: '1px solid rgba(226, 232, 240, 0.9)',
        background: '#ffffff',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: { xs: 1.5, sm: 2 },
            borderBottom: '1px solid #e2e8f0',
            background: '#fafcff',
            '& .MuiTab-root': {
              fontWeight: 800,
              fontSize: '0.82rem',
              py: 1.4,
              textTransform: 'none',
              color: '#64748b',
              '&.Mui-selected': {
                color: '#0f3460',
              },
            },
          }}
        >
          <Tab icon={<BarChart sx={{ fontSize: 18 }} />} iconPosition="start" label="Class Overview (समग्र विश्लेषण)" />
          <Tab icon={<AutoAwesome sx={{ fontSize: 18 }} />} iconPosition="start" label="Target Learning Outcomes (कमजोर LOs)" />
          <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Student Risk Roster (उपचारात्मक रोस्टर)" />
          <Tab icon={<MenuBook sx={{ fontSize: 18 }} />} iconPosition="start" label="Digital Learning Resources (डिजिटल पाठ)" />
        </Tabs>

        {/* ── TAB 0: Overall Overview & Remedial Suggestions ── */}
        {currentTab === 0 && (
          <Box sx={{ p: { xs: 2, sm: 2.8 } }}>
            {/* Urgent Remedial Action Alert Banner */}
            {remedialSuggestions.length > 0 && (
              <Box sx={{ mb: 2.5 }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.9rem', mb: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ color: '#0284c7', fontSize: 20 }} />
                  Actionable Remedial Plan (सुधारात्मक शिक्षण रणनीतियाँ):
                </Typography>
                <Stack spacing={1.2}>
                  {remedialSuggestions.map((rec, idx) => (
                    <Alert
                      key={idx}
                      severity={rec.priority === 'CRITICAL' ? 'error' : rec.priority === 'HIGH' ? 'warning' : 'info'}
                      sx={{
                        borderRadius: 2.5,
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        py: 0.75,
                        border: '1px solid rgba(0,0,0,0.06)',
                      }}
                    >
                      {rec.message}
                    </Alert>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Full-Width Grid: Subject Performance & Grade Distribution */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1.2fr 0.8fr' },
              gap: 2.5,
              width: '100%',
            }}>
              {/* Subject Comparison */}
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', background: '#ffffff' }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.95rem', mb: 2 }}>
                  Subject-wise Performance & Pass Rate (विषयवार प्रदर्शन)
                </Typography>
                <Stack spacing={1.8}>
                  {subjectAnalytics.map((sub) => (
                    <Box
                      key={sub.subject_id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2.2,
                        background: sub.needs_attention ? 'rgba(254, 242, 242, 0.65)' : '#f8fafc',
                        border: sub.needs_attention ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #e2e8f0',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.86rem' }}>
                            {sub.subject_name}
                          </Typography>
                          {sub.needs_attention && (
                            <Chip
                              label="Needs Attention"
                              size="small"
                              sx={{ background: '#ef4444', color: '#ffffff', fontWeight: 800, fontSize: '0.64rem', height: 20 }}
                            />
                          )}
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: sub.needs_attention ? '#ef4444' : '#0f3460', fontSize: '0.82rem' }}>
                          Avg: {sub.average_pct}% (Pass: {sub.pass_pct}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(sub.average_pct, 100)}
                        sx={{
                          height: 7,
                          borderRadius: 3.5,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: sub.average_pct >= 75 ? '#10b981' : sub.average_pct >= 50 ? '#0284c7' : '#ef4444',
                            borderRadius: 3.5,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>

              {/* Grade Distribution */}
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none', background: '#ffffff' }}>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.95rem', mb: 2 }}>
                  Grade Distribution (कक्षा ग्रेड वर्गीकरण)
                </Typography>
                <Stack spacing={1.2}>
                  {[
                    { grade: 'A+ (Excellent)', range: '>= 80%', count: classSummary?.grade_distribution?.['A+'] || 0, color: '#10b981' },
                    { grade: 'A (First Class)', range: '65% - 79%', count: classSummary?.grade_distribution?.['A'] || 0, color: '#0284c7' },
                    { grade: 'B (Second Class)', range: '50% - 64%', count: classSummary?.grade_distribution?.['B'] || 0, color: '#f59e0b' },
                    { grade: 'C (Third Class)', range: '33% - 49%', count: classSummary?.grade_distribution?.['C'] || 0, color: '#d97706' },
                    { grade: 'D (Remedial Focus)', range: '< 33%', count: classSummary?.grade_distribution?.['D'] || 0, color: '#ef4444' },
                  ].map((g, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.1,
                        px: 1.5,
                        borderRadius: 2,
                        background: '#f8fafc',
                        border: `1px solid ${alpha(g.color, 0.2)}`,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: g.color }} />
                        <Typography sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.82rem' }}>
                          {g.grade}
                        </Typography>
                        <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem' }}>({g.range})</Typography>
                      </Box>
                      <Chip
                        label={`${g.count} Students`}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22, background: `${g.color}18`, color: g.color }}
                      />
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Box>
          </Box>
        )}

        {/* ── TAB 1: Weak LOs & Focus Areas (Full Width 4-4-4 Grid) ── */}
        {currentTab === 1 && (
          <Box sx={{ p: { xs: 2, sm: 2.8 } }}>
            <Box sx={{ mb: 2.2 }}>
              <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 0.3 }}>
                🎯 Focus Learning Outcomes (कमजोर अधिगम परिणाम)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.82rem' }}>
                Questions and Learning Outcomes where class score is below 50%. Focus on remedial sessions for these specific competencies:
              </Typography>
            </Box>

            {loInsights.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                <CheckCircle sx={{ fontSize: 44, color: '#10b981', mb: 1 }} />
                <Typography sx={{ fontWeight: 700, color: '#0f3460', fontSize: '0.95rem' }}>
                  No weak Learning Outcomes detected! Once question-wise marks are entered, detailed LO analytics will appear here.
                </Typography>
              </Card>
            ) : (
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 2,
                width: '100%',
              }}>
                {loInsights.map((lo, idx) => (
                  <motion.div key={lo.lo_id || idx} custom={idx} initial="hidden" animate="visible" variants={cardVariants} style={{ height: '100%' }}>
                    <Paper sx={{
                      p: 2,
                      borderRadius: 3,
                      border: lo.is_critical ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                      background: lo.is_critical ? 'rgba(254, 242, 242, 0.65)' : '#ffffff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                    }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Chip
                            label={lo.lo_code}
                            size="small"
                            sx={{
                              background: lo.is_critical ? '#ef4444' : '#0f3460',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              height: 22,
                            }}
                          />
                          <Chip
                            label={`Avg: ${lo.avg_pct}%`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              height: 22,
                              background: lo.avg_pct >= 60 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: lo.avg_pct >= 60 ? '#10b981' : '#ef4444',
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', mb: 0.5 }}>
                          {lo.subject_name} — {lo.lo_description}
                        </Typography>
                        <Typography sx={{ color: lo.is_critical ? '#991b1b' : '#64748b', fontSize: '0.74rem', display: 'block', mb: 2 }}>
                          ⚠️ <strong>{lo.weak_students_count} students</strong> require remedial reinforcement in this concept.
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        size="small"
                        variant="contained"
                        startIcon={<PlayCircle sx={{ fontSize: 16 }} />}
                        href="https://diksha.gov.in/explore"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          borderRadius: 2,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          py: 0.75,
                          background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
                        }}
                      >
                        DIKSHA Remedial Video
                      </Button>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* ── TAB 2: Student Risk Roster ── */}
        {currentTab === 2 && (
          <Box sx={{ p: { xs: 2, sm: 2.8 } }}>
            {/* Search & Tier Filters */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search student name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 260px' },
                  maxWidth: { sm: 320 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    height: 36,
                    fontSize: '0.82rem',
                    background: '#f8fafc',
                  },
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#94a3b8', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                {[
                  { key: 'ALL', label: 'All' },
                  { key: 'CRITICAL', label: '🔴 Critical' },
                  { key: 'AVERAGE', label: '🟡 Average' },
                  { key: 'EXCELLENT', label: '🟢 Excellent' },
                  { key: 'ABSENT', label: '⚪ Absent' },
                ].map(f => (
                  <Chip
                    key={f.key}
                    label={f.label}
                    size="small"
                    clickable
                    onClick={() => setTierFilter(f.key)}
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 26,
                      borderRadius: 1.8,
                      background: tierFilter === f.key ? '#0f3460' : '#f1f5f9',
                      color: tierFilter === f.key ? '#ffffff' : '#475569',
                      border: tierFilter === f.key ? '1px solid #0f3460' : '1px solid #e2e8f0',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Student Table */}
            <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ background: '#0f3460' }}>
                  <TableRow>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2, width: 80 }}>Roll #</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>Student Name</TableCell>
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>Score / Max</TableCell>
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>Percentage</TableCell>
                    <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>Risk Status</TableCell>
                    <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>Weak Subjects</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography sx={{ color: '#64748b', fontSize: '0.84rem' }}>No student matches the search/filter criteria.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((st, idx) => {
                      const isCritical = st.tier === 'CRITICAL_ATTENTION';
                      return (
                        <TableRow
                          key={st.student_id}
                          sx={{
                            background: isCritical ? 'rgba(254, 242, 242, 0.75)' : idx % 2 === 0 ? '#ffffff' : 'rgba(248, 250, 252, 0.8)',
                            '&:hover': { background: 'rgba(241, 245, 249, 0.9) !important' },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.82rem' }}>#{st.roll_number}</TableCell>
                          <TableCell sx={{ fontWeight: 700, color: isCritical ? '#991b1b' : '#1e293b', fontSize: '0.84rem' }}>{st.student_name}</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            {st.total_obtained !== null ? `${st.total_obtained} / ${st.total_max}` : '—'}
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 800, color: isCritical ? '#ef4444' : '#0f3460', fontSize: '0.82rem' }}>
                            {st.percentage !== null ? `${st.percentage}%` : '—'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                st.tier === 'CRITICAL_ATTENTION' ? '🔴 Critical Attention' :
                                st.tier === 'NEEDS_PULL' ? '🟠 Needs Improvement' :
                                st.tier === 'AVERAGE' ? '🟡 Average' :
                                st.tier === 'GOOD' ? '🔵 Good' :
                                st.tier === 'EXCELLENT' ? '🟢 Excellent' : '⚪ Absent'
                              }
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.66rem',
                                height: 22,
                                background: isCritical ? '#ef4444' : '#f1f5f9',
                                color: isCritical ? '#ffffff' : '#334155',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {st.failed_subjects?.length > 0 ? (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {st.failed_subjects.map((fs, fIdx) => (
                                  <Chip
                                    key={fIdx}
                                    label={`${fs.subject_name} (${fs.percentage}%)`}
                                    size="small"
                                    sx={{ fontSize: '0.64rem', height: 20, background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', fontWeight: 700 }}
                                  />
                                ))}
                              </Stack>
                            ) : (
                              <Typography sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.74rem' }}>All Subjects Passed</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ── TAB 3: Digital Learning Resources Hub (Full Width 4-4-4 Grid) ── */}
        {currentTab === 3 && (
          <Box sx={{ p: { xs: 2, sm: 2.8 } }}>
            {/* Subject Selector Bar */}
            <Box sx={{ mb: 2.5 }}>
              <Typography sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em', mb: 1.2 }}>
                Select Subject for Curated E-Learning Materials:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                {displaySubjects.map((s, idx) => {
                  const isSelected = String(s.id) === String(selectedSubjectId) || (!selectedSubjectId && (String(s.id) === String(displaySubjects[0]?.id) || idx === 0));
                  const subjectLabel = s.name || s.subject_name || s.code || `Subject ${s.id}`;
                  return (
                    <Chip
                      key={s.id || idx}
                      label={subjectLabel}
                      clickable
                      onClick={() => setSelectedSubjectId(String(s.id))}
                      sx={{
                        px: 1.6,
                        py: 2,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        borderRadius: 2.5,
                        background: isSelected ? 'linear-gradient(135deg, #0f3460, #0284c7)' : '#f8fafc',
                        color: isSelected ? '#ffffff' : '#334155',
                        border: isSelected ? 'none' : '1px solid #cbd5e1',
                        boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: isSelected ? 'linear-gradient(135deg, #0f3460, #0284c7)' : '#f1f5f9',
                          borderColor: isSelected ? 'transparent' : '#94a3b8',
                        }
                      }}
                    />
                  );
                })}
              </Stack>
            </Box>

            {/* 4-4-4 Grid: 3 Equal Width Resource Cards */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2,
              width: '100%',
            }}>
              {currentResources.map((res, idx) => (
                <motion.div key={idx} custom={idx} initial="hidden" animate="visible" variants={cardVariants} style={{ height: '100%' }}>
                  <Card sx={{
                    p: 2.2,
                    height: '100%',
                    width: '100%',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 10px 24px ${alpha(res.color, 0.15)}`,
                      borderColor: res.color,
                    },
                  }}>
                    {/* Top Accent Stripe */}
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: `linear-gradient(90deg, ${res.color}, ${res.gradientTo || res.color})`,
                    }} />

                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.2 }}>
                        <Chip
                          label={res.platform}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.68rem', height: 22, background: `${res.color}15`, color: res.color }}
                        />
                        <Chip label={res.type} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, borderColor: '#cbd5e1' }} />
                      </Box>

                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem', lineHeight: 1.3, mb: 0.6 }}>
                        {res.title}
                      </Typography>

                      <Typography sx={{ color: '#64748b', fontSize: '0.74rem', lineHeight: 1.5, mb: 2, display: 'block' }}>
                        {res.desc}
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      endIcon={<OpenInNew sx={{ fontSize: '14px !important' }} />}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        borderRadius: 2,
                        background: `linear-gradient(135deg, #0f3460, ${res.color})`,
                        fontWeight: 700,
                        fontSize: '0.76rem',
                        textTransform: 'none',
                        py: 0.8,
                        boxShadow: `0 2px 8px ${alpha(res.color, 0.25)}`,
                      }}
                    >
                      Open Digital Resource
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
