import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, Chip, Alert, CircularProgress,
  Tooltip, IconButton, Skeleton, Divider, Stack, InputAdornment,
  Grid, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, Checkbox,
} from '@mui/material';
import {
  Save as SaveIcon, Send as SendIcon, CheckCircle,
  ArrowBack, Refresh, Search, FactCheck,
  Calculate, Person, EventBusy, GroupAdd,
} from '@mui/icons-material';

import { motion } from 'framer-motion';
import { assessmentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Controlled cell for marks input with instant validation, 'AB' support, and keyboard navigation
function CompactMarksCell({ value, isAbsent, maxMarks, onChange, onToggleAbsent, disabled }) {
  const [localVal, setLocalVal] = useState(isAbsent ? 'AB' : (value ?? ''));
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isAbsent) {
      setLocalVal('AB');
      setError(false);
    } else {
      setLocalVal(value ?? '');
      const num = parseFloat(value);
      if (value !== '' && value !== null && !isNaN(num) && (num < 0 || num > maxMarks)) {
        setError(true);
      } else {
        setError(false);
      }
    }
  }, [value, isAbsent, maxMarks]);

  const handleChange = (e) => {
    const raw = e.target.value.trim().toUpperCase();
    setLocalVal(raw);

    if (raw === 'AB' || raw === 'A') {
      setError(false);
      onToggleAbsent(true);
      onChange(null);
      return;
    }

    if (isAbsent) {
      onToggleAbsent(false);
    }

    if (raw === '' || raw === null) {
      setError(false);
      onChange(null);
      return;
    }

    const num = parseFloat(raw);
    if (isNaN(num) || num < 0 || num > maxMarks) {
      setError(true);
      return;
    }
    setError(false);
    onChange(num);
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      {isAbsent ? (
        <Tooltip title="Absent — click to mark as present">
          <Chip
            label="AB"
            size="small"
            clickable={!disabled}
            onClick={() => !disabled && onToggleAbsent(false)}
            sx={{
              height: 26,
              width: 44,
              fontWeight: 800,
              fontSize: '0.72rem',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              cursor: disabled ? 'default' : 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.22)',
              },
            }}
          />
        </Tooltip>
      ) : (
        <TextField
          value={localVal}
          onChange={handleChange}
          variant="outlined"
          size="small"
          disabled={disabled}
          error={error}
          placeholder="—"
          inputProps={{
            min: 0,
            max: maxMarks,
            step: 0.5,
            style: {
              textAlign: 'center',
              padding: '4px 2px',
              width: 46,
              height: 20,
              fontWeight: 700,
              fontSize: '0.84rem',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              backgroundColor: localVal !== '' && !error ? 'rgba(2, 132, 199, 0.04)' : '#ffffff',
              '& fieldset': { borderColor: error ? '#ef4444' : 'rgba(203, 213, 225, 0.9)' },
              '&:hover fieldset': { borderColor: error ? '#ef4444' : '#0284c7' },
              '&.Mui-focused fieldset': { borderColor: error ? '#ef4444' : '#0f3460', borderWidth: 2 },
            },
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              const form = e.target.form || document.querySelector('form') || document.body;
              const inputs = Array.from(form.querySelectorAll('input:not(:disabled)'));
              const idx = inputs.indexOf(e.target);
              if (idx !== -1 && inputs[idx + 1]) {
                e.preventDefault();
                inputs[idx + 1].focus();
                inputs[idx + 1].select();
              }
            }
          }}
        />
      )}
    </Box>
  );
}

