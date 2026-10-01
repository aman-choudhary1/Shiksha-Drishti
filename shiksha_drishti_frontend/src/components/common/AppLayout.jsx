import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Avatar,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton,
  Tooltip, Divider, Badge, useMediaQuery, useTheme, Chip, Button,
  Menu, MenuItem, alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard, AssignmentTurnedIn, School,
  People, BarChart, Logout, ChevronLeft,
  NotificationsNone, Add, AutoAwesome,
  HelpOutlineOutlined, KeyboardArrowDown,
  Verified,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const DRAWER_WIDTH_OPEN   = 264;
const DRAWER_WIDTH_CLOSED = 72;

const teacherNavItems = [
  { label: 'Dashboard',      icon: <Dashboard />,          path: '/dashboard',        color: '#0284c7' },
  { label: 'Assessments',    icon: <AssignmentTurnedIn />, path: '/assessments',       color: '#8b5cf6' },
  { label: 'Students',       icon: <People />,             path: '/students',          color: '#10b981' },
  { label: 'Analytics & LO', icon: <AutoAwesome />,        path: '/analytics',         color: '#e89005', badge: 'New' },
  { label: 'School Profile', icon: <School />,             path: '/schools',           color: '#ef4444' },
];

const principalNavItems = [
  { label: 'School Overview',    icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Faculty Performance', icon: <AssignmentTurnedIn />, path: '/dashboard?tab=1',    tabIndex: 1, color: '#8b5cf6' },
  { label: 'Student Analytics',  icon: <People />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981' },
  { label: 'Exam Comparison',    icon: <BarChart />,           path: '/dashboard?tab=3',    tabIndex: 3, color: '#e89005' },
  { label: 'LO Mastery',         icon: <AutoAwesome />,        path: '/dashboard?tab=4',    tabIndex: 4, color: '#f59e0b', badge: 'LO' },
  { label: 'School Profile',     icon: <School />,             path: '/schools',            color: '#ef4444' },
];

const cacNavItems = [
  { label: 'Cluster Overview',   icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'School Matrix',      icon: <AssignmentTurnedIn />, path: '/dashboard?tab=1',    tabIndex: 1, color: '#8b5cf6' },
  { label: 'LO Diagnostics',     icon: <AutoAwesome />,        path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981', badge: 'LO' },
  { label: 'HOS Directory',      icon: <School />,             path: '/dashboard?tab=3',    tabIndex: 3, color: '#ef4444' },
];

const blockNavItems = [
  { label: 'Block Overview',       icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Cluster Benchmarks',   icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#8b5cf6' },
  { label: 'School League Table',  icon: <School />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981' },
  { label: 'Question Diagnostics', icon: <AutoAwesome />,        path: '/dashboard?tab=3',    tabIndex: 3, color: '#f59e0b', badge: 'BEO' },
  { label: 'Faculty Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
];

const districtNavItems = [
  { label: 'District Overview',    icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'Block Benchmarks',     icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#8b5cf6' },
  { label: 'School League Table',  icon: <School />,             path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981' },
  { label: 'Question Diagnostics', icon: <AutoAwesome />,        path: '/dashboard?tab=3',    tabIndex: 3, color: '#f59e0b', badge: 'DEO' },
  { label: 'Faculty Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
];

const stateNavItems = [
  { label: 'State Overview',       icon: <Dashboard />,          path: '/dashboard',          tabIndex: 0, color: '#0284c7' },
  { label: 'District League',      icon: <BarChart />,           path: '/dashboard?tab=1',    tabIndex: 1, color: '#8b5cf6' },
  { label: 'Subject Diagnostics',  icon: <AutoAwesome />,        path: '/dashboard?tab=2',    tabIndex: 2, color: '#10b981', badge: 'AI' },
  { label: 'Question Analytics',   icon: <AssignmentTurnedIn />, path: '/dashboard?tab=3',    tabIndex: 3, color: '#f59e0b', badge: 'HOT' },
  { label: 'Teacher Matrix',       icon: <People />,             path: '/dashboard?tab=4',    tabIndex: 4, color: '#ec4899' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const location         = useLocation();
  const theme            = useTheme();
  const isMobile         = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen]   = useState(true);
  const [anchorEl,   setAnchorEl]     = useState(null);

  const isState    = user?.role === 'STATE_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isDistrict  = user?.role === 'DISTRICT_OFFICER' || user?.role === 'DEO';
  const isBlock     = user?.role === 'BLOCK_OFFICER' || user?.role === 'BEO';
  const isCac       = user?.role === 'CAC' || user?.role === 'CLUSTER_COORDINATOR';
  const isPrincipal = user?.role === 'SCHOOL_ADMIN';
  const canCreateAssessment = user?.role === 'TEACHER' || user?.role === 'SCHOOL_ADMIN';
  const navItems    = isState ? stateNavItems : isDistrict ? districtNavItems : isBlock ? blockNavItems : isCac ? cacNavItems : isPrincipal ? principalNavItems : teacherNavItems;
  const drawerWidth = isMobile ? DRAWER_WIDTH_OPEN : (drawerOpen ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/report-card'))    return 'Class Report Card';
    if (p.includes('/question-marks')) return 'LO Marks Entry';
    if (p.includes('/assessments/new'))return 'Create Assessment';
    if (p.includes('/assessments'))    return 'Assessments';
    if (p.includes('/students'))       return 'Student Directory';
    if (p.includes('/analytics'))      return 'Analytics & LO';
    if (p.includes('/schools'))        return 'School Profile';
    if (isState)    return 'Chhattisgarh Education Command Centre (State Admin)';
    if (isDistrict) return 'District Education Command Center (DEO)';
    if (isBlock) return 'Block Education Command Center (BEO)';
    if (isCac) return 'Cluster Command Center (CAC)';
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

  const getRoleBg = () => {
    if (user?.role === 'STATE_ADMIN' || user?.role === 'SUPER_ADMIN') return 'linear-gradient(135deg, #0f3460, #6d28d9)';
    if (user?.role === 'DISTRICT_OFFICER' || user?.role === 'DEO') return 'linear-gradient(135deg, #071526, #0284c7)';
    if (user?.role === 'BLOCK_OFFICER' || user?.role === 'BEO') return 'linear-gradient(135deg, #071526, #0284c7)';
    if (user?.role === 'CAC' || user?.role === 'CLUSTER_COORDINATOR') return 'linear-gradient(135deg, #0f3460, #10b981)';
    if (user?.role === 'SCHOOL_ADMIN') return 'linear-gradient(135deg, #0f3460, #e89005)';
    return 'linear-gradient(135deg, #0f3460, #0284c7)';
  };

  // ── Sidebar Content ────────────────────────────────────────────────────
  const sidebarContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      overflowX: 'hidden',
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>

      {/* Brand Header */}
      <Box sx={{
        height: 64,
        px: drawerOpen ? 2.5 : 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: drawerOpen ? 'space-between' : 'center',
        borderBottom: '1px solid rgba(226,232,240,0.9)',
        background: 'linear-gradient(135deg, #0f3460 0%, #1e5f99 100%)',
        flexShrink: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box sx={{
            width: 36, height: 36,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <School sx={{ color: '#ffffff', fontSize: 20 }} />
          </Box>
          {drawerOpen && (
            <Box sx={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Typography sx={{
                color: '#ffffff', fontWeight: 800,
                fontSize: '1rem', lineHeight: 1.1,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                Shiksha Drishti
              </Typography>
              <Typography sx={{
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 600, fontSize: '0.62rem',
                letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block',
              }}>
                Chhattisgarh Education
              </Typography>
            </Box>
          )}
        </Box>
        {drawerOpen && !isMobile && (
          <IconButton
            size="small"
            onClick={() => setDrawerOpen(false)}
            sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffffff', background: 'rgba(255,255,255,0.1)' } }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* User Profile Card */}
      {drawerOpen ? (
        <Box sx={{
          mx: 2, mt: 2,
          p: 1.75,
          borderRadius: 3,
          background: isPrincipal
            ? 'linear-gradient(135deg, rgba(15,52,96,0.06) 0%, rgba(2,132,199,0.08) 100%)'
            : 'rgba(248,250,252,0.9)',
          border: isPrincipal ? '1px solid rgba(2,132,199,0.2)' : '1px solid #e2e8f0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Avatar sx={{
              width: 38, height: 38,
              borderRadius: 2,
              background: getRoleBg(),
              fontSize: '0.9rem', fontWeight: 800,
              boxShadow: '0 2px 8px rgba(15,52,96,0.25)',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ overflow: 'hidden', flex: 1 }}>
              <Typography sx={{
                fontWeight: 800, color: '#0f172a',
                fontSize: '0.82rem', whiteSpace: 'nowrap',
                overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2,
              }}>
                {user?.full_name}
              </Typography>
              <Typography sx={{
                color: isPrincipal ? '#b45309' : '#0284c7',
                fontWeight: 700, fontSize: '0.7rem', display: 'block', lineHeight: 1.2,
              }}>
                {getRoleLabel()}
              </Typography>
            </Box>
          </Box>
          {user?.school_name && (
            <Typography sx={{
              color: '#64748b', fontSize: '0.68rem',
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
              width: 38, height: 38, borderRadius: 2,
              background: getRoleBg(), fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
            }}>
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>
        </Box>
      )}

      {/* Quick Action Button (Teacher & Principal only) */}
      {drawerOpen && canCreateAssessment && (
        <Box sx={{ px: 2, mt: 2 }}>
          <Button
            fullWidth size="small" variant="contained"
            startIcon={<Add />}
            onClick={() => { navigate('/assessments/new'); if (isMobile) setDrawerOpen(false); }}
            sx={{
              py: 1, borderRadius: 2.5,
              background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
              boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              fontSize: '0.8rem', fontWeight: 700,
              '&:hover': { boxShadow: '0 6px 20px rgba(2,132,199,0.4)', transform: 'translateY(-1px)' },
            }}
          >
            + New Assessment
          </Button>
        </Box>
      )}

      {/* Navigation Section Label */}
      {drawerOpen && (
        <Typography sx={{
          px: 2.5, mt: 2.5, mb: 0.75,
          fontSize: '0.65rem', fontWeight: 800,
          color: '#94a3b8', letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          Navigation
        </Typography>
      )}

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1.25, pt: 0 }}>
        {navItems.map((item) => {
          const isExact     = location.pathname + location.search === item.path;
          const isBasePath  = !item.path.includes('?') && location.pathname === item.path;
          const isActive    = isExact || isBasePath;

          const btn = (
            <ListItemButton
              onClick={() => { navigate(item.path); if (isMobile) setDrawerOpen(false); }}
              sx={{
                borderRadius: 2.5, py: 1.1,
                px: drawerOpen ? 1.5 : 1,
                justifyContent: drawerOpen ? 'initial' : 'center',
                background: isActive
                  ? alpha(item.color, 0.1)
                  : 'transparent',
                borderLeft: isActive ? `3px solid ${item.color}` : '3px solid transparent',
                mb: 0.25,
                '&:hover': {
                  background: isActive ? alpha(item.color, 0.12) : 'rgba(241,245,249,0.9)',
                },
                transition: 'all 0.15s ease',
              }}
            >
              <ListItemIcon sx={{
                color: isActive ? item.color : '#94a3b8',
                minWidth: drawerOpen ? 38 : 'auto',
                justifyContent: 'center',
                '& .MuiSvgIcon-root': { fontSize: 20 },
              }}>
                {item.icon}
              </ListItemIcon>
              {drawerOpen && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 700 : 600,
                    fontSize: '0.84rem',
                    color: isActive ? '#0f172a' : '#475569',
                  }}
                />
              )}
              {drawerOpen && item.badge && (
                <Chip
                  label={item.badge}
                  size="small"
                  sx={{
                    height: 18, borderRadius: 1,
                    fontSize: '0.6rem', fontWeight: 800,
                    backgroundColor: item.color,
                    color: '#ffffff', px: 0.5,
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

      {/* Sidebar Footer */}
      {drawerOpen && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{
            p: 1.5, borderRadius: 2.5,
            background: 'linear-gradient(135deg, rgba(15,52,96,0.05) 0%, rgba(2,132,199,0.06) 100%)',
            border: '1px solid rgba(2,132,199,0.12)',
            mb: 1.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Verified sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a' }}>
                Session 2026-27 · Active
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.65rem', color: '#64748b', mt: 0.25, fontWeight: 500 }}>
              UDISE+ Government Platform
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ p: drawerOpen ? 1.5 : 1, borderTop: '1px solid rgba(226,232,240,0.9)', flexShrink: 0 }}>
        {drawerOpen ? (
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5, py: 1,
              color: '#ef4444',
              background: 'rgba(239,68,68,0.04)',
              border: '1px solid rgba(239,68,68,0.12)',
              '&:hover': { background: 'rgba(239,68,68,0.08)' },
            }}
          >
            <ListItemIcon sx={{ color: '#ef4444', minWidth: 36 }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Sign Out"
              primaryTypographyProps={{ fontWeight: 700, fontSize: '0.84rem', color: '#ef4444' }}
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

  // ── Main Layout ────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* ── Top AppBar ── */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226,232,240,0.9)',
          color: '#0f172a',
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 2.5 }, gap: 1 }}>
          <IconButton
            onClick={() => setDrawerOpen(v => !v)}
            sx={{
              color: '#0f3460', mr: 0.5,
              borderRadius: 2,
              '&:hover': { background: 'rgba(15,52,96,0.06)' },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Page Title */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
            <Typography sx={{
              fontWeight: 800, color: '#0f172a',
              fontSize: { xs: '0.95rem', sm: '1.05rem' },
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {getPageTitle()}
            </Typography>
            <Chip
              label="2026-27 · Live"
              size="small"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                background: 'rgba(16,185,129,0.1)',
                color: '#047857', fontWeight: 700, fontSize: '0.7rem',
                border: '1px solid rgba(16,185,129,0.25)',
                borderRadius: 1.5,
              }}
            />
          </Box>

          {/* Right Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Help & Guide">
              <IconButton size="small" sx={{ color: '#64748b', borderRadius: 2 }}>
                <HelpOutlineOutlined fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: '#64748b', borderRadius: 2 }}>
                <Badge badgeContent={1} color="error" variant="dot">
                  <NotificationsNone fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 1.25, borderColor: 'rgba(226,232,240,0.9)' }} />

            {/* User Menu Trigger */}
            <Box
              onClick={e => setAnchorEl(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                cursor: 'pointer', px: 1, py: 0.5,
                borderRadius: 2.5,
                border: '1px solid rgba(226,232,240,0.9)',
                background: 'rgba(248,250,252,0.8)',
                '&:hover': { background: '#f1f5f9', borderColor: '#cbd5e1' },
                transition: 'all 0.15s ease',
              }}
            >
              <Avatar sx={{
                width: 30, height: 30, borderRadius: 1.5,
                background: getRoleBg(),
                fontSize: '0.8rem', fontWeight: 800,
              }}>
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography sx={{ fontWeight: 700, color: '#0f172a', lineHeight: 1.2, fontSize: '0.82rem' }}>
                  {user?.full_name?.split(' ')[0]}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.68rem', display: 'block', lineHeight: 1.2 }}>
                  {getRoleLabel()}
                </Typography>
              </Box>
              <KeyboardArrowDown sx={{ fontSize: 16, color: '#94a3b8', display: { xs: 'none', sm: 'block' } }} />
            </Box>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  minWidth: 200, mt: 1.5,
                  borderRadius: 3,
                  border: '1px solid rgba(226,232,240,0.9)',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
                  overflow: 'visible',
                  p: 0.5,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #f1f5f9', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
                  {user?.full_name}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {user?.school_name?.slice(0, 28)}
                </Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorEl(null); navigate('/dashboard'); }}>
                <Dashboard sx={{ mr: 1.5, fontSize: 18, color: '#0284c7' }} /> Dashboard
              </MenuItem>
              {canCreateAssessment && (
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/assessments/new'); }}>
                  <Add sx={{ mr: 1.5, fontSize: 18, color: '#10b981' }} /> New Assessment
                </MenuItem>
              )}
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={handleLogout} sx={{ color: '#ef4444', fontWeight: 700 }}>
                <Logout sx={{ mr: 1.5, fontSize: 18 }} /> Sign Out
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Sidebar Drawer ── */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            boxShadow: isMobile ? '4px 0 24px rgba(15,23,42,0.12)' : 'none',
            border: 'none',
            borderRight: '1px solid rgba(226,232,240,0.9)',
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* ── Main Content ── */}
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ height: '100%', width: '100%', maxWidth: '100%' }}
        >
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
}
