import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, IconButton,
  Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, LinearProgress, Stack, TextField, InputAdornment, alpha, Grid, Divider
} from '@mui/material';
import {
  Compass, MapPin, Award, Activity, TrendingUp, TrendingDown,
  Search, RefreshCw, Layers, Sliders, ChevronRight, School,
  Users, CheckCircle2, AlertTriangle, ArrowUpRight, BarChart2,
  ZoomIn, ZoomOut, RotateCcw, Target, ShieldCheck, Sparkles, Filter, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Bounding box for Chhattisgarh state geometry projection
const MIN_LON = 80.0;
const MAX_LON = 84.8;
const MIN_LAT = 17.7;
const MAX_LAT = 24.2;

function projectCoord([lon, lat], width = 560, height = 650, padding = 24) {
  const x = padding + ((lon - MIN_LON) / (MAX_LON - MIN_LON)) * (width - 2 * padding);
  const y = height - padding - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * (height - 2 * padding);
  return [x, y];
}

function ringToPathD(ring, width, height) {
  if (!ring || ring.length === 0) return '';
  return ring
    .map((pt, i) => {
      const [x, y] = projectCoord(pt, width, height);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

function geometryToD(geometry, width, height) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToPathD(ring, width, height)).join(' ');
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .flatMap(polygon => polygon.map(ring => ringToPathD(ring, width, height)))
      .join(' ');
  }
  return '';
}

function getCentroid(geometry, width, height) {
  let pts = [];
  if (geometry.type === 'Polygon') {
    pts = geometry.coordinates[0] || [];
  } else if (geometry.type === 'MultiPolygon') {
    pts = (geometry.coordinates[0] && geometry.coordinates[0][0]) || [];
  }
  if (pts.length === 0) return [width / 2, height / 2];

  let sumX = 0, sumY = 0;
  pts.forEach(pt => {
    const [x, y] = projectCoord(pt, width, height);
    sumX += x;
    sumY += y;
  });
  return [sumX / pts.length, sumY / pts.length];
}

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

const ALIAS_MAP = {
  [norm('gaurela')]: norm('gourela pendra marvahi'),
  [norm('gaurelapendramarwahi')]: norm('gourela pendra marvahi'),
  [norm('gpm')]: norm('gourela pendra marvahi'),
  [norm('khairagarh')]: norm('khairagarh chuikhadan gandai'),
  [norm('khairagarhchuikhadangandai')]: norm('khairagarh chuikhadan gandai'),
  [norm('kcg')]: norm('khairagarh chuikhadan gandai'),
  [norm('mohlamanpurambagarhchowki')]: norm('mohla manpur chowki'),
  [norm('mohlamanpur')]: norm('mohla manpur chowki'),
  [norm('mma')]: norm('mohla manpur chowki'),
  [norm('manendragarhchirmiribharatpur')]: norm('manendragarh'),
  [norm('mcb')]: norm('manendragarh'),
  [norm('sarangarhbilaigarh')]: norm('sarangarh'),
  [norm('bastar')]: norm('baster'),
  [norm('gariyaband')]: norm('gariaband'),
  [norm('kabirdham')]: norm('kawardha'),
  [norm('korea')]: norm('koriya'),
  [norm('balodabazar')]: norm('balodabzar'),
  [norm('balodabazarbhatapara')]: norm('balodabzar'),
  [norm('janjgirchampa')]: norm('janjgir'),
  [norm('uttarbastarkanker')]: norm('kanker'),
  [norm('dakshinbastardantewada')]: norm('dantewada'),
};

const DISTRICT_DIVISIONS = {
  // Surguja Division
  [norm('koriya')]: 'Surguja Division',
  [norm('korea')]: 'Surguja Division',
  [norm('manendragarh')]: 'Surguja Division',
  [norm('manendragarhchirmiribharatpur')]: 'Surguja Division',
  [norm('surajpur')]: 'Surguja Division',
  [norm('balrampur')]: 'Surguja Division',
  [norm('surguja')]: 'Surguja Division',
  [norm('jashpur')]: 'Surguja Division',

  // Bilaspur Division
  [norm('bilaspur')]: 'Bilaspur Division',
  [norm('gourela pendra marvahi')]: 'Bilaspur Division',
  [norm('gaurelapendramarwahi')]: 'Bilaspur Division',
  [norm('gaurela')]: 'Bilaspur Division',
  [norm('mungeli')]: 'Bilaspur Division',
  [norm('korba')]: 'Bilaspur Division',
  [norm('janjgir')]: 'Bilaspur Division',
  [norm('janjgirchampa')]: 'Bilaspur Division',
  [norm('sakti')]: 'Bilaspur Division',
  [norm('raigarh')]: 'Bilaspur Division',
  [norm('sarangarh')]: 'Bilaspur Division',
  [norm('sarangarhbilaigarh')]: 'Bilaspur Division',

  // Durg Division
  [norm('durg')]: 'Durg Division',
  [norm('bemetara')]: 'Durg Division',
  [norm('balod')]: 'Durg Division',
  [norm('rajnandgaon')]: 'Durg Division',
  [norm('khairagarh')]: 'Durg Division',
  [norm('khairagarhchuikhadangandai')]: 'Durg Division',
  [norm('mohla manpur chowki')]: 'Durg Division',
  [norm('mohlamanpurambagarhchowki')]: 'Durg Division',
  [norm('kawardha')]: 'Durg Division',
  [norm('kabirdham')]: 'Durg Division',

  // Raipur Division
  [norm('raipur')]: 'Raipur Division',
  [norm('balodabazar')]: 'Raipur Division',
  [norm('balodabzar')]: 'Raipur Division',
  [norm('balodabazarbhatapara')]: 'Raipur Division',
  [norm('gariaband')]: 'Raipur Division',
  [norm('gariyaband')]: 'Raipur Division',
  [norm('mahasamund')]: 'Raipur Division',
  [norm('dhamtari')]: 'Raipur Division',

  // Bastar Division
  [norm('kanker')]: 'Bastar Division',
  [norm('uttarbastarkanker')]: 'Bastar Division',
  [norm('kondagaon')]: 'Bastar Division',
  [norm('narayanpur')]: 'Bastar Division',
  [norm('bastar')]: 'Bastar Division',
  [norm('baster')]: 'Bastar Division',
  [norm('dantewada')]: 'Bastar Division',
  [norm('dakshinbastardantewada')]: 'Bastar Division',
  [norm('bijapur')]: 'Bastar Division',
  [norm('sukma')]: 'Bastar Division',
};

const DISTRICT_DISPLAY_NAMES = {
  [norm('gourela pendra marvahi')]: 'G.P.M.',
  [norm('gaurelapendramarwahi')]: 'G.P.M.',
  [norm('gaurela')]: 'G.P.M.',
  [norm('khairagarh chuikhadan gandai')]: 'Khairagarh',
  [norm('khairagarhchuikhadangandai')]: 'Khairagarh',
  [norm('khairagarh')]: 'Khairagarh',
  [norm('mohla manpur chowki')]: 'M.M. Chowki',
  [norm('mohlamanpurambagarhchowki')]: 'M.M. Chowki',
  [norm('mohlamanpur')]: 'M.M. Chowki',
  [norm('manendragarhchirmiribharatpur')]: 'Manendragarh',
  [norm('manendragarh')]: 'Manendragarh',
  [norm('sarangarhbilaigarh')]: 'Sarangarh',
  [norm('sarangarh')]: 'Sarangarh',
  [norm('balodabazarbhatapara')]: 'Baloda Bazar',
  [norm('balodabazar')]: 'Baloda Bazar',
  [norm('balodabzar')]: 'Baloda Bazar',
  [norm('janjgirchampa')]: 'Janjgir',
  [norm('janjgir')]: 'Janjgir',
  [norm('kabirdham')]: 'Kawardha',
  [norm('korea')]: 'Koriya',
  [norm('uttarbastarkanker')]: 'Kanker',
  [norm('dakshinbastardantewada')]: 'Dantewada',
};

// Micro-offsets for preventing text collisions in dense district clusters
const LABEL_OFFSETS = {
  [norm('raipur')]: { dx: 10, dy: 10 },
  [norm('durg')]: { dx: -10, dy: 8 },
  [norm('bemetara')]: { dx: 0, dy: -6 },
  [norm('balodabazar')]: { dx: 14, dy: -2 },
  [norm('balodabzar')]: { dx: 14, dy: -2 },
  [norm('balodabazarbhatapara')]: { dx: 14, dy: -2 },
  [norm('bilaspur')]: { dx: -5, dy: -8 },
  [norm('mungeli')]: { dx: -12, dy: 1 },
  [norm('janjgir')]: { dx: 10, dy: 6 },
  [norm('sakti')]: { dx: 8, dy: -2 },
  [norm('balod')]: { dx: -8, dy: 8 },
  [norm('dhamtari')]: { dx: 10, dy: 10 },
  [norm('koriya')]: { dx: -5, dy: -5 },
  [norm('surajpur')]: { dx: 6, dy: 4 },
  [norm('surguja')]: { dx: 0, dy: 3 },
  [norm('manendragarh')]: { dx: -10, dy: -6 },
  [norm('gourela pendra marvahi')]: { dx: -12, dy: -3 },
  [norm('gaurelapendramarwahi')]: { dx: -12, dy: -3 },
  [norm('korba')]: { dx: 0, dy: 2 },
  [norm('raigarh')]: { dx: 4, dy: 0 },
  [norm('mahasamund')]: { dx: 8, dy: 4 },
  [norm('gariaband')]: { dx: 4, dy: 6 },
  [norm('kanker')]: { dx: -4, dy: 0 },
  [norm('kondagaon')]: { dx: 4, dy: 0 },
  [norm('narayanpur')]: { dx: -6, dy: 0 },
  [norm('bastar')]: { dx: 4, dy: 4 },
  [norm('baster')]: { dx: 4, dy: 4 },
  [norm('dantewada')]: { dx: -4, dy: 0 },
  [norm('bijapur')]: { dx: -6, dy: 0 },
  [norm('sukma')]: { dx: 4, dy: 4 },
};

export default function StateHeatmapMap({
  districtData = [],
  selectedDistrict = 'ALL',
  onSelectDistrict = () => {},
  loading = false,
  showRankingsAtBottom = false,
}) {
  const [geoFeatures, setGeoFeatures] = useState([]);
  const [metricMode, setMetricMode] = useState('avg_score'); // 'avg_score', 'pass_rate', 'high_achievers', 'remedial'
  const [hoveredDist, setHoveredDist] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');
  const mapCanvasRef = useRef(null);

  // 1. Load GeoJSON
  useEffect(() => {
    async function loadGeo() {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}chhattisgarh_districts.json`);
        const data = await res.json();
        if (data && data.features) {
          setGeoFeatures(data.features);
        }
      } catch (err) {
        console.error('Failed to load Chhattisgarh GeoJSON:', err);
      }
    }
    loadGeo();
  }, []);

  const updateTooltipPos = (e) => {
    if (mapCanvasRef.current) {
      const rect = mapCanvasRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Lookup map for district metrics
  const statsMap = useMemo(() => {
    const map = {};
    districtData.forEach(d => {
      const k = norm(d.district_name);
      map[k] = d;
      if (ALIAS_MAP[k]) map[ALIAS_MAP[k]] = d;
      if (d.district_cd) map[`cd_${d.district_cd}`] = d;
      if (d.district_id) map[`id_${d.district_id}`] = d;
    });
    return map;
  }, [districtData]);

  // Color logic based on active metric
  const getDistrictColor = (stats) => {
    if (!stats || !stats.evaluated_students || Number(stats.evaluated_students) === 0) {
      return {
        fill: 'url(#cg-grad-slate)',
        rawFill: '#f8fafc',
        stroke: '#cbd5e1',
        textFill: '#64748b',
        hoverFill: '#e2e8f0',
        valText: 'No Data',
        valNum: 0,
        tier: 'Unreported',
        chipBg: '#f1f5f9',
        chipText: '#64748b',
      };
    }

    if (metricMode === 'avg_score') {
      const score = Number(stats.avg_score_pct || 0);
      if (score >= 70) {
        return {
          fill: 'url(#cg-grad-emerald)',
          rawFill: '#10b981',
          stroke: '#059669',
          hoverFill: '#34d399',
          textFill: '#065f46',
          valText: `${score}%`,
          valNum: score,
          tier: 'Excellent',
          chipBg: '#ecfdf5',
          chipText: '#059669',
        };
      } else if (score >= 60) {
        return {
          fill: 'url(#cg-grad-sky)',
          rawFill: '#0284c7',
          stroke: '#0284c7',
          hoverFill: '#7dd3fc',
          textFill: '#0369a1',
          valText: `${score}%`,
          valNum: score,
          tier: 'Good',
          chipBg: '#f0f9ff',
          chipText: '#0284c7',
        };
      } else if (score >= 50) {
        return {
          fill: 'url(#cg-grad-amber)',
          rawFill: '#f59e0b',
          stroke: '#d97706',
          hoverFill: '#fde68a',
          textFill: '#92400e',
          valText: `${score}%`,
          valNum: score,
          tier: 'Average',
          chipBg: '#fffbeb',
          chipText: '#d97706',
        };
      } else {
        return {
          fill: 'url(#cg-grad-rose)',
          rawFill: '#ef4444',
          stroke: '#dc2626',
          hoverFill: '#fecaca',
          textFill: '#991b1b',
          valText: `${score}%`,
          valNum: score,
          tier: 'Priority Support',
          chipBg: '#fef2f2',
          chipText: '#dc2626',
        };
      }
    } else if (metricMode === 'pass_rate') {
      const pass = Number(stats.pass_rate_pct || 0);
      if (pass >= 85) {
        return {
          fill: 'url(#cg-grad-emerald)',
          rawFill: '#10b981',
          stroke: '#059669',
          hoverFill: '#34d399',
          textFill: '#065f46',
          valText: `${pass}%`,
          valNum: pass,
          tier: 'High Pass',
          chipBg: '#ecfdf5',
          chipText: '#059669',
        };
      } else if (pass >= 70) {
        return {
          fill: 'url(#cg-grad-sky)',
          rawFill: '#0284c7',
          stroke: '#0284c7',
          hoverFill: '#7dd3fc',
          textFill: '#0369a1',
          valText: `${pass}%`,
          valNum: pass,
          tier: 'Moderate Pass',
          chipBg: '#f0f9ff',
          chipText: '#0284c7',
        };
      } else {
        return {
          fill: 'url(#cg-grad-rose)',
          rawFill: '#ef4444',
          stroke: '#dc2626',
          hoverFill: '#fecaca',
          textFill: '#991b1b',
          valText: `${pass}%`,
          valNum: pass,
          tier: 'Low Pass',
          chipBg: '#fef2f2',
          chipText: '#dc2626',
        };
      }
    } else if (metricMode === 'high_achievers') {
      const ha = Number(stats.high_achievers || 0);
      return {
        fill: ha > 500 ? 'url(#cg-grad-sky)' : 'url(#cg-grad-slate)',
        rawFill: '#0284c7',
        stroke: '#0284c7',
        hoverFill: '#bae6fd',
        textFill: '#0369a1',
        valText: ha.toLocaleString(),
        valNum: ha,
        tier: 'High Achievers',
        chipBg: '#f0f9ff',
        chipText: '#0284c7',
      };
    } else {
      const rem = Number(stats.remedial_students || 0);
      return {
        fill: rem > 50 ? 'url(#cg-grad-rose)' : 'url(#cg-grad-amber)',
        rawFill: '#ef4444',
        stroke: '#dc2626',
        hoverFill: '#fecaca',
        textFill: '#991b1b',
        valText: rem.toLocaleString(),
        valNum: rem,
        tier: 'Remedial Cohort',
        chipBg: '#fef2f2',
        chipText: '#dc2626',
      };
    }
  };

  const selectedDistObj = useMemo(() => {
    if (!selectedDistrict || selectedDistrict === 'ALL') return null;
    return districtData.find(d =>
      String(d.district_name).toLowerCase() === String(selectedDistrict).toLowerCase() ||
      String(d.district_cd) === String(selectedDistrict)
    ) || null;
  }, [selectedDistrict, districtData]);

  const sortedLeaderboard = useMemo(() => {
    let list = [...districtData];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(d => (d.district_name || '').toLowerCase().includes(q));
    }
    return list.sort((a, b) => (Number(b.avg_score_pct) || 0) - (Number(a.avg_score_pct) || 0));
  }, [districtData, searchFilter]);

  // Active dossier displayed in the Inspector sidebar:
  // Shows hovered district if cursor is on one, or the currently selected district, or null for Statewide overview.
  const activeInspectorData = useMemo(() => {
    if (hoveredDist?.stats) return hoveredDist.stats;
    if (selectedDistObj) return selectedDistObj;
    return null;
  }, [hoveredDist, selectedDistObj]);

  const mapWidth = 560;
  const mapHeight = 650;

  return (
    <Card
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.75 },
        mb: 3,
        borderRadius: 1.5,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 10px 24px -5px rgba(15, 23, 42, 0.04)',
      }}
    >
      {/* ── Top Header & Command Controls ── */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2.5,
        gap: 2,
        pb: 2,
        borderBottom: '1px solid #f1f5f9',
      }}>
        {/* Left: Branding & Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 1.5,
            background: 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)'
          }}>
            <Compass size={24} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography
                onClick={() => onSelectDistrict('ALL')}
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '1.05rem', sm: '1.2rem' },
                  color: selectedDistObj ? '#0284c7' : '#0f172a',
                  cursor: 'pointer',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  letterSpacing: '-0.02em',
                  '&:hover': { color: '#0369a1' }
                }}
              >
                Chhattisgarh State GIS Cartography
              </Typography>
              {selectedDistObj && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ChevronRight size={16} color="#94a3b8" />
                  <Chip
                    label={selectedDistObj.district_name}
                    size="small"
                    onDelete={() => onSelectDistrict('ALL')}
                    sx={{
                      background: '#e0f2fe',
                      color: '#0284c7',
                      fontWeight: 800,
                      fontSize: '0.74rem',
                      height: 24,
                      border: '1px solid #bae6fd',
                    }}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.2 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <Typography sx={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                Live district-level telemetry · {geoFeatures.length || 33} administrative districts monitored
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right: Modern Segmented Metric Mode Switcher */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          p: 0.5,
          background: '#f8fafc',
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'avg_score', label: 'Average Score', icon: <BarChart2 size={13} /> },
            { id: 'pass_rate', label: 'Pass Rate %', icon: <CheckCircle2 size={13} /> },
            { id: 'high_achievers', label: 'High Achievers (≥70%)', icon: <Award size={13} /> },
            { id: 'remedial', label: 'Remedial (<40%)', icon: <AlertTriangle size={13} /> },
          ].map(btn => {
            const active = metricMode === btn.id;
            return (
              <Button
                key={btn.id}
                size="small"
                onClick={() => setMetricMode(btn.id)}
                startIcon={btn.icon}
                sx={{
                  textTransform: 'none',
                  borderRadius: 1.5,
                  fontSize: '0.72rem',
                  fontWeight: active ? 800 : 600,
                  py: 0.6,
                  px: 1.3,
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? '#0284c7' : '#64748b',
                  boxShadow: active ? '0 2px 6px rgba(15, 23, 42, 0.08)' : 'none',
                  border: active ? '1px solid #e2e8f0' : '1px solid transparent',
                  '&:hover': {
                    background: active ? '#ffffff' : '#f1f5f9',
                    color: '#0f172a',
                  }
                }}
              >
                {btn.label}
              </Button>
            );
          })}

          {selectedDistrict !== 'ALL' && (
            <Button
              size="small"
              onClick={() => onSelectDistrict('ALL')}
              startIcon={<RotateCcw size={12} />}
              sx={{
                textTransform: 'none',
                borderRadius: 1.5,
                fontSize: '0.72rem',
                fontWeight: 700,
                py: 0.6,
                px: 1.2,
                color: '#0284c7',
                background: '#e0f2fe',
                border: '1px solid #bae6fd',
                '&:hover': { background: '#bae6fd' }
              }}
            >
              Reset to State
            </Button>
          )}
        </Box>
      </Box>

      {/* ── Main GIS Cockpit: 2-Column Responsive Layout ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '1fr 380px', xl: '1fr 420px' },
        gap: 2.5,
        alignItems: 'stretch',
        width: '100%',
      }}>

        {/* ── Column 1: Interactive SVG Cartography Canvas ── */}
        <Box
          ref={mapCanvasRef}
          sx={{
            position: 'relative',
            borderRadius: 1.5,
            p: { xs: 1, sm: 2 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
            minHeight: { xs: 480, md: 580, lg: 640 },
            width: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {/* Top-Left: GIS Coordinate & Status HUD */}
          <Box sx={{
            position: 'absolute', top: 14, left: 16, zIndex: 5,
            display: 'flex', flexDirection: 'column', gap: 0.3,
            pointerEvents: 'none',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#334155', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                CHHATTISGARH STATE GIS • 33 DISTRICTS
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#94a3b8', fontFamily: 'monospace' }}>
              LAT 17.7°–24.2° N | LON 80.0°–84.8° E • DATUM WGS-84
            </Typography>
          </Box>

          {/* Top-Right: Zoom & Pan HUD Controls */}
          <Box sx={{
            position: 'absolute', top: 14, right: 16, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 0.5,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #e2e8f0',
            borderRadius: 1.5,
            p: 0.4,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
          }}>
            <Tooltip title="Zoom In (Inspect Central Hubs)">
              <IconButton
                size="small"
                onClick={() => setZoomLevel(z => Math.min(Number((z + 0.35).toFixed(2)), 2.2))}
                sx={{ p: 0.5, color: '#334155', '&:hover': { background: '#f1f5f9' } }}
              >
                <ZoomIn size={15} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton
                size="small"
                onClick={() => setZoomLevel(z => Math.max(Number((z - 0.35).toFixed(2)), 1))}
                sx={{ p: 0.5, color: '#334155', '&:hover': { background: '#f1f5f9' } }}
              >
                <ZoomOut size={15} />
              </IconButton>
            </Tooltip>
            {zoomLevel > 1 && (
              <Tooltip title="Reset View">
                <IconButton
                  size="small"
                  onClick={() => setZoomLevel(1)}
                  sx={{ p: 0.5, color: '#0284c7', '&:hover': { background: '#f1f5f9' } }}
                >
                  <RotateCcw size={14} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Telemetry Updating Loader */}
          {loading && (
            <Box sx={{
              position: 'absolute', top: 54, right: 16, zIndex: 10,
              background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
              px: 1.5, py: 0.5, borderRadius: 1.5, border: '1px solid #bae6fd',
              display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.72rem', fontWeight: 800, color: '#0284c7',
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)'
            }}>
              <Activity size={14} className="spin" /> Syncing GIS Telemetry...
            </Box>
          )}

          {/* The High-Precision Vector Map SVG */}
          <svg
            width={mapWidth}
            height={mapHeight}
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '640px',
              display: 'block',
            }}
          >
            <defs>
              {/* Subtle High-Tech Blueprint Dots Grid */}
              <pattern id="gis-grid-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
                <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#e2e8f0" strokeWidth="0.6" strokeDasharray="2 3" />
                <circle cx="0" cy="0" r="0.9" fill="#cbd5e1" />
              </pattern>

              {/* 3D Relief Elevation Shadow for the Entire State */}
              <filter id="cg-relief-shadow" x="-15%" y="-15%" width="130%" height="130%">
                <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0f172a" floodOpacity="0.1" />
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.08" />
              </filter>

              {/* Hover Glow Filter */}
              <filter id="cg-hover-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284c7" floodOpacity="0.3" />
              </filter>

              {/* Vibrant Heatmap Vector Gradients */}
              <linearGradient id="cg-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="cg-grad-sky" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              <linearGradient id="cg-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              <linearGradient id="cg-grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>

              <linearGradient id="cg-grad-slate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>

              <linearGradient id="cg-grad-active" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0f3460" />
              </linearGradient>
            </defs>

            {/* Cartographic Blueprint Background Layer */}
            <rect width={mapWidth} height={mapHeight} fill="url(#gis-grid-pattern)" rx="8" />

            {/* Inner Map Group (Scalable with Zoom) */}
            <g
              transform={`scale(${zoomLevel})`}
              style={{
                transformOrigin: '280px 325px',
                transition: 'transform 0.3s cubic-bezier(0.2, 0, 0, 1)'
              }}
            >
              {/* Layer 0: State Outline Ambient Silhouette Underlay (Creates Floating 3D Relief) */}
              <g filter="url(#cg-relief-shadow)" opacity={0.9}>
                {geoFeatures.map((feat, idx) => {
                  const pathD = geometryToD(feat.geometry, mapWidth, mapHeight);
                  return (
                    <path
                      key={`shadow-${idx}`}
                      d={pathD}
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                    />
                  );
                })}
              </g>

              {/* Layer 1: Render 33 District Polygons */}
              {geoFeatures.map((feat, idx) => {
                const geoCd = String(feat.properties?.dist_id || feat.properties?.udise_code || feat.properties?.dt_code || '');
                const rawName = feat.properties?.District_N || feat.properties?.name || feat.properties?.PMP || `District ${idx}`;
                const distId = feat.properties?.dist_id || idx;

                const candidates = [
                  geoCd ? `cd_${geoCd}` : null,
                  norm(feat.properties?.PMP),
                  norm(feat.properties?.name),
                  norm(feat.properties?.District_N),
                  norm(rawName),
                ];

                let stats = null;
                for (const c of candidates) {
                  if (!c) continue;
                  stats = statsMap[c] || statsMap[ALIAS_MAP[c]];
                  if (stats) break;
                }
                if (!stats) stats = statsMap[`id_${distId}`];

                const colorInfo = getDistrictColor(stats);
                const pathD = geometryToD(feat.geometry, mapWidth, mapHeight);
                const [cx, cy] = getCentroid(feat.geometry, mapWidth, mapHeight);

                const cKey = norm(stats?.district_name || rawName);
                const isSelected = selectedDistObj && (
                  String(selectedDistObj.district_cd) === String(geoCd) ||
                  norm(selectedDistObj.district_name) === cKey ||
                  norm(selectedDistObj.district_name) === norm(feat.properties?.name)
                );

                const isHovered = hoveredDist && hoveredDist.rawName === rawName;

                let fillVal = colorInfo.fill;
                let strokeVal = colorInfo.stroke;
                let strokeW = 1.35;
                let filterVal = 'none';

                if (isSelected) {
                  fillVal = 'url(#cg-grad-active)';
                  strokeVal = '#0f3460';
                  strokeW = 3.2;
                } else if (isHovered) {
                  fillVal = colorInfo.hoverFill;
                  strokeVal = '#0f3460';
                  strokeW = 2.4;
                  filterVal = 'url(#cg-hover-glow)';
                }

                const offset = LABEL_OFFSETS[cKey] || { dx: 0, dy: 0 };
                const displayNameClean = DISTRICT_DISPLAY_NAMES[cKey] || stats?.district_name || rawName;

                return (
                  <g
                    key={idx}
                    style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
                    onClick={() => onSelectDistrict(stats?.district_name || rawName)}
                    onMouseEnter={(e) => {
                      setHoveredDist({ rawName, stats, colorInfo });
                      updateTooltipPos(e);
                    }}
                    onMouseMove={updateTooltipPos}
                    onMouseLeave={() => setHoveredDist(null)}
                  >
                    <path
                      d={pathD}
                      fill={fillVal}
                      stroke={strokeVal}
                      strokeWidth={strokeW}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      filter={filterVal}
                    />

                    {/* Centroid Marker Pin */}
                    <circle
                      cx={cx}
                      cy={cy - 4}
                      r={isHovered ? 5.5 : isSelected ? 4.5 : 3.5}
                      fill={isSelected ? '#ffffff' : colorInfo.rawFill}
                      stroke={isSelected ? '#0f3460' : '#ffffff'}
                      strokeWidth={isHovered || isSelected ? 2 : 1.4}
                      style={{
                        pointerEvents: 'none',
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.22))'
                      }}
                    />

                    {/* Pulsing Concentric Beacon for Selected District */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy - 4}
                        r={8}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth={1.8}
                        style={{ pointerEvents: 'none' }}
                      >
                        <animate attributeName="r" values="5;14;5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Clean Anti-Aliased Cartographic Typography with Dual Halo */}
                    <text
                      x={cx + offset.dx}
                      y={cy + 8 + offset.dy}
                      textAnchor="middle"
                      fill={isSelected ? '#ffffff' : '#0f172a'}
                      fontSize={isSelected ? '10px' : isHovered ? '9.5px' : '9px'}
                      fontWeight={isSelected || isHovered ? '900' : '800'}
                      style={{
                        pointerEvents: 'none',
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        letterSpacing: '0.02em',
                        paintOrder: 'stroke fill',
                        stroke: isSelected ? '#0f3460' : '#ffffff',
                        strokeWidth: isSelected ? '3.5px' : '2.6px',
                        strokeLinejoin: 'round',
                        strokeLinecap: 'round',
                      }}
                    >
                      {displayNameClean}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Bottom-Left: North Arrow Compass Rose */}
          <Box sx={{
            position: 'absolute', bottom: 14, left: 16, zIndex: 5,
            display: 'flex', alignItems: 'center', gap: 1,
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(8px)',
            px: 1.1, py: 0.5, borderRadius: 1.5,
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)'
          }}>
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#0284c7', color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.66rem'
            }}>
              N↑
            </Box>
            <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>
              33 Districts Monitored
            </Typography>
          </Box>

          {/* Bottom-Right: Gradient Heat Scale Legend */}
          <Box sx={{
            position: 'absolute', bottom: 14, right: 16, zIndex: 5,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            px: 1.4, py: 0.6, borderRadius: 1.5,
            border: '1px solid #e2e8f0',
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center', gap: 1.5,
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>≥70% High</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#0284c7' }} />
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>60–70% Good</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>50–60% Avg</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#334155' }}>&lt;50% Urgent</Typography>
            </Box>
          </Box>

          {/* ── Interactive Cursor Hover Tooltip HUD ── */}
          {hoveredDist && (
            <Box
              sx={{
                position: 'absolute',
                left: Math.min(tooltipPos.x + 16, (mapCanvasRef.current?.clientWidth || 500) - 230),
                top: Math.max(tooltipPos.y - 70, 14),
                zIndex: 999,
                background: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(16px)',
                p: 1.6,
                borderRadius: 1.5,
                border: `1.5px solid ${hoveredDist.colorInfo.stroke}`,
                boxShadow: '0 16px 36px -4px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.08)',
                pointerEvents: 'none',
                minWidth: 210,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography sx={{ fontWeight: 900, fontSize: '0.88rem', color: '#0f172a' }}>
                  📍 {hoveredDist.stats?.district_name || hoveredDist.rawName}
                </Typography>
                <Chip
                  label={hoveredDist.colorInfo.tier}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.64rem', fontWeight: 800,
                    background: hoveredDist.colorInfo.chipBg,
                    color: hoveredDist.colorInfo.chipText,
                  }}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.45, fontSize: '0.74rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.73rem' }}>Average Score:</Typography>
                  <Typography sx={{ fontWeight: 900, color: hoveredDist.colorInfo.stroke, fontSize: '0.82rem' }}>
                    {hoveredDist.stats?.avg_score_pct ? `${hoveredDist.stats.avg_score_pct}%` : 'Unreported'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.73rem' }}>Pass Rate %:</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.74rem' }}>
                    {hoveredDist.stats?.pass_rate_pct ? `${hoveredDist.stats.pass_rate_pct}%` : '0%'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.73rem' }}>Evaluated Cohort:</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.74rem' }}>
                    {Number(hoveredDist.stats?.evaluated_students || 0).toLocaleString()} students
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.73rem' }}>Remedial Needs:</Typography>
                  <Typography sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.74rem' }}>
                    {Number(hoveredDist.stats?.remedial_students || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mt: 1, pt: 0.75, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Target size={11} color="#0284c7" />
                <Typography sx={{ fontSize: '0.64rem', color: '#0284c7', fontWeight: 700 }}>
                  Click to lock district filter
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* ── Column 2: GIS Telemetry & District Intelligence Dossier ── */}
        <Box sx={{
          background: '#ffffff',
          borderRadius: 1.5,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          p: { xs: 2, sm: 2.25 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {activeInspectorData ? (
            /* Mode A: Focused District Dossier */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Dossier Header */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Chip
                    label={DISTRICT_DIVISIONS[norm(activeInspectorData.district_name)] || 'CHHATTISGARH STATE'}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.64rem',
                      fontWeight: 800,
                      background: '#f1f5f9',
                      color: '#475569',
                      letterSpacing: '0.04em'
                    }}
                  />
                  <Chip
                    label={`Rank #${sortedLeaderboard.findIndex(d => norm(d.district_name) === norm(activeInspectorData.district_name)) + 1} of 33`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      background: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fcd34d',
                    }}
                  />
                </Box>
                <Typography sx={{
                  fontWeight: 900,
                  fontSize: '1.45rem',
                  color: '#0f172a',
                  lineHeight: 1.2,
                  fontFamily: '"Plus Jakarta Sans", sans-serif'
                }}>
                  {activeInspectorData.district_name}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.3 }}>
                  District Code: {activeInspectorData.district_cd || '—'} · Active Cohort Telemetry
                </Typography>
              </Box>

              {/* Primary Score Hero Card */}
              <Box sx={{
                p: 2,
                borderRadius: 1.5,
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(2, 132, 199, 0.02) 100%)',
                border: '1px solid rgba(2, 132, 199, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Average Academic Score
                  </Typography>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                    {activeInspectorData.avg_score_pct || 0}%
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mt: 0.3 }}>
                    Pass Rate: <strong>{activeInspectorData.pass_rate_pct || 0}%</strong>
                  </Typography>
                </Box>
                <Box sx={{
                  width: 52, height: 52, borderRadius: 1.5,
                  background: Number(activeInspectorData.avg_score_pct || 0) >= 70 ? '#ecfdf5' : '#f0f9ff',
                  border: `1.5px solid ${Number(activeInspectorData.avg_score_pct || 0) >= 70 ? '#a7f3d0' : '#bae6fd'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: Number(activeInspectorData.avg_score_pct || 0) >= 70 ? '#059669' : '#0284c7'
                }}>
                  <Award size={28} />
                </Box>
              </Box>

              {/* 4-Card District Vitals Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
                <Box sx={{ p: 1.4, borderRadius: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b' }}>Evaluated Students</Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                    {(activeInspectorData.evaluated_students || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.4, borderRadius: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b' }}>Pass Rate (≥40%)</Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#059669' }}>
                    {activeInspectorData.pass_rate_pct || 0}%
                  </Typography>
                </Box>

                <Box sx={{ p: 1.4, borderRadius: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b' }}>High Achievers (≥70%)</Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#0284c7' }}>
                    {(activeInspectorData.high_achievers || 0).toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.4, borderRadius: 1.5, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b' }}>Remedial Cohort</Typography>
                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#ef4444' }}>
                    {(activeInspectorData.remedial_students || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {selectedDistrict && norm(selectedDistrict) === norm(activeInspectorData.district_name) ? (
                  <Button
                    fullWidth
                    variant="outlined"
                    color="inherit"
                    onClick={() => onSelectDistrict('ALL')}
                    startIcon={<X size={14} />}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      py: 0.85,
                      borderColor: '#cbd5e1',
                    }}
                  >
                    Clear Filter (Return to Statewide View)
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => onSelectDistrict(activeInspectorData.district_name)}
                    startIcon={<Filter size={14} />}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      py: 0.85,
                      background: 'linear-gradient(135deg, #0f172a 0%, #0284c7 100%)',
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.28)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      }
                    }}
                  >
                    Filter Entire Dashboard to {activeInspectorData.district_name}
                  </Button>
                )}
              </Box>
            </Box>
          ) : (
            /* Mode B: Statewide Executive Intelligence Overview */
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Header */}
              <Box>
                <Chip
                  label="STATEWIDE GIS OVERVIEW"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    background: '#e0f2fe',
                    color: '#0284c7',
                    letterSpacing: '0.04em',
                    mb: 0.75
                  }}
                />
                <Typography sx={{
                  fontWeight: 900,
                  fontSize: '1.25rem',
                  color: '#0f172a',
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  lineHeight: 1.2
                }}>
                  Chhattisgarh State GIS Command
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.74rem', mt: 0.3 }}>
                  Hover or tap any polygon on the map to inspect district telemetry
                </Typography>
              </Box>

              {/* 🥇 Top 3 Performing Districts */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🏆 Top Academic Performers
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                    By Average Score
                  </Typography>
                </Box>

                {sortedLeaderboard.slice(0, 3).map((d, i) => (
                  <Box
                    key={d.district_cd || i}
                    onClick={() => onSelectDistrict(d.district_name)}
                    sx={{
                      p: 1.1,
                      borderRadius: 1.5,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        background: '#f0f9ff',
                        borderColor: '#bae6fd',
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{
                        width: 24, height: 24, borderRadius: 1.2,
                        background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#ffedd5',
                        color: i === 0 ? '#b45309' : i === 1 ? '#475569' : '#c2410c',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.72rem', fontWeight: 900
                      }}>
                        #{i + 1}
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                          {d.district_name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.66rem', color: '#64748b' }}>
                          Pass: {d.pass_rate_pct || 0}% · Cohort: {(d.evaluated_students || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={`${d.avg_score_pct || 0}%`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        background: '#ecfdf5',
                        color: '#059669',
                        border: '1px solid #a7f3d0'
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {/* ⚠️ Priority Support Districts */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ⚠️ Priority Support Watchlist
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Remedial Needs
                  </Typography>
                </Box>

                {sortedLeaderboard.slice(-3).reverse().map((d, i) => (
                  <Box
                    key={d.district_cd || i}
                    onClick={() => onSelectDistrict(d.district_name)}
                    sx={{
                      p: 1.1,
                      borderRadius: 1.5,
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        background: '#ffe4e6',
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#9f1239' }}>
                        {d.district_name}
                      </Typography>
                      <Typography sx={{ fontSize: '0.66rem', color: '#be123c' }}>
                        {(d.remedial_students || 0).toLocaleString()} remedial students
                      </Typography>
                    </Box>
                    <Chip
                      label={`${d.avg_score_pct || 0}%`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.72rem',
                        fontWeight: 900,
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {/* Instant Search Bar */}
              <Box sx={{ mt: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Type district name to jump & filter..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={14} color="#94a3b8" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      fontSize: '0.78rem',
                      background: '#f8fafc',
                    }
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Footer Telemetry Note */}
          <Box sx={{ pt: 1.5, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
              Updated dynamically from class evaluations
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#0284c7', fontWeight: 800 }}>
              UDISE+ Standard
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Optional In-Card Rankings at Bottom (e.g. for standalone Tab 1 map view) */}
      {showRankingsAtBottom && (
        <Box sx={{ mt: 3, width: '100%' }}>
          <DistrictRankingsCard
            districtData={districtData}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={onSelectDistrict}
          />
        </Box>
      )}
    </Card>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// 🏆 DISTRICT RANKINGS & ACADEMIC LEADERBOARD COMPONENT (Bottom of Page)
// ════════════════════════════════════════════════════════════════════════════════
export function DistrictRankingsCard({
  districtData = [],
  selectedDistrict = 'ALL',
  onSelectDistrict = () => {},
}) {
  const [searchFilter, setSearchFilter] = useState('');

  const sortedLeaderboard = useMemo(() => {
    let list = [...districtData];
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      list = list.filter(d =>
        (d.district_name || '').toLowerCase().includes(q) ||
        String(d.district_cd || '').includes(q)
      );
    }
    return list.sort((a, b) => (Number(b.avg_score_pct) || 0) - (Number(a.avg_score_pct) || 0));
  }, [districtData, searchFilter]);

  return (
    <Card
      id="district-rankings-section"
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.75 },
        borderRadius: 1.5,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 20px -3px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Bar */}
      <Box sx={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2.25,
        gap: 1.5,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '1px solid #fcd34d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(245, 158, 11, 0.22)',
          }}>
            <Typography sx={{ fontSize: '1.35rem', lineHeight: 1 }}>🏆</Typography>
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{
                fontWeight: 900,
                color: '#0f172a',
                fontSize: { xs: '1rem', sm: '1.15rem' },
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                letterSpacing: '-0.02em',
              }}>
                District Rankings & Academic Leaderboard
              </Typography>
              <Chip
                label={`${sortedLeaderboard.length} Districts`}
                size="small"
                sx={{ height: 22, fontSize: '0.68rem', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}
              />
              {selectedDistrict && selectedDistrict !== 'ALL' && (
                <Chip
                  label={`Filtered: ${selectedDistrict}`}
                  size="small"
                  onDelete={() => onSelectDistrict('ALL')}
                  sx={{
                    height: 22,
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    background: '#e0f2fe',
                    color: '#0284c7',
                    border: '1px solid #bae6fd',
                  }}
                />
              )}
            </Box>
            <Typography sx={{ color: '#64748b', fontSize: '0.74rem', fontWeight: 500, mt: 0.3 }}>
              Full statewide performance league table · Click any district to filter all dashboard telemetry
            </Typography>
          </Box>
        </Box>

        {/* Search Field */}
        <TextField
          size="small"
          placeholder="Search district by name or code..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={15} color="#94a3b8" />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: { xs: '100%', sm: 280 },
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              fontSize: '0.8rem',
              background: '#f8fafc',
            }
          }}
        />
      </Box>

      {/* Comprehensive Full-Width Rankings Table */}
      <TableContainer sx={{ maxHeight: 460, border: '1px solid #f1f5f9', borderRadius: 1.5, overflowY: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{
              '& th': {
                background: '#f8fafc',
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                py: 1.25,
                borderBottom: '2px solid #e2e8f0',
              }
            }}>
              <TableCell sx={{ width: 65 }}>Rank</TableCell>
              <TableCell>District Name</TableCell>
              <TableCell align="center" sx={{ minWidth: 150 }}>Average Score %</TableCell>
              <TableCell align="center">Pass Rate</TableCell>
              <TableCell align="right">Evaluated Cohort</TableCell>
              <TableCell align="right">High Achievers (≥70%)</TableCell>
              <TableCell align="right">Remedial (&lt;40%)</TableCell>
              <TableCell align="center">Performance Tier</TableCell>
              <TableCell align="center">Scope Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedLeaderboard.map((d, idx) => {
              const isSelected = selectedDistrict && (
                String(selectedDistrict).toLowerCase() === String(d.district_name).toLowerCase() ||
                String(selectedDistrict) === String(d.district_cd)
              );
              const rankNum = d.rank || idx + 1;
              const isTop3 = rankNum <= 3;
              const avgScore = Number(d.avg_score_pct || 0);
              const scoreColor = avgScore >= 70 ? '#059669' : avgScore >= 60 ? '#0284c7' : avgScore >= 50 ? '#d97706' : '#dc2626';

              return (
                <TableRow
                  key={d.district_cd || idx}
                  onClick={() => onSelectDistrict(d.district_name)}
                  sx={{
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(2, 132, 199, 0.08)' : (idx % 2 === 0 ? '#ffffff' : '#fafafa'),
                    '&:hover': { background: 'rgba(2, 132, 199, 0.05)' },
                    '& td': { py: 1.1, fontSize: '0.78rem' },
                    transition: 'background 0.15s ease',
                  }}
                >
                  <TableCell>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: 1.2,
                      background: isTop3 ? (rankNum === 1 ? '#fef3c7' : rankNum === 2 ? '#f1f5f9' : '#ffedd5') : '#f8fafc',
                      color: isTop3 ? (rankNum === 1 ? '#b45309' : rankNum === 2 ? '#475569' : '#c2410c') : '#64748b',
                      border: `1px solid ${isTop3 ? (rankNum === 1 ? '#fcd34d' : rankNum === 2 ? '#cbd5e1' : '#fdba74') : '#e2e8f0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.74rem',
                    }}>
                      #{rankNum}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.84rem' }}>
                      {d.district_name}
                    </Typography>
                    <Typography sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 500 }}>
                      Code: {d.district_cd || '—'} · {d.block_count || 0} Blocks
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', minWidth: 140 }}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(avgScore, 100)}
                        sx={{
                          flex: 1, height: 7, borderRadius: 3, background: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { background: scoreColor, borderRadius: 3 }
                        }}
                      />
                      <Typography sx={{ color: scoreColor, fontSize: '0.84rem', fontWeight: 900, minWidth: 40, textAlign: 'right' }}>
                        {avgScore}%
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${d.pass_rate_pct || 0}%`}
                      size="small"
                      sx={{
                        height: 22, fontSize: '0.72rem', fontWeight: 800,
                        background: Number(d.pass_rate_pct || 0) >= 80 ? '#ecfdf5' : '#fffbeb',
                        color: Number(d.pass_rate_pct || 0) >= 80 ? '#059669' : '#d97706',
                        border: `1px solid ${Number(d.pass_rate_pct || 0) >= 80 ? '#a7f3d0' : '#fde68a'}`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#475569' }}>
                    {(d.evaluated_students || d.student_count || 0).toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#0284c7' }}>
                    {(d.high_achievers || 0).toLocaleString()}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#ef4444' }}>
                    {(d.remedial_students || 0).toLocaleString()}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={d.performance_tier || (avgScore >= 70 ? 'Excellent' : avgScore >= 60 ? 'Good' : avgScore >= 50 ? 'Average' : 'Needs Attention')}
                      size="small"
                      sx={{
                        fontSize: '0.67rem', fontWeight: 800, height: 21,
                        background: avgScore >= 70 ? '#ecfdf5' : avgScore >= 60 ? '#f0f9ff' : avgScore >= 50 ? '#fffbeb' : '#fef2f2',
                        color: avgScore >= 70 ? '#059669' : avgScore >= 60 ? '#0284c7' : avgScore >= 50 ? '#d97706' : '#dc2626',
                        border: `1px solid ${avgScore >= 70 ? '#a7f3d0' : avgScore >= 60 ? '#bae6fd' : avgScore >= 50 ? '#fde68a' : '#fecaca'}`,
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant={isSelected ? 'contained' : 'outlined'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDistrict(isSelected ? 'ALL' : d.district_name);
                      }}
                      sx={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        borderRadius: 1.5,
                        py: 0.25,
                        px: 1.1,
                        textTransform: 'none',
                        ...(isSelected ? {
                          background: '#0284c7',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
                        } : {
                          borderColor: '#cbd5e1',
                          color: '#475569',
                          '&:hover': { borderColor: '#0284c7', color: '#0284c7', background: '#f0f9ff' }
                        })
                      }}
                    >
                      {isSelected ? 'Selected' : 'Filter Scope'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
