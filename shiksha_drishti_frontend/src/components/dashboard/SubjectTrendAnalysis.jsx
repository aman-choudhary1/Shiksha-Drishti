import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Card, Grid, Chip, Button, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, Select, MenuItem, FormControl,
  InputLabel, TextField, InputAdornment, alpha, CircularProgress
} from '@mui/material';
import {
  TrendingUp, TrendingDown, Minus, BookOpen, Search,
  Award, AlertTriangle, ArrowUpRight, BarChart2, Filter,
  RefreshCw, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { stateApi } from '../../services/api';

const SUBJECT_COLORS = [
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Rose
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#6366f1', // Indigo
];

export default function SubjectTrendAnalysis({ districtFilter = 'ALL', classFilter = 'ALL' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClass, setSelectedClass] = useState(classFilter || 'ALL');
  const [selectedDistrict, setSelectedDistrict] = useState(districtFilter || 'ALL');
  const [searchSubject, setSearchSubject] = useState('');
  const [highlightedSubject, setHighlightedSubject] = useState(null);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedDistrict !== 'ALL') params.district = selectedDistrict;
      if (selectedClass !== 'ALL') params.class_name = selectedClass;
      const res = await stateApi.getSubjectTrends(params);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load subject trends:', err);
      setError('Unable to load subject trends.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [selectedClass, selectedDistrict]);

  const subjects = data?.subjects || [];
  const timeline = data?.timeline || [];
  const kpis = data?.kpis || {};

  const filteredSubjects = useMemo(() => {
    if (!searchSubject.trim()) return subjects;
    const q = searchSubject.toLowerCase();
    return subjects.filter(s => (s.subject_name || '').toLowerCase().includes(q) || (s.subject_code || '').toLowerCase().includes(q));
  }, [subjects, searchSubject]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* ── Top Header & Filter Controls ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0284c7, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}>
              <TrendingUp size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f172a' }}>
                Subject-Wise Trend & Mastery Trajectory
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                Track student score progression across academic terms, exams, and diagnostic checkpoints
              </Typography>
            </Box>
          </Box>

          {/* Filter Dropdowns */}
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
              onClick={fetchTrends}
              startIcon={<RefreshCw size={13} />}
              sx={{ borderRadius: 2, fontSize: '0.75rem', textTransform: 'none' }}
            >
              Refresh Trends
            </Button>
          </Stack>
        </Box>
      </Card>

      {/* ── KPI Strategic Tiles ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
        gap: 2
      }}>
        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #0284c7' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Top Performing Subject
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284c7', mt: 0.5 }}>
            {kpis.highest_subject || 'Loading...'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircle2 size={13} /> Highest overall proficiency
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #10b981' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Most Improved Subject
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981', mt: 0.5 }}>
            {kpis.most_improved || 'Loading...'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp size={13} /> Positive term-over-term growth
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #ef4444' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Needs Critical Support
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#ef4444', mt: 0.5 }}>
            {kpis.needs_attention || 'Loading...'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AlertTriangle size={13} /> Priority remedial focus
          </Typography>
        </Card>

        <Card elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc', borderLeft: '4px solid #8b5cf6' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Core Subjects Tracked
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#8b5cf6', mt: 0.5 }}>
            {subjects.length} Subjects
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500, mt: 0.25 }}>
            Across all state exam terms
          </Typography>
        </Card>
      </Box>

      {/* ── Multi-Term Trend Line Chart ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              📈 Multi-Term Performance Trajectory
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
              Average subject scores tracked sequentially across assessments
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {subjects.slice(0, 5).map((s, idx) => (
              <Chip
                key={s.subject_name}
                label={s.subject_name}
                size="small"
                onClick={() => setHighlightedSubject(highlightedSubject === s.subject_name ? null : s.subject_name)}
                sx={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: highlightedSubject === s.subject_name ? SUBJECT_COLORS[idx % SUBJECT_COLORS.length] : alpha(SUBJECT_COLORS[idx % SUBJECT_COLORS.length], 0.12),
                  color: highlightedSubject === s.subject_name ? '#ffffff' : SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
                  border: `1px solid ${SUBJECT_COLORS[idx % SUBJECT_COLORS.length]}`,
                }}
              />
            ))}
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={36} sx={{ color: '#0284c7' }} />
          </Box>
        ) : timeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={timeline} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="term" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" unit="%" />
              <RTooltip
                contentStyle={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(val, name) => [`${val}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              {subjects.map((s, idx) => {
                const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
                const isDimmed = highlightedSubject && highlightedSubject !== s.subject_name;
                return (
                  <Line
                    key={s.subject_name}
                    type="monotone"
                    dataKey={s.subject_name}
                    stroke={color}
                    strokeWidth={highlightedSubject === s.subject_name ? 3.5 : 2.2}
                    opacity={isDimmed ? 0.25 : 1}
                    dot={{ r: 4, strokeWidth: 1.5, fill: '#ffffff' }}
                    activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>No trend data available for selected filter.</Typography>
          </Box>
        )}
      </Card>

      {/* ── Subject Performance Matrix Table ── */}
      <Card elevation={0} className="glass-card-premium" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
              📊 Subject Diagnostic Breakdown
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
              Detailed score trajectory, growth delta, and remedial deficits
            </Typography>
          </Box>
          <TextField
            size="small"
            placeholder="Search subject..."
            value={searchSubject}
            onChange={(e) => setSearchSubject(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={14} color="#94a3b8" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 220, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.75rem' } }}
          />
        </Box>

        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2.5, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { background: '#f8fafc', color: '#475569', fontWeight: 800, fontSize: '0.72rem', py: 1.2 } }}>
                <TableCell>Subject Name</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell align="right">Initial Term</TableCell>
                <TableCell align="right">Current Term</TableCell>
                <TableCell align="center">Trajectory Delta</TableCell>
                <TableCell align="right">Overall Avg %</TableCell>
                <TableCell align="right">Weak Students (&lt;40%)</TableCell>
                <TableCell align="center">Mastery Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.map((s, idx) => {
                const isImproving = s.delta > 0;
                const isDeclining = s.delta < 0;
                return (
                  <TableRow key={idx} sx={{ '& td': { py: 1, fontSize: '0.76rem', borderBottom: '1px solid #f1f5f9' }, '&:hover': { background: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                      {s.subject_name}
                    </TableCell>
                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>
                      {s.subject_code || 'SUB-0' + (idx + 1)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#64748b' }}>
                      {s.initial_score}%
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      {s.current_score}%
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        icon={isImproving ? <TrendingUp size={12} /> : isDeclining ? <TrendingDown size={12} /> : <Minus size={12} />}
                        label={`${isImproving ? '+' : ''}${s.delta}%`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: isImproving ? '#ecfdf5' : isDeclining ? '#fef2f2' : '#f1f5f9',
                          color: isImproving ? '#059669' : isDeclining ? '#dc2626' : '#64748b',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: s.avg_score_pct >= 70 ? '#059669' : s.avg_score_pct >= 60 ? '#0284c7' : '#ef4444' }}>
                      {s.avg_score_pct}%
                    </TableCell>
                    <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 700 }}>
                      {(s.weak_count || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={s.avg_score_pct >= 75 ? 'Mastery' : s.avg_score_pct >= 60 ? 'Proficient' : 'Needs Support'}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          background: s.avg_score_pct >= 75 ? '#d1fae5' : s.avg_score_pct >= 60 ? '#e0f2fe' : '#fee2e2',
                          color: s.avg_score_pct >= 75 ? '#065f46' : s.avg_score_pct >= 60 ? '#0369a1' : '#991b1b',
                        }}
                      />
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
