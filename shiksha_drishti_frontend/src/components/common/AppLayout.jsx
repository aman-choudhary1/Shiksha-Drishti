import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Tooltip, Divider, Badge, useMediaQuery, useTheme, Chip, Button,
  Menu, MenuItem,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard, AssignmentTurnedIn, School,
  People, BarChart, Logout, ChevronLeft,
  NotificationsNone, Add, AutoAwesome,
  HelpOutlineOutlined, KeyboardArrowDown,
  Insights, Layers, FiberManualRecord,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH_OPEN   = 268;
const DRAWER_WIDTH_CLOSED = 68;

const teacherNavItems = [
  { label: 'Dashboard',          icon: <Dashboard />,          path: '/dashboard',          color: '#0284c7' },
  { label: 'Academic Analytics', icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',      icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'Assessments',        icon: <AssignmentTurnedIn />, path: '/assessments',        color: '#10b981' },
  { label: 'Students',           icon: <People />,             path: '/students',           color: '#f59e0b' },
  { label: 'Analytics & LO',     icon: <AutoAwesome />,        path: '/analytics',          color: '#ec4899', badge: 'New' },
  { label: 'School Profile',     icon: <School />,             path: '/schools',            color: '#ef4444' },
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

const stateNavItems = [
  { label: 'State Overview',       icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Academic Analytics',   icon: <Insights />,           path: '/academic-analytics', color: '#6366f1', badge: 'UDISE' },
  { label: 'Question Bank',        icon: <Layers />,             path: '/question-bank',      color: '#8b5cf6', badge: 'Admin' },
  { label: 'District League',      icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#10b981' },
  { label: 'Subject Diagnostics',  icon: <AutoAwesome />,        path: '/dashboard?tab=2',    tabIndex: 2, color: '#f59e0b', badge: 'AI' },
  { label: 'Question Analytics',   icon: <AssignmentTurnedIn />, path: '/dashboard?tab=3',    tabIndex: 3, color: '#06b6d4', badge: 'HOT' },
  { label: 'Teacher Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
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
  const navItems   = isState ? stateNavItems : isDistrict ? districtNavItems : isBlock ? blockNavItems : isCac ? cacNavItems : isPrincipal ? principalNavItems : teacherNavItems;
  const drawerWidth = isMobile ? DRAWER_WIDTH_OPEN : (drawerOpen ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/academic-analytics') || p.includes('/academic')) return 'Overall Academic Analytics (UDISE+ 5.75M Active Students)';
    if (p.includes('/question-bank'))  return 'Assessment Question Bank & Paper Authoring';
    if (p.includes('/report-card'))    return 'Class Report Card';
    if (p.includes('/question-marks')) return 'LO Marks Entry';
    if (p.includes('/assessments/new'))return 'Create Assessment';
    if (p.includes('/assessments'))    return 'Assessments';
    if (p.includes('/students'))       return 'Student Directory';
    if (p.includes('/analytics'))      return 'Analytics & LO';
    if (p.includes('/schools'))        return 'School Profile';
    if (isState)    return 'Chhattisgarh Education Intelligence Command Centre';
    if (isDistrict) return 'District Education Command Center (DEO)';
    if (isBlock)    return 'Block Education Command Center (BEO)';
    if (isCac)      return 'Cluster Command Center (CAC)';
    return isPrincipal ? 'Principal Dashboard' : 'Teacher Dashboard';
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
        background: `linear-gradient(135deg, ${accent}15 0%, ${accent}08 100%)`,
        borderBottom: `2px solid ${accent}22`,
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box sx={{
            width: 36, height: 36,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${accent}40`,
          }}>
            <School sx={{ color: '#ffffff', fontSize: 19 }} />
          </Box>
          {drawerOpen && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography sx={{
                color: '#0f172a', fontWeight: 800,
                fontSize: '0.98rem', lineHeight: 1.1,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                letterSpacing: '-0.01em',
              }}>
                Shiksha Drishti
              </Typography>
              <Typography sx={{
                color: accent,
                fontWeight: 700, fontSize: '0.6rem',
                letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block',
              }}>
                CG Education · VSK
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
              '&:hover': { color: '#64748b', background: '#f1f5f9' },
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* ── User Profile Card ─────────────────────────────────────────────────── */}
      {drawerOpen ? (
        <Box sx={{
          mx: 1.75, mt: 2,
          p: 1.75,
          borderRadius: 2.5,
          background: `linear-gradient(135deg, ${accent}0d 0%, ${accent}06 100%)`,
          border: `1px solid ${accent}20`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{
              width: 38, height: 38,
              borderRadius: 2,
              background: getRoleBg(),
              fontSize: '0.9rem', fontWeight: 800,
              boxShadow: `0 4px 12px ${accent}35`,
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography sx={{
                fontWeight: 800, color: '#0f172a',
                fontSize: '0.83rem', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2,
              }}>
                {user?.full_name}
              </Typography>
              <Typography sx={{
                color: accent,
                fontWeight: 700, fontSize: '0.67rem', display: 'block', lineHeight: 1.2,
              }}>
                {getRoleLabel()}
              </Typography>
            </Box>
          </Box>
          {user?.school_name && (
            <Typography sx={{
              color: '#64748b', fontSize: '0.67rem',
              display: 'block', mt: 0.75,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              fontWeight: 500,
            }}>
              🏫 {user.school_name}
            </Typography>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Tooltip title={`${user?.full_name} · ${getRoleLabel()}`} placement="right">
            <Avatar sx={{
              width: 36, height: 36, borderRadius: 2,
              background: getRoleBg(),
              fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* ── Quick Create Button ────────────────────────────────────────────────── */}
      {drawerOpen && canCreateAssessment && (
        <Box sx={{ px: 1.75, mt: 1.75 }}>
          <Button
            fullWidth size="small"
            onClick={() => { navigate('/assessments/new'); if (isMobile) setDrawerOpen(false); }}
            startIcon={<Add sx={{ fontSize: 17 }} />}
            sx={{
              py: 1, borderRadius: 2.5,
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
              color: '#ffffff',
              fontWeight: 700, fontSize: '0.8rem',
              boxShadow: `0 4px 14px ${accent}35`,
              border: 'none',
              '&:hover': {
                boxShadow: `0 6px 20px ${accent}50`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.18s ease',
            }}
          >
            + New Assessment
          </Button>
        </Box>
      )}

      {/* ── Nav Section Label ──────────────────────────────────────────────────── */}
      {drawerOpen && (
        <Typography sx={{
          px: 2.5, mt: 2.25, mb: 0.5,
          fontSize: '0.62rem', fontWeight: 800,
          color: '#c1cdd9', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Navigation
        </Typography>
      )}

      {/* ── Nav Items ──────────────────────────────────────────────────────────── */}
      <List sx={{ flex: 1, px: 1, pt: 0, overflow: 'auto' }}>
        {navItems.map((item) => {
          const isExact    = location.pathname + location.search === item.path;
          const isBasePath = !item.path.includes('?') && location.pathname === item.path;
          const isActive   = isExact || isBasePath;

          const btn = (
            <ListItemButton
              onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
              sx={{
                borderRadius: 2.5, py: 1,
                px: drawerOpen ? 1.5 : 1,
                justifyContent: drawerOpen ? 'initial' : 'center',
                background: isActive ? `${item.color}12` : 'transparent',
                borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                mb: 0.3,
                '&:hover': {
                  background: isActive ? `${item.color}15` : '#f8fafc',
                },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon sx={{
                color: isActive ? item.color : '#94a3b8',
                minWidth: drawerOpen ? 36 : 'auto',
                justifyContent: 'center',
                '& .MuiSvgIcon-root': { fontSize: 19 },
                transition: 'color 0.15s ease',
              }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.84rem',
                    color: isActive ? '#0f172a' : '#64748b',
                  }}
                />
              )}
              {drawerOpen && item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 18, borderRadius: 1,
                    fontSize: '0.58rem', fontWeight: 800,
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    border: `1px solid ${item.color}30`,
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
      </List>

      {/* ── Footer ─────────────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <Box sx={{ px: 1.75, pb: 1 }}>
          <Box sx={{
            p: 1.25, borderRadius: 2,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            mb: 1.25,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <FiberManualRecord sx={{ fontSize: 8, color: '#10b981' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#374151' }}>
                Session 2026-27 · Active
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.63rem', color: '#94a3b8', mt: 0.2, fontWeight: 500 }}>
              UDISE+ Government Platform
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ p: drawerOpen ? 1.5 : 1, borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
        {drawerOpen ? (
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5, py: 0.9,
              color: '#ef4444',
              background: '#fef2f2',
              border: '1px solid #fee2e2',
              '&:hover': { background: '#fde8e8', borderColor: '#fca5a5' },
            }}
          >
            <ListItemIcon sx={{ color: '#ef4444', minWidth: 34 }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 700, fontSize: '0.83rem', color: '#ef4444' }}
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
              borderRadius: 2,
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
              fontWeight: 800, color: '#0f172a',
              fontSize: { xs: '0.88rem', sm: '0.98rem' },
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
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
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#059669' }}>
                2026-27 · Live
              </Typography>
            </Box>
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Help & Guide">
              <IconButton size="small" sx={{
                color: '#6b7280', borderRadius: 2,
                '&:hover': { background: '#f3f4f6', color: '#374151' },
              }}>
                <HelpOutlineOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{
                color: '#6b7280', borderRadius: 2,
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
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                background: '#f9fafb',
                '&:hover': { background: '#f3f4f6', borderColor: '#d1d5db' },
                transition: 'all 0.15s ease',
              }}
            >
              <Avatar sx={{
                width: 30, height: 30, borderRadius: 1.5,
                background: getRoleBg(),
                fontSize: '0.78rem', fontWeight: 800,
              }}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, color: '#111827', lineHeight: 1.2, fontSize: '0.82rem' }}>
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
                  borderRadius: 2.5,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)',
                  p: 0.5,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f3f4f6', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#111827' }}>
                  {user?.full_name}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {user?.school_name?.slice(0, 30) || getRoleLabel()}
                </Typography>
              </Box>
              <MenuItem
                onClick={() => { setAnchorEl(null); navigate('/dashboard'); }}
                sx={{ borderRadius: 1.5, fontSize: '0.84rem', fontWeight: 600, py: 1, color: '#374151', '&:hover': { background: '#f0f9ff', color: '#0284c7' } }}
              >
                <Dashboard sx={{ mr: 1.5, fontSize: 18, color: '#0284c7' }} /> Dashboard
              </MenuItem>
              {canCreateAssessment && (
                <MenuItem
                  onClick={() => { setAnchorEl(null); navigate('/assessments/new'); }}
                  sx={{ borderRadius: 1.5, fontSize: '0.84rem', fontWeight: 600, py: 1, color: '#374151', '&:hover': { background: '#f0fdf4', color: '#10b981' } }}
                >
                  <Add sx={{ mr: 1.5, fontSize: 18, color: '#10b981' }} /> New Assessment
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{ color: '#ef4444', fontWeight: 700, borderRadius: 1.5, py: 1, '&:hover': { background: '#fef2f2' } }}
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
