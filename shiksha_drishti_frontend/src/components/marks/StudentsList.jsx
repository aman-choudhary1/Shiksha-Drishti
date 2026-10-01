import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Card, CardContent, Button,
  Chip, Avatar, TextField, InputAdornment, Skeleton,
  Alert, Stack, FormControl, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, alpha, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import {
  Search, People, School, Refresh, Person,
  Female, Male, Cake, Badge as BadgeIcon,
  GridView, ViewList, CheckCircle, FilterList,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { masterApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import educationSvg from '../../assets/Education-bro.svg';

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function StudentsList() {
  const { user, assignments } = useAuth();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Default to first assigned class
  useEffect(() => {
    if (assignments?.length > 0 && !selectedClassId) {
      setSelectedClassId(String(assignments[0].class_id));
    }
  }, [assignments, selectedClassId]);

  const activeClassObj = useMemo(() => {
    return (assignments || []).find(a => String(a.class_id) === String(selectedClassId));
  }, [assignments, selectedClassId]);

  const fetchStudents = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    setError('');
    try {
      const targetUdise = activeClassObj?.school_udise || user?.primary_udise;
      const res = await masterApi.getStudents(selectedClassId, {
        school_udise: targetUdise,
      });
      setStudents(res.data || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load students for this class.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassId && user) {
      fetchStudents();
    }
  }, [selectedClassId, user, activeClassObj]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        (s.student_name || '').toLowerCase().includes(q) ||
        String(s.roll_number || '').includes(q) ||
        (s.guardian_name || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (genderFilter !== 'ALL' && s.gender !== genderFilter) return false;
      return true;
    });
  }, [students, searchTerm, genderFilter]);

  const boysCount = students.filter(s => s.gender === 'M').length;
  const girlsCount = students.filter(s => s.gender === 'F').length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* ── 1. Header ── */}
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
            Student Directory
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <School sx={{ fontSize: 16, color: '#0284c7' }} />
            {user?.school_name || 'Chhattisgarh School'} · Session 2026-27
          </Typography>
        </Box>

        {/* Top Controls: Class Selector + Refresh */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 220 } }}>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              displayEmpty
              sx={{
                borderRadius: 2.5,
                background: '#ffffff',
                fontWeight: 700,
                fontSize: '0.82rem',
                height: 38,
                border: '1px solid #cbd5e1',
                '& .MuiSelect-select': { py: 0.8 },
              }}
            >
              {(assignments || []).map(a => (
                <MenuItem key={a.class_id} value={String(a.class_id)}>
                  {a.class_name} ({a.student_count || 0} Students)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Refresh sx={{ fontSize: 16 }} />}
            onClick={fetchStudents}
            sx={{
              borderRadius: 2.5,
              borderColor: '#cbd5e1',
              color: '#475569',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              px: 2,
              height: 38,
              '&:hover': { borderColor: '#94a3b8', background: 'rgba(241, 245, 249, 0.8)' },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* ── 2. Compact 4-Card Summary Metrics Row (Full Width Grid) ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
        gap: 2,
        width: '100%',
        mb: 2.5,
      }}>
        {[
          {
            label: 'Total Enrolled',
            value: students.length,
            sub: activeClassObj ? `${activeClassObj.class_name}` : 'Class Roster',
            color: '#0f3460',
            icon: <People sx={{ fontSize: 20, color: '#0f3460' }} />,
            bg: 'rgba(15, 52, 96, 0.08)',
          },
          {
            label: 'Boys (बालक)',
            value: boysCount,
            sub: students.length ? `${Math.round((boysCount / students.length) * 100)}% of class` : '0%',
            color: '#0284c7',
            icon: <Male sx={{ fontSize: 20, color: '#0284c7' }} />,
            bg: 'rgba(2, 132, 199, 0.08)',
          },
          {
            label: 'Girls (बालिका)',
            value: girlsCount,
            sub: students.length ? `${Math.round((girlsCount / students.length) * 100)}% of class` : '0%',
            color: '#ec4899',
            icon: <Female sx={{ fontSize: 20, color: '#ec4899' }} />,
            bg: 'rgba(236, 72, 153, 0.08)',
          },
          {
            label: 'Active Class',
            value: activeClassObj?.class_name || 'Class',
            sub: 'UDISE+ Registered',
            color: '#10b981',
            icon: <School sx={{ fontSize: 20, color: '#10b981' }} />,
            bg: 'rgba(16, 185, 129, 0.08)',
          },
        ].map((item, idx) => (
          <Card key={idx} sx={{
            p: 1.8,
            borderRadius: 3,
            border: `1px solid ${alpha(item.color, 0.16)}`,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
            background: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: item.color,
            }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box sx={{
                width: 34,
                height: 34,
                borderRadius: 2,
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </Box>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                {item.label}
              </Typography>
            </Box>
            <Typography sx={{
              fontSize: { xs: '1.35rem', sm: '1.55rem' },
              fontWeight: 800,
              color: item.color,
              lineHeight: 1.1,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              mb: 0.3,
            }}>
              {item.value}
            </Typography>
            <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {item.sub}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* ── 3. Search, Filter & View Mode Bar ── */}
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
        {/* Search */}
        <TextField
          size="small"
          placeholder="Search student name, roll number, or guardian..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flex: { xs: '1 1 100%', sm: '1 1 280px' },
            maxWidth: { sm: 360 },
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

        {/* Filters and View Mode */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          {/* Gender Filter Chips */}
          <Stack direction="row" spacing={0.75}>
            {[
              { key: 'ALL', label: `All (${students.length})` },
              { key: 'M', label: `Boys (${boysCount})` },
              { key: 'F', label: `Girls (${girlsCount})` },
            ].map(g => {
              const active = genderFilter === g.key;
              return (
                <Chip
                  key={g.key}
                  label={g.label}
                  clickable
                  onClick={() => setGenderFilter(g.key)}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 28,
                    borderRadius: 2,
                    background: active ? '#0f3460' : 'rgba(241, 245, 249, 0.9)',
                    color: active ? '#ffffff' : '#475569',
                    border: active ? '1px solid #0f3460' : '1px solid #e2e8f0',
                  }}
                />
              );
            })}
          </Stack>

          {/* View Toggle */}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            size="small"
            sx={{
              height: 30,
              background: '#f8fafc',
              borderRadius: 2,
              '& .MuiToggleButton-root': {
                border: '1px solid #e2e8f0',
                px: 1,
                py: 0.2,
                color: '#64748b',
                '&.Mui-selected': {
                  background: '#0f3460',
                  color: '#ffffff',
                },
              },
            }}
          >
            <ToggleButton value="grid" aria-label="Grid View">
              <Tooltip title="Card Grid View"><GridView sx={{ fontSize: 16 }} /></Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="Table View">
              <Tooltip title="Table View"><ViewList sx={{ fontSize: 16 }} /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

      {/* Error Banner */}
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2.5 }} action={
          <Button color="inherit" size="small" onClick={fetchStudents}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* ── 4. Main Content: Grid vs Table View ── */}
      {loading ? (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%',
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} variant="rectangular" height={150} sx={{ borderRadius: 3.5 }} />
          ))}
        </Box>
      ) : filtered.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3.5, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.9)' }}>
          <Box
            component="img"
            src={educationSvg}
            alt="No students"
            sx={{ maxHeight: 130, mb: 2, opacity: 0.8 }}
          />
          <Typography sx={{ fontWeight: 800, color: '#1e293b', mb: 0.5, fontSize: '1.05rem' }}>
            No Students Found
          </Typography>
          <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mb: 1, maxWidth: 360, mx: 'auto' }}>
            {searchTerm || genderFilter !== 'ALL'
              ? 'No student matches your search criteria.'
              : 'No students enrolled in this class yet.'}
          </Typography>
        </Paper>
      ) : viewMode === 'grid' ? (
        /* ── 4-4-4 Compact Grid View (3 Equal Columns) ── */
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%',
        }}>
          {filtered.map((st, i) => {
            const isFemale = st.gender === 'F';
            const genderColor = isFemale ? '#ec4899' : '#0284c7';
            const dobFormatted = st.dob ? new Date(st.dob).toLocaleDateString('en-GB') : null;

            return (
              <motion.div
                key={st.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                style={{ height: '100%', width: '100%' }}
              >
                <Card sx={{
                  p: 1.8,
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  background: '#ffffff',
                  height: '100%',
                  width: '100%',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: genderColor,
                    boxShadow: `0 10px 24px ${alpha(genderColor, 0.12)}`,
                    transform: 'translateY(-3px)',
                  },
                  transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
                }}>
                  {/* Left Accent Bar */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 3.5,
                    background: genderColor,
                  }} />

                  {/* Card Top: Avatar + Name + Roll Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 1.2, pl: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                      <Avatar sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2.2,
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        background: isFemale
                          ? 'linear-gradient(135deg, #ec4899, #f43f5e)'
                          : 'linear-gradient(135deg, #0284c7, #1d4ed8)',
                        color: '#ffffff',
                        flexShrink: 0,
                        boxShadow: `0 3px 10px ${alpha(genderColor, 0.3)}`,
                      }}>
                        {st.student_name?.[0]?.toUpperCase() || 'S'}
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
                          {st.student_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                          {isFemale ? (
                            <Female sx={{ fontSize: 13, color: '#ec4899' }} />
                          ) : (
                            <Male sx={{ fontSize: 13, color: '#0284c7' }} />
                          )}
                          <Typography sx={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                            {isFemale ? 'Female' : 'Male'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Roll No Badge */}
                    <Chip
                      label={`Roll #${st.roll_number}`}
                      size="small"
                      sx={{
                        height: 22,
                        borderRadius: 1.5,
                        fontWeight: 800,
                        fontSize: '0.68rem',
                        background: 'rgba(15, 52, 96, 0.07)',
                        color: '#0f3460',
                        border: '1px solid rgba(15, 52, 96, 0.12)',
                        flexShrink: 0,
                      }}
                    />
                  </Box>

                  {/* Card Details: Guardian & DOB */}
                  <Box sx={{
                    p: 1.1,
                    pl: 1.5,
                    borderRadius: 2,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Person sx={{ fontSize: 14, color: '#94a3b8' }} />
                      <Typography sx={{ fontSize: '0.73rem', color: '#475569', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Guardian: <strong style={{ color: '#0f172a' }}>{st.guardian_name || 'N/A'}</strong>
                      </Typography>
                    </Box>

                    {dobFormatted && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Cake sx={{ fontSize: 14, color: '#94a3b8' }} />
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                          DOB: {dobFormatted}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </motion.div>
            );
          })}
        </Box>
      ) : (
        /* ── Modern Sleek Table View ── */
        <Paper sx={{
          borderRadius: 3.5,
          overflow: 'hidden',
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
        }}>
          <TableContainer sx={{ maxHeight: '60vh' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2, width: 80 }}>
                    Roll #
                  </TableCell>
                  <TableCell sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>
                    Student Name
                  </TableCell>
                  <TableCell sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>
                    Guardian / Father
                  </TableCell>
                  <TableCell align="center" sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>
                    Gender
                  </TableCell>
                  <TableCell align="center" sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>
                    DOB
                  </TableCell>
                  <TableCell align="center" sx={{ background: '#0f3460 !important', color: '#ffffff', fontWeight: 800, fontSize: '0.76rem', py: 1.2 }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((st, idx) => {
                  const isFemale = st.gender === 'F';
                  return (
                    <TableRow
                      key={st.id}
                      sx={{
                        background: idx % 2 === 0 ? '#ffffff' : 'rgba(248, 250, 252, 0.75)',
                        '&:hover': { background: 'rgba(241, 245, 249, 0.9) !important' },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.84rem' }}>
                        #{st.roll_number}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            background: isFemale ? 'linear-gradient(135deg, #ec4899, #f43f5e)' : 'linear-gradient(135deg, #0284c7, #1d4ed8)',
                          }}>
                            {st.student_name?.[0]?.toUpperCase() || 'S'}
                          </Avatar>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.84rem' }}>
                            {st.student_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                        {st.guardian_name || '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={isFemale ? <Female sx={{ fontSize: '12px !important' }} /> : <Male sx={{ fontSize: '12px !important' }} />}
                          label={isFemale ? 'Female' : 'Male'}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: isFemale ? 'rgba(236, 72, 153, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                            color: isFemale ? '#be185d' : '#0369a1',
                            border: `1px solid ${isFemale ? 'rgba(236, 72, 153, 0.25)' : 'rgba(2, 132, 199, 0.25)'}`,
                          }}
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
                        {st.dob ? new Date(st.dob).toLocaleDateString('en-GB') : '—'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<CheckCircle sx={{ fontSize: '11px !important', color: '#059669 !important' }} />}
                          label="Enrolled"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#047857',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}
