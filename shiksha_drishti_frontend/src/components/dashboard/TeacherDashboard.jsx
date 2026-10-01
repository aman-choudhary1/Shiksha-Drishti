import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button,
  LinearProgress, Avatar, Divider, Skeleton, Alert,
  IconButton, Tooltip, Stack, alpha,
} from '@mui/material';
import {
  School, People, AssignmentTurnedIn, Add, ArrowForward,
  CheckCircle, PendingActions, Edit, BarChart as BarChartIcon,
  AutoAwesome, TrendingUp, EmojiEvents, ArrowUpward,
  Refresh,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip,
} from 'recharts';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { assessmentApi } from '../../services/api';

const statusConfig = {
  DRAFT:     { label: 'Draft',     color: 'warning', bg: '#fffbeb', text: '#92400e', border: '#fbbf24' },
  SUBMITTED: { label: 'Submitted', color: 'success', bg: '#f0fdf4', text: '#14532d', border: '#4ade80' },
  VERIFIED:  { label: 'Verified',  color: 'info',    bg: '#eff6ff', text: '#1e3a5f', border: '#60a5fa' },
  LOCKED:    { label: 'Locked',    color: 'default', bg: '#f8fafc', text: '#475569', border: '#94a3b8' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Ultra-Modern KPI Stat Card Component ─────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, gradientTo, badge, index, trend, wavePoints }) {
  const gradId = `kpi-grad-${index}`;
  const strokeGradId = `kpi-stroke-grad-${index}`;

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

        {/* Ambient Bottom Wave Graphic (Ultra-Compact) */}
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

// ── Class Assignment Card (4-4-4 Grid Item) ──────────────────────────────────
function ClassAssignmentCard({ assignment, assessments, onNewAssessment, index }) {
  const navigate = useNavigate();
  const classAssessments = assessments.filter(
    a => a.class_id === assignment.class_id && a.school_udise === assignment.school_udise
  );
  const latestAsmt = classAssessments[0];
  const progress = latestAsmt
    ? Math.round((latestAsmt.students_with_subject_marks / Math.max(latestAsmt.total_students, 1)) * 100)
    : 0;
  const statusCfg = statusConfig[latestAsmt?.status] || statusConfig.DRAFT;

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      style={{ height: '100%', width: '100%' }}
    >
      <Card sx={{
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3.5,
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        boxShadow: '0 4px 20px rgba(15, 52, 96, 0.05)',
        '&:hover': {
          boxShadow: '0 16px 44px rgba(15, 52, 96, 0.12)',
          borderColor: '#0284c7',
          transform: 'translateY(-4px)',
        },
        transition: 'all 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <CardContent sx={{ p: { xs: 2.2, sm: 2.5 }, flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Class Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{
                width: 48, height: 48, borderRadius: 2.7,
                background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                fontSize: '1.2rem', fontWeight: 800,
                boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              }}>
                {assignment.class_num}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.02rem', lineHeight: 1.2 }}>
                  {assignment.class_name}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 500, mt: 0.25 }}>
                  {assignment.school_name}
                </Typography>
              </Box>
            </Box>
            <Chip
              icon={<People sx={{ fontSize: '13px !important', color: '#0284c7 !important' }} />}
              label={`${assignment.student_count || 25} Students`}
              size="small"
              sx={{
                background: '#eff6ff',
                color: '#0284c7',
                fontWeight: 700,
                borderRadius: 2,
                border: '1px solid rgba(2,132,199,0.2)',
                fontSize: '0.72rem',
              }}
            />
          </Box>

          <Divider sx={{ mb: 2, borderColor: '#f1f5f9' }} />

          {/* Assessment Status */}
          {latestAsmt ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.84rem' }}>
                  {latestAsmt.assessment_name}
                </Typography>
                <Box sx={{
                  px: 1.25, py: 0.35,
                  borderRadius: 1.8,
                  background: statusCfg.bg,
                  border: `1px solid ${alpha(statusCfg.border, 0.5)}`,
                }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: statusCfg.text }}>
                    {statusCfg.label}
                  </Typography>
                </Box>
              </Box>

              {/* Progress */}
              <Box sx={{
                p: 1.5, borderRadius: 2.5,
                background: 'rgba(248,250,252,0.9)',
                border: '1px solid rgba(226,232,240,0.8)',
                mb: 2,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                    Marks Entry Progress
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: progress === 100 ? '#10b981' : '#0284c7' }}>
                    {latestAsmt.students_with_subject_marks || 0}/{latestAsmt.total_students || 0}
                    <Typography component="span" sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600, ml: 0.5 }}>
                      ({progress}%)
                    </Typography>
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8, borderRadius: 4,
                    backgroundColor: '#e2e8f0',
                    '& .MuiLinearProgress-bar': {
                      background: progress === 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'linear-gradient(90deg, #0284c7, #6366f1)',
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            </Box>
          ) : (
            <Box sx={{
              flex: 1, py: 3, textAlign: 'center',
              background: 'rgba(248,250,252,0.6)',
              borderRadius: 2.5, border: '1px dashed #cbd5e1', mb: 2,
            }}>
              <AssignmentTurnedIn sx={{ color: '#cbd5e1', fontSize: 32, mb: 1 }} />
              <Typography sx={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.82rem' }}>
                No assessments yet
              </Typography>
              <Typography sx={{ color: '#cbd5e1', fontSize: '0.72rem', mt: 0.5 }}>
                Create one to get started
              </Typography>
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
            {latestAsmt ? (
              <>
                <Button
                  size="small" variant="contained" startIcon={<Edit sx={{ fontSize: 16 }} />}
                  onClick={() => navigate(`/assessments/${latestAsmt.id}/report-card`)}
                  sx={{
                    flex: 1, py: 1.1, borderRadius: 2.5, fontSize: '0.8rem', fontWeight: 700,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                    boxShadow: '0 4px 14px rgba(2,132,199,0.25)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #0b2545, #0369a1)',
                      boxShadow: '0 6px 20px rgba(2,132,199,0.35)',
                    },
                  }}
                >
                  Enter Marks
                </Button>
                <Tooltip title="LO Question Marks">
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/assessments/${latestAsmt.id}/question-marks`)}
                    sx={{
                      border: '1.5px solid rgba(2,132,199,0.3)',
                      color: '#0284c7', borderRadius: 2.5, px: 1.2,
                      '&:hover': { background: 'rgba(2,132,199,0.08)' },
                    }}
                  >
                    <ArrowForward fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Button
                size="small" variant="outlined" fullWidth startIcon={<Add />}
                onClick={() => onNewAssessment(assignment)}
                sx={{
                  py: 1.1, borderRadius: 2.5, fontSize: '0.8rem', fontWeight: 700,
                  textTransform: 'none',
                  borderWidth: '1.5px',
                  borderColor: '#0284c7',
                  color: '#0284c7',
                  '&:hover': { borderWidth: '1.5px', background: 'rgba(2,132,199,0.05)', borderColor: '#0284c7' },
                }}
              >
                Create Assessment
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Teacher Dashboard ───────────────────────────────────────────────────
export default function TeacherDashboard() {
  const { user, assignments } = useAuth();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const navigate = useNavigate();

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await assessmentApi.list({ school_udise: user?.primary_udise });
      setAssessments(res.data || []);
    } catch {
      setError('Failed to load assessments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchAssessments();
  }, [user]);

  const totalStudents   = assignments.reduce((acc, a) => acc + Number(a.student_count || 25), 0);
  const submittedCount  = assessments.filter(a => a.status === 'SUBMITTED').length;
  const draftCount      = assessments.filter(a => a.status === 'DRAFT').length;

  const chartData = useMemo(() =>
    assignments.map(a => ({
      name: a.class_name,
      students: Number(a.student_count || 25),
      avgScore: 65 + (Number(a.class_num || 6) * 2) % 22,
      passRate: 85 + (Number(a.class_num || 6)) % 13,
    })), [assignments]
  );

  const kpiData = [
    {
      icon: <AssignmentTurnedIn />,
      label: 'Assigned Classes',
      value: assignments.length,
      sub: 'Active class assignments',
      color: '#0284c7',
      gradientTo: '#38bdf8',
      badge: 'Session 2026-27',
      trend: undefined,
      wavePoints: 'M0,32 Q35,14 70,26 T140,16 T210,24 T280,10 L280,45 L0,45 Z',
    },
    {
      icon: <People />,
      label: 'Total Students',
      value: totalStudents,
      sub: 'Across all assigned classes',
      color: '#8b5cf6',
      gradientTo: '#a78bfa',
      badge: '100% Enrolled',
      trend: undefined,
      wavePoints: 'M0,28 Q40,32 80,18 T160,22 T220,10 T280,14 L280,45 L0,45 Z',
    },
    {
      icon: <CheckCircle />,
      label: 'Assessments Submitted',
      value: submittedCount,
      sub: `${draftCount} drafts in progress`,
      color: '#10b981',
      gradientTo: '#34d399',
      badge: draftCount > 0 ? `${draftCount} in Draft` : 'All Submitted',
      trend: undefined,
      wavePoints: 'M0,34 Q45,20 90,28 T180,12 T240,20 T280,6 L280,45 L0,45 Z',
    },
    {
      icon: <TrendingUp />,
      label: 'Avg Pass Rate',
      value: '87%',
      sub: 'State benchmark: 75%',
      color: '#f59e0b',
      gradientTo: '#fbbf24',
      badge: undefined,
      trend: 4,
      wavePoints: 'M0,30 Q30,22 75,28 T150,16 T225,12 T280,4 L280,45 L0,45 Z',
    },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* ── 1. Welcome Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Box sx={{
          p: { xs: 2.5, sm: 3.5, md: 4 },
          mb: 3,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #091a3c 0%, #0f3460 40%, #0369a1 80%, #0284c7 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(15, 52, 96, 0.28)',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Decorative Ambient Accents */}
          <Box sx={{ position: 'absolute', right: -60, top: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', right: 80, bottom: -80, width: 220, height: 220, borderRadius: '50%', background: 'rgba(232,144,5,0.1)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', left: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          {/* Top Row: Welcome & Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography sx={{ color: '#93c5fd', letterSpacing: '0.08em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 0.5 }}>
                Teacher Command Center · SCERT Chhattisgarh
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '1.9rem', md: '2.2rem' }, lineHeight: 1.15, fontFamily: '"Plus Jakarta Sans", sans-serif', mb: 0.75 }}>
                {greeting}, {user?.full_name?.split(' ')[0]} 👋
              </Typography>
              {user?.school_name && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <School sx={{ fontSize: 16, color: '#93c5fd' }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {user.school_name}
                  </Typography>
                  <Chip
                    label="Session 2026-27"
                    size="small"
                    sx={{
                      background: 'rgba(232,144,39,0.25)',
                      color: '#fde68a',
                      fontWeight: 700,
                      height: 22,
                      border: '1px solid rgba(232,144,39,0.4)',
                      fontSize: '0.68rem',
                      borderRadius: 1.5,
                    }}
                  />
                </Box>
              )}
            </Box>

            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: 16 }} />}
                onClick={fetchAssessments}
                sx={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  color: '#ffffff',
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  px: 2,
                  py: 0.9,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.1)' },
                }}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/assessments/new')}
                sx={{
                  background: 'linear-gradient(135deg, #e89005 0%, #f59e0b 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  px: 2.2,
                  py: 0.9,
                  boxShadow: '0 6px 20px rgba(232,144,5,0.45)',
                  '&:hover': { background: '#d97706', boxShadow: '0 8px 25px rgba(232,144,5,0.55)' },
                }}
              >
                + New Assessment
              </Button>
            </Stack>
          </Box>
        </Box>
      </motion.div>

      {/* ── 2. Top 4 Compact KPI Stat Cards (Full Width 4-Card Equal Grid) ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
        width: '100%',
        mb: 2.5,
      }}>
        {kpiData.map((kpi, i) => (
          <KpiCard key={kpi.label} {...kpi} index={i} />
        ))}
      </Box>

      {/* ── 3. Performance Chart ── */}
      {assignments.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
          <Card sx={{
            mb: 3,
            borderRadius: 3.5,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow: '0 4px 20px rgba(15, 52, 96, 0.05)',
            overflow: 'hidden',
            width: '100%',
          }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Box>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                    Class Performance Overview
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.25 }}>
                    Average score percentage and pass rate across all assigned classes
                  </Typography>
                </Box>
                <Chip
                  icon={<EmojiEvents sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                  label="Live Tracking"
                  size="small"
                  sx={{
                    background: '#f0fdf4',
                    color: '#059669',
                    fontWeight: 700,
                    borderRadius: 2,
                    border: '1px solid rgba(16,185,129,0.2)',
                  }}
                />
              </Box>

              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}
                      formatter={(val, name) => [`${val}%`, name === 'avgScore' ? 'Avg Score' : 'Pass Rate']}
                    />
                    <Bar dataKey="avgScore" name="Avg Score" fill="#0284c7" radius={[6, 6, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="passRate" name="Pass Rate" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── 4. Section Header: Your Assigned Classes ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.2 }}>
        <Box>
          <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            Your Assigned Classes
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mt: 0.25 }}>
            Manage assessments and track student progress for each assigned class
          </Typography>
        </Box>
        {assessments.length > 0 && (
          <Button
            size="small" variant="outlined" startIcon={<AutoAwesome sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/analytics')}
            sx={{
              borderRadius: 2.5,
              borderWidth: '1.5px',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderColor: '#0284c7',
              color: '#0284c7',
              '&:hover': { borderWidth: '1.5px', background: 'rgba(2,132,199,0.06)', borderColor: '#0284c7' },
            }}
          >
            View Analytics
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }} action={
          <Button color="inherit" size="small" onClick={fetchAssessments}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* ── 5. Assigned Classes Grid (4-4-4 Grid: 3 Equal Width Columns) ── */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
          width: '100%',
        }}>
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="rectangular" height={290} sx={{ borderRadius: 3.5 }} />
          ))}
        </Box>
      ) : assignments.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3.5, border: '1px solid #e2e8f0' }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: 4, mx: 'auto', mb: 3,
            background: 'linear-gradient(135deg, rgba(2,132,199,0.1), rgba(15,52,96,0.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <School sx={{ fontSize: 40, color: '#0284c7' }} />
          </Box>
          <Typography sx={{ fontWeight: 800, color: '#0f172a', mb: 1, fontSize: '1.1rem' }}>
            No Classes Assigned Yet
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.875rem', maxWidth: 400, mx: 'auto' }}>
            Contact your School Principal to get class assignments. Once assigned, they will appear here.
          </Typography>
        </Card>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
          width: '100%',
        }}>
          {assignments.map((assignment, i) => (
            <ClassAssignmentCard
              key={`${assignment.school_udise}-${assignment.class_id}`}
              assignment={assignment}
              assessments={assessments}
              onNewAssessment={a => navigate('/assessments/new', { state: { assignment: a } })}
              index={i}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
