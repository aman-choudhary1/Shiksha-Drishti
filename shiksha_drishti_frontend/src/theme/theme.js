import { createTheme } from '@mui/material/styles';

// ═══════════════════════════════════════════════════════════════
// SHIKSHA DRISHTI — Premium MUI Theme
// Chhattisgarh School Education Department
// Design: Deep Navy + Sky Blue + Saffron Gold + Emerald Green
// ═══════════════════════════════════════════════════════════════

export const COLORS = {
  primary:        '#0f3460',
  primaryLight:   '#1e5f99',
  primaryDark:    '#0a2240',
  secondary:      '#e89005',
  secondaryLight: '#f5a623',
  secondaryDark:  '#c27400',
  accent:         '#0284c7',
  accentLight:    '#38bdf8',
  success:        '#10b981',
  successLight:   '#34d399',
  warning:        '#f59e0b',
  error:          '#ef4444',
  background:     '#f8fafc',
  surface:        '#ffffff',
  surfaceSubtle:  '#f1f5f9',
  border:         'rgba(226, 232, 240, 0.9)',
  borderStrong:   '#cbd5e1',
  textPrimary:    '#0f172a',
  textSecondary:  '#475569',
  textMuted:      '#94a3b8',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main:          COLORS.primary,
      light:         COLORS.primaryLight,
      dark:          COLORS.primaryDark,
      contrastText:  '#ffffff',
    },
    secondary: {
      main:          COLORS.secondary,
      light:         COLORS.secondaryLight,
      dark:          COLORS.secondaryDark,
      contrastText:  '#ffffff',
    },
    success: { main: COLORS.success, light: COLORS.successLight, dark: '#059669' },
    warning: { main: COLORS.warning, light: '#fbbf24', dark: '#d97706' },
    error:   { main: COLORS.error,   light: '#f87171',  dark: '#dc2626' },
    info:    { main: COLORS.accent,  light: COLORS.accentLight, dark: '#0369a1' },
    background: {
      default: COLORS.background,
      paper:   COLORS.surface,
    },
    text: {
      primary:   COLORS.textPrimary,
      secondary: COLORS.textSecondary,
      disabled:  COLORS.textMuted,
    },
    divider: COLORS.border,
  },

  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", "Noto Sans Devanagari", system-ui, -apple-system, sans-serif',
    fontWeightLight:   300,
    fontWeightRegular: 400,
    fontWeightMedium:  600,
    fontWeightBold:    700,
    h1: { fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15 },
    h2: { fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.2 },
    h3: { fontWeight: 700, letterSpacing: '-0.02em',  lineHeight: 1.25 },
    h4: { fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.3 },
    h5: { fontWeight: 700, letterSpacing: '-0.01em',  lineHeight: 1.35 },
    h6: { fontWeight: 700, letterSpacing: '-0.01em',  lineHeight: 1.4 },
    subtitle1: { fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, letterSpacing: 0,          lineHeight: 1.5 },
    body1:     { fontSize: '0.9375rem', lineHeight: 1.65, letterSpacing: 0 },
    body2:     { fontSize: '0.85rem',   lineHeight: 1.55, letterSpacing: 0 },
    caption:   { fontSize: '0.75rem',   lineHeight: 1.5,  letterSpacing: '0.02em' },
    overline:  { fontSize: '0.7rem',    fontWeight: 700,  letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.6 },
    button:    { fontWeight: 700, textTransform: 'none', letterSpacing: '0.01em', lineHeight: 1.4 },
  },

  shape: { borderRadius: 10 },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(15,23,42,0.04)',
    '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
    '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.04)',
    '0 8px 16px -3px rgba(15,23,42,0.08), 0 4px 6px -4px rgba(15,23,42,0.04)',
    '0 16px 24px -5px rgba(15,23,42,0.1), 0 6px 10px -6px rgba(15,23,42,0.05)',
    '0 24px 40px -8px rgba(15,23,42,0.12), 0 8px 16px -8px rgba(15,23,42,0.06)',
    ...Array(17).fill('0 24px 40px -8px rgba(15,23,42,0.12)'),
  ],

  components: {
    // ── Button ──────────────────────────────────────────────────────
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 700,
          textTransform: 'none',
          fontSize: '0.875rem',
          letterSpacing: '0.01em',
          transition: 'all 0.2s ease',
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeSmall:  { padding: '5px 14px',  fontSize: '0.8rem',   borderRadius: 8 },
        sizeMedium: { padding: '8px 20px',   fontSize: '0.875rem', borderRadius: 10 },
        sizeLarge:  { padding: '12px 28px',  fontSize: '0.95rem',  borderRadius: 12 },
        containedPrimary: {
          background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryLight} 100%)`,
          boxShadow: '0 4px 14px rgba(15, 52, 96, 0.3)',
          '&:hover': {
            background: `linear-gradient(135deg, ${COLORS.primaryLight} 0%, ${COLORS.accent} 100%)`,
            boxShadow: '0 6px 20px rgba(15, 52, 96, 0.35)',
            transform: 'translateY(-1px)',
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.secondaryLight} 100%)`,
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(232, 144, 5, 0.35)',
          '&:hover': {
            background: `linear-gradient(135deg, ${COLORS.secondaryLight} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 6px 20px rgba(232, 144, 5, 0.4)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px' },
        },
      },
    },

    // ── Card ─────────────────────────────────────────────────────────
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 1px 4px rgba(15,23,42,0.05)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
          '&:last-child': { paddingBottom: '20px' },
        },
      },
    },

    // ── Paper ─────────────────────────────────────────────────────────
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
        },
      },
    },

    // ── TextField ─────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: COLORS.surface,
            transition: 'box-shadow 0.15s ease',
            '& fieldset': { borderColor: COLORS.borderStrong, borderWidth: '1.5px' },
            '&:hover fieldset': { borderColor: COLORS.primaryLight },
            '&.Mui-focused': {
              boxShadow: `0 0 0 3px rgba(2, 132, 199, 0.12)`,
            },
            '&.Mui-focused fieldset': {
              borderColor: COLORS.accent,
              borderWidth: '2px',
            },
          },
          '& .MuiInputLabel-root': { fontWeight: 600 },
        },
      },
    },

    // ── Select ────────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          '& fieldset': { borderColor: COLORS.borderStrong },
          '&:hover fieldset': { borderColor: COLORS.primaryLight },
          '&.Mui-focused fieldset': {
            borderColor: COLORS.accent,
            borderWidth: '2px',
          },
        },
      },
    },

    // ── AppBar ────────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${COLORS.border}`,
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          color: COLORS.textPrimary,
        },
      },
    },

    // ── Drawer ────────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: `1px solid ${COLORS.border}`,
          boxShadow: 'none',
          overflowX: 'hidden',
        },
      },
    },

    // ── Table ─────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#f8fafc',
            color: COLORS.textPrimary,
            fontWeight: 700,
            fontSize: '0.78rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: `2px solid ${COLORS.border}`,
            padding: '12px 16px',
            whiteSpace: 'nowrap',
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.12s ease',
          '&:hover': { backgroundColor: 'rgba(241, 245, 249, 0.8) !important' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: COLORS.border,
          fontSize: '0.85rem',
          padding: '12px 16px',
          color: COLORS.textPrimary,
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 700,
          fontSize: '0.75rem',
          height: 26,
        },
        sizeSmall: {
          height: 22,
          fontSize: '0.7rem',
          borderRadius: 6,
        },
      },
    },

    // ── Tab ───────────────────────────────────────────────────────────
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          letterSpacing: 0,
          minHeight: 48,
          color: COLORS.textSecondary,
          transition: 'color 0.15s ease',
          '&.Mui-selected': {
            color: COLORS.primary,
            fontWeight: 700,
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.accent})`,
        },
      },
    },

    // ── Linear Progress ───────────────────────────────────────────────
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          height: 8,
          backgroundColor: '#e2e8f0',
        },
        bar: {
          borderRadius: 6,
        },
      },
    },

    // ── Alert ─────────────────────────────────────────────────────────
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
          fontWeight: 500,
        },
        standardError:   { borderColor: 'rgba(239, 68, 68, 0.3)',   backgroundColor: '#fef2f2' },
        standardSuccess: { borderColor: 'rgba(16, 185, 129, 0.3)',  backgroundColor: '#f0fdf4' },
        standardWarning: { borderColor: 'rgba(245, 158, 11, 0.3)',  backgroundColor: '#fffbeb' },
        standardInfo:    { borderColor: 'rgba(2, 132, 199, 0.3)',   backgroundColor: '#f0f9ff' },
      },
    },

    // ── Tooltip ───────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLORS.primary,
          borderRadius: 8,
          fontSize: '0.78rem',
          fontWeight: 600,
          padding: '6px 12px',
        },
        arrow: { color: COLORS.primary },
      },
    },

    // ── ListItemButton ────────────────────────────────────────────────
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s ease',
        },
      },
    },

    // ── Avatar ────────────────────────────────────────────────────────
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: 800 },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.2)',
        },
      },
    },

    // ── Skeleton ──────────────────────────────────────────────────────
    MuiSkeleton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },

    // ── Menu ──────────────────────────────────────────────────────────
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          border: `1px solid ${COLORS.border}`,
          boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
          marginTop: 8,
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          fontSize: '0.875rem',
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
