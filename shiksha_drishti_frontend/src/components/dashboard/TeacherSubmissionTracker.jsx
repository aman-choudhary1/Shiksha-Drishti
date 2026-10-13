import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, Select, MenuItem, FormControl,
  InputLabel, TextField, InputAdornment, alpha, CircularProgress
} from '@mui/material';
import {
  ClipboardCheck, Clock, AlertCircle, CheckCircle2, Search,
  RefreshCw, Send, Phone, School, MapPin, Award, UserCheck,
  UserX, FileText, ChevronRight
} from 'lucide-react';
import { stateApi } from '../../services/api';

export default function TeacherSubmissionTracker({ districtFilter = 'ALL' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(districtFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'PENDING', 'COMPLIANT'
  const [searchTerm, setSearchTerm] = useState('');
  const [reminderMsg, setReminderMsg] = useState('');

  const fetchTracker = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 150 };
      if (selectedDistrict !== 'ALL') params.district = selectedDistrict;
      const res = await stateApi.getSubmissionTracker(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load submission tracker:', err);
      setError('Unable to load submission tracker data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracker();
  }, [selectedDistrict]);

  const kpis = data?.kpis || {};
  const districtCompliance = data?.district_compliance || [];
  const teachers = data?.teachers || [];

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'COMPLIANT' && t.status === 'COMPLIANT') ||
        (statusFilter === 'PENDING' && t.status !== 'COMPLIANT');
      const matchSearch =
        !searchTerm.trim() ||
        (t.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.school_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.udise_code || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [teachers, statusFilter, searchTerm]);

  const handleSendReminder = (teacher) => {
    setReminderMsg(`Reminder notification dispatched to ${teacher.full_name} (${teacher.school_name})`);
    setTimeout(() => setReminderMsg(''), 4000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Top Header Bar ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
            }}>
              <ClipboardCheck size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                Teacher Report Card Submission & Compliance Tracker
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                Real-time monitoring of teacher marks submission deadlines, pending drafts, and defaulters
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={fetchTracker}
              startIcon={<RefreshCw size={13} />}
              sx={{ borderRadius: 2, fontSize: '0.75rem', textTransform: 'none' }}
            >
              Refresh Telemetry
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Reminder Toast */}
      {reminderMsg && (
        <Box sx={{
          p: 1.5, borderRadius: 2, background: '#fef3c7', border: '1px solid #fde68a',
          color: '#92400e', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1
        }}>
          <CheckCircle2 size={16} color="#d97706" /> {reminderMsg}
        </Box>
      )}

      {/* ── Macro Scorecards ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2
      }}>
        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Total Assigned Exams
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
            {(kpis.total_assessments || 0).toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
            Class report cards scheduled
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #10b981' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Submitted & Verified
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', mt: 0.5 }}>
            {(kpis.submitted_assessments || 0).toLocaleString()} ({kpis.submission_rate_pct}%)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle2 size={13} /> Completed and finalized
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #ef4444' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Pending Drafts / Overdue
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', mt: 0.5 }}>
            {(kpis.pending_assessments || 0).toLocaleString()} ({100 - (kpis.submission_rate_pct || 0)}%)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Clock size={13} /> Still in draft / unsubmitted
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #8b5cf6' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Faculty Cadre Reporting
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
            {(kpis.active_teachers || 0).toLocaleString()} Faculty
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
            Across all participating schools
          </Typography>
        </Card>
      </Box>

      {/* ── District Compliance Breakdown ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            🏢 District Submission Compliance League
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Districts ranked by percentage of scheduled report cards finalized
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          {districtCompliance.slice(0, 8).map((d, idx) => (
            <Box key={idx} sx={{ p: 1.5, borderRadius: 2, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>
                  {d.district_name}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 900, color: Number(d.submission_rate_pct) >= 90 ? '#059669' : Number(d.submission_rate_pct) >= 75 ? '#0284c7' : '#ef4444' }}>
                  {d.submission_rate_pct}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Number(d.submission_rate_pct) || 0}
                sx={{
                  height: 6, borderRadius: 3,
                  backgroundColor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: Number(d.submission_rate_pct) >= 90 ? '#10b981' : Number(d.submission_rate_pct) >= 75 ? '#0284c7' : '#ef4444',
                    borderRadius: 3
                  }
                }}
              />
              <Typography sx={{ fontSize: '0.66rem', color: '#64748b', mt: 0.5 }}>
                {d.submitted_assessments} submitted · {d.pending_assessments} pending
              </Typography>
            </Box>
          ))}
        </Box>
      </Card>

      {/* ── Teacher Submission Directory Table ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              👨‍🏫 Teacher Submission Directory & Follow-Up
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
              Inspect pending assessments per teacher and send instant reminders
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'All Teachers' },
              { id: 'PENDING', label: 'Pending Only' },
              { id: 'COMPLIANT', label: '100% Compliant' },
            ].map(tab => (
              <Chip
                key={tab.id}
                label={tab.label}
                size="small"
                onClick={() => setStatusFilter(tab.id)}
                sx={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? '#0f3460' : '#f1f5f9',
                  color: statusFilter === tab.id ? '#ffffff' : '#475569',
                }}
              />
            ))}

            <TextField
              size="small"
              placeholder="Search teacher, school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 210, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.75rem', py: 0.1 } }}
            />
          </Stack>
        </Box>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { background: '#f8fafc', color: '#475569', fontWeight: 800, fontSize: '0.72rem', py: 1.2 } }}>
                <TableCell>Teacher Details</TableCell>
                <TableCell>Assigned School & Location</TableCell>
                <TableCell align="center">Submission Progress</TableCell>
                <TableCell>Pending Assessment Details</TableCell>
                <TableCell align="center">Compliance Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTeachers.map((t, idx) => {
                const isCompliant = t.status === 'COMPLIANT';
                return (
                  <TableRow
                    key={t.user_id || idx}
                    sx={{
                      '& td': { py: 1, fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9' },
                      background: !isCompliant && t.pending_count > 0 ? 'rgba(254, 242, 242, 0.3)' : 'transparent',
                      '&:hover': { background: '#f8fafc' }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#0f172a' }}>
                        {t.full_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                        ID: {t.username} · Ph: {t.mobile || 'Registered'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        {t.school_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        UDISE: {t.udise_code} · {t.district_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 140 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, fontSize: '0.68rem' }}>
                        <span style={{ fontWeight: 700, color: isCompliant ? '#059669' : '#ea580c' }}>
                          {t.submitted_count} / {t.total_assigned}
                        </span>
                        <span style={{ fontWeight: 800 }}>{t.submission_rate_pct}%</span>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={t.submission_rate_pct}
                        sx={{
                          height: 6, borderRadius: 3,
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: isCompliant ? '#10b981' : '#f59e0b',
                            borderRadius: 3
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 220 }}>
                      {t.pending_items ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {t.pending_items.split('; ').map((item, i) => (
                            <Chip
                              key={i}
                              label={item}
                              size="small"
                              sx={{ height: 20, fontSize: '0.64rem', fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                          ✓ All Completed
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={t.status_label}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: isCompliant ? '#ecfdf5' : '#fee2e2',
                          color: isCompliant ? '#059669' : '#dc2626',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {!isCompliant ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleSendReminder(t)}
                          startIcon={<Send size={12} />}
                          sx={{
                            fontSize: '0.68rem',
                            borderRadius: 1.5,
                            textTransform: 'none',
                            py: 0.2,
                            px: 1,
                            borderColor: '#ea580c',
                            color: '#ea580c',
                            '&:hover': { background: alpha('#ea580c', 0.08) }
                          }}
                        >
                          Send Alert
                        </Button>
                      ) : (
                        <Chip label="Compliant" size="small" sx={{ height: 20, fontSize: '0.64rem', background: '#f1f5f9', color: '#64748b' }} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
