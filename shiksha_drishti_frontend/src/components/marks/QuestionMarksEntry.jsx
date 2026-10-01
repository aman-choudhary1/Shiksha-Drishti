import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, Card, CardContent, TextField,
  Button, Chip, Alert, CircularProgress, Divider, Tooltip,
  LinearProgress, IconButton, Stack, Avatar, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Save, ArrowBack, Person, CheckCircle, InfoOutlined,
  KeyboardArrowLeft, KeyboardArrowRight, AutoAwesome,
  ArrowForward, HelpOutlineOutlined, EditNote, WarningAmber,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { assessmentApi } from '../../services/api';

export default function QuestionMarksEntry() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [questionData, setQuestionData] = useState(null);
  const [marks, setMarks] = useState({}); // { question_id: marks_obtained }
  const [isStudentAbsent, setIsStudentAbsent] = useState(false);
  const [studentAbsentStatusMap, setStudentAbsentStatusMap] = useState({}); // { `${studentId}-${subjectId}`: boolean }
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [saveAndNextMode, setSaveAndNextMode] = useState(false);

  // Load assessment + subjects + students
  useEffect(() => {
    const fetch = async () => {
      try {
        const [asmtRes, marksRes] = await Promise.all([
          assessmentApi.get(assessmentId),
          assessmentApi.getSubjectMarks(assessmentId),
        ]);
        const asmt = asmtRes.data;
        setAssessment(asmt);
        setSubjects(asmt.subjects || []);
        const stList = (marksRes.data.report_card || []).map(s => ({
          id: s.student_id, roll_number: s.roll_number, student_name: s.student_name,
        }));
        setStudents(stList);

        const abMap = {};
        for (const s of marksRes.data.report_card || []) {
          for (const sm of s.subject_marks || []) {
            if (sm.is_absent) {
              abMap[`${s.student_id}-${sm.subject_id}`] = true;
            }
          }
        }
        setStudentAbsentStatusMap(abMap);

        if (asmt.subjects?.length) setSelectedSubject(String(asmt.subjects[0].subject_id));
        if (stList.length) setSelectedStudent(String(stList[0].id));
      } catch (err) {
        setError('Failed to load assessment data');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [assessmentId]);

  // Load question marks when student or subject changes
  const loadQuestionMarks = useCallback(async () => {
    if (!selectedStudent || !selectedSubject) return;
    setLoadingQuestions(true);
    setSaveSuccess(false);
    try {
      const res = await assessmentApi.getQuestionMarks(assessmentId, {
        student_id: selectedStudent,
        subject_id: selectedSubject,
      });
      setQuestionData(res.data);
      const m = {};
      const hasAbsentFlag = res.data.question_marks?.some(q => q.is_absent) || false;

      for (const q of res.data.question_marks || []) {
        m[q.question_id] = q.marks_obtained ?? '';
      }
      setMarks(m);
      setIsStudentAbsent(hasAbsentFlag);
    } catch (err) {
      setError('Failed to load question data');
    } finally {
      setLoadingQuestions(false);
    }
  }, [assessmentId, selectedStudent, selectedSubject]);

  useEffect(() => { loadQuestionMarks(); }, [loadQuestionMarks]);

  const updateMark = (questionId, value) => {
    if (isStudentAbsent) {
      setIsStudentAbsent(false);
    }
    const num = value === '' ? '' : parseFloat(value);
    setMarks(prev => ({ ...prev, [questionId]: num }));
    setSaveSuccess(false);
  };

  const toggleAbsentStatus = (makeAbsent) => {
    setIsStudentAbsent(makeAbsent);
    if (makeAbsent) {
      setMarks(prev => {
        const cleared = {};
        for (const k in prev) cleared[k] = null;
        return cleared;
      });
    }
    setSaveSuccess(false);
  };

  // Open Confirmation modal before saving
  const handleOpenConfirm = (andNext = false) => {
    setSaveAndNextMode(andNext);
    setConfirmDialogOpen(true);
  };

  // Execute actual save after teacher confirms
  const executeSave = async () => {
    if (!selectedStudent || !selectedSubject || !questionData?.question_marks) return;
    setSaving(true);
    setError('');
    setSaveSuccess(false);

    const questionMarksPayload = questionData.question_marks.map(q => ({
      question_id: q.question_id,
      marks_obtained: isStudentAbsent
        ? null
        : (marks[q.question_id] !== '' && marks[q.question_id] !== null && !isNaN(marks[q.question_id])
            ? Number(marks[q.question_id])
            : null),
      is_absent: isStudentAbsent,
    }));

    try {
      await assessmentApi.bulkSaveQuestionMarks(assessmentId, {
        student_id: Number(selectedStudent),
        subject_id: Number(selectedSubject),
        marks: questionMarksPayload,
      });
      setSaveSuccess(true);
      setConfirmDialogOpen(false);

      setStudentAbsentStatusMap(prev => ({
        ...prev,
        [`${selectedStudent}-${selectedSubject}`]: isStudentAbsent,
      }));

      if (saveAndNextMode) {
        const currentIdx = students.findIndex(s => String(s.id) === String(selectedStudent));
        if (currentIdx !== -1 && currentIdx < students.length - 1) {
          setSelectedStudent(String(students[currentIdx + 1].id));
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save question marks');
    } finally {
      setSaving(false);
    }
  };

  const currentStudentObj = students.find(s => String(s.id) === String(selectedStudent));
  const currentSubjectObj = subjects.find(s => String(s.subject_id) === String(selectedSubject));
  const currentStudentIdx = students.findIndex(s => String(s.id) === String(selectedStudent));

  const derivedTotal = questionData?.question_marks && !isStudentAbsent
    ? questionData.question_marks.reduce((acc, q) => {
        const val = marks[q.question_id];
        return acc + (val !== '' && val !== null && !isNaN(val) ? Number(val) : 0);
      }, 0)
    : (isStudentAbsent ? 'AB' : 0);

  const totalMaxMarks = questionData?.question_marks
    ? questionData.question_marks.reduce((acc, q) => acc + (q.max_marks || 0), 0)
    : 0;

  const emptyQuestionsCount = questionData?.question_marks && !isStudentAbsent
    ? questionData.question_marks.filter(q => marks[q.question_id] === '' || marks[q.question_id] === null || marks[q.question_id] === undefined).length
    : 0;

  const isLocked = assessment?.status === 'SUBMITTED' || assessment?.status === 'LOCKED';

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <LinearProgress sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Compact Top Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Paper sx={{
          p: 2,
          mb: 2,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 60%, #0284c7 100%)',
          color: '#ffffff',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(15, 52, 96, 0.2)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <IconButton
                size="small"
                onClick={() => navigate(`/assessments/${assessmentId}/report-card`)}
                sx={{
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
                }}
              >
                <ArrowBack fontSize="small" />
              </IconButton>
              <Box>
                <Typography variant="h5" sx={{
                  fontWeight: 800,
                  fontSize: { xs: '1.2rem', sm: '1.4rem' },
                  lineHeight: 1.2,
                }}>
                  {assessment?.class_name} — {assessment?.assessment_name}
                </Typography>
                <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 600 }}>
                  🏫 {assessment?.school_name} · Session {assessment?.year_label} · Mode B — LO Marks Entry
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate(`/assessments/${assessmentId}/report-card`)}
              sx={{
                color: '#ffffff',
                borderColor: 'rgba(255, 255, 255, 0.4)',
                borderRadius: 2,
                fontSize: '0.78rem',
                fontWeight: 700,
                py: 0.5,
                '&:hover': { borderColor: '#ffffff', background: 'rgba(255, 255, 255, 0.1)' },
              }}
            >
              ← Report Card View
            </Button>
          </Box>
        </Paper>
      </motion.div>

      {/* Selectors Bar: Subject Tabs + Student Carousel */}
      <Paper sx={{
        p: 2,
        mb: 2,
        borderRadius: 3,
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
      }}>
        {/* Subject Tabs */}
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{
            color: '#64748b',
            fontWeight: 700,
            textTransform: 'uppercase',
            display: 'block',
            mb: 0.75,
            fontSize: '0.68rem',
          }}>
            Select Subject:
          </Typography>
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
            {subjects.map(s => {
              const isSelected = String(s.subject_id) === String(selectedSubject);
              return (
                <Chip
                  key={s.subject_id}
                  label={`${s.subject_name} (${s.max_marks})`}
                  clickable
                  onClick={() => setSelectedSubject(String(s.subject_id))}
                  sx={{
                    px: 1,
                    py: 1.5,
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    background: isSelected ? 'linear-gradient(135deg, #0f3460, #0284c7)' : 'rgba(241, 245, 249, 0.9)',
                    color: isSelected ? '#ffffff' : '#334155',
                    border: isSelected ? 'none' : '1px solid rgba(226, 232, 240, 0.9)',
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: 'rgba(226, 232, 240, 0.8)' }} />

        {/* Student Carousel Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              disabled={currentStudentIdx <= 0}
              onClick={() => setSelectedStudent(String(students[currentStudentIdx - 1].id))}
              sx={{ background: 'rgba(241, 245, 249, 0.9)', border: '1px solid #cbd5e1' }}
            >
              <KeyboardArrowLeft fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Student {currentStudentIdx + 1} / {students.length}
            </Typography>
            <IconButton
              size="small"
              disabled={currentStudentIdx >= students.length - 1}
              onClick={() => setSelectedStudent(String(students[currentStudentIdx + 1].id))}
              sx={{ background: 'rgba(241, 245, 249, 0.9)', border: '1px solid #cbd5e1' }}
            >
              <KeyboardArrowRight fontSize="small" />
            </IconButton>
          </Box>

          {/* Quick Clickable Student Pills with Attendance status */}
          <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', py: 0.5, maxWidth: '100%' }}>
            {students.map((st) => {
              const isSelected = String(st.id) === String(selectedStudent);
              const isAbsentForThisSubj = studentAbsentStatusMap[`${st.id}-${selectedSubject}`] || false;

              return (
                <Chip
                  key={st.id}
                  avatar={
                    <Avatar sx={{
                      bgcolor: isAbsentForThisSubj
                        ? '#ef4444 !important'
                        : isSelected ? '#ffffff' : '#0f3460',
                      color: isAbsentForThisSubj
                        ? '#ffffff !important'
                        : isSelected ? '#0f3460' : '#ffffff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                    }}>
                      {isAbsentForThisSubj ? 'AB' : st.roll_number}
                    </Avatar>
                  }
                  label={st.student_name}
                  clickable
                  onClick={() => setSelectedStudent(String(st.id))}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    height: 28,
                    background: isSelected
                      ? '#0f3460'
                      : isAbsentForThisSubj
                        ? 'rgba(254, 242, 242, 0.9)'
                        : 'rgba(248, 250, 252, 0.9)',
                    color: isSelected
                      ? '#ffffff'
                      : isAbsentForThisSubj
                        ? '#ef4444'
                        : '#475569',
                    border: isSelected
                      ? 'none'
                      : isAbsentForThisSubj
                        ? '1px solid rgba(239, 68, 68, 0.4)'
                        : '1px solid rgba(226, 232, 240, 0.9)',
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Paper>

      {/* Student Score Summary & Absent Switch Bar */}
      {currentStudentObj && (
        <Card sx={{
          p: 2,
          mb: 2,
          borderRadius: 3,
          background: isStudentAbsent
            ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: isStudentAbsent
            ? '1.5px solid rgba(239, 68, 68, 0.4)'
            : '1px solid rgba(56, 189, 248, 0.35)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: isStudentAbsent ? '#ef4444' : 'linear-gradient(135deg, #0f3460, #0284c7)',
                fontSize: '1.1rem',
                fontWeight: 800,
              }}>
                {isStudentAbsent ? 'AB' : currentStudentObj.roll_number}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: isStudentAbsent ? '#991b1b' : '#0f3460', lineHeight: 1.2, fontSize: '1rem' }}>
                  {currentStudentObj.student_name}
                </Typography>
                <Typography variant="caption" sx={{ color: isStudentAbsent ? '#ef4444' : '#0284c7', fontWeight: 700 }}>
                  Roll No: {currentStudentObj.roll_number} · Subject: {currentSubjectObj?.subject_name} ({currentSubjectObj?.max_marks} Marks)
                </Typography>
              </Box>
            </Box>

            {/* Attendance Segmented Control & Derived Total */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                background: '#ffffff',
                p: 0.5,
                borderRadius: 2.5,
                border: '1px solid rgba(203, 213, 225, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}>
                <Button
                  size="small"
                  variant={!isStudentAbsent ? "contained" : "text"}
                  disabled={isLocked}
                  onClick={() => toggleAbsentStatus(false)}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    height: 28,
                    background: !isStudentAbsent ? '#10b981' : 'transparent',
                    color: !isStudentAbsent ? '#ffffff' : '#64748b',
                    '&:hover': {
                      background: !isStudentAbsent ? '#059669' : 'rgba(16, 185, 129, 0.1)',
                    },
                  }}
                >
                  🟢 Present
                </Button>

                <Button
                  size="small"
                  variant={isStudentAbsent ? "contained" : "text"}
                  disabled={isLocked}
                  onClick={() => toggleAbsentStatus(true)}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    height: 28,
                    background: isStudentAbsent ? '#ef4444' : 'transparent',
                    color: isStudentAbsent ? '#ffffff' : '#64748b',
                    '&:hover': {
                      background: isStudentAbsent ? '#dc2626' : 'rgba(239, 68, 68, 0.1)',
                    },
                  }}
                >
                  🔴 Absent (AB)
                </Button>
              </Box>

              <Box sx={{
                background: '#ffffff',
                px: 2.5,
                py: 1,
                borderRadius: 2.5,
                border: isStudentAbsent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(56, 189, 248, 0.3)',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                textAlign: 'right',
              }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: '0.65rem' }}>
                  Derived Total
                </Typography>
                <Typography variant="h5" sx={{
                  fontWeight: 800,
                  color: isStudentAbsent ? '#ef4444' : '#0f3460',
                  lineHeight: 1.1,
                }}>
                  {isStudentAbsent ? 'AB' : `${derivedTotal} / ${totalMaxMarks}`}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Card>
      )}

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {saveSuccess && <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2, borderRadius: 2 }}>Marks and LO status saved successfully!</Alert>}

      {/* Compact Question Cards */}
      {loadingQuestions ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={32} sx={{ color: '#0284c7', mb: 1.5 }} />
          <Typography variant="body2" color="text.secondary">Loading questions and LO data...</Typography>
        </Box>
      ) : !questionData?.question_marks || questionData.question_marks.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <HelpOutlineOutlined sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#334155' }}>No questions available for this subject</Typography>
        </Card>
      ) : (
        <Stack spacing={1.5} sx={{ mb: 3 }}>
          {questionData.question_marks.map((q, qIdx) => {
            const currentVal = isStudentAbsent ? 'AB' : (marks[q.question_id] ?? '');
            const isFilled = !isStudentAbsent && currentVal !== '' && currentVal !== null;
            const isInvalid = !isStudentAbsent && isFilled && (currentVal < 0 || currentVal > q.max_marks);

            return (
              <Paper
                key={q.question_id}
                sx={{
                  p: 1.75,
                  borderRadius: 2.5,
                  background: isStudentAbsent ? 'rgba(254, 242, 242, 0.5)' : '#ffffff',
                  border: isStudentAbsent
                    ? '1px solid rgba(239, 68, 68, 0.25)'
                    : isInvalid
                      ? '1.5px solid #ef4444'
                      : isFilled
                        ? '1.5px solid rgba(16, 185, 129, 0.4)'
                        : '1px solid rgba(226, 232, 240, 0.9)',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.02)',
                }}
              >
                <Grid container spacing={1.5} alignItems="center">
                  {/* Question Prompt & LO Badge */}
                  <Grid item xs={12} sm={8}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Question ${q.question_number || qIdx + 1}`}
                        size="small"
                        sx={{
                          background: '#0f3460',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                      <Chip
                        icon={<AutoAwesome sx={{ fontSize: '12px !important', color: '#0284c7 !important' }} />}
                        label={`LO: ${q.lo_code || 'LO-MATH-06'}`}
                        size="small"
                        sx={{
                          background: 'rgba(2, 132, 199, 0.08)',
                          color: '#0284c7',
                          fontWeight: 800,
                          fontSize: '0.68rem',
                          height: 22,
                          border: '1px solid rgba(2, 132, 199, 0.2)',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                        Max: {q.max_marks} Marks
                      </Typography>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', mb: 0.5, fontSize: '0.88rem' }}>
                      {q.question_text}
                    </Typography>

                    {q.lo_description && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>
                        🎯 <strong>Learning Outcome:</strong> {q.lo_description}
                      </Typography>
                    )}
                  </Grid>

                  {/* Marks Input & Presets */}
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, gap: 0.75 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                          Marks Obtained:
                        </Typography>
                        {isStudentAbsent ? (
                          <Chip label="AB (Absent)" size="small" sx={{ background: '#ef4444', color: '#ffffff', fontWeight: 800 }} />
                        ) : (
                          <>
                            <TextField
                              type="number"
                              size="small"
                              disabled={isLocked || isStudentAbsent}
                              error={isInvalid}
                              value={currentVal}
                              placeholder="—"
                              onChange={(e) => updateMark(q.question_id, e.target.value)}
                              inputProps={{
                                min: 0,
                                max: q.max_marks,
                                step: 0.5,
                                style: {
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.95rem',
                                  width: 52,
                                  padding: '4px 2px',
                                },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 1.5,
                                  background: '#ffffff',
                                  height: 32,
                                },
                              }}
                            />
                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                              / {q.max_marks}
                            </Typography>
                          </>
                        )}
                      </Box>

                      {/* Quick presets */}
                      {!isLocked && !isStudentAbsent && (
                        <Stack direction="row" spacing={0.5}>
                          <Chip
                            label="0"
                            size="small"
                            clickable
                            onClick={() => updateMark(q.question_id, 0)}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                          <Chip
                            label="½"
                            size="small"
                            clickable
                            onClick={() => updateMark(q.question_id, q.max_marks / 2)}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                          <Chip
                            label="Full"
                            size="small"
                            clickable
                            onClick={() => updateMark(q.question_id, q.max_marks)}
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              background: 'rgba(16, 185, 129, 0.1)',
                              color: '#10b981',
                            }}
                          />
                        </Stack>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Sticky Bottom Action Bar */}
      <Paper sx={{
        position: 'sticky',
        bottom: 12,
        zIndex: 10,
        p: 1.5,
        borderRadius: 2.5,
        background: '#ffffff',
        border: '1px solid rgba(226, 232, 240, 0.9)',
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1.5,
      }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>
          💡 A review dialog will appear before saving your marks.
        </Typography>

        {!isLocked && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleOpenConfirm(false)}
              disabled={saving}
              startIcon={<Save />}
              sx={{ borderRadius: 2, fontWeight: 700, fontSize: '0.78rem' }}
            >
              Save
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => handleOpenConfirm(true)}
              disabled={saving}
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              Save & Next Student
            </Button>
          </Stack>
        )}
      </Paper>

      {/* Confirmation Modal Before Save & Next */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !saving && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0f3460', pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditNote sx={{ color: '#0284c7', fontSize: 28 }} />
          Confirm Marks Entry
        </DialogTitle>
        <DialogContent dividers>
          {/* Student & Subject Info Strip */}
          <Paper sx={{
            p: 1.75,
            mb: 2,
            borderRadius: 2,
            background: isStudentAbsent ? 'rgba(254, 242, 242, 0.8)' : 'rgba(240, 249, 255, 0.8)',
            border: isStudentAbsent ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(2, 132, 199, 0.3)',
          }}>
            <Grid container spacing={1}>
              <Grid item xs={7}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                  Student Name:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                  #{currentStudentObj?.roll_number} — {currentStudentObj?.student_name}
                </Typography>
              </Grid>
              <Grid item xs={5} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                  Subject & Attendance:
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip
                    label={isStudentAbsent ? "🔴 Absent (AB)" : "🟢 Present"}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      background: isStudentAbsent ? '#ef4444' : '#10b981',
                      color: '#ffffff',
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Missing Questions Warning */}
          {!isStudentAbsent && emptyQuestionsCount > 0 && (
            <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 2, borderRadius: 2 }}>
              <strong>Note:</strong> {emptyQuestionsCount} question(s) have no marks entered. They will be treated as 0 on confirmation.
            </Alert>
          )}

          {/* Questions Breakdown Table */}
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Question-wise Marks & LO Summary:
          </Typography>

          <TableContainer sx={{ maxHeight: 240, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ background: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', py: 0.75 }}>Q. No</TableCell>
                  <TableCell sx={{ fontWeight: 800, fontSize: '0.72rem', py: 0.75 }}>LO Code / Description</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', py: 0.75 }}>Max</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.72rem', py: 0.75 }}>Obtained</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {questionData?.question_marks?.map((q, idx) => {
                  const mVal = isStudentAbsent ? 'AB' : (marks[q.question_id] ?? '—');
                  return (
                    <TableRow key={q.question_id}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.5 }}>
                        Q{q.question_number || idx + 1}
                      </TableCell>
                      <TableCell sx={{ py: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0284c7', display: 'block' }}>
                          {q.lo_code || 'LO-GEN'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                          {q.lo_description || q.question_text?.substring(0, 40) + '...'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', py: 0.5 }}>
                        {q.max_marks}
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.8rem', py: 0.5, color: isStudentAbsent ? '#ef4444' : '#0f3460' }}>
                        {mVal}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Total Summary Footer */}
          <Box sx={{
            mt: 2,
            p: 1.5,
            borderRadius: 2,
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '1px solid #e2e8f0',
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f3460' }}>
              Total Subject Score (Derived):
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: isStudentAbsent ? '#ef4444' : '#0284c7' }}>
              {isStudentAbsent ? 'AB (Absent)' : `${derivedTotal} / ${totalMaxMarks} (${totalMaxMarks > 0 ? ((derivedTotal / totalMaxMarks) * 100).toFixed(1) : 0}%)`}
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={saving}
            sx={{ borderRadius: 2, borderColor: '#cbd5e1', color: '#475569', fontWeight: 700 }}
          >
            ← Review / Edit
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={executeSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              fontWeight: 800,
              fontSize: '0.82rem',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            {saving ? 'Saving...' : saveAndNextMode ? 'Confirm & Next Student →' : 'Confirm & Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
