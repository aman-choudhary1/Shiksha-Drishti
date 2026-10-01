import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Card, CardContent, Chip,
  Divider, Skeleton, Alert, Button, Stack, Avatar, Link,
} from '@mui/material';
import {
  School, LocationOn, Person, Phone, Business,
  AutoAwesome, CheckCircle, Public, OpenInNew,
  Groups, AssignmentTurnedIn, VerifiedUser, AccountBalance,
  Map, ClassOutlined, Language, Call, Launch,
  Badge, AccountTree, CoPresent,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { masterApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SchoolProfile() {
  const { user, assignments } = useAuth();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchool = async () => {
      setLoading(true);
      setError('');
      try {
        const udise = user?.primary_udise;
        if (!udise) {
          setError('विद्यालय UDISE कोड उपलब्ध नहीं है');
          setLoading(false);
          return;
        }
        const res = await masterApi.getSchool(udise);
        setSchool(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'विद्यालय विवरण लोड करने में त्रुटि');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchSchool();
  }, [user]);

  const totalAssignedStudents = (assignments || []).reduce((acc, a) => acc + Number(a.student_count || 0), 0);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 1 }}>
        <Skeleton variant="rectangular" height={110} sx={{ borderRadius: 2.5, mb: 2 }} />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={75} sx={{ borderRadius: 2.5 }} />
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' }, gap: 2 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 2.5 }} />
          ))}
        </Box>
      </Box>
    );
  }

  const kpis = [
    {
      label: 'UDISE Code',
      val: school?.udise_code || user?.primary_udise || '22050900101',
      sub: 'मान्यता प्राप्त शासकीय शाला',
      icon: <VerifiedUser sx={{ fontSize: 18 }} />,
      color: '#0284c7',
      bg: 'linear-gradient(135deg, rgba(2,132,199,0.1) 0%, rgba(2,132,199,0.02) 100%)',
    },
    {
      label: 'Assigned Classes',
      val: `${assignments?.length || 0} कक्षाएं`,
      sub: 'सक्रिय शिक्षण आवंटन',
      icon: <ClassOutlined sx={{ fontSize: 18 }} />,
      color: '#10b981',
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.02) 100%)',
    },
    {
      label: 'Enrolled Students',
      val: `${totalAssignedStudents} विद्यार्थी`,
      sub: 'कक्षा 6 से 8 कुल दर्ज संख्या',
      icon: <Groups sx={{ fontSize: 18 }} />,
      color: '#8b5cf6',
      bg: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)',
    },
    {
      label: 'Block & Cluster',
      val: school?.block_name || 'रायपुर नगर',
      sub: `संकुल: ${school?.cluster_name || 'संकुल केंद्र'}`,
      icon: <AccountTree sx={{ fontSize: 18 }} />,
      color: '#e89005',
      bg: 'linear-gradient(135deg, rgba(232,144,5,0.1) 0%, rgba(232,144,5,0.02) 100%)',
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Compact Executive Header Banner ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Paper
          elevation={0}
          sx={{
            px: { xs: 2.2, sm: 3 },
            py: { xs: 2, sm: 2.2 },
            mb: 2,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #071526 0%, #0f3460 55%, #0284c7 100%)',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(15, 52, 96, 0.22)',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 1.5,
          }}
        >
          {/* Subtle Ambient Glow */}
          <Box sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Left Content */}
          <Box sx={{ zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
              <Chip
                icon={<VerifiedUser sx={{ fontSize: '13px !important', color: '#10b981 !important' }} />}
                label="छत्तीसगढ़ शासन मान्यता प्राप्त विद्यालय"
                size="small"
                sx={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#bfdbfe',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  borderRadius: 1.5,
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              />
              <Chip
                label={`UDISE: ${school?.udise_code || user?.primary_udise || '22050900101'}`}
                size="small"
                sx={{
                  background: 'rgba(232, 144, 5, 0.25)',
                  color: '#fef08a',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  border: '1px solid rgba(232, 144, 5, 0.45)',
                  borderRadius: 1.5,
                }}
              />
              <Chip
                label="सत्र 2026-27"
                size="small"
                sx={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#6ee7b7',
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  height: 22,
                  borderRadius: 1.5,
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                }}
              />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                lineHeight: 1.25,
                mb: 0.5,
                letterSpacing: '-0.01em',
              }}
            >
              {school?.school_name || user?.school_name || 'शासकीय पूर्व माध्यमिक शाला'}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(226, 232, 240, 0.88)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.6,
                flexWrap: 'wrap',
                fontSize: '0.78rem',
              }}
            >
              <LocationOn sx={{ fontSize: 16, color: '#38bdf8' }} />
              संकुल: <strong style={{ color: '#ffffff' }}>{school?.cluster_name || 'संकुल केंद्र'}</strong>
              <span style={{ opacity: 0.4 }}>•</span>
              ब्लॉक: <strong style={{ color: '#ffffff' }}>{school?.block_name || 'रायपुर नगर'}</strong>
              <span style={{ opacity: 0.4 }}>•</span>
              जिला: <strong style={{ color: '#ffffff' }}>{school?.district_name || 'रायपुर'}</strong>
            </Typography>
          </Box>

          {/* Right Badge / Action */}
          <Box sx={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                textAlign: { xs: 'left', md: 'right' },
              }}
            >
              <Typography sx={{ fontSize: '0.66rem', color: '#93c5fd', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                संबद्धता बोर्ड
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 800 }}>
                CGBSE (छ.ग. माध्यमिक शिक्षा मंडल)
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{error}</Alert>}

      {/* ── Compact 4-KPI Row (Low Profile & Modern) ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 1.5,
        mb: 2,
        width: '100%',
      }}>
        {kpis.map((kpi, idx) => (
          <Card
            key={idx}
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(15, 23, 42, 0.07)',
                borderColor: kpi.color,
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box sx={{
                width: 38,
                height: 38,
                borderRadius: 2,
                background: kpi.bg,
                color: kpi.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${kpi.color}25`,
                flexShrink: 0,
              }}>
                {kpi.icon}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {kpi.label}
                </Typography>
                <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {kpi.val}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {kpi.sub}
                </Typography>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* ── Main Details Grid (4-4-4 or 2-Column Responsive) ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
        gap: 2,
        width: '100%',
      }}>
        {/* Card 1: Administrative Information */}
        <Card elevation={0} sx={{
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          <Box sx={{
            px: 2.2,
            py: 1.4,
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(15, 52, 96, 0.08)',
              color: '#0f3460',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Business sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.88rem' }}>
                प्रशासनिक एवं संकुल विवरण (Administrative Details)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                स्कूल शिक्षा विभाग, छत्तीसगढ़ शासन
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>
              {[
                { label: 'UDISE कोड', value: school?.udise_code || user?.primary_udise || '22050900101' },
                { label: 'शाला प्रबंधन (Management)', value: school?.school_management || 'Dept. of Education (स्कूल शिक्षा विभाग)' },
                { label: 'शाला का प्रकार (Category)', value: school?.school_type || 'सह-शिक्षा (Co-Educational)' },
                { label: 'जिला (District)', value: `${school?.district_name || 'रायपुर'} (कोड: ${school?.district_cd || '2205'})` },
                { label: 'विकासखंड (Block)', value: `${school?.block_name || 'रायपुर नगर'} (कोड: ${school?.block_cd || '220509'})` },
                { label: 'संकुल केंद्र (Cluster)', value: school?.cluster_name || 'संकुल संकुल केंद्र रायपुर' },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    background: '#f8fafc',
                    border: '1px solid #edf2f7',
                  }}
                >
                  <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem', mt: 0.2 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Card 2: Head of School & Leadership */}
        <Card elevation={0} sx={{
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          <Box sx={{
            px: 2.2,
            py: 1.4,
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(2, 132, 199, 0.08)',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Person sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.88rem' }}>
                संस्था प्रमुख एवं संस्थागत प्रोफाइल (School Leadership)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                प्रशासनिक एवं शैक्षणिक प्रभारी
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 1.25 }}>
              {[
                { label: 'संस्था प्रमुख का नाम', value: school?.hos_name || 'श्रीमान प्रधान पाठक (Principal)' },
                { label: 'संपर्क नंबर (Contact)', value: school?.hos_mobile || '+91 98260 XXXXX' },
                { label: 'संबद्धता बोर्ड (Board)', value: 'CGBSE (छत्तीसगढ़ माध्यमिक शिक्षा मंडल)' },
                { label: 'शैक्षणिक सत्र', value: '2026-27 (सक्रिय सत्र)' },
                { label: 'भौगोलिक स्थिति (Lat/Long)', value: `${school?.latitude || '21.2514° N'}, ${school?.longitude || '81.6296° E'}` },
                { label: 'शाला श्रेणी (Grade)', value: 'उच्च प्राथमिक (कक्षा 6 से 8)' },
              ].map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    background: '#f8fafc',
                    border: '1px solid #edf2f7',
                  }}
                >
                  <Typography sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.8rem', mt: 0.2 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Card 3: Class & Enrolled Teacher Stats */}
        <Card elevation={0} sx={{
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          <Box sx={{
            px: 2.2,
            py: 1.4,
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{
                width: 32,
                height: 32,
                borderRadius: 2,
                bgcolor: 'rgba(16, 185, 129, 0.08)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Groups sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.88rem' }}>
                  आवंटित कक्षाएं एवं विद्यार्थी विवरण
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                  शिक्षक असाइनमेंट सारांश ({assignments?.length || 0} कक्षाएं)
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`कुल दर्ज: ${totalAssignedStudents}`}
              size="small"
              sx={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 800, fontSize: '0.68rem', height: 22 }}
            />
          </Box>

          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1}>
              {(assignments || []).map(a => (
                <Box
                  key={a.class_id}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#0284c7',
                      background: '#f0f9ff',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Avatar sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.8,
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #0f3460, #0284c7)',
                      color: '#ffffff',
                    }}>
                      {a.class_num}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem' }}>
                        {a.class_name}
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                        सत्र 2026-27 · हिंदी माध्यम · सेक्शन {a.section || 'A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    icon={<Person sx={{ fontSize: '13px !important', color: '#0284c7 !important' }} />}
                    label={`${a.student_count || 0} विद्यार्थी नामांकित`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 1.5,
                      background: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      fontSize: '0.7rem',
                      height: 22,
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Card 4: Official Portals & Quick External Links */}
        <Card elevation={0} sx={{
          borderRadius: 2.8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          background: '#ffffff',
          overflow: 'hidden',
        }}>
          <Box sx={{
            px: 2.2,
            py: 1.4,
            borderBottom: '1px solid #f1f5f9',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.2,
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: 'rgba(232, 144, 5, 0.08)',
              color: '#e89005',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Public sx={{ fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.88rem' }}>
                छत्तीसगढ़ शासन आधिकारिक शिक्षा पोर्टल (Portals & Gateways)
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                School Education Portals & Data Access
              </Typography>
            </Box>
          </Box>

          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack spacing={1}>
              {[
                {
                  title: 'स्कूल शिक्षा पोर्टल छत्तीसगढ़ (EduPortal)',
                  url: 'https://eduportal.cg.nic.in/',
                  desc: 'शिक्षक पदस्थापना, शाला विवरण एवं ऑनलाइन रिपोर्टिंग',
                  badge: 'CG NIC',
                },
                {
                  title: 'पढ़ई तुंहर दुआर (CG School Portal)',
                  url: 'https://cgschool.in/',
                  desc: 'डिजिटल शिक्षण सामग्री, पाठ्यपुस्तकें एवं अभ्यास कार्य',
                  badge: 'E-Learning',
                },
                {
                  title: 'UDISE+ राष्ट्रीय पोर्टल (Govt. of India)',
                  url: 'https://udiseplus.gov.in/',
                  desc: 'एकीकृत जिला शिक्षा सूचना प्रणाली (Ministry of Education)',
                  badge: 'MoE India',
                },
              ].map((link, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: '#0284c7',
                      background: '#f0f9ff',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                      <Typography sx={{ fontWeight: 800, color: '#0f3460', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {link.title}
                      </Typography>
                      <Chip
                        label={link.badge}
                        size="small"
                        sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, background: 'rgba(15, 52, 96, 0.08)', color: '#0f3460', borderRadius: 1 }}
                      />
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.67rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {link.desc}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    endIcon={<OpenInNew sx={{ fontSize: '13px !important' }} />}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      borderRadius: 1.8,
                      fontSize: '0.7rem',
                      py: 0.4,
                      px: 1.2,
                      borderColor: '#cbd5e1',
                      color: '#0284c7',
                      fontWeight: 700,
                      flexShrink: 0,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#0284c7',
                        background: 'rgba(2, 132, 199, 0.06)',
                      }
                    }}
                  >
                    पोर्टल खोलें
                  </Button>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

