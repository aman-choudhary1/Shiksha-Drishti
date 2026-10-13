import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, Select, MenuItem, FormControl,
  InputLabel, TextField, InputAdornment, alpha, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  GraduationCap, AlertTriangle, CheckCircle2, HelpCircle,
  Search, RefreshCw, Filter, BellRing, UserCheck, UserX,
  FileText, ArrowUpRight, School, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { stateApi } from '../../services/api';

export default function ClassPromotionReadiness({ districtFilter = 'ALL', classFilter = 'ALL' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(classFilter || 'ALL');
  const [selectedDistrict, setSelectedDistrict] = useState(districtFilter || 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'AT_RISK', 'CONDITIONAL', 'READY'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [alertSuccess, setAlertSuccess] = useState('');

  const fetchReadiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { limit: 120 };
      if (selectedDistrict !== 'ALL') params.district = selectedDistrict;
      if (selectedClass !== 'ALL') params.class_name = selectedClass;
      const res = await stateApi.getPromotionReadiness(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load promotion readiness:', err);
      setError('Unable to load promotion readiness data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [selectedClass, selectedDistrict]);

  const kpis = data?.kpis || {};
  const classBreakdown = data?.class_breakdown || [];
  const students = data?.students || [];

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchStatus = statusFilter === 'ALL' || s.promotion_status === statusFilter;
      const matchSearch = !searchTerm.trim() ||
        (s.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.school_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.roll_number || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [students, statusFilter, searchTerm]);

  const handleSendNudge = (student) => {
    setAlertSuccess(`Parent SMS notification & Teacher Remedial Directive queued for ${student.student_name}`);
    setTimeout(() => setAlertSuccess(''), 4000);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Top Header Bar ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
            }}>
              <GraduationCap size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                Class Promotion & Academic Retention Readiness
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                Early-warning identification of at-risk students based on teacher-submitted class report cards
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: '0.78rem' }}>Grade / Class</InputLabel>
              <Select
                value={selectedClass}
                label="Grade / Class"
                onChange={(e) => setSelectedClass(e.target.value)}
                sx={{ borderRadius: 2, fontSize: '0.78rem' }}
              >
                <MenuItem value="ALL">All Grades (1–12)</MenuItem>
                {[...Array(12)].map((_, i) => (
                  <MenuItem key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              variant="outlined"
              onClick={fetchReadiness}
              startIcon={<RefreshCw size={13} />}
              sx={{ borderRadius: 2, fontSize: '0.75rem', textTransform: 'none' }}
            >
              Refresh Audit
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* Alert toast notification */}
      {alertSuccess && (
        <Box sx={{
          p: 1.5, borderRadius: 2, background: '#ecfdf5', border: '1px solid #a7f3d0',
          color: '#065f46', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1
        }}>
          <CheckCircle2 size={16} color="#059669" /> {alertSuccess}
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
            Total Evaluated Cohort
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', mt: 0.5 }}>
            {(kpis.total_evaluated || 0).toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
            Enrolled with active report card marks
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #10b981' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Ready for Promotion
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', mt: 0.5 }}>
            {(kpis.ready_count || 0).toLocaleString()} ({kpis.ready_pct}%)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle2 size={13} /> Score ≥40% & 0 failed subjects
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #f59e0b' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Conditional / Re-test
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>
            {(kpis.conditional_count || 0).toLocaleString()} ({kpis.conditional_pct}%)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HelpCircle size={13} /> Borderline (1 weak subject)
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #ef4444' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Critical At-Risk / Detain
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', mt: 0.5 }}>
            {(kpis.at_risk_count || 0).toLocaleString()} ({kpis.at_risk_pct}%)
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AlertTriangle size={13} /> Score &lt;35% or ≥2 failing subjects
          </Typography>
        </Card>
      </Box>

      {/* ── Class-Wise Promotion Readiness Distribution Chart ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            📊 Grade-Wise Promotion Readiness Rate
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Proportion of students prepared for promotion vs requiring re-test or intensive remedial support
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={36} sx={{ color: '#0284c7' }} />
          </Box>
        ) : classBreakdown.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={classBreakdown} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="class_name" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <RTooltip
                contentStyle={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(val, name) => [`${val}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar dataKey="ready_pct" name="Ready for Promotion" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="conditional_pct" name="Conditional (1 Sub)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="at_risk_pct" name="Critical At-Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>No class data available.</Typography>
          </Box>
        )}
      </Card>

      {/* ── Student Promotion Roster & Intervention Table ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              🎯 Student Promotion Audit & Remedial Roster
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
              Detailed student scorecard showing weak subjects flagged for remediation
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {/* Status pills */}
            {[
              { id: 'ALL', label: 'All Students' },
              { id: 'AT_RISK', label: 'Critical At-Risk' },
              { id: 'CONDITIONAL', label: 'Conditional' },
              { id: 'READY', label: 'Promotion Ready' },
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
              placeholder="Search student, school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} color="#94a3b8" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 200, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.75rem', py: 0.1 } }}
            />
          </Stack>
        </Box>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { background: '#f8fafc', color: '#475569', fontWeight: 800, fontSize: '0.72rem', py: 1.2 } }}>
                <TableCell>Roll / Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>School & District</TableCell>
                <TableCell align="right">Overall %</TableCell>
                <TableCell>Failing Subjects (&lt;33%)</TableCell>
                <TableCell align="center">Promotion Status</TableCell>
                <TableCell align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStudents.map((st, idx) => {
                const isAtRisk = st.promotion_status === 'AT_RISK';
                const isCond = st.promotion_status === 'CONDITIONAL';
                return (
                  <TableRow
                    key={st.student_id || idx}
                    sx={{
                      '& td': { py: 1, fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9' },
                      background: isAtRisk ? 'rgba(254, 242, 242, 0.4)' : 'transparent',
                      '&:hover': { background: '#f8fafc' }
                    }}
                  >
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#0f172a' }}>
                        {st.student_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Roll #{st.roll_number || 'N/A'} · {st.gender || 'Coh'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#0284c7' }}>
                      {st.class_name}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155' }}>
                        {st.school_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {st.district_name} · {st.block_name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: st.overall_pct >= 70 ? '#059669' : st.overall_pct >= 50 ? '#0284c7' : '#dc2626' }}>
                      {st.overall_pct}%
                    </TableCell>
                    <TableCell>
                      {st.failing_subjects ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {st.failing_subjects.split(', ').map((fs, i) => (
                            <Chip
                              key={i}
                              label={fs}
                              size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}
                            />
                          ))}
                        </Box>
                      ) : (
                        <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                          ✓ None (All Cleared)
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={st.status_label}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: isAtRisk ? '#fee2e2' : isCond ? '#fef3c7' : '#ecfdf5',
                          color: isAtRisk ? '#dc2626' : isCond ? '#d97706' : '#059669',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSendNudge(st)}
                        startIcon={<BellRing size={12} />}
                        sx={{
                          fontSize: '0.68rem',
                          borderRadius: 1.5,
                          textTransform: 'none',
                          py: 0.2,
                          px: 1,
                          borderColor: isAtRisk ? '#dc2626' : '#0284c7',
                          color: isAtRisk ? '#dc2626' : '#0284c7',
                        }}
                      >
                        Nudge
                      </Button>
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