export default function ClassReportCard() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assessment, setAssessment] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [marks, setMarks] = useState({}); // { `${studentId}-${subjectId}`: marksObtained }
  const [absentMap, setAbsentMap] = useState({}); // { `${studentId}-${subjectId}`: boolean }
  const [studentAbsentAll, setStudentAbsentAll] = useState({}); // { studentId: boolean }

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, COMPLETE, PENDING, ABSENT
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchSelectedIds, setBatchSelectedIds] = useState(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [asmtRes, marksRes] = await Promise.all([
        assessmentApi.get(assessmentId),
        assessmentApi.getSubjectMarks(assessmentId),
      ]);
      setAssessment(asmtRes.data);
      setSubjects(marksRes.data.subjects || []);
      setReportCard(marksRes.data.report_card || []);

      const marksM = {};
      const abM = {};
      const studAbAll = {};

      for (const student of marksRes.data.report_card || []) {
        let allSubjAbsent = true;
        let hasAnyMark = false;

        for (const sm of student.subject_marks || []) {
          marksM[`${student.student_id}-${sm.subject_id}`] = sm.marks_obtained;
          abM[`${student.student_id}-${sm.subject_id}`] = sm.is_absent || false;
          if (!sm.is_absent) allSubjAbsent = false;
          if (sm.marks_obtained !== null || sm.is_absent) hasAnyMark = true;
        }

        studAbAll[student.student_id] = hasAnyMark && allSubjAbsent;
      }

      setMarks(marksM);
      setAbsentMap(abM);
      setStudentAbsentAll(studAbAll);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateMark = useCallback((studentId, subjectId, value) => {
    setMarks(prev => ({ ...prev, [`${studentId}-${subjectId}`]: value }));
    setAbsentMap(prev => ({ ...prev, [`${studentId}-${subjectId}`]: false }));
    setSaveSuccess(false);
  }, []);

  const toggleSubjectAbsent = useCallback((studentId, subjectId, isAbs) => {
    setAbsentMap(prev => ({ ...prev, [`${studentId}-${subjectId}`]: isAbs }));
    if (isAbs) {
      setMarks(prev => ({ ...prev, [`${studentId}-${subjectId}`]: null }));
    }
    setSaveSuccess(false);
  }, []);

  // Quick toggle to mark student absent for ALL subjects
  const toggleStudentEntirelyAbsent = useCallback((studentId, makeAbsent) => {
    setStudentAbsentAll(prev => ({ ...prev, [studentId]: makeAbsent }));
    setAbsentMap(prev => {
      const updated = { ...prev };
      for (const subj of subjects) {
        updated[`${studentId}-${subj.subject_id}`] = makeAbsent;
      }
      return updated;
    });
    if (makeAbsent) {
      setMarks(prev => {
        const updated = { ...prev };
        for (const subj of subjects) {
          updated[`${studentId}-${subj.subject_id}`] = null;
        }
        return updated;
      });
    }
    setSaveSuccess(false);
  }, [subjects]);

  // Batch toggle for selected students
  const handleApplyBatchAbsent = (makeAbsent) => {
    if (batchSelectedIds.size === 0) return;
    for (const stId of batchSelectedIds) {
      toggleStudentEntirelyAbsent(stId, makeAbsent);
    }
    setBatchDialogOpen(false);
    setBatchSelectedIds(new Set());
  };

  const handleToggleBatchSelection = (studentId) => {
    setBatchSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  // Calculate totals per student
  const calcStudentTotals = useCallback((studentId) => {
    let obtained = 0;
    let max = 0;
    let filledCount = 0;
    let absentCount = 0;

    for (const subj of subjects) {
      max += subj.max_marks;
      const isAbs = absentMap[`${studentId}-${subj.subject_id}`];
      const m = marks[`${studentId}-${subj.subject_id}`];

      if (isAbs) {
        absentCount++;
        filledCount++;
      } else if (m !== undefined && m !== null && m !== '') {
        obtained += Number(m);
        filledCount++;
      }
    }

    const isAllAbsent = subjects.length > 0 && absentCount === subjects.length;
    const isComplete = subjects.length > 0 && filledCount === subjects.length;
    const presentMax = max - (absentCount * (subjects[0]?.max_marks || 100));
    const percentage = presentMax > 0 && filledCount > absentCount
      ? ((obtained / presentMax) * 100).toFixed(1)
      : (isAllAbsent ? null : null);

    return {
      obtained: (filledCount > absentCount) ? obtained : (isAllAbsent ? null : null),
      max,
      presentMax,
      percentage,
      isComplete,
      isAllAbsent,
      absentCount,
    };
  }, [subjects, marks, absentMap]);

  // Summary statistics across entire class
  const classStats = useMemo(() => {
    if (!reportCard?.length || !subjects?.length) {
      return { total: 0, completed: 0, absent: 0, avgPercentage: 0, highest: 0, lowest: 0 };
    }
    let totalPct = 0;
    let validCount = 0;
    let completedCount = 0;
    let absentStudentsCount = 0;
    let highest = -1;
    let lowest = 101;

    for (const st of reportCard) {
      const { percentage, isComplete, isAllAbsent } = calcStudentTotals(st.student_id);
      if (isAllAbsent) absentStudentsCount++;
      if (isComplete) completedCount++;
      if (percentage !== null) {
        const num = parseFloat(percentage);
        totalPct += num;
        validCount++;
        if (num > highest) highest = num;
        if (num < lowest) lowest = num;
      }
    }
    return {
      total: reportCard.length,
      completed: completedCount,
      absent: absentStudentsCount,
      avgPercentage: validCount > 0 ? (totalPct / validCount).toFixed(1) : 0,
      highest: highest >= 0 ? highest : '—',
      lowest: lowest <= 100 ? lowest : '—',
    };
  }, [reportCard, subjects, calcStudentTotals]);

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!reportCard) return [];
    return reportCard.filter(s => {
      const matchQuery = s.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.roll_number).includes(searchTerm);
      if (!matchQuery) return false;

      const totals = calcStudentTotals(s.student_id);
      if (statusFilter === 'COMPLETE') return totals.isComplete && !totals.isAllAbsent;
      if (statusFilter === 'ABSENT') return totals.isAllAbsent || totals.absentCount > 0;
      if (statusFilter === 'PENDING') return !totals.isComplete;
      return true;
    });
  }, [reportCard, searchTerm, statusFilter, calcStudentTotals]);

  // Helper for Grade Badge
  const getGradeInfo = (pct, isAllAbsent) => {
    if (isAllAbsent) return { label: 'Absent (AB)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
    if (pct === null) return null;
    const p = parseFloat(pct);
    if (p >= 80) return { label: 'A+ (Distinction)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    if (p >= 65) return { label: 'A (First Class)', color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' };
    if (p >= 50) return { label: 'B (Second Class)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    if (p >= 33) return { label: 'C (Third Class)', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' };
    return { label: 'D (Remedial)', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' };
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    const marksPayload = [];
    for (const student of reportCard || []) {
      for (const subj of subjects) {
        const isAbs = absentMap[`${student.student_id}-${subj.subject_id}`] || false;
        const val = marks[`${student.student_id}-${subj.subject_id}`];

        if (isAbs || (val !== undefined && val !== null && val !== '')) {
          marksPayload.push({
            student_id: student.student_id,
            subject_id: subj.subject_id,
            marks_obtained: isAbs ? null : Number(val),
            is_absent: isAbs,
          });
        }
      }
    }

    try {
      await assessmentApi.bulkSaveSubjectMarks(assessmentId, { marks: marksPayload });
      setSaveSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit this assessment for state-level review? This action cannot be undone.')) return;
    setSubmitting(true);
    setError('');
    try {
      await handleSave();
      await assessmentApi.submit(assessmentId);
      setAssessment(a => ({ ...a, status: 'SUBMITTED' }));
      setSaveSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = assessment?.status === 'SUBMITTED' || assessment?.status === 'LOCKED';

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="rectangular" height={90} sx={{ borderRadius: '4px' }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '4px' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Compact Top Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Paper sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 60%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: '4px',
          boxShadow: '0 4px 20px rgba(15, 52, 96, 0.2)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                size="small"
                onClick={() => navigate('/dashboard')}
                sx={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.2rem', sm: '1.45rem' },
                  lineHeight: 1.2,
                }}>
                  {assessment?.class_name} — {assessment?.assessment_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 600 }}>
                  🏫 {assessment?.school_name} · Session {assessment?.year_label} · Marks Entry Sheet
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={isLocked ? 'Submitted' : 'Draft'}
                size="small"
                sx={{
                  background: isLocked ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                  color: isLocked ? '#34d399' : '#fcd34d',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  borderRadius: '4px',
                }}
              />

              <Button
                variant="outlined"
                size="small"
                startIcon={<FactCheck sx={{ fontSize: 16 }} />}
                onClick={() => navigate(`/assessments/${assessmentId}/question-marks`)}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  py: 0.5,
                  '&:hover': { borderColor: '#ffffff', background: 'rgba(255, 255, 255, 0.1)' },
                }}
              >
                LO Question-wise Mode →
              </Button>
            </Stack>
          </Box>
        </Paper>
      </motion.div>

      {/* Class Metric Highlights Strip */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { label: 'Total Students', value: classStats.total, color: '#0f3460', icon: <Person sx={{ fontSize: 18 }} /> },
          { label: 'Entry Complete', value: `${classStats.completed}/${classStats.total}`, color: '#10b981', icon: <CheckCircle sx={{ fontSize: 18 }} /> },
          { label: 'Absent (AB)', value: classStats.absent, color: '#ef4444', icon: <EventBusy sx={{ fontSize: 18 }} /> },
          { label: 'Class Avg %', value: `${classStats.avgPercentage}%`, color: '#0284c7', icon: <Calculate sx={{ fontSize: 18 }} /> },
        ].map((item, idx) => (
          <Grid item xs={6} sm={3} key={idx}>
            <Card sx={{
              borderRadius: '4px',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)',
            }}>
              <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ color: item.color }}>{item.icon}</Box>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>
                    {item.label}
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: item.color, lineHeight: 1.2, mt: 0.25 }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '4px' }} onClose={() => setError('')}>{error}</Alert>}
      {saveSuccess && <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2, borderRadius: '4px' }}>Marks saved successfully!</Alert>}
      {isLocked && <Alert severity="info" sx={{ mb: 2, borderRadius: '4px' }}>This assessment has been submitted and is now locked for editing.</Alert>}

      {/* Compact Search & Filter Toolbar */}
      <Paper sx={{
        p: 1.5,
        mb: 2,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.9)',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by student name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: 240,
              '& .MuiOutlinedInput-root': { height: 34, borderRadius: '4px' },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#64748b', fontSize: 18 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          {!isLocked && (
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<GroupAdd sx={{ fontSize: 16 }} />}
              onClick={() => {
                setBatchSelectedIds(new Set());
                setBatchDialogOpen(true);
              }}
              sx={{
                borderRadius: '4px',
                height: 34,
                fontWeight: 700,
                fontSize: '0.75rem',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'rgba(239, 68, 68, 0.04)',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#ef4444',
                },
              }}
            >
              ⚡ Batch Mark Absent
            </Button>
          )}
        </Box>

        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.72rem' }}>
            Filter:
          </Typography>
          {[
            { key: 'ALL', label: `All (${reportCard?.length || 0})` },
            { key: 'COMPLETE', label: `Complete (${classStats.completed})` },
            { key: 'ABSENT', label: `Absent (${classStats.absent})` },
            { key: 'PENDING', label: `Pending (${(reportCard?.length || 0) - classStats.completed})` },
          ].map(f => (
            <Chip
              key={f.key}
              label={f.label}
              size="small"
              clickable
              onClick={() => setStatusFilter(f.key)}
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 24,
                borderRadius: '4px',
                background: statusFilter === f.key ? '#0f3460' : 'rgba(241, 245, 249, 0.9)',
                color: statusFilter === f.key ? '#ffffff' : '#475569',
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* High-Density Marks Table */}
      <Paper sx={{
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(15, 23, 42, 0.04)',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        background: '#ffffff',
      }}>
        <Box component="form">
          <TableContainer sx={{ maxHeight: '62vh', overflow: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{
                    minWidth: 55,
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    background: '#0f3460 !important',
                    color: '#ffffff',
                    fontWeight: 800,
                    py: 1,
                    fontSize: '0.75rem',
                  }}>
                    Roll No.
                  </TableCell>
                  <TableCell sx={{
                    minWidth: 150,
                    position: 'sticky',
                    left: 55,
                    zIndex: 4,
                    background: '#0f3460 !important',
                    color: '#ffffff',
                    fontWeight: 800,
                    py: 1,
                    fontSize: '0.75rem',
                  }}>
                    Student Name
                  </TableCell>
                  <TableCell align="center" sx={{
                    minWidth: 70,
                    background: '#0f3460 !important',
                    color: '#ffffff',
                    fontWeight: 800,
                    py: 1,
                    fontSize: '0.75rem',
                  }}>
                    Attendance
                  </TableCell>
                  {subjects.map(subj => (
                    <TableCell key={subj.subject_id} align="center" sx={{
                      minWidth: 80,
                      background: '#0f3460 !important',
                      py: 0.75,
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.75rem', lineHeight: 1.1 }}>
                        {subj.subject_name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 700, fontSize: '0.62rem' }}>
                        /{subj.max_marks}
                      </Typography>
                    </TableCell>
                  ))}
                  <TableCell align="center" sx={{ minWidth: 85, background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, py: 1, fontSize: '0.75rem' }}>
                    Total
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 110, background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, py: 1, fontSize: '0.75rem' }}>
                    Result
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={subjects.length + 5} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No students match your filter.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, idx) => {
                    const totals = calcStudentTotals(student.student_id);
                    const isAllAbsent = totals.isAllAbsent;
                    const grade = getGradeInfo(totals.percentage, isAllAbsent);
                    const isEven = idx % 2 === 0;

                    return (
                      <TableRow
                        key={student.student_id}
                        sx={{
                          backgroundColor: isAllAbsent
                            ? 'rgba(254, 242, 242, 0.7)'
                            : isEven ? '#ffffff' : 'rgba(248, 250, 252, 0.7)',
                          '&:hover': { backgroundColor: 'rgba(241, 245, 249, 0.9) !important' },
                        }}
                      >
                        {/* Roll Number Sticky */}
                        <TableCell sx={{
                          fontWeight: 800,
                          color: '#0f3460',
                          fontSize: '0.85rem',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: isAllAbsent ? 'rgba(254, 242, 242, 0.98)' : (isEven ? '#ffffff' : 'rgba(248, 250, 252, 0.98)'),
                          zIndex: 2,
                          py: 0.6,
                          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                        }}>
                          {student.roll_number}
                        </TableCell>

                        {/* Student Name Sticky */}
                        <TableCell sx={{
                          fontWeight: 700,
                          color: isAllAbsent ? '#991b1b' : '#1e293b',
                          fontSize: '0.82rem',
                          position: 'sticky',
                          left: 55,
                          backgroundColor: isAllAbsent ? 'rgba(254, 242, 242, 0.98)' : (isEven ? '#ffffff' : 'rgba(248, 250, 252, 0.98)'),
                          zIndex: 2,
                          py: 0.6,
                          borderRight: '1px solid rgba(226, 232, 240, 0.8)',
                        }}>
                          {student.student_name}
                        </TableCell>

                        {/* Entire Student Absent Quick Toggle */}
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          <Tooltip title={isAllAbsent ? "Absent for entire exam — click to mark present" : "Mark absent for all subjects"}>
                            <Button
                              size="small"
                              variant={isAllAbsent ? "contained" : "outlined"}
                              disabled={isLocked}
                              onClick={() => toggleStudentEntirelyAbsent(student.student_id, !isAllAbsent)}
                              sx={{
                                minWidth: 38,
                                height: 24,
                                p: 0,
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                borderRadius: '4px',
                                borderColor: isAllAbsent ? '#ef4444' : '#cbd5e1',
                                background: isAllAbsent ? '#ef4444' : 'transparent',
                                color: isAllAbsent ? '#ffffff' : '#64748b',
                                '&:hover': {
                                  background: isAllAbsent ? '#dc2626' : 'rgba(239, 68, 68, 0.08)',
                                  borderColor: '#ef4444',
                                  color: '#ef4444',
                                },
                              }}
                            >
                              {isAllAbsent ? 'AB' : 'P'}
                            </Button>
                          </Tooltip>
                        </TableCell>

                        {/* Compact Subject Marks Cells */}
                        {subjects.map(subj => {
                          const isSubjAbsent = isAllAbsent || absentMap[`${student.student_id}-${subj.subject_id}`];
                          return (
                            <TableCell key={subj.subject_id} align="center" sx={{ p: 0.5 }}>
                              <CompactMarksCell
                                value={marks[`${student.student_id}-${subj.subject_id}`]}
                                isAbsent={isSubjAbsent}
                                maxMarks={subj.max_marks}
                                onChange={(val) => updateMark(student.student_id, subj.subject_id, val)}
                                onToggleAbsent={(isAbs) => toggleSubjectAbsent(student.student_id, subj.subject_id, isAbs)}
                                disabled={isLocked}
                              />
                            </TableCell>
                          );
                        })}

                        {/* Total Cell */}
                        <TableCell align="center" sx={{
                          fontWeight: 800,
                          color: isAllAbsent ? '#ef4444' : '#0f3460',
                          fontSize: '0.82rem',
                          py: 0.6,
                        }}>
                          {isAllAbsent ? (
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#ef4444' }}>
                              Absent (AB)
                            </Typography>
                          ) : totals.obtained !== null ? (
                            `${totals.obtained}/${totals.presentMax}`
                          ) : (
                            '—'
                          )}
                        </TableCell>

                        {/* Grade / Percentage Cell */}
                        <TableCell align="center" sx={{ py: 0.6 }}>
                          {grade ? (
                            <Chip
                              label={isAllAbsent ? 'Absent' : `${totals.percentage}% · ${grade.label}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: '0.68rem',
                                height: 22,
                                borderRadius: '4px',
                                color: grade.color,
                                background: grade.bg,
                                border: `1px solid ${grade.color}30`,
                              }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                              Incomplete
                            </Typography>
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

        {/* Action Footer */}
        <Divider />
        <Box sx={{
          p: 1.5,
          display: 'flex',
          gap: 1.5,
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          flexWrap: 'wrap',
        }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
            💡 <strong>Tip:</strong> Type <strong>AB</strong> in a cell or click the <strong>AB button</strong> to mark a student absent for all subjects.
          </Typography>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={fetchData}
              disabled={loading || saving}
              sx={{ borderRadius: '4px', borderColor: '#cbd5e1', color: '#475569', fontSize: '0.78rem', fontWeight: 700 }}
            >
              Refresh
            </Button>

            {!isLocked && (
              <>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || submitting}
                  sx={{
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #0f3460, #1e5f99)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                  }}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>

                <Button
                  variant="contained"
                  size="small"
                  startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <SendIcon />}
                  onClick={handleSubmit}
                  disabled={saving || submitting}
                  sx={{
                    borderRadius: '4px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  {submitting ? 'Submitting...' : 'Final Submit'}
                </Button>
              </>
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Batch Absent Selection Dialog */}
      <Dialog
        open={batchDialogOpen}
        onClose={() => setBatchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '4px', p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f3460', pb: 1 }}>
          ⚡ अनुपस्थित छात्र चयन (Batch Mark Absent)
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            जिन विद्यार्थियों ने परीक्षा नहीं दी, उन्हें नीचे चुनें और <strong>'अनुपस्थित दर्ज करें'</strong> दबाएं:
          </Typography>

          <Grid container spacing={1}>
            {reportCard?.map(st => {
              const isSelected = batchSelectedIds.has(st.student_id);
              const totals = calcStudentTotals(st.student_id);
              return (
                <Grid item xs={12} sm={6} key={st.student_id}>
                  <Paper
                    onClick={() => handleToggleBatchSelection(st.student_id)}
                    sx={{
                      p: 1.25,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: isSelected ? '1.5px solid #ef4444' : '1px solid #e2e8f0',
                      background: isSelected ? 'rgba(254, 242, 242, 0.9)' : '#ffffff',
                      '&:hover': { background: isSelected ? 'rgba(242, 242, 242, 1)' : 'rgba(248, 250, 252, 0.9)' },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        color="error"
                        sx={{ p: 0 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? '#991b1b' : '#1e293b' }}>
                          #{st.roll_number} {st.student_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                          वर्तमान स्थिति: {totals.isAllAbsent ? '🔴 अनुपस्थित' : totals.obtained !== null ? '🟢 अंक दर्ज' : '⚪ लंबित'}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              onClick={() => {
                const allIds = new Set(reportCard.map(s => s.student_id));
                setBatchSelectedIds(allIds);
              }}
              sx={{ fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px' }}
            >
              सभी चुनें
            </Button>
            <Button
              size="small"
              onClick={() => setBatchSelectedIds(new Set())}
              sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', borderRadius: '4px' }}
            >
              हटाएं
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              color="success"
              disabled={batchSelectedIds.size === 0}
              onClick={() => handleApplyBatchAbsent(false)}
              sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}
            >
              चयनित को उपस्थित (Present) करें
            </Button>
            <Button
              variant="contained"
              size="small"
              color="error"
              disabled={batchSelectedIds.size === 0}
              onClick={() => handleApplyBatchAbsent(true)}
              sx={{ borderRadius: '4px', fontWeight: 700, fontSize: '0.75rem' }}
            >
              अनुपस्थित (AB) दर्ज करें ({batchSelectedIds.size})
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
