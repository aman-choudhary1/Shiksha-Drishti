import React, { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography,
  Button, IconButton, Stack, Chip, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Tooltip,
  Divider, FormControlLabel, Checkbox, Tabs, Tab,
} from '@mui/material';
import {
  Close, CloudUpload, FileDownload, CheckCircle,
  WarningAmber, Description, Refresh, Save, School, InfoOutlined,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadMarksExcelTemplate, parseAndValidateMarksExcel } from '../../utils/excelMarksTemplate';
import { assessmentApi } from '../../services/api';

export default function BulkExcelMarksModal({
  open,
  onClose,
  assessment,
  subjects = [],
  reportCard = [],
  schoolName = '',
  onSuccess,
}) {
  const [activeStep, setActiveStep] = useState('UPLOAD'); // 'UPLOAD' or 'PREVIEW'
  const [downloading, setDownloading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [generalError, setGeneralError] = useState('');
  const [skipErrors, setSkipErrors] = useState(false);
  const [previewTab, setPreviewTab] = useState('ALL'); // 'ALL', 'ERRORS', 'VALID'

  const fileInputRef = useRef(null);

  // Handle template download
  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setGeneralError('');
    try {
      await downloadMarksExcelTemplate({
        assessment,
        subjects,
        reportCard,
        schoolName,
      });
    } catch (err) {
      console.error(err);
      setGeneralError('Failed to generate Excel template: ' + (err.message || 'Unknown error'));
    } finally {
      setDownloading(false);
    }
  };

  // Process chosen file
  const processFile = async (file) => {
    if (!file) return;
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    if (!isExcel) {
      setGeneralError('Please upload an Excel spreadsheet (.xlsx or .xls)');
      return;
    }

    setParsing(true);
    setGeneralError('');
    try {
      const result = await parseAndValidateMarksExcel({
        file,
        subjects,
        reportCard,
      });
      setParseResult(result);
      setActiveStep('PREVIEW');
      setPreviewTab(result.hasFatalErrors ? 'ERRORS' : 'ALL');
    } catch (err) {
      console.error(err);
      setGeneralError(err.message || 'Error parsing the Excel file. Please ensure it follows the downloaded template format.');
    } finally {
      setParsing(false);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Reset to re-upload
  const handleReset = () => {
    setParseResult(null);
    setActiveStep('UPLOAD');
    setGeneralError('');
    setSkipErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save marks to database
  const handleApplyMarks = async () => {
    if (!parseResult || !assessment?.id) return;

    let payload = parseResult.payload;

    if (parseResult.hasFatalErrors && !skipErrors) {
      setGeneralError('Please resolve all validation errors in your Excel file or check "Skip rows with issues" to proceed.');
      return;
    }

    if (parseResult.hasFatalErrors && skipErrors) {
      // Filter payload to only include students without errors
      const validStudentIds = new Set(
        parseResult.parsedStudents
          .filter(s => !s.hasErrors && s.is_enrolled)
          .map(s => s.student_id)
      );
      payload = payload.filter(m => validStudentIds.has(m.student_id));
    }

    if (payload.length === 0) {
      setGeneralError('No valid marks found to save.');
      return;
    }

    setSaving(true);
    setGeneralError('');

    try {
      await assessmentApi.bulkSaveSubjectMarks(assessment.id, { marks: payload });
      if (onSuccess) {
        onSuccess(payload.length);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setGeneralError(err.response?.data?.error || 'Failed to save marks to database.');
    } finally {
      setSaving(false);
    }
  };

  // Filter preview rows
  const filteredStudents = (parseResult?.parsedStudents || []).filter(st => {
    if (previewTab === 'ERRORS') return st.hasErrors || !st.is_enrolled;
    if (previewTab === 'VALID') return !st.hasErrors && st.is_enrolled;
    return true;
  });

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
          background: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        },
      }}
    >
      {/* Header Banner */}
      <DialogTitle
        sx={{
          p: 2.2,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 60%, #0284c7 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
          >
            <Description sx={{ color: '#67e8f9', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.2 }}>
              Excel Bulk Marks Entry
            </Typography>
            <Typography variant="caption" sx={{ color: '#93c5fd', fontWeight: 600 }}>
              {assessment?.class_name} · {assessment?.assessment_name} · Vidya Samiksha Kendra
            </Typography>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          disabled={saving}
          sx={{
            color: '#ffffff',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1.5,
            '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, backgroundColor: '#f8fafc' }}>
        {generalError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setGeneralError('')}>
            {generalError}
          </Alert>
        )}

        <AnimatePresence mode="wait">
          {activeStep === 'UPLOAD' ? (
            <motion.div
              key="step-upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Two Column Layout: Step 1 (Download) & Step 2 (Upload) */}
              <Stack spacing={2.5}>
                {/* Step 1: Download Template Card */}
                <Paper
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.75, alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileDownload sx={{ fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.98rem' }}>
                        Step 1: Download Pre-Formatted Excel Template
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.25 }}>
                        Pre-populated with all <strong>{reportCard?.length || 0} enrolled students</strong>, roll numbers, and <strong>{subjects?.length || 0} subject columns</strong>.
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <FileDownload />}
                    onClick={handleDownloadTemplate}
                    disabled={downloading}
                    sx={{
                      borderRadius: 1.5,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      fontWeight: 700,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      px: 2.5,
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669, #047857)',
                      },
                    }}
                  >
                    {downloading ? 'Generating...' : 'Download Template (.xlsx)'}
                  </Button>
                </Paper>

                {/* Step 2: Dropzone Upload Card */}
                <Paper
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    p: 4,
                    borderRadius: 2,
                    border: `2px dashed ${isDragging ? '#0284c7' : '#cbd5e1'}`,
                    background: isDragging ? 'rgba(2, 132, 199, 0.04)' : '#ffffff',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#0284c7',
                      background: 'rgba(2, 132, 199, 0.02)',
                    },
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                  />

                  {parsing ? (
                    <Box sx={{ py: 3 }}>
                      <CircularProgress size={42} sx={{ color: '#0284c7', mb: 2 }} />
                      <Typography sx={{ fontWeight: 800, color: '#0f172a' }}>
                        Validating and parsing Excel data...
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                        Verifying student enrollments and subject mark boundaries...
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ py: 1 }}>
                      <Box
                        sx={{
                          width: 58,
                          height: 58,
                          borderRadius: '50%',
                          background: 'rgba(2, 132, 199, 0.1)',
                          color: '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                        }}
                      >
                        <CloudUpload sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem', mb: 0.5 }}>
                        Step 2: Drag & Drop Completed Excel File Here
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.84rem', mb: 2 }}>
                        Or click anywhere in this box to browse from your computer / phone
                      </Typography>

                      <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                        <Chip label="Supports .xlsx, .xls" size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1 }} />
                        <Chip label="Auto-detects AB for Absent" size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1 }} />
                        <Chip label="Instant Boundary Checks" size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: 1 }} />
                      </Stack>
                    </Box>
                  )}
                </Paper>

                {/* Friendly Guidance Box */}
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1.5,
                    background: 'rgba(2, 132, 199, 0.05)',
                    border: '1px solid rgba(2, 132, 199, 0.2)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                  }}
                >
                  <InfoOutlined sx={{ color: '#0284c7', fontSize: 20, mt: 0.2 }} />
                  <Typography variant="body2" sx={{ color: '#0369a1', fontSize: '0.82rem', lineHeight: 1.5 }}>
                    <strong>Quality Assurance Rule:</strong> Marks cannot exceed maximum marks for any subject. If a student was absent on exam day, type <strong>AB</strong> or <strong>A</strong>. Never delete the <strong>Student ID</strong> column as it guarantees marks are mapped to the correct student.
                  </Typography>
                </Box>
              </Stack>
            </motion.div>
          ) : (
            <motion.div
              key="step-preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* KPI Diagnostics Strip */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Paper sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #e2e8f0', background: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Total Rows Found</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>
                    {parseResult?.totalStudentsParsed}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #bbf7d0', background: '#f0fdf4' }}>
                  <Typography variant="caption" sx={{ color: '#166534', fontWeight: 600 }}>Valid Records</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#15803d' }}>
                    {parseResult?.validRowsCount}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 1.5, border: parseResult?.errorRowsCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', background: parseResult?.errorRowsCount > 0 ? '#fef2f2' : '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: parseResult?.errorRowsCount > 0 ? '#b91c1c' : '#64748b', fontWeight: 600 }}>
                    Flagged / Errors
                  </Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: parseResult?.errorRowsCount > 0 ? '#b91c1c' : '#0f172a' }}>
                    {parseResult?.errorRowsCount}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid #fed7aa', background: '#fff7ed' }}>
                  <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 600 }}>Marked Absent (AB)</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#ea580c' }}>
                    {parseResult?.absentCount}
                  </Typography>
                </Paper>
              </Box>

              {/* Error Warning & Action Banner */}
              {parseResult?.hasFatalErrors && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 1.5,
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningAmber sx={{ color: '#dc2626', fontSize: 20 }} />
                    <Typography sx={{ fontWeight: 800, color: '#991b1b', fontSize: '0.92rem' }}>
                      {parseResult.errorsList.length} Entry Issue(s) Detected in Spreadsheet
                    </Typography>
                  </Box>

                  <Box sx={{ maxHeight: 90, overflowY: 'auto', pr: 1, mb: 1.5 }}>
                    {parseResult.errorsList.map((err, idx) => (
                      <Typography key={idx} variant="caption" sx={{ display: 'block', color: '#b91c1c', fontSize: '0.78rem' }}>
                        • <strong>{err.studentName}</strong> (Roll #{err.rollNo}): {err.message}
                      </Typography>
                    ))}
                  </Box>

                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={skipErrors}
                        onChange={(e) => setSkipErrors(e.target.checked)}
                        sx={{ color: '#dc2626', '&.Mui-checked': { color: '#dc2626' } }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b', fontSize: '0.82rem' }}>
                        Skip rows with issues and save the remaining {parseResult.validRowsCount} valid student marks
                      </Typography>
                    }
                  />
                </Paper>
              )}

              {/* Tab Filters */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                <Tabs
                  value={previewTab}
                  onChange={(e, val) => setPreviewTab(val)}
                  sx={{ minHeight: 34, '& .MuiTab-root': { minHeight: 34, py: 0.5, fontSize: '0.8rem', fontWeight: 700 } }}
                >
                  <Tab value="ALL" label={`All Students (${parseResult?.parsedStudents?.length || 0})`} />
                  <Tab value="VALID" label={`Valid (${parseResult?.validRowsCount || 0})`} />
                  {parseResult?.errorRowsCount > 0 && (
                    <Tab
                      value="ERRORS"
                      label={`With Issues (${parseResult?.errorRowsCount})`}
                      sx={{ color: '#dc2626 !important' }}
                    />
                  )}
                </Tabs>

                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  sx={{ borderRadius: 1.5, fontSize: '0.76rem', textTransform: 'none', color: '#64748b' }}
                >
                  Upload Different File
                </Button>
              </Box>

              {/* Live Preview Table */}
              <TableContainer
                component={Paper}
                sx={{
                  maxHeight: 320,
                  borderRadius: 1.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: 'none',
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, background: '#f1f5f9', py: 1, fontSize: '0.76rem' }}>Roll</TableCell>
                      <TableCell sx={{ fontWeight: 800, background: '#f1f5f9', py: 1, fontSize: '0.76rem' }}>Student Name</TableCell>
                      <TableCell sx={{ fontWeight: 800, background: '#f1f5f9', py: 1, fontSize: '0.76rem' }}>Status</TableCell>
                      {subjects.map(subj => (
                        <TableCell key={subj.subject_id} align="center" sx={{ fontWeight: 800, background: '#f1f5f9', py: 1, fontSize: '0.76rem' }}>
                          {subj.subject_name}
                          <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontSize: '0.68rem', fontWeight: 600 }}>
                            (Max: {subj.max_marks})
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((st, idx) => (
                      <TableRow
                        key={idx}
                        sx={{
                          backgroundColor: st.hasErrors || !st.is_enrolled ? 'rgba(254, 242, 242, 0.6)' : idx % 2 === 1 ? '#fafafa' : '#ffffff',
                          '&:hover': { backgroundColor: 'rgba(2, 132, 199, 0.04)' },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', py: 0.8 }}>
                          #{st.roll_number}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem', py: 0.8, color: '#0f172a' }}>
                          {st.student_name}
                        </TableCell>
                        <TableCell sx={{ py: 0.8 }}>
                          {st.hasErrors || !st.is_enrolled ? (
                            <Tooltip title={st.errors.join(' | ')}>
                              <Chip
                                label="Issue"
                                size="small"
                                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, background: '#fee2e2', color: '#b91c1c' }}
                              />
                            </Tooltip>
                          ) : (
                            <Chip
                              label="Valid"
                              size="small"
                              sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}
                            />
                          )}
                        </TableCell>
                        {subjects.map(subj => {
                          const sm = st.subject_marks?.find(m => String(m.subject_id) === String(subj.subject_id));
                          return (
                            <TableCell key={subj.subject_id} align="center" sx={{ py: 0.8 }}>
                              {sm?.is_absent ? (
                                <Chip
                                  label="AB"
                                  size="small"
                                  sx={{ height: 22, width: 38, fontWeight: 800, fontSize: '0.7rem', background: '#fee2e2', color: '#ef4444' }}
                                />
                              ) : sm?.status === 'ERROR' ? (
                                <Tooltip title={sm.error || 'Invalid mark'}>
                                  <Chip
                                    label="Invalid"
                                    size="small"
                                    sx={{ height: 22, fontWeight: 800, fontSize: '0.68rem', background: '#fecaca', color: '#991b1b' }}
                                  />
                                </Tooltip>
                              ) : sm?.marks_obtained !== null && sm?.marks_obtained !== undefined ? (
                                <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f3460' }}>
                                  {sm.marks_obtained}
                                </Typography>
                              ) : (
                                <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>

      <Divider />

      {/* Footer Buttons */}
      <DialogActions sx={{ p: 2, px: 2.5, justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{ borderRadius: 1.5, color: '#64748b', fontWeight: 700, textTransform: 'none' }}
        >
          Cancel
        </Button>

        {activeStep === 'PREVIEW' && (
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={saving}
              sx={{ borderRadius: 1.5, borderColor: '#cbd5e1', color: '#475569', fontWeight: 700, textTransform: 'none' }}
            >
              Back to Upload
            </Button>

            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleApplyMarks}
              disabled={saving || (parseResult?.hasFatalErrors && !skipErrors) || parseResult?.payload?.length === 0}
              sx={{
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                fontWeight: 800,
                fontSize: '0.84rem',
                textTransform: 'none',
                px: 3,
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #071526, #0369a1)',
                },
              }}
            >
              {saving ? 'Saving Marks...' : `Save & Apply Marks (${skipErrors ? parseResult?.validRowsCount : parseResult?.totalStudentsParsed || 0} Students)`}
            </Button>
          </Stack>
        )}
      </DialogActions>
    </Dialog>
  );
}
