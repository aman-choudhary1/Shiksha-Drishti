import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Lock, User, ArrowRight, AlertCircle,
  Eye, EyeOff, Fingerprint, MapPin, Loader2, Sparkles,
  Award, BarChart3, School, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import educationSvg from '../../assets/Lesson.svg';
import seminarSvg from '../../assets/Seminar-bro.svg';
import cgLogo from '../../assets/cglogo.png';

/* ═══════════════════════════════════════════════════════════════
   PARTICLE CANVAS — Interconnected neural node network
   ═══════════════════════════════════════════════════════════════ */
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cvs.getContext('2d');
    let W, H, raf;
    const particles = [];

    const resize = () => {
      W = cvs.width = window.innerWidth;
      H = cvs.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const small = W < 768;
    const count = small
      ? Math.min(60, Math.max(30, Math.round((W * H) / 14000)))
      : Math.min(140, Math.max(70, Math.round((W * H) / 9500)));

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r: Math.random() * 2.2 + 0.8,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const LINK = 165;
    const MOUSE_R = 190;

    const tick = () => {
      ctx.clearRect(0, 0, W, H);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        // mouse repel physics
        const mdx = p.x - mouse.current.x;
        const mdy = p.y - mouse.current.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < MOUSE_R && md > 0) {
          const force = (1 - md / MOUSE_R) * 0.7;
          p.vx += (mdx / md) * force;
          p.vy += (mdy / md) * force;
        }

        // friction dampen
        p.vx *= 0.998;
        p.vy *= 0.998;
      }

      // connect node lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            const alpha = (1 - d / LINK) * 0.35;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw glowing node dots
      for (const p of particles) {
        const glow = 0.7 + Math.sin(p.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${glow})`;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(tick);
    };
    tick();

    const onMove = (e) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════
   FLOATING ORBS — Ambient Multi-Color Glow Blobs
   ═══════════════════════════════════════════════════════════════ */
function FloatingOrbs() {
  const orbs = [
    { size: 520, x: '5%', y: '12%', color: 'rgba(2, 132, 199, 0.22)', dur: 16 },
    { size: 440, x: '75%', y: '50%', color: 'rgba(124, 58, 237, 0.18)', dur: 20 },
    { size: 360, x: '50%', y: '5%', color: 'rgba(16, 185, 129, 0.14)', dur: 22 },
    { size: 320, x: '18%', y: '72%', color: 'rgba(56, 189, 248, 0.15)', dur: 18 },
  ];

  return (
    <>
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, 35, -25, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.18, 0.92, 1],
          }}
          transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            left: o.x,
            top: o.y,
            width: o.size,
            height: o.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.color} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const S = {
  page: {
    minHeight: '100dvh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at 50% 0%, #0c1a3a 0%, #050a1a 50%, #020617 100%)',
    overflowX: 'hidden',
    overflowY: 'auto',
    position: 'relative',
    fontFamily: '"Plus Jakarta Sans", "Inter", system-ui, -apple-system, sans-serif',
    padding: 'clamp(10px, 1.8vw, 22px)',
    boxSizing: 'border-box',
  },
  card: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: 'min(1260px, 97vw)',
    minHeight: 'min(820px, 94vh)',
    margin: 'auto',
    display: 'grid',
    gridTemplateColumns: '1.08fr 0.92fr',
    borderRadius: 28,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(8, 18, 44, 0.52) 0%, rgba(5, 12, 30, 0.62) 100%)',
    backdropFilter: 'blur(16px) saturate(1.75)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.75)',
    border: '1px solid rgba(56, 189, 248, 0.22)',
    boxShadow: `
      0 0 0 1px rgba(56, 189, 248, 0.12),
      0 30px 80px -15px rgba(0, 0, 25, 0.7),
      0 0 140px -30px rgba(2, 132, 199, 0.28),
      inset 0 1px 0 rgba(255, 255, 255, 0.14)
    `,
  },
  /* Left Pane */
  leftPane: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(28px, 4vw, 48px) clamp(24px, 3.5vw, 44px)',
    background: 'linear-gradient(160deg, rgba(2, 132, 199, 0.08) 0%, rgba(6, 14, 34, 0.18) 100%)',
    borderRight: '1px solid rgba(56, 189, 248, 0.14)',
    overflow: 'hidden',
  },
  brandBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    borderRadius: 30,
    background: 'rgba(2, 132, 199, 0.16)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    marginBottom: 16,
    backdropFilter: 'blur(8px)',
  },
  svgContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 320,
    aspectRatio: '1.15',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  svgGlow: {
    position: 'absolute',
    inset: -15,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)',
    filter: 'blur(32px)',
  },
  svgImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    position: 'relative',
    zIndex: 1,
    filter: 'drop-shadow(0 0 26px rgba(56, 189, 248, 0.32))',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 10,
    width: '100%',
    maxWidth: 420,
    marginTop: 16,
  },
  statCard: {
    padding: '11px 8px',
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    backdropFilter: 'blur(8px)',
    textAlign: 'center',
  },
  featuresRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
    marginTop: 16,
  },
  featurePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 12px',
    borderRadius: 20,
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    fontSize: '0.72rem',
    color: '#cbd5e1',
    fontWeight: 600,
    backdropFilter: 'blur(8px)',
  },
  /* Right Pane */
  rightPane: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'clamp(28px, 4.5vw, 50px) clamp(24px, 4vw, 48px)',
    background: 'rgba(4, 10, 24, 0.25)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  capIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0284c7 0%, #7c3aed 100%)',
    boxShadow: '0 0 28px rgba(2, 132, 199, 0.45)',
    flexShrink: 0,
  },
  title: {
    fontSize: 'clamp(1.25rem, 4vw, 1.6rem)',
    fontWeight: 800,
    color: '#fff',
    textAlign: 'center',
    margin: 0,
    background: 'linear-gradient(135deg, #ffffff 30%, #7dd3fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '0.8rem',
    color: 'rgba(169, 188, 220, 0.82)',
    textAlign: 'center',
    margin: '4px 0 22px',
    letterSpacing: 0.2,
  },
  label: {
    fontSize: '0.74rem',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0 16px',
    height: 48,
    borderRadius: 14,
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(56, 189, 248, 0.16)',
    marginBottom: 16,
    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  inputWrapFocus: {
    border: '1px solid rgba(56, 189, 248, 0.65)',
    boxShadow: '0 0 0 4px rgba(2, 132, 199, 0.12), 0 0 22px rgba(2, 132, 199, 0.12)',
    background: 'rgba(2, 132, 199, 0.05)',
  },
  input: {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
    fontSize: '15px',
    fontFamily: 'inherit',
    height: '100%',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 6,
    margin: -4,
    display: 'flex',
    color: '#64748b',
    transition: 'color 0.2s',
  },
  submitBtn: {
    width: '100%',
    height: 50,
    border: 'none',
    borderRadius: 14,
    fontSize: '0.94rem',
    fontWeight: 700,
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #7c3aed 100%)',
    boxShadow: '0 8px 30px rgba(2, 132, 199, 0.4)',
    transition: 'all 0.3s ease',
    marginTop: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 12,
    background: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    marginBottom: 16,
    fontSize: '0.82rem',
    color: '#f87171',
  },
  quickAccessTitle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: '0.67rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    marginTop: 18,
    marginBottom: 10,
  },
  demoChipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  demoChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 11px',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#cbd5e1',
    fontSize: '0.72rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  demoChipActive: {
    background: 'rgba(2, 132, 199, 0.22)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
    color: '#7dd3fc',
    boxShadow: '0 0 12px rgba(2, 132, 199, 0.25)',
  },
  footer: {
    textAlign: 'center',
    fontSize: '0.7rem',
    color: '#475569',
    marginTop: 18,
    lineHeight: 1.6,
  },
};

/* ═══════════════════════════════════════════════════════════════
   LOGIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userFocus, setUserFocus] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await login(username.trim().toLowerCase(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please ensure credentials are correct.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [username, password, login, navigate]);

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const demoAccounts = [
    { label: 'District Officer (DEO)', user: 'district.raipur', pass: 'Admin@123', icon: BarChart3, color: '#38bdf8' },
    { label: 'Block Officer (BEO)', user: 'beo.abhanpur', pass: 'Admin@123', icon: School, color: '#a855f7' },
    { label: 'Cluster Coordinator (CAC)', user: 'cac.raipur', pass: 'Admin@123', icon: Layers, color: '#f59e0b' },
    { label: 'Principal (Raipur)', user: 'principal.raipur', pass: 'Admin@123', icon: School, color: '#0ea5e9' },
    { label: 'Principal (Durg)', user: 'principal.durg', pass: 'Admin@123', icon: School, color: '#818cf8' },
    { label: 'Teacher Ananya', user: 'teacher.ananya', pass: 'Admin@123', icon: Award, color: '#f472b6' },
    { label: 'State Admin', user: 'admin', pass: 'Admin@123', icon: Sparkles, color: '#10b981' },
  ];

  // Stagger animation definitions
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  };
  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <div style={S.page}>
      <ParticleCanvas />
      <FloatingOrbs />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 26 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        style={S.card}
        className="sd-login-card"
      >
        {/* ──── LEFT PANE (Visual Showcase) ──── */}
        <motion.div
          style={S.leftPane}
          className="sd-left-pane"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Brand badge */}
          <motion.div variants={item} style={S.brandBadge}>
            <MapPin size={13} color="#38bdf8" />
            <span style={{ fontSize: '0.76rem', color: '#7dd3fc', fontWeight: 600 }}>
              Samagra Shiksha • Chhattisgarh State Monitoring
            </span>
          </motion.div>

          {/* SVG Illustration */}
          <motion.div variants={item} style={S.svgContainer}>
            <div style={S.svgGlow} />
            <motion.img
              src={educationSvg}
              alt="Education Monitoring"
              style={S.svgImg}
              animate={{ scale: [1, 1.03, 1], y: [0, -5, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          {/* Headline & Description */}
          <motion.p
            variants={item}
            style={{
              textAlign: 'center',
              fontSize: '0.84rem',
              color: '#94a3b8',
              lineHeight: 1.65,
              maxWidth: 340,
              margin: '0 0 10px',
            }}
          >
            Real-time student performance tracking & Learning Outcomes monitoring across all{' '}
            <strong style={{ color: '#7dd3fc' }}>33 districts</strong> of Chhattisgarh.
          </motion.p>

          {/* Impact Stats Grid */}
          <motion.div variants={item} style={S.statGrid}>
            {[
              { label: 'Districts', value: '33' },
              { label: 'Blocks', value: '146+' },
              { label: 'Schools', value: '59K+' },
              { label: 'Students', value: '30L+' },
            ].map((s) => (
              <div key={s.label} style={S.statCard}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>{s.value}</div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: 1, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Feature Highlights */}
          <motion.div variants={item} style={S.featuresRow}>
            {['NIPUN Bharat', 'FLN Monitoring', 'Question Analytics', 'Real-time Scorecards'].map((feat) => (
              <div key={feat} style={S.featurePill}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8' }} />
                {feat}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ──── RIGHT PANE (Login Form) ──── */}
        <motion.div
          style={S.rightPane}
          className="sd-right-pane"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Logo & Emblem row */}
          <motion.div variants={item} style={S.logoRow}>
            <img
              src={cgLogo}
              alt="CG Government Logo"
              style={{
                width: 68,
                height: 68,
                borderRadius: 14,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 14px rgba(2, 132, 199, 0.25))',
              }}
            />
            <div style={S.capIcon}>
              <GraduationCap size={28} color="#fff" />
            </div>
          </motion.div>

          <motion.h1 variants={item} style={S.title}>
            Shiksha Drishti Portal
          </motion.h1>
          <motion.p variants={item} style={S.subtitle}>
            Vidya Samiksha Kendra • Unified Student Assessment & Analytics
          </motion.p>

          {/* Animated Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={S.error}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Username Field */}
            <motion.div variants={item}>
              <div style={S.label}>Username / Official ID</div>
              <div style={{ ...S.inputWrap, ...(userFocus ? S.inputWrapFocus : {}) }}>
                <User size={18} color={userFocus ? '#38bdf8' : '#475569'} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setUserFocus(true)}
                  onBlur={() => setUserFocus(false)}
                  placeholder="Enter username or official ID..."
                  className="sd-login-input"
                  style={S.input}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div variants={item}>
              <div style={S.label}>Password</div>
              <div style={{ ...S.inputWrap, ...(pwdFocus ? S.inputWrapFocus : {}) }}>
                <Lock size={18} color={pwdFocus ? '#38bdf8' : '#475569'} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPwdFocus(true)}
                  onBlur={() => setPwdFocus(false)}
                  placeholder="Enter your password..."
                  className="sd-login-input"
                  style={S.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={S.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={item}>
              <motion.button
                type="submit"
                disabled={loading}
                style={{
                  ...S.submitBtn,
                  opacity: loading ? 0.75 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                whileHover={!loading ? { scale: 1.015, boxShadow: '0 12px 38px rgba(2, 132, 199, 0.5)' } : {}}
                whileTap={!loading ? { scale: 0.985 } : {}}
              >
                {/* Shimmer light sweep */}
                {!loading && (
                  <motion.div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
                  />
                )}

                {loading ? (
                  <>
                    <Loader2 size={19} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint size={19} />
                    <span>Sign In to Portal</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Quick Demo Logins */}
          <motion.div variants={item}>
            <div style={S.quickAccessTitle}>
              <span>One-Click Demo Access</span>
            </div>
            <div style={S.demoChipsWrap}>
              {demoAccounts.map((acc) => {
                const isActive = username === acc.user;
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.user}
                    type="button"
                    onClick={() => handleQuickLogin(acc.user, acc.pass)}
                    style={{
                      ...S.demoChip,
                      ...(isActive ? S.demoChipActive : {}),
                    }}
                  >
                    <Icon size={12} color={isActive ? '#38bdf8' : acc.color} />
                    <span>{acc.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Footer Note */}
          <motion.div variants={item} style={S.footer}>
            Supports State Admins, DEO, BEO, Principals & Teachers
            <br />
            <span style={{ color: '#334155' }}>Powered by VSK • Chhattisgarh Samagra Shiksha</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Global & Responsive Inline Overrides */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Clean transparent input overrides */
        input.sd-login-input {
          background-color: transparent !important;
          background: transparent !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        /* Override browser autofill ugly white/yellow backgrounds */
        input.sd-login-input:-webkit-autofill,
        input.sd-login-input:-webkit-autofill:hover,
        input.sd-login-input:-webkit-autofill:focus,
        input.sd-login-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 60px #09132c inset !important;
          box-shadow: 0 0 0 60px #09132c inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        input.sd-login-input::placeholder {
          color: #475569 !important;
          opacity: 1 !important;
        }

        /* Responsive Breakpoints */
        @media (max-width: 860px) {
          .sd-login-card {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
          .sd-left-pane {
            display: none !important;
          }
          .sd-right-pane {
            padding: 34px 22px !important;
          }
        }
      `}</style>
    </div>
  );
}