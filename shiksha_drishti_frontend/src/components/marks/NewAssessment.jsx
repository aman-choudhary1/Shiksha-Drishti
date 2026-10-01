import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Paper, Typography, Grid, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Alert, CircularProgress, Chip,
  Stack, Divider,
} from '@mui/material';
import {
  Add, ArrowBack, School, AutoAwesome, CheckCircle,
  MenuBook, CalendarMonth,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { assessmentApi, masterApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ASSESSMENT_TYPES = [
  { id: 'TERM', label: 'Term Exam (Quarterly / Half-Yearly)' },
  { id: 'UNIT', label: 'Unit Test' },
  { id: 'FINAL', label: 'Final / Annual Exam' },
  { id: 'MONTHLY', label: 'Monthly Assessment' },
  { id: 'CUSTOM', label: 'Custom Test' },
];

const PRESETS = [
  { name: 'Quarterly Examination 2026', type: 'TERM' },
  { name: 'Half-Yearly Examination 2026', type: 'TERM' },
  { name: 'Annual Examination 2026', type: 'FINAL' },
  { name: 'Unit Test 1', type: 'UNIT' },
];

export default function NewAssessment() {
  const { user, assignments } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.assignment;

  const [allClasses, setAllClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  const [form, setForm] = useState({
    school_udise: prefill?.school_udise || user?.primary_udise || '',
    class_id: prefill?.class_id || '',
    academic_year_id: '',
    assessment_name: '',
    assessment_type: 'TERM',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      setLoadingData(true);
      try {
        const [yearsRes, classesRes] = await Promise.all([
          masterApi.getAcademicYears(),
          masterApi.getClasses().catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          const years = yearsRes.data || [];
          setAcademicYears(years);
          const active = years.find(y => y.is_active) || years[0];

          const classes = classesRes.data || [];
          setAllClasses(classes);

          const assignedClassId = prefill?.class_id ||
            assignments?.[0]?.class_id ||
            (classes.length > 0 ? classes[0].id : '');

          setForm(f => ({
            ...f,
            academic_year_id: active ? active.id : '',
            class_id: f.class_id || assignedClassId,
          }));
        }
      } catch (err) {
        console.error('Failed to load assessment metadata', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadInitial();
    return () => { isMounted = false; };
  }, [assignments, prefill]);

  // Set of assigned class IDs for badges
  const assignedClassIds = new Set((assignments || []).map(a => String(a.class_id)));

  const handleApplyPreset = (preset) => {
    setForm(f => ({
      ...f,
      assessment_name: preset.name,
      assessment_type: preset.type,
    }));
  };

  const handleCreate = async () => {
    if (!form.school_udise) {
      setError('School UDISE code is required');
      return;
    }
    if (!form.class_id) {
      setError('Please select a class');
      return;
    }
    if (!form.academic_year_id) {
      setError('Please select an academic year');
      return;
    }
    if (!form.assessment_name.trim()) {
      setError('Please enter assessment name');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const res = await assessmentApi.create({
        ...form,
        assessment_name: form.assessment_name.trim(),
      });
      navigate(`/assessments/${res.data.id}/report-card`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create assessment');
    } finally {
      setCreating(false);
    }
  };

  const displayClasses = allClasses.length > 0
    ? allClasses
    : (assignments || []).map(a => ({ id: a.class_id, class_name: a.class_name, class_num: a.class_num }));

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        
        {/* Top Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            size="small"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/assessments')}
            sx={{ color: '#475569', fontWeight: 700, borderRadius: '4px' }}
          >
            ← Back to Assessments
          </Button>

          {user?.school_name && (
            <Chip
              icon={<School sx={{ fontSize: '0.9rem !important' }} />}
              label={`${user.school_name}`}
              size="small"
              sx={{ background: 'rgba(15, 52, 96, 0.08)', color: '#0f3460', fontWeight: 700, fontSize: '0.75rem', borderRadius: '4px' }}
            />
          )}
        </Box>

        <Grid container spacing={3}>
          {/* Left Column: Form Paper */}
          <Grid item xs={12} md={7} lg={8}>
            <Paper sx={{
              p: 3,
              borderRadius: '4px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
            }}>
              {/* Card Title */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                <Box sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '4px',
                  background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Add sx={{ fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', lineHeight: 1.2 }}>
                    Create New Assessment
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Fill details to setup evaluation and proceed directly to marks entry
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5 }} />

              {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: '4px' }}>{error}</Alert>}

              {loadingData ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} sx={{ color: '#0284c7' }} />
                </Box>
              ) : (
                <Grid container spacing={2.5}>
                  
                  {/* Preset Chips */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                        Quick Presets:
                      </Typography>
                      {PRESETS.map((p, i) => (
                        <Chip
                          key={i}
                          label={p.name}
                          size="small"
                          clickable
                          onClick={() => handleApplyPreset(p)}
                          variant={form.assessment_name === p.name ? 'filled' : 'outlined'}
                          color={form.assessment_name === p.name ? 'primary' : 'default'}
                          sx={{ fontSize: '0.72rem', height: 24, fontWeight: 700, borderRadius: '4px' }}
                        />
                      ))}
                    </Box>
                  </Grid>

                  {/* Assessment Name */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Assessment Name *"
                      placeholder="e.g. Quarterly Examination 2026"
                      value={form.assessment_name}
                      onChange={e => setForm(f => ({ ...f, assessment_name: e.target.value }))}
                    />
                  </Grid>

                  {/* Class Dropdown */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="class-select-label">Class *</InputLabel>
                      <Select
                        labelId="class-select-label"
                        value={form.class_id}
                        label="Class *"
                        onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}
                      >
                        {displayClasses.map(c => {
                          const isAssigned = assignedClassIds.has(String(c.id));
                          return (
                            <MenuItem key={c.id} value={c.id}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span>{c.class_name}</span>
                                {isAssigned && (
                                  <Chip
                                    label="Assigned"
                                    size="small"
                                    color="success"
                                    sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, ml: 1, borderRadius: '4px' }}
                                  />
                                )}
                              </Box>
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Academic Year */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="year-select-label">Academic Year *</InputLabel>
                      <Select
                        labelId="year-select-label"
                        value={form.academic_year_id}
                        label="Academic Year *"
                        onChange={e => setForm(f => ({ ...f, academic_year_id: e.target.value }))}
                      >
                        {academicYears.map(y => (
                          <MenuItem key={y.id} value={y.id}>
                            {y.year_label} {y.is_active ? ' (Active)' : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Assessment Type */}
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="type-select-label">Assessment Type</InputLabel>
                      <Select
                        labelId="type-select-label"
                        value={form.assessment_type}
                        label="Assessment Type"
                        onChange={e => setForm(f => ({ ...f, assessment_type: e.target.value }))}
                      >
                        {ASSESSMENT_TYPES.map(t => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Subject Info Strip */}
                  <Grid item xs={12}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: '4px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}>
                      <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                        📖 5 Subjects (Hindi, English, Mathematics, Science, Social Science)
                      </Typography>
                      <Chip label="Max 100 marks/subject" size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, borderRadius: '4px' }} />
                    </Box>
                  </Grid>

                  {/* Submit Buttons */}
                  <Grid item xs={12} sx={{ display: 'flex', gap: 1.5, mt: 1 }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/assessments')}
                      sx={{ borderRadius: '4px', px: 2.5, borderColor: '#cbd5e1', color: '#64748b', fontWeight: 700 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <Add />}
                      onClick={handleCreate}
                      disabled={creating || !form.class_id || !form.assessment_name.trim()}
                      sx={{
                        borderRadius: '4px',
                        py: 1,
                        background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                        fontWeight: 700,
                      }}
                    >
                      {creating ? 'Creating...' : 'Create Assessment & Open Report Card'}
                    </Button>
                  </Grid>

                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Right Column: Instructions & Master Framework Card */}
          <Grid item xs={12} md={5} lg={4}>
            <Paper sx={{
              p: 3,
              borderRadius: '4px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              height: '100%',
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f3460', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: '#0284c7', fontSize: 20 }} />
                छत्तीसगढ़ मूल्यांकन दिशा-निर्देश
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 2, fontSize: '0.82rem', lineHeight: 1.5 }}>
                कक्षा मूल्यांकन के निर्माण के उपरांत आप सीधे अंक प्रविष्टि तालिका (Class Report Card) या प्रश्नवार अधिगम परिणाम (LO Marks Entry) मोड में अंक दर्ज कर सकते हैं।
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.5}>
                {[
                  { title: 'मोड A - तालिका अंक प्रविष्टि', desc: 'समग्र विषयवार प्राप्तांक सीधे तालिका में भरें।' },
                  { title: 'मोड B - प्रश्नवार अधिगम प्रविष्टि', desc: 'प्रत्येक प्रश्न और संबंधित LO के अनुसार अंक दर्ज करें।' },
                  { title: 'अनुपस्थित छात्र समर्थन (AB)', desc: 'परीक्षा में अनुपस्थित छात्रों के लिए केवल AB दर्ज करें।' },
                  { title: 'सत्र 2026-27 मानक', desc: 'SCERT छत्तीसगढ़ पाठ्यक्रम के अनुसार 100 पूर्णांक प्रति विषय।' },
                ].map((item, idx) => (
                  <Box key={idx} sx={{ p: 1.25, borderRadius: '4px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem' }}>
                      ✓ {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

      </motion.div>
    </Box>
  );
}
