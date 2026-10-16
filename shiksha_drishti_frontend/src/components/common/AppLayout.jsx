import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Tooltip, Divider, Badge, useMediaQuery, useTheme, Chip, Button,
  Menu, MenuItem, alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard, AssignmentTurnedIn, School,
  People, BarChart, Logout, ChevronLeft,
  NotificationsNone, Add, AutoAwesome,
  HelpOutlineOutlined, KeyboardArrowDown,
  Insights, Layers, FiberManualRecord,
  MapOutlined, TrendingUp, EmojiEvents,
  CompareArrows, Groups, Download
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH_OPEN   = 276;
const DRAWER_WIDTH_CLOSED = 68;

const teacherNavSections = [
  {
    title: 'Classroom Command',
    items: [
      { label: 'Class Overview',      icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7', badge: 'Live' },
      { label: 'Assigned Classes',    icon: <Layers />,             path: '/dashboard?tab=1',    tabIndex: 1, color: '#6366f1', badge: 'Matrix' },
      { label: 'Exam & Marks Hub',    icon: <AssignmentTurnedIn />, path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981', badge: 'Assess' },
    ]
  },
  {
    title: 'Academic & Students',
    items: [
      { label: 'Student Directory',   icon: <People />,             path: '/students',           color: '#f59e0b', badge: 'Roster' },
      { label: 'Class Diagnostics',   icon: <BarChart />,           path: '/dashboard?tab=3',    tabIndex: 3, color: '#06b6d4', badge: 'Analytics' },
      { label: 'LO & Question Marks', icon: <AutoAwesome />,        path: '/analytics',          color: '#ec4899', badge: 'LO' },
      { label: 'Academic Analytics',  icon: <Insights />,           path: '/academic-analytics', color: '#8b5cf6', badge: 'UDISE' },
    ]
  },
  {
    title: 'Curriculum & Resources',
    items: [
      { label: 'Question Bank',       icon: <School />,             path: '/question-bank',      color: '#0284c7', badge: 'Admin' },
      { label: 'SCERT Digital DIKSHA',icon: <TrendingUp />,         path: '/dashboard?tab=4',    tabIndex: 4, color: '#f97316', badge: 'Remedial' },
      { label: 'School Profile',      icon: <School />,             path: '/schools',            color: '#ef4444' },
    ]
  }
];

const principalNavItems = [
  { label: 'School Overview',     icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Academic Analytics',  icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',       icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'Faculty Performance', icon: <AssignmentTurnedIn />, path: '/dashboard?tab=1',    tabIndex: 1, color: '#10b981' },
  { label: 'Student Analytics',   icon: <People />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#f59e0b' },
  { label: 'Exam Comparison',     icon: <BarChart />,           path: '/dashboard?tab=3',    tabIndex: 3, color: '#06b6d4' },
  { label: 'LO Mastery',          icon: <AutoAwesome />,        path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899', badge: 'LO' },
  { label: 'School Profile',      icon: <School />,             path: '/schools',            color: '#ef4444' },
];

const cacNavItems = [
  { label: 'Cluster Overview',   icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Academic Analytics', icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',      icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'School Matrix',      icon: <AssignmentTurnedIn />, path: '/dashboard?tab=1',    tabIndex: 1, color: '#10b981' },
  { label: 'LO Diagnostics',     icon: <AutoAwesome />,        path: '/dashboard?tab=2',    tabIndex: 2, color: '#f59e0b', badge: 'LO' },
  { label: 'HOS Directory',      icon: <School />,             path: '/dashboard?tab=3',    tabIndex: 3, color: '#ef4444' },
];

const blockNavItems = [
  { label: 'Block Overview',       icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Academic Analytics',   icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',        icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'Cluster Benchmarks',   icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#10b981' },
  { label: 'School League Table',  icon: <School />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#f59e0b' },
  { label: 'Question Diagnostics', icon: <AutoAwesome />,        path: '/dashboard?tab=3',    tabIndex: 3, color: '#06b6d4', badge: 'BEO' },
  { label: 'Faculty Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
];

const districtNavItems = [
  { label: 'District Overview',    icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Academic Analytics',   icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',        icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'Block Benchmarks',     icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#10b981' },
  { label: 'School League Table',  icon: <School />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#f59e0b' },
  { label: 'Question Diagnostics', icon: <AutoAwesome />,        path: '/dashboard?tab=3',    tabIndex: 3, color: '#06b6d4', badge: 'DEO' },
  { label: 'Faculty Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
];

// ── State Level Nav Structure (Grouped into Executive Sections) ─────────────────
const stateNavSections = [
  {
    title: 'Command & GIS',
    items: [
      { label: 'State Overview',         icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
      { label: 'State GIS Heatmap',      icon: <MapOutlined />,        path: '/dashboard?tab=1',    tabIndex: 1, color: '#059669', badge: 'GIS' },
      { label: 'Academic Analytics',     icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE+' },
    ]
  },
  {
    title: 'Academic Intelligence',
    items: [
      { label: 'Subject Trends',         icon: <TrendingUp />,         path: '/dashboard?tab=2',    tabIndex: 2, color: '#8b5cf6', badge: 'Growth' },
      { label: 'Promotion Readiness',    icon: <EmojiEvents />,        path: '/dashboard?tab=3',    tabIndex: 3, color: '#f59e0b', badge: 'Retention' },
      { label: 'Student Performance',    icon: <People />,             path: '/dashboard?tab=5',    tabIndex: 5, color: '#06b6d4', badge: 'Cohort' },
      { label: 'Subject Diagnostics',    icon: <BarChart />,           path: '/dashboard?tab=8',    tabIndex: 8, color: '#ec4899' },
      { label: 'Question Analytics',     icon: <AutoAwesome />,        path: '/dashboard?tab=9',    tabIndex: 9, color: '#f97316', badge: 'LO' },
    ]
  },
  {
    title: 'District Governance & Cadre',
    items: [
      { label: 'District League Table',  icon: <Layers />,             path: '/dashboard?tab=6',    tabIndex: 6, color: '#10b981', badge: 'Rankings' },
      { label: 'District Benchmarking',  icon: <CompareArrows />,      path: '/dashboard?tab=7',    tabIndex: 7, color: '#14b8a6', badge: 'Radar' },
      { label: 'Submission Tracker',     icon: <AssignmentTurnedIn />, path: '/dashboard?tab=4',    tabIndex: 4, color: '#3b82f6', badge: 'Compliance' },
      { label: 'Teacher Matrix',         icon: <Groups />,             path: '/dashboard?tab=10',   tabIndex: 10, color: '#a855f7' },
    ]
  },
  {
    title: 'Curriculum & Reports',
    items: [
      { label: 'Question Bank Authoring',icon: <School />,             path: '/question-bank',      color: '#6366f1', badge: 'Admin' },
      { label: 'Report Download Center', icon: <Download />,           path: '/dashboard?tab=11',   tabIndex: 11, color: '#059669', badge: 'Excel' },
    ]
  }
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const theme            = useTheme();
  const isMobile         = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl]     = useState(null);

  const isState    = user?.role === 'STATE_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDistrict = user?.role === 'DISTRICT_OFFICER' || user?.role === 'DEO';
  const isBlock    = user?.role === 'BLOCK_OFFICER' || user?.role === 'BEO';
  const isCac      = user?.role === 'CAC' || user?.role === 'CLUSTER_COORDINATOR';
  const isPrincipal = user?.role === 'SCHOOL_ADMIN';
  const canCreateAssessment = user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN';

  // Grouped Navigation Sections for rendering
  const navSections = useMemo(() => {
    if (isState) return stateNavSections;
    if (isDistrict) {
      return [
        { title: 'District Overview', items: districtNavItems.slice(0, 3) },
        { title: 'Analytics & Benchmarks', items: districtNavItems.slice(3) }
      ];
    }
    if (isBlock) {
      return [
        { title: 'Block Overview', items: blockNavItems.slice(0, 3) },
        { title: 'Cluster Monitoring', items: blockNavItems.slice(3) }
      ];
    }
    if (isCac) {
      return [
        { title: 'Cluster Overview', items: cacNavItems.slice(0, 3) },
        { title: 'School Operations', items: cacNavItems.slice(3) }
      ];
    }
    if (isPrincipal) {
      return [
        { title: 'School Core', items: principalNavItems.slice(0, 4) },
        { title: 'Academics & Profiles', items: principalNavItems.slice(4) }
      ];
    }
    return teacherNavSections;
  }, [isState, isDistrict, isBlock, isCac, isPrincipal]);

  const drawerWidth = isMobile ? DRAWER_WIDTH_OPEN : (drawerOpen ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    const s = location.search;
    if (p.includes('/academic-analytics') || p.includes('/academic')) return 'Overall Academic Analytics (UDISE+ 5.75M Active Students)';
    if (p.includes('/question-bank'))  return 'Assessment Question Bank & Paper Authoring';
    if (p.includes('/report-card'))    return 'Class Report Card';
    if (p.includes('/question-marks')) return 'LO Marks Entry';
    if (p.includes('/assessments/new'))return 'Create Assessment';
    if (p.includes('/assessments'))    return 'Assessments';
    if (p.includes('/students'))       return 'Student Directory';
    if (p.includes('/analytics'))      return 'Analytics & LO';
    if (p.includes('/schools'))        return 'School Profile';
    if (isState) {
      if (s.includes('tab=1')) return 'Chhattisgarh State GIS Cartography & Heatmap';
      if (s.includes('tab=2')) return 'Subject Trend & Learning Growth Diagnostics';
      if (s.includes('tab=3')) return 'Class Promotion & Retention Readiness';
      if (s.includes('tab=4')) return 'Teacher Assessment Submission & Compliance Tracker';
      if (s.includes('tab=5')) return 'Student Performance & Cohort Analytics';
      if (s.includes('tab=6')) return 'District Performance League & Rankings';
      if (s.includes('tab=7')) return 'District Academic Score Benchmarking';
      if (s.includes('tab=8')) return 'State Subject Diagnostic Analysis';
      if (s.includes('tab=9')) return 'Question & Learning Outcome (LO) Analytics';
      if (s.includes('tab=10')) return 'Teacher Cadre & Faculty Matrix';
      if (s.includes('tab=11')) return 'State Reports & Data Download Center';
      return 'Chhattisgarh Education Intelligence Command Centre';
    }
    if (isDistrict) return 'District Education Command Center (DEO)';
    if (isBlock)    return 'Block Education Command Center (BEO)';
    if (isCac)      return 'Cluster Command Center (CAC)';
    if (isPrincipal) return 'Principal Dashboard';

    // Class Teacher Tab Titles
    if (s.includes('tab=1')) return 'Assigned Classes & Academic Matrix';
    if (s.includes('tab=2')) return 'Examination Hub & Marks Submission Register';
    if (s.includes('tab=3')) return 'Class Diagnostics & Subject Analytics';
    if (s.includes('tab=4')) return 'SCERT Digital Remedial & DIKSHA Learning Center';
    return 'Teacher Academic Command Center · Class Overview';
  };

  const getRoleLabel = () => {
    if (user?.role === 'STATE_ADMIN' || user?.role === 'SUPER_ADMIN') return 'State Administrator (SA)';
    if (user?.role === 'DISTRICT_OFFICER' || user?.role === 'DEO') return 'District Education Officer (DEO)';
    if (user?.role === 'BLOCK_OFFICER' || user?.role === 'BEO') return 'Block Education Officer (BEO)';
    if (user?.role === 'CAC' || user?.role === 'CLUSTER_COORDINATOR') return 'Cluster Coordinator (CAC)';
    if (user?.role === 'SCHOOL_ADMIN') return 'School Principal';
    return 'Class Teacher';
  };

  const getRoleAccent = () => {
    if (isState) return '#0284c7';
    if (isDistrict) return '#6366f1';
    if (isBlock) return '#10b981';
    if (isCac) return '#f59e0b';
    if (isPrincipal) return '#f97316';
    return '#0284c7';
  };

  const getRoleBg = () => {
    if (isState) return 'linear-gradient(135deg, #0369a1, #0284c7)';
    if (isDistrict) return 'linear-gradient(135deg, #4f46e5, #6366f1)';
    if (isBlock) return 'linear-gradient(135deg, #059669, #10b981)';
    if (isCac) return 'linear-gradient(135deg, #d97706, #f59e0b)';
    if (isPrincipal) return 'linear-gradient(135deg, #ea580c, #f97316)';
    return 'linear-gradient(135deg, #0369a1, #0284c7)';
  };

  const accent = getRoleAccent();

  // Active check helper for exact and tab-based paths
  const isItemActive = (item) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (item.path.includes('?')) {
      const [itemBase, itemQuery] = item.path.split('?');
      if (currentPath !== itemBase) return false;
      const itemParams = new URLSearchParams(itemQuery);
      const currentParams = new URLSearchParams(currentSearch);
      const itemTab = itemParams.get('tab');
      const currentTab = currentParams.get('tab') || '0';
      return itemTab === currentTab;
    }

    if (item.path === '/dashboard') {
      return currentPath === '/dashboard' && (!currentSearch || currentSearch === '?tab=0');
    }

    return currentPath === item.path || currentPath.startsWith(item.path + '/');
  };

  // ── Sidebar Content ──────────────────────────────────────────────────────────
  const sidebarContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      overflowX: 'hidden',
      borderRight: '1px solid #e2e8f0',
    }}>

      {/* ── Brand Header ─────────────────────────────────────────────────────── */}
      <Box sx={{
        height: 64,
        px: drawerOpen ? 2.5 : 1.25,
        display: 'flex',
        alignItems: 'center',
        justifyContent: drawerOpen ? 'space-between' : 'center',
        background: `linear-gradient(135deg, ${accent}15 0%, ${accent}06 100%)`,
        borderBottom: `1px solid ${accent}22`,
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box sx={{
            width: 36, height: 36,
            borderRadius: 1.5,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${accent}40`,
          }}>
            <School sx={{ color: '#ffffff', fontSize: 20 }} />
          </Box>
          {drawerOpen && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography sx={{
                color: '#0f172a', fontWeight: 900,
                fontSize: '0.98rem', lineHeight: 1.15,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                letterSpacing: '-0.02em',
              }}>
                शिक्षा दृष्टि
              </Typography>
              <Typography sx={{
                color: accent,
                fontWeight: 800, fontSize: '0.62rem',
                letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block',
              }}>
                Chhattisgarh VSK
              </Typography>
            </Box>
          )}
        </Box>
        {drawerOpen && !isMobile && (
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            sx={{
              color: '#94a3b8',
              borderRadius: 1.5, p: 0.5,
              '&:hover': { color: '#0f172a', background: '#f1f5f9' },
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* ── User Profile Card ─────────────────────────────────────────────────── */}
      {drawerOpen ? (
        <Box sx={{
          mx: 1.5, mt: 1.5, mb: 0.5,
          p: 1.5,
          borderRadius: 1.5,
          background: `linear-gradient(135deg, ${alpha(accent, 0.08)} 0%, ${alpha(accent, 0.03)} 100%)`,
          border: `1px solid ${alpha(accent, 0.18)}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{
              width: 38, height: 38,
              borderRadius: 1.5,
              background: getRoleBg(),
              fontSize: '0.9rem', fontWeight: 800,
              boxShadow: `0 4px 12px ${alpha(accent, 0.35)}`,
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <Typography sx={{
                color: '#0f172a', fontWeight: 800, fontSize: '0.84rem',
                lineHeight: 1.2,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.full_name || 'Administrator'}
              </Typography>
              <Typography sx={{
                color: accent,
                fontWeight: 800, fontSize: '0.66rem', display: 'block', lineHeight: 1.2, mt: 0.2
              }}>
                {getRoleLabel()}
              </Typography>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
          <Tooltip title={`${user?.full_name} · ${getRoleLabel()}`} placement="right">
            <Avatar sx={{
              width: 36, height: 36, borderRadius: 1.5,
              background: getRoleBg(),
              fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* ── Quick Create Assessment Button (Teachers / School Admins) ─────────── */}
      {drawerOpen && canCreateAssessment && (
        <Box sx={{ px: 1.5, mt: 1 }}>
          <Button
            fullWidth size="small"
            onClick={() => { navigate('/assessments/new'); if (isMobile) setDrawerOpen(false); }}
            startIcon={<Add sx={{ fontSize: 17 }} />}
            sx={{
              py: 0.85, borderRadius: 1.5,
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#ffffff',
              fontWeight: 800, fontSize: '0.78rem',
              boxShadow: `0 4px 12px ${alpha(accent, 0.3)}`,
              border: 'none',
              textTransform: 'none',
              '&:hover': {
                boxShadow: `0 6px 18px ${alpha(accent, 0.45)}`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.18s ease',
            }}
          >
            + New Assessment
          </Button>
        </Box>
      )}

      {/* ── Categorized Navigation Sections List ──────────────────────────────── */}
      <List sx={{
        flex: 1,
        px: 1,
        pt: 0.5,
        overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: 2 },
      }}>
        {navSections.map((section, sIdx) => (
          <Box key={section.title || sIdx} sx={{ mb: 1 }}>
            {/* Section Category Title */}
            {drawerOpen && (
              <Typography sx={{
                px: 1.5,
                pt: sIdx === 0 ? 0.75 : 1.5,
                pb: 0.4,
                fontSize: '0.62rem',
                fontWeight: 800,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontFamily: '"Plus Jakarta Sans", sans-serif'
              }}>
                {section.title}
              </Typography>
            )}
            {!drawerOpen && sIdx > 0 && (
              <Divider sx={{ my: 0.75, borderColor: '#f1f5f9' }} />
            )}

            {/* Section Items */}
            {section.items.map((item) => {
              const isActive = isItemActive(item);

              const btn = (
                <ListItemButton
                  onClick={() => {
                    navigate(item.path);
                    if (isMobile) setDrawerOpen(false);
                  }}
                  sx={{
                    borderRadius: 1.5,
                    py: 0.85,
                    px: drawerOpen ? 1.4 : 1,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    background: isActive ? `linear-gradient(90deg, ${alpha(item.color, 0.12)} 0%, ${alpha(item.color, 0.04)} 100%)` : 'transparent',
                    borderLeft: isActive ? `3.5px solid ${item.color}` : '3.5px solid transparent',
                    boxShadow: isActive ? `0 2px 8px ${alpha(item.color, 0.1)}` : 'none',
                    mb: 0.35,
                    '&:hover': {
                      background: isActive ? `linear-gradient(90deg, ${alpha(item.color, 0.16)} 0%, ${alpha(item.color, 0.06)} 100%)` : '#f8fafc',
                    },
                    transition: 'all 0.16s ease',
                  }}
                >
                  <ListItemIcon sx={{
                    color: isActive ? item.color : '#64748b',
                    minWidth: drawerOpen ? 34 : 'auto',
                    justifyContent: 'center',
                    '& .MuiSvgIcon-root': { fontSize: 18 },
                    transition: 'color 0.15s ease',
                  }}>
                    {item.icon}
                  </ListItemIcon>

                  {drawerOpen && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '0.8rem',
                        color: isActive ? '#0f172a' : '#475569',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                        letterSpacing: '-0.01em',
                      }}
                    />
                  )}

                  {drawerOpen && item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      sx={{
                        height: 18,
                        borderRadius: 1,
                        fontSize: '0.58rem',
                        fontWeight: 800,
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}35`,
                        px: 0.25,
                      }}
                    />
                  )}
                </ListItemButton>
              );

              return (
                <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                  {!drawerOpen && !isMobile
                    ? <Tooltip title={item.label} placement="right">{btn}</Tooltip>
                    : btn
                  }
                </ListItem>
              );
            })}
          </Box>
        ))}
      </List>

      {/* ── Footer Status & Sign Out ─────────────────────────────────────────── */}
      {drawerOpen && (
        <Box sx={{ px: 1.5, pb: 0.5 }}>
          <Box sx={{
            p: 1.2,
            borderRadius: 1.5,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            mb: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FiberManualRecord sx={{ fontSize: 8, color: '#10b981' }} />
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#1e293b' }}>
                Session 2026-27 · Active
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.2, fontWeight: 600 }}>
              UDISE+ Live State Telemetry
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ p: drawerOpen ? 1.5 : 1, borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
        {drawerOpen ? (
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 1.5,
              py: 0.85,
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              '&:hover': { background: '#fde8e8', borderColor: '#fca5a5' },
              transition: 'all 0.15s ease'
            }}
          >
            <ListItemIcon sx={{ color: '#ef4444', minWidth: 32 }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 800, fontSize: '0.8rem', color: '#ef4444' }}
            />
          </ListItemButton>
        ) : (
          <Tooltip title="Sign Out" placement="right">
            <IconButton onClick={handleLogout} sx={{ color: '#ef4444', mx: 'auto', display: 'flex' }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  // ── Main Layout ─────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── Top AppBar ─────────────────────────────────────────────────────────── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 1.5, sm: 2.5 }, gap: 1 }}>

          {/* Hamburger */}
          <IconButton
            onClick={() => setDrawerOpen(v => !v)}
            sx={{
              color: '#374151', mr: 0.5,
              borderRadius: 1.5,
              border: '1px solid #e5e7eb',
              p: 0.8,
              '&:hover': { background: '#f9fafb', borderColor: '#d1d5db' },
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
          </IconButton>

          {/* Page Title */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            <Typography sx={{
              fontWeight: 900, color: '#0f172a',
              fontSize: { xs: '0.88rem', sm: '1.02rem' },
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.02em',
            }}>
              {getPageTitle()}
            </Typography>
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center', gap: 0.5,
              px: 1.2, py: 0.35, borderRadius: 20, flexShrink: 0,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
            }}>
              <FiberManualRecord sx={{ fontSize: 7, color: '#10b981' }} />
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, color: '#059669' }}>
                2026-27 · Live
              </Typography>
            </Box>
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Help & Guide">
              <IconButton size="small" sx={{
                color: '#6b7280', borderRadius: 1.5,
                '&:hover': { background: '#f3f4f6', color: '#374151' },
              }}>
                <HelpOutlineOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{
                color: '#6b7280', borderRadius: 1.5,
                '&:hover': { background: '#f3f4f6', color: '#374151' },
              }}>
                <Badge
                  sx={{
                    '& .MuiBadge-badge': {
                      width: 8, height: 8, minWidth: 8,
                      background: '#ef4444',
                      top: 3, right: 3,
                    }
                  }}
                  variant="dot"
                >
                  <NotificationsNone sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 1.5, borderColor: '#e5e7eb' }} />

            {/* User Dropdown */}
            <Box
              onClick={e => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                cursor: 'pointer', px: 1.2, py: 0.5,
                borderRadius: 1.5,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                '&:hover': { background: '#f3f4f6', borderColor: '#d1d5db' },
                transition: 'all 0.15s ease',
              }}
            >
              <Avatar sx={{
                width: 30, height: 30, borderRadius: 1.2,
                background: getRoleBg(),
                fontSize: '0.78rem', fontWeight: 800,
              }}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 800, color: '#111827', lineHeight: 1.2, fontSize: '0.82rem' }}>
                  {user?.full_name?.split(' ')[0]}
                </Typography>
                <Typography sx={{ color: '#6b7280', fontSize: '0.67rem', display: 'block', lineHeight: 1.2 }}>
                  {getRoleLabel()}
                </Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 15, color: '#9ca3af', display: { xs: 'none', sm: 'block' } }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  minWidth: 220, mt: 1.5,
                  borderRadius: 1.5,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
                  p: 0.5,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f3f4f6', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', color: '#111827' }}>
                  {user?.full_name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {user?.school_name?.slice(0, 30) || getRoleLabel()}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => { setAnchorEl(null); navigate('/dashboard'); }}
                sx={{ borderRadius: 1.2, fontSize: '0.84rem', fontWeight: 700, py: 1, color: '#374151', '&:hover': { background: '#f0f9ff', color: '#0284c7' } }}
              >
                <Dashboard sx={{ mr: 1.5, fontSize: 18, color: '#0284c7' }} /> Dashboard
              </MenuItem>
              {canCreateAssessment && (
                <MenuItem
                  onClick={() => { setAnchorEl(null); navigate('/assessments/new'); }}
                  sx={{ borderRadius: 1.2, fontSize: '0.84rem', fontWeight: 700, py: 1, color: '#374151', '&:hover': { background: '#f0fdf4', color: '#10b981' } }}
                >
                  <Add sx={{ mr: 1.5, fontSize: 18, color: '#10b981' }} /> New Assessment
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{ color: '#ef4444', fontWeight: 800, borderRadius: 1.2, py: 1, '&:hover': { background: '#fef2f2' } }}
              >
                <Logout sx={{ mr: 1.5, fontSize: 18 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar Drawer ─────────────────────────────────────────────────────── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            boxShadow: isMobile ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
            border: 'none',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* ── Main Content ─────────────────────────────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${isMobile ? 0 : drawerWidth}px)`,
          maxWidth: `calc(100% - ${isMobile ? 0 : drawerWidth}px)`,
          minHeight: 'calc(100vh - 64px)',
          mt: '64px',
          p: { xs: 1.5, sm: 2, md: 2.5 },
          background: '#f8fafc',
          boxSizing: 'border-box',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        }}
      >
        <motion.div
          key={location.pathname + location.search}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          style={{ height: '100%', width: '100%', maxWidth: '100%' }}
        >
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
}
