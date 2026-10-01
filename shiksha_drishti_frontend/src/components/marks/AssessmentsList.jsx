import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Card, CardContent, Button,
  Chip, LinearProgress, TextField, InputAdornment, Skeleton,
  Alert, Stack, Avatar, alpha,
} from '@mui/material';
import {
  Add, Search, AssignmentTurnedIn, Edit, FactCheck,
  CheckCircle, PendingActions, School,
  Refresh, FilterList, ArrowForward,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { assessmentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import educationSvg from '../../assets/Education-bro.svg';

const statusConfig = {
  DRAFT: {
    label: 'Draft',
    color: '#f59e0b',
    bg: '#fffbeb',
    text: '#b45309',
    border: '#fde68a',
    icon: <PendingActions sx={{ fontSize: 13 }} />,
  },
  SUBMITTED: {
    label: 'Submitted',
    color: '#10b981',
    bg: '#f0fdf4',
    text: '#047857',
    border: '#a7f3d0',
    icon: <CheckCircle sx={{ fontSize: 13 }} />,
  },
  VERIFIED: {
    label: 'Verified',
    color: '#0284c7',
    bg: '#f0f9ff',
    text: '#0369a1',
    border: '#bae6fd',
    icon: <CheckCircle sx={{ fontSize: 13 }} />,
  },
  LOCKED: {
    label: 'Locked',
    color: '#64748b',
    bg: '#f8fafc',
    text: '#475569',
    border: '#cbd5e1',
    icon: <CheckCircle sx={{ fontSize: 13 }} />,
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function AssessmentsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

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

  const filtered = assessments.filter(a => {
    const q = searchTerm.toLowerCase();
    const matchesQuery = (a.assessment_name || '').toLowerCase().includes(q) ||
      (a.class_name || '').toLowerCase().includes(q) ||
      (a.subject_name || '').toLowerCase().includes(q);
    if (!matchesQuery) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    return true;
  });

  const draftCount = assessments.filter(a => a.status === 'DRAFT').length;
  const submittedCount = assessments.filter(a => a.status === 'SUBMITTED').length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ── Page Header ── */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 2,
        mb: 2.5,
      }}>
        <Box>
          <Typography sx={{
            fontWeight: 800,
            color: '#0f172a',
            fontSize: { xs: '1.4rem', sm: '1.75rem' },
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            lineHeight: 1.2,
          }}>
            Assessments
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.25 }}>
            Manage classroom assessments, enter student marks, and view Learning Outcomes progress
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 16 }} />}
            onClick={fetchAssessments}
            sx={{
              borderRadius: 2.5,
              borderColor: '#cbd5e1',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              py: 0.8,
              '&:hover': { borderColor: '#94a3b8', background: 'rgba(241, 245, 249, 0.8)' },
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/assessments/new')}
            sx={{
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2.2,
              py: 0.8,
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
              '&:hover': { background: 'linear-gradient(135deg, #0b2545 0%, #0369a1 100%)', boxShadow: '0 6px 20px rgba(2, 132, 199, 0.4)' },
            }}
          >
            + New Assessment
          </Button>
        </Stack>
      </Box>

      {/* ── Compact Filter and Search Bar ── */}
      <Paper sx={{
        px: { xs: 1.5, sm: 2 },
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
        <TextField
          size="small"
          placeholder="Search assessment name, class, subject..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 300px' },
            maxWidth: { sm: 380 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.2,
              height: 38,
              fontSize: '0.82rem',
              background: '#f8fafc',
              '& fieldset': { borderColor: '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#0284c7' },
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

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8', mr: 0.5 }}>
            <FilterList sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Status:
            </Typography>
          </Box>
          {[
            { key: 'ALL', label: 'All', count: assessments.length },
            { key: 'DRAFT', label: 'Drafts', count: draftCount },
            { key: 'SUBMITTED', label: 'Submitted', count: submittedCount },
          ].map((status) => {
            const isActive = filterStatus === status.key;
            return (
              <Chip
                key={status.key}
                label={`${status.label} (${status.count})`}
                clickable
                onClick={() => setFilterStatus(status.key)}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  height: 28,
                  borderRadius: 2,
                  background: isActive ? '#0f3460' : 'rgba(241, 245, 249, 0.9)',
                  color: isActive ? '#ffffff' : '#475569',
                  border: isActive ? '1px solid #0f3460' : '1px solid #e2e8f0',
                  '&:hover': {
                    background: isActive ? '#0f3460' : '#e2e8f0',
                  },
                }}
              />
            );
          })}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }} action={
          <Button color="inherit" size="small" onClick={fetchAssessments}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* ── 4-4-4 Grid of Compact Assessment Cards ── */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%',
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} variant="rectangular" height={195} sx={{ borderRadius: 3.5 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3.5, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
          <Box
            component="img"
            src={educationSvg}
            alt="No assessments"
            sx={{ maxHeight: 130, mb: 2, opacity: 0.8 }}
          />
          <Typography sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5, fontSize: '1.05rem' }}>
            No Assessments Found
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mb: 2.5, maxWidth: 360, mx: 'auto' }}>
            {searchTerm || filterStatus !== 'ALL'
              ? 'Try changing your search keywords or status filter.'
              : 'Create a new assessment to start entering marks for your students.'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/assessments/new')}
            sx={{
              borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0f3460, #0284c7)',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2.5,
            }}
          >
            Create Assessment
          </Button>
        </Paper>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%',
        }}>
          {filtered.map((asmt, i) => {
            const progress = Math.round(
              (asmt.students_with_subject_marks / Math.max(asmt.total_students, 1)) * 100
            );
            const statusCfg = statusConfig[asmt.status] || statusConfig.DRAFT;
            const classNum = asmt.class_name?.match(/\d+/)?.[0] || 'C';

            return (
              <motion.div
                key={asmt.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                style={{ height: '100%', width: '100%' }}
              >
                <Card sx={{
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
                  height: '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  background: '#ffffff',
                  '&:hover': {
                    borderColor: '#0284c7',
                    boxShadow: '0 10px 28px rgba(15, 52, 96, 0.1)',
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                }}>
                  {/* Top Status Accent Stripe */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: statusCfg.color,
                  }} />

                  <CardContent sx={{ p: { xs: 1.8, sm: 2 }, flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {/* Header: Class Avatar + Title + Status Pill */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                        <Avatar sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2.2,
                          background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: '0 3px 10px rgba(2, 132, 199, 0.25)',
                        }}>
                          {classNum}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{
                            fontWeight: 800,
                            color: '#0f172a',
                            fontSize: '0.92rem',
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {asmt.assessment_name}
                          </Typography>
                          <Typography sx={{
                            color: '#64748b',
                            fontSize: '0.72rem',
                            fontWeight: 500,
                            mt: 0.2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}>
                            <School sx={{ fontSize: 13, color: '#0284c7' }} />
                            {asmt.class_name} {asmt.year_label ? `· ${asmt.year_label}` : ''}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status Chip */}
                      <Box sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1.5,
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4,
                        flexShrink: 0,
                      }}>
                        {statusCfg.icon}
                        <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: statusCfg.text }}>
                          {statusCfg.label}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Progress Bar Container */}
                    <Box sx={{
                      p: 1.2,
                      borderRadius: 2,
                      background: 'rgba(248, 250, 252, 0.9)',
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      mb: 1.5,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.6 }}>
                        <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
                          Marks Entry Progress
                        </Typography>
                        <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, color: progress === 100 ? '#10b981' : '#0284c7' }}>
                          {asmt.students_with_subject_marks || 0}/{asmt.total_students || 0}
                          <Typography component="span" sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, ml: 0.5 }}>
                            ({progress}%)
                          </Typography>
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            background: progress === 100
                              ? 'linear-gradient(90deg, #10b981, #059669)'
                              : 'linear-gradient(90deg, #0284c7, #2563eb)',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    {/* Compact Action Buttons */}
                    <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Edit sx={{ fontSize: 14 }} />}
                        onClick={() => navigate(`/assessments/${asmt.id}/report-card`)}
                        sx={{
                          flex: 1,
                          py: 0.75,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          boxShadow: '0 2px 8px rgba(2, 132, 199, 0.2)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #0b2545, #0369a1)',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                          },
                        }}
                      >
                        Report Card
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<FactCheck sx={{ fontSize: 14 }} />}
                        onClick={() => navigate(`/assessments/${asmt.id}/question-marks`)}
                        sx={{
                          flex: 1,
                          py: 0.75,
                          borderRadius: 2,
                          borderColor: '#0284c7',
                          color: '#0284c7',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          textTransform: 'none',
                          borderWidth: '1.2px',
                          '&:hover': {
                            borderWidth: '1.2px',
                            background: 'rgba(2, 132, 199, 0.06)',
                            borderColor: '#0284c7',
                          },
                        }}
                      >
                        LO Marks
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
