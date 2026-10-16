import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Chip, Tooltip,
  CircularProgress, Radio, FormControlLabel, RadioGroup, FormControl,
  FormLabel, Select, MenuItem, InputLabel, Divider, Badge, Tabs, Tab,
  Alert, Paper, Stack, LinearProgress, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, InputAdornment, alpha
} from '@mui/material';
import {
  Add, CloudUpload, Delete, Edit, CheckCircle, Image as ImageIcon,
  PhoneIphone, AutoAwesome, Refresh, Search, BookmarkBorder,
  HelpOutlineOutlined, ChevronRight, ChevronLeft, Send, Check, Close,
  School, Assignment, Visibility, ContentCopy, Layers, AssignmentTurnedIn,
  FilterList, ViewModule, ViewList, MenuBook, TrendingUp, Lightbulb,
  WorkspacePremium, AccountBalance, WarningAmber, Launch, ZoomIn
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from 'notistack';
import { questionBankApi } from '../../services/api';

const API_SERVER_URL = (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000').replace(/\s+/g, '');

const PRESET_DIAGRAMS = [
  { label: 'Q2: Glass (ग्लास)', url: '/uploads/questions/1021/page_2_img_1_jpeg.png' },
  { label: 'Q3: Sun (सूरज)', url: '/uploads/questions/1021/page_3_img_2_jpeg.png' },
  { label: 'Q6: Clothes Set (वस्त्र)', url: '/uploads/questions/1021/page_3_img_5_jpeg.png' },
  { label: 'Q8: Bat & Pairs (बल्ला)', url: '/uploads/questions/1021/page_4_img_1_jpeg.png' },
  { label: 'Q10: Flying Bird (उड़ता पक्षी)', url: '/uploads/questions/1021/page_5_img_1_jpeg.png' },
  { label: 'Q11: Cat on Table (मेज पर बिल्ली)', url: '/uploads/questions/1021/page_5_img_2_jpeg.png' },
  { label: 'Q12: Ball in Box (डिब्बे में गेंद)', url: '/uploads/questions/1021/page_6_img_2_jpeg.png' },
  { label: 'Q13: Ahil Boy (अहिल लड़का)', url: '/uploads/questions/1021/page_5_img_3_jpeg.png' },
  { label: 'Q14: Mango Fruit (आम)', url: '/uploads/questions/1021/page_6_img_3_jpeg.png' },
  { label: 'Q15: Alphabet Letter M (एम)', url: '/uploads/questions/1021/page_6_img_4_jpeg.png' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

// ── Admin-Style KPI Stat Card Component ─────────────────────────────────────
function QuestionBankKpiCard({ icon, label, value, sub, color, gradientTo, badge, index }) {
  const gTo = gradientTo || color;

  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={cardVariants} style={{ height: '100%', width: '100%' }}>
      <Card
        sx={{
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          background: '#ffffff',
          border: `1px solid ${alpha(color, 0.22)}`,
          boxShadow: `0 2px 10px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'all 0.25s cubic-bezier(0.22, 1, 0.36, 1)',
          '&:hover': {
            borderColor: alpha(color, 0.5),
            boxShadow: `0 10px 28px -4px ${alpha(color, 0.18)}, 0 4px 12px rgba(15, 23, 42, 0.05)`,
            transform: 'translateY(-3px)',
            '& .kpi-icon-badge': {
              transform: 'scale(1.08)',
              boxShadow: `0 6px 18px ${alpha(color, 0.38)}`,
            },
          },
        }}
      >
        {/* Top Glowing Accent Stripe */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3.5,
          background: `linear-gradient(90deg, ${color} 0%, ${gTo} 100%)`,
        }} />

        {/* Card Body */}
        <Box sx={{ p: { xs: 2, sm: 2.2 }, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5, mb: 1 }}>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                <Typography sx={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  {label}
                </Typography>
              </Box>

              <Typography sx={{
                fontSize: { xs: '1.5rem', sm: '1.75rem' },
                fontWeight: 800,
                color: '#0f172a',
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {value}
              </Typography>
            </Box>

            {/* Glowing 3D Icon Badge */}
            <Box
              className="kpi-icon-badge"
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${color} 0%, ${gTo} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 14px ${alpha(color, 0.3)}`,
                color: '#ffffff',
                flexShrink: 0,
                transition: 'all 0.25s ease',
              }}
            >
              {React.cloneElement(icon, { sx: { fontSize: 22, color: '#ffffff' } })}
            </Box>
          </Box>

          {/* Subtitle & Badge Footer */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
              {sub}
            </Typography>

            {badge && (
              <Chip
                label={badge}
                size="small"
                sx={{
                  background: alpha(color, 0.08),
                  color: color,
                  fontWeight: 700,
                  height: 20,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(color, 0.2)}`,
                  fontSize: '0.66rem',
                }}
              />
            )}
          </Box>
        </Box>
      </Card>
    </motion.div>
  );
}

export default function QuestionBankAdmin() {
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef(null);

  // Hierarchical Filter State: Class -> Subject -> Paper
  const [selectedClass, setSelectedClass] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState('Hindi');

  // Papers State
  const [papers, setPapers] = useState([]);
  const [selectedPaperCode, setSelectedPaperCode] = useState('1011');
  const [activePaper, setActivePaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // View Mode: 0: Cards Grid, 1: Table Register, 2: Blueprint & Matrix
  const [viewTab, setViewTab] = useState(0);
  const [filterType, setFilterType] = useState('ALL'); // ALL, DIAGRAMS, TEXT

  // Image Fallback Tracker
  const [imgErrors, setImgErrors] = useState({});

  // Class Subject Map
  const CLASS_SUBJECT_MAP = {
    primary: ['Hindi', 'English', 'Mathematics', 'EVS'],
    middle: ['Hindi', 'English', 'Sanskrit', 'Mathematics', 'Science', 'Social Science'],
    secondary: ['Hindi', 'English', 'Sanskrit', 'Mathematics', 'Science', 'Social Science'],
    higherSecondary: ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Economics', 'Accountancy'],
  };

  const getSubjectsForClass = (cls) => {
    if (cls <= 5) return CLASS_SUBJECT_MAP.primary;
    if (cls <= 8) return CLASS_SUBJECT_MAP.middle;
    if (cls <= 10) return CLASS_SUBJECT_MAP.secondary;
    return CLASS_SUBJECT_MAP.higherSecondary;
  };

  // Papers filtered by selected Class and Subject
  const papersForSelectedClassSubject = useMemo(() => {
    return papers.filter(
      p => Number(p.class_no) === Number(selectedClass) && p.subject?.toLowerCase() === selectedSubject?.toLowerCase()
    );
  }, [papers, selectedClass, selectedSubject]);

  // Question Form / Dialog State
  const [openQuestionModal, setOpenQuestionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Details & Bilingual, 1: Diagram & Options, 2: Student Preview

  // Question Form Data
  const [formData, setFormData] = useState({
    id: null,
    question_number: 1,
    question_text_en: '',
    question_text_hi: '',
    question_image_url: '',
    lo_code: 'ENG101',
    lo_description: 'Identifies letters of the alphabet and associates them with sounds.',
    question_type: 'MCQ',
    marks: 1.0,
    explanation_en: '',
    explanation_hi: '',
    correct_option: 'A',
    options: [
      { option_key: 'A', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: true },
      { option_key: 'B', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
      { option_key: 'C', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
      { option_key: 'D', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
    ],
  });

  // Mobile Simulator State
  const [openSimulator, setOpenSimulator] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [simAnswers, setSimAnswers] = useState({});
  const [simResult, setSimResult] = useState(null);
  const [submittingSim, setSubmittingSim] = useState(false);

  // New Paper Dialog State
  const [openPaperModal, setOpenPaperModal] = useState(false);
  const [paperForm, setPaperForm] = useState({
    paper_code: '',
    title: '',
    title_hi: '',
    class_no: 1,
    subject: 'English',
    total_questions: 15,
    total_marks: 15,
    duration_minutes: 45,
    academic_year: '2026-27',
    instructions_en: 'Choose the best option for each question.',
    instructions_hi: 'प्रत्येक प्रश्न के लिए सही विकल्प चुनें।',
  });

  // JSON Import State
  const [openImportModal, setOpenImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importingJson, setImportingJson] = useState(false);

  // Fetch Papers List
  const fetchPapers = async (targetClass = selectedClass, targetSubject = selectedSubject) => {
    try {
      setLoading(true);
      const res = await questionBankApi.getPapers();
      if (res.data?.success) {
        const allPapers = res.data.data;
        setPapers(allPapers);
        
        // Find matching paper for targetClass & targetSubject
        const matched = allPapers.find(
          p => Number(p.class_no) === Number(targetClass) && p.subject?.toLowerCase() === targetSubject?.toLowerCase()
        );

        if (matched) {
          setSelectedPaperCode(matched.paper_code);
          fetchPaperDetails(matched.paper_code);
        } else if (allPapers.length > 0) {
          const classMatched = allPapers.find(p => Number(p.class_no) === Number(targetClass));
          if (classMatched) {
            setSelectedPaperCode(classMatched.paper_code);
            setSelectedSubject(classMatched.subject);
            fetchPaperDetails(classMatched.paper_code);
          } else {
            setSelectedPaperCode(allPapers[0].paper_code);
            setSelectedClass(allPapers[0].class_no);
            setSelectedSubject(allPapers[0].subject);
            fetchPaperDetails(allPapers[0].paper_code);
          }
        } else {
          setActivePaper(null);
        }
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Failed to fetch assessment papers: ' + err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch Active Paper Details
  const fetchPaperDetails = async (code) => {
    try {
      setLoading(true);
      const res = await questionBankApi.getPaper(code);
      if (res.data?.success) {
        setActivePaper(res.data.data);
      }
    } catch (err) {
      console.error(err);
      enqueueSnackbar(`Error loading paper ${code}: ` + err.message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers(selectedClass, selectedSubject);
  }, []);

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    const availableSubjects = getSubjectsForClass(newClass);
    let nextSubj = selectedSubject;
    if (!availableSubjects.includes(nextSubj)) {
      nextSubj = availableSubjects[0];
      setSelectedSubject(nextSubj);
    }

    const matched = papers.find(
      p => Number(p.class_no) === Number(newClass) && p.subject?.toLowerCase() === nextSubj.toLowerCase()
    );

    if (matched) {
      setSelectedPaperCode(matched.paper_code);
      fetchPaperDetails(matched.paper_code);
    } else {
      const anyForClass = papers.find(p => Number(p.class_no) === Number(newClass));
      if (anyForClass) {
        setSelectedSubject(anyForClass.subject);
        setSelectedPaperCode(anyForClass.paper_code);
        fetchPaperDetails(anyForClass.paper_code);
      } else {
        setActivePaper(null);
      }
    }
  };

  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    const matched = papers.find(
      p => Number(p.class_no) === Number(selectedClass) && p.subject?.toLowerCase() === newSubject.toLowerCase()
    );
    if (matched) {
      setSelectedPaperCode(matched.paper_code);
      fetchPaperDetails(matched.paper_code);
    } else {
      setActivePaper(null);
    }
  };

  const handlePaperChange = (code) => {
    setSelectedPaperCode(code);
    const target = papers.find(p => p.paper_code === code);
    if (target) {
      setSelectedClass(target.class_no);
      setSelectedSubject(target.subject);
    }
    fetchPaperDetails(code);
  };

  // Seed SLA 1021
  const handleSeed1021 = async () => {
    try {
      setSeeding(true);
      const res = await questionBankApi.seedSla1021();
      if (res.data?.success) {
        enqueueSnackbar('✅ SLA Paper 1021 (English) loaded with 15 questions & diagrams!', { variant: 'success' });
        setSelectedPaperCode('1021');
        setSelectedClass(1);
        setSelectedSubject('English');
        fetchPapers(1, 'English');
      }
    } catch (err) {
      enqueueSnackbar('Failed to seed SLA Paper: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  // Seed Hindi 1011
  const handleSeedHindi1011 = async () => {
    try {
      setSeeding(true);
      const res = await questionBankApi.seedHindi1011();
      if (res.data?.success) {
        enqueueSnackbar('✅ Paper 1011 (Hindi Class 1, 30 Marks) loaded successfully!', { variant: 'success' });
        setSelectedPaperCode('1011');
        setSelectedClass(1);
        setSelectedSubject('Hindi');
        fetchPapers(1, 'Hindi');
      }
    } catch (err) {
      enqueueSnackbar('Failed to seed Hindi Paper: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setSeeding(false);
    }
  };

  // Import Custom JSON
  const handleImportJsonSubmit = async () => {
    try {
      if (!jsonInput.trim()) {
        enqueueSnackbar('Please paste valid JSON payload', { variant: 'warning' });
        return;
      }
      setImportingJson(true);
      const parsed = JSON.parse(jsonInput);
      const res = await questionBankApi.importMobileJson(parsed);
      if (res.data?.success) {
        enqueueSnackbar('✅ Questions imported successfully into database!', { variant: 'success' });
        setOpenImportModal(false);
        setJsonInput('');
        if (Array.isArray(parsed) && parsed[0]?.paperCode) {
          setSelectedPaperCode(parsed[0].paperCode);
        } else if (parsed?.paperCode) {
          setSelectedPaperCode(parsed.paperCode);
        }
        fetchPapers();
      }
    } catch (err) {
      enqueueSnackbar('JSON import error: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setImportingJson(false);
    }
  };

  // Open Question Authoring Modal
  const handleOpenNewQuestion = async () => {
    let currentPaper = activePaper;
    if (!currentPaper) {
      try {
        const subIndex = getSubjectsForClass(selectedClass).indexOf(selectedSubject) + 1;
        const autoPaperCode = `${selectedClass}0${subIndex > 0 ? subIndex : 1}1`;
        const createRes = await questionBankApi.savePaper({
          paper_code: autoPaperCode,
          title: `Class ${selectedClass} ${selectedSubject} Assessment`,
          title_hi: `कक्षा ${selectedClass} ${selectedSubject} मूल्यांकन`,
          class_no: selectedClass,
          subject: selectedSubject,
          total_questions: 15,
          total_marks: 30,
          duration_minutes: 45,
          academic_year: '2026-27',
        });
        if (createRes.data?.success) {
          currentPaper = createRes.data.data;
          setSelectedPaperCode(autoPaperCode);
          await fetchPapers(selectedClass, selectedSubject);
        }
      } catch {
        enqueueSnackbar('Please create an assessment paper for this subject first', { variant: 'warning' });
        return;
      }
    }

    const nextQNum = (currentPaper?.questions?.length || 0) + 1;
    const subPrefix = selectedSubject.slice(0, 3).toUpperCase();

    setFormData({
      id: null,
      question_number: nextQNum,
      question_text_en: '',
      question_text_hi: '',
      question_image_url: '',
      lo_code: `${subPrefix}${selectedClass}0${Math.min(nextQNum, 9)}`,
      lo_description: `Class ${selectedClass} ${selectedSubject} Foundational Learning Competency`,
      question_type: 'MCQ',
      marks: 1.0,
      explanation_en: '',
      explanation_hi: '',
      correct_option: 'A',
      options: [
        { option_key: 'A', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: true },
        { option_key: 'B', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
        { option_key: 'C', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
        { option_key: 'D', option_text_en: '', option_text_hi: '', option_image_url: '', is_correct: false },
      ],
    });
    setIsEditing(false);
    setActiveTab(0);
    setOpenQuestionModal(true);
  };

  const handleEditQuestion = (q) => {
    const correctOpt = q.options?.find(o => o.is_correct)?.option_key || 'A';
    setFormData({
      id: q.id,
      question_number: q.question_number,
      question_text_en: q.question_text_en || '',
      question_text_hi: q.question_text_hi || '',
      question_image_url: q.question_image_url || '',
      lo_code: q.lo_code || 'ENG101',
      lo_description: q.lo_description || '',
      question_type: q.question_type || 'MCQ',
      marks: parseFloat(q.marks || 1.0),
      explanation_en: q.explanation_en || '',
      explanation_hi: q.explanation_hi || '',
      correct_option: correctOpt,
      options: ['A', 'B', 'C', 'D'].map(key => {
        const found = q.options?.find(o => o.option_key === key);
        return {
          option_key: key,
          option_text_en: found?.option_text_en || '',
          option_text_hi: found?.option_text_hi || '',
          option_image_url: found?.option_image_url || '',
          is_correct: key === correctOpt,
        };
      }),
    });
    setIsEditing(true);
    setActiveTab(0);
    setOpenQuestionModal(true);
  };

  const handleDeleteQuestion = async (id, qNum) => {
    if (!window.confirm(`Are you sure you want to delete Question #${qNum}?`)) return;
    try {
      await questionBankApi.deleteQuestion(id);
      enqueueSnackbar(`Question #${qNum} deleted`, { variant: 'info' });
      fetchPaperDetails(selectedPaperCode);
    } catch (err) {
      enqueueSnackbar('Failed to delete question: ' + err.message, { variant: 'error' });
    }
  };

  // Image Upload handler for Question diagram
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await questionBankApi.uploadImage(fd);
      if (res.data?.success) {
        setFormData(prev => ({ ...prev, question_image_url: res.data.imageUrl }));
        enqueueSnackbar('Image uploaded successfully!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Image upload failed: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCorrectOptionChange = (key) => {
    setFormData(prev => ({
      ...prev,
      correct_option: key,
      options: prev.options.map(o => ({
        ...o,
        is_correct: o.option_key === key,
      })),
    }));
  };

  const handleOptionTextChange = (key, lang, text) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(o => {
        if (o.option_key !== key) return o;
        return {
          ...o,
          [lang === 'en' ? 'option_text_en' : 'option_text_hi']: text,
        };
      }),
    }));
  };

  const handleSaveQuestion = async () => {
    if (!formData.question_text_en && !formData.question_text_hi) {
      enqueueSnackbar('Please provide either English or Hindi question text', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        paper_id: activePaper.id,
        ...formData,
      };

      const res = await questionBankApi.saveQuestion(payload);
      if (res.data?.success) {
        enqueueSnackbar(isEditing ? 'Question updated successfully!' : 'Question authored successfully!', { variant: 'success' });
        setOpenQuestionModal(false);
        fetchPaperDetails(selectedPaperCode);
      }
    } catch (err) {
      enqueueSnackbar('Failed to save question: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    }
  };

  const handleSavePaper = async () => {
    if (!paperForm.paper_code || !paperForm.title) {
      enqueueSnackbar('Please provide Paper Code and Title', { variant: 'warning' });
      return;
    }
    try {
      const res = await questionBankApi.savePaper(paperForm);
      if (res.data?.success) {
        enqueueSnackbar('Assessment paper created successfully!', { variant: 'success' });
        setOpenPaperModal(false);
        setSelectedClass(paperForm.class_no);
        setSelectedSubject(paperForm.subject);
        setSelectedPaperCode(paperForm.paper_code);
        fetchPapers(paperForm.class_no, paperForm.subject);
      }
    } catch (err) {
      enqueueSnackbar('Failed to save paper: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    }
  };

  // Simulator Handlers
  const handleStartSimulator = () => {
    setSimIndex(0);
    setSimAnswers({});
    setSimResult(null);
    setOpenSimulator(true);
  };

  const handleSimOptionSelect = (qNum, optKey) => {
    setSimAnswers(prev => ({
      ...prev,
      [qNum]: optKey,
    }));
  };

  const handleSubmitSimTest = async () => {
    if (!activePaper?.questions?.length) return;
    try {
      setSubmittingSim(true);
      const answersPayload = Object.entries(simAnswers).map(([qNum, opt]) => ({
        question_number: parseInt(qNum, 10),
        selected_option: opt,
      }));

      const res = await questionBankApi.submitAssessment({
        student_id: 'STUDENT_CG_1021',
        student_name: 'Aarav Sharma (Class 1)',
        paper_id: activePaper.id,
        class_no: activePaper.class_no,
        school_id: 1,
        answers: answersPayload,
      });

      if (res.data?.success) {
        setSimResult(res.data);
        enqueueSnackbar('Assessment submitted and graded by AI engine!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar('Submission error: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setSubmittingSim(false);
    }
  };

  // Filter questions by search and type
  const filteredQuestions = useMemo(() => {
    return (activePaper?.questions || []).filter(q => {
      if (filterType === 'DIAGRAMS' && !q.question_image_url) return false;
      if (filterType === 'TEXT' && q.question_image_url) return false;
      if (!searchQuery) return true;
      const qStr = `${q.question_text_en || ''} ${q.question_text_hi || ''} ${q.lo_code || ''} Q${q.question_number}`.toLowerCase();
      return qStr.includes(searchQuery.toLowerCase());
    });
  }, [activePaper, searchQuery, filterType]);

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_SERVER_URL}${path}`;
  };

  // Unique LO Codes count
  const uniqueLoCount = useMemo(() => {
    const los = new Set((activePaper?.questions || []).map(q => q.lo_code).filter(Boolean));
    return los.size || (activePaper?.questions?.length ? 1 : 0);
  }, [activePaper]);

  // Total available papers count across classes
  const totalPapersCount = papers.length;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* ── 1. Hero Executive Header Banner (Matching Teacher/Admin Dashboard) ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <Box sx={{
          p: { xs: 2.2, sm: 3 },
          mb: 2.5,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #eff6ff 100%)',
          color: '#0f172a',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 12px rgba(15, 23, 42, 0.04)',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          {/* Decorative Ambient Accents */}
          <Box sx={{ position: 'absolute', right: -50, top: -50, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(2,132,199,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', right: 140, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
            <Box>
              <Typography sx={{ color: '#0284c7', letterSpacing: '0.08em', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', mb: 0.5 }}>
                SCERT Curriculum & Examination Authoring Engine
              </Typography>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.4rem', sm: '1.75rem' }, lineHeight: 1.2, fontFamily: '"Plus Jakarta Sans", sans-serif', mb: 0.75, color: '#0f172a' }}>
                Assessment Question Bank & Paper Authoring 📚
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <School sx={{ fontSize: 16, color: '#0284c7' }} />
                <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '0.84rem' }}>
                  State Council of Educational Research & Training · Chhattisgarh
                </Typography>
                <Chip
                  label="Session 2026-27 · Active"
                  size="small"
                  sx={{
                    background: '#eff6ff',
                    color: '#0284c7',
                    fontWeight: 700,
                    height: 22,
                    border: '1px solid rgba(2,132,199,0.25)',
                    fontSize: '0.68rem',
                    borderRadius: 1.5,
                  }}
                />
                <Chip
                  label="Bilingual (EN / हिन्दी)"
                  size="small"
                  sx={{
                    background: '#f0fdf4',
                    color: '#059669',
                    fontWeight: 700,
                    height: 22,
                    border: '1px solid #bbf7d0',
                    fontSize: '0.68rem',
                    borderRadius: 1.5,
                  }}
                />
              </Box>
            </Box>

            {/* Quick Action Buttons */}
            <Stack direction="row" spacing={1.25} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: 16 }} />}
                onClick={handleSeedHindi1011}
                disabled={seeding}
                sx={{
                  borderColor: '#fde68a',
                  color: '#b45309',
                  background: '#fffbeb',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.75,
                  '&:hover': { background: '#fef3c7', borderColor: '#f59e0b' },
                }}
              >
                {seeding ? 'Seeding...' : '⚡ Seed Hindi 1011'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh sx={{ fontSize: 16 }} />}
                onClick={handleSeed1021}
                disabled={seeding}
                sx={{
                  borderColor: 'rgba(2,132,199,0.3)',
                  color: '#0284c7',
                  background: 'rgba(2,132,199,0.04)',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.75,
                  '&:hover': { background: 'rgba(2,132,199,0.1)', borderColor: '#0284c7' },
                }}
              >
                {seeding ? 'Seeding...' : '⚡ Seed SLA 1021'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<CloudUpload sx={{ fontSize: 16 }} />}
                onClick={() => setOpenImportModal(true)}
                sx={{
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 1.5,
                  py: 0.75,
                  background: '#ffffff',
                  '&:hover': { background: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                📥 Import JSON
              </Button>

              <Button
                variant="contained"
                startIcon={<PhoneIphone sx={{ fontSize: 16 }} />}
                onClick={handleStartSimulator}
                disabled={!activePaper?.questions?.length}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 1.8,
                  py: 0.75,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                  '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                }}
              >
                Mobile Simulator
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleOpenNewQuestion}
                sx={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  borderRadius: 2,
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  px: 2,
                  py: 0.75,
                  boxShadow: '0 4px 12px rgba(2,132,199,0.25)',
                  '&:hover': { background: 'linear-gradient(135deg, #0369a1 0%, #075985 100%)' },
                }}
              >
                + Add Question
              </Button>
            </Stack>
          </Box>
        </Box>
      </motion.div>

      {/* ── 2. Admin-Style 4 KPI Cards Row ── */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        gap: 2,
        width: '100%',
        mb: 2.5,
      }}>
        <QuestionBankKpiCard
          index={0}
          icon={<School />}
          label="CURRICULUM PAPER"
          value={activePaper ? `Paper [${activePaper.paper_code}]` : 'No Paper'}
          sub={`Class ${selectedClass} · ${selectedSubject}`}
          color="#0284c7"
          gradientTo="#38bdf8"
          badge={activePaper?.academic_year || 'Session 2026-27'}
        />

        <QuestionBankKpiCard
          index={1}
          icon={<Layers />}
          label="QUESTIONS REPOSITORY"
          value={`${activePaper?.questions?.length || 0} Questions`}
          sub={`${totalPapersCount} assessment papers active`}
          color="#8b5cf6"
          gradientTo="#a78bfa"
          badge="100% Bilingual"
        />

        <QuestionBankKpiCard
          index={2}
          icon={<AssignmentTurnedIn />}
          label="EVALUATION WEIGHTAGE"
          value={`${activePaper?.total_marks || 30} Marks`}
          sub={`Duration: ${activePaper?.duration_minutes || 45} Minutes`}
          color="#10b981"
          gradientTo="#34d399"
          badge="40% Passing Std"
        />

        <QuestionBankKpiCard
          index={3}
          icon={<AutoAwesome />}
          label="COMPETENCY COVERAGE"
          value={`${uniqueLoCount} LO Codes`}
          sub="Mapped to SCERT Learning Standards"
          color="#f59e0b"
          gradientTo="#fbbf24"
          badge="SCERT Aligned"
        />
      </Box>

      {/* ── 3. Executive 3-Tier Curriculum Filter Panel ── */}
      <Paper sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 2.5,
        borderRadius: 2,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        {/* Tier 1: Class Selector */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 1: Select Class / Grade (कक्षा चुनें)
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Class 1 to 12
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { height: 4 } }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => {
              const isSelected = Number(selectedClass) === cls;
              const papersForClass = papers.filter(p => Number(p.class_no) === cls).length;

              return (
                <Chip
                  key={cls}
                  label={`Class ${cls}${papersForClass > 0 ? ` (${papersForClass})` : ''}`}
                  onClick={() => handleClassChange(cls)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    height: 32,
                    px: 0.5,
                    cursor: 'pointer',
                    borderRadius: 1.8,
                    background: isSelected ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 12px rgba(2,132,199,0.25)' : 'none',
                    '&:hover': {
                      background: isSelected ? '#0369a1' : '#f1f5f9',
                      borderColor: isSelected ? '#0284c7' : '#cbd5e1',
                    },
                    transition: 'all 0.18s ease',
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

        {/* Tier 2: Subject Selector */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step 2: Select Subject (विषय चुनें · Class {selectedClass})
            </Typography>
            <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>
              Curriculum Subjects
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, '::-webkit-scrollbar': { height: 4 } }}>
            {getSubjectsForClass(selectedClass).map((subj) => {
              const isSelected = selectedSubject?.toLowerCase() === subj.toLowerCase();
              const countForSubj = papers.filter(
                p => Number(p.class_no) === Number(selectedClass) && p.subject?.toLowerCase() === subj.toLowerCase()
              ).length;

              return (
                <Chip
                  key={subj}
                  label={countForSubj > 0 ? `${subj} (${countForSubj} Paper)` : subj}
                  onClick={() => handleSubjectChange(subj)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    height: 32,
                    px: 0.8,
                    cursor: 'pointer',
                    borderRadius: 1.8,
                    background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f8fafc',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid #10b981' : '1px solid #e2e8f0',
                    boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.25)' : 'none',
                    '&:hover': {
                      background: isSelected ? '#059669' : '#f1f5f9',
                      borderColor: isSelected ? '#10b981' : '#cbd5e1',
                    },
                    transition: 'all 0.18s ease',
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: '#f1f5f9' }} />

        {/* Tier 3: Paper Selector Dropdown & Blueprint Summary */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            {papersForSelectedClassSubject.length > 0 ? (
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Active Paper for Class {selectedClass} · {selectedSubject}
                </InputLabel>
                <Select
                  value={selectedPaperCode}
                  label={`Active Paper for Class ${selectedClass} · ${selectedSubject}`}
                  onChange={(e) => handlePaperChange(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    height: 40,
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    background: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                  }}
                >
                  {papersForSelectedClassSubject.map((p) => (
                    <MenuItem key={p.id} value={p.paper_code} sx={{ fontSize: '0.84rem' }}>
                      📄 [{p.paper_code}] {p.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <Box sx={{
                p: 1.25,
                borderRadius: 2,
                background: '#fff1f2',
                border: '1px dashed #fecdd3',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}>
                <WarningAmber sx={{ color: '#e11d48', fontSize: 18 }} />
                <Typography sx={{ color: '#be123c', fontWeight: 700, fontSize: '0.8rem' }}>
                  No paper exists yet for Class {selectedClass} · {selectedSubject}
                </Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} md={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5, flexWrap: 'wrap' }}>
              {activePaper && (
                <Chip
                  label={`${activePaper.total_questions || 15} Target Questions · ${activePaper.duration_minutes || 45} Mins`}
                  size="small"
                  sx={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, height: 28, borderRadius: 1.5 }}
                />
              )}

              <Button
                size="small"
                variant="outlined"
                startIcon={<Add sx={{ fontSize: 16 }} />}
                onClick={() => {
                  setPaperForm({
                    paper_code: `${selectedClass}0${getSubjectsForClass(selectedClass).indexOf(selectedSubject) + 1}1`,
                    title: `Class ${selectedClass} ${selectedSubject} Assessment`,
                    title_hi: `कक्षा ${selectedClass} ${selectedSubject} मूल्यांकन`,
                    class_no: selectedClass,
                    subject: selectedSubject,
                    total_questions: 15,
                    total_marks: 30,
                    duration_minutes: 45,
                    academic_year: '2026-27',
                    instructions_en: 'Choose the best option for each question.',
                    instructions_hi: 'प्रत्येक प्रश्न के लिए सही विकल्प चुनें।',
                  });
                  setOpenPaperModal(true);
                }}
                sx={{
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  borderColor: '#cbd5e1',
                  color: '#334155',
                  '&:hover': { background: '#f8fafc', borderColor: '#94a3b8' },
                }}
              >
                + New Paper Blueprint
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* ── 4. View Tabs (Questions Grid / Questions Table / Paper Blueprint) ── */}
      <Paper sx={{
        mb: 2.5,
        borderRadius: 2,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
        overflow: 'hidden',
        width: '100%',
      }}>
        <Tabs
          value={viewTab}
          onChange={(e, val) => setViewTab(val)}
          sx={{
            px: 1.5,
            minHeight: 46,
            '& .MuiTab-root': {
              minHeight: 46,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              color: '#64748b',
              py: 1,
              px: { xs: 1.5, sm: 2.5 },
              '&.Mui-selected': {
                color: '#0284c7',
                fontWeight: 800,
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
            },
          }}
        >
          <Tab icon={<ViewModule sx={{ fontSize: 18 }} />} iconPosition="start" label={`Questions Grid (${filteredQuestions.length})`} />
          <Tab icon={<ViewList sx={{ fontSize: 18 }} />} iconPosition="start" label="Register Table View" />
          <Tab icon={<MenuBook sx={{ fontSize: 18 }} />} iconPosition="start" label="Paper Blueprint & LO Matrix" />
        </Tabs>
      </Paper>

      {/* ── 5. Search, Filter Chips & Action Controls (Only on Grid and Table View) ── */}
      {viewTab !== 2 && (
        <Paper sx={{
          p: 2,
          mb: 2.5,
          borderRadius: 2,
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
        }}>
          <TextField
            size="small"
            placeholder="Search by question text (English/Hindi) or LO Code (e.g. ENG101)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 360px' },
              maxWidth: { sm: 460 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                height: 38,
                fontSize: '0.82rem',
                background: '#f8fafc',
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

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8', mr: 0.5 }}>
              <FilterList sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                Type:
              </Typography>
            </Box>
            {[
              { key: 'ALL', label: 'All Questions', count: activePaper?.questions?.length || 0 },
              { key: 'DIAGRAMS', label: 'With Diagrams', count: (activePaper?.questions || []).filter(q => q.question_image_url).length },
              { key: 'TEXT', label: 'Text Only', count: (activePaper?.questions || []).filter(q => !q.question_image_url).length },
            ].map((flt) => {
              const active = filterType === flt.key;
              return (
                <Chip
                  key={flt.key}
                  label={`${flt.label} (${flt.count})`}
                  clickable
                  onClick={() => setFilterType(flt.key)}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    height: 28,
                    borderRadius: 1.8,
                    background: active ? '#0284c7' : '#f1f5f9',
                    color: active ? '#ffffff' : '#475569',
                    border: active ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  }}
                />
              );
            })}
          </Stack>
        </Paper>
      )}

      {/* ── 6. TAB 0: QUESTIONS CARDS GRID (Executive Full-Width 3-Column Grid) ── */}
      {viewTab === 0 && (
        <Box sx={{ width: '100%' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#0284c7' }} />
            </Box>
          ) : filteredQuestions.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2, background: '#ffffff', border: '1px dashed #cbd5e1' }}>
              <ImageIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
              <Typography sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', mb: 0.5 }}>
                No Questions Found
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.84rem', mb: 2 }}>
                Click "+ Add Question" to author your first question, or load sample assessments from the top buttons.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={handleSeedHindi1011}
                sx={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  fontWeight: 800,
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Load Sample Hindi 1011 Paper
              </Button>
            </Paper>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2.5,
              width: '100%',
            }}>
              {filteredQuestions.map((q, qIndex) => {
                const hasImage = Boolean(q.question_image_url);
                const hasImgError = imgErrors[q.id];

                return (
                  <motion.div
                    key={q.id || qIndex}
                    custom={qIndex}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    style={{ height: '100%' }}
                  >
                    <Card
                      sx={{
                        borderRadius: 2,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        background: '#ffffff',
                        transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                        '&:hover': {
                          borderColor: '#38bdf8',
                          boxShadow: '0 8px 24px rgba(2,132,199,0.12)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Top Card Header: Q-Badge, LO Tag, Marks & Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1.5,
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem',
                                boxShadow: '0 2px 6px rgba(2,132,199,0.3)',
                              }}
                            >
                              Q{q.question_number}
                            </Box>
                            <Tooltip title={q.lo_description || 'Foundational Learning Outcome'}>
                              <Chip
                                label={q.lo_code || 'LO-GENERAL'}
                                size="small"
                                sx={{
                                  background: '#eff6ff',
                                  color: '#0284c7',
                                  fontWeight: 800,
                                  fontSize: '0.7rem',
                                  border: '1px solid rgba(2,132,199,0.25)',
                                  borderRadius: 1.5,
                                  height: 24,
                                }}
                              />
                            </Tooltip>
                            <Chip
                              label={`${q.marks || 1.0} Marks`}
                              size="small"
                              sx={{
                                background: '#f8fafc',
                                color: '#64748b',
                                fontWeight: 700,
                                fontSize: '0.68rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: 1.5,
                                height: 22,
                              }}
                            />
                          </Stack>

                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Edit Question">
                              <IconButton
                                size="small"
                                onClick={() => handleEditQuestion(q)}
                                sx={{
                                  color: '#0284c7',
                                  background: 'rgba(2,132,199,0.06)',
                                  borderRadius: 1.5,
                                  width: 28,
                                  height: 28,
                                  '&:hover': { background: 'rgba(2,132,199,0.15)' },
                                }}
                              >
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Question">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteQuestion(q.id, q.question_number)}
                                sx={{
                                  color: '#ef4444',
                                  background: 'rgba(239,68,68,0.06)',
                                  borderRadius: 1.5,
                                  width: 28,
                                  height: 28,
                                  '&:hover': { background: 'rgba(239,68,68,0.15)' },
                                }}
                              >
                                <Delete sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {/* Diagram Container (With Fallback Graceful Handling) */}
                        {hasImage && !hasImgError && (
                          <Box
                            sx={{
                              mb: 1.5,
                              p: 1,
                              borderRadius: 2,
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minHeight: 120,
                              maxHeight: 140,
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <img
                              src={getFullImageUrl(q.question_image_url)}
                              alt={`Diagram Q${q.question_number}`}
                              onError={() => setImgErrors(prev => ({ ...prev, [q.id]: true }))}
                              style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }}
                            />
                          </Box>
                        )}

                        {hasImage && hasImgError && (
                          <Box
                            sx={{
                              mb: 1.5,
                              p: 1.25,
                              borderRadius: 2,
                              background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                              border: '1px dashed #bbf7d0',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.25,
                            }}
                          >
                            <Box sx={{
                              width: 34, height: 34, borderRadius: 1.5,
                              background: '#10b981', color: '#ffffff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <ImageIcon sx={{ fontSize: 18 }} />
                            </Box>
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '0.76rem', color: '#166534' }}>
                                Visual Diagram Question · Q{q.question_number}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#15803d' }}>
                                Reference: {q.question_image_url?.split('/')?.pop() || 'Diagram'}
                              </Typography>
                            </Box>
                          </Box>
                        )}

                        {/* Bilingual Question Prompts */}
                        <Box sx={{ mb: 2, flex: 1 }}>
                          {q.question_text_en && (
                            <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.88rem', mb: 0.5, lineHeight: 1.4 }}>
                              {q.question_text_en}
                            </Typography>
                          )}
                          {q.question_text_hi && (
                            <Box sx={{
                              pl: 1,
                              borderLeft: '2.5px solid #0284c7',
                              py: 0.25,
                            }}>
                              <Typography sx={{ fontWeight: 600, color: '#334155', fontSize: '0.84rem', lineHeight: 1.4 }}>
                                {q.question_text_hi}
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* 4 Options 2x2 Responsive Grid */}
                        <Box sx={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, 1fr)',
                          gap: 1,
                          mt: 'auto',
                          pt: 1,
                          borderTop: '1px solid #f1f5f9',
                        }}>
                          {q.options?.map((opt) => {
                            const isCorrect = opt.is_correct;
                            return (
                              <Box
                                key={opt.option_key}
                                sx={{
                                  p: 1,
                                  borderRadius: 1.8,
                                  background: isCorrect ? '#f0fdf4' : '#f8fafc',
                                  border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  transition: 'all 0.18s ease',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 22, height: 22, borderRadius: 1.2,
                                    background: isCorrect ? '#10b981' : '#cbd5e1',
                                    color: '#ffffff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.72rem', fontWeight: 800, flexShrink: 0,
                                  }}
                                >
                                  {isCorrect ? '✓' : opt.option_key}
                                </Box>
                                <Box sx={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                                  <Typography sx={{
                                    fontSize: '0.78rem',
                                    fontWeight: isCorrect ? 800 : 600,
                                    color: isCorrect ? '#14532d' : '#334155',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>
                                    {opt.option_text_en || opt.option_text_hi || `Option ${opt.option_key}`}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ── 7. TAB 1: QUESTIONS TABLE REGISTER VIEW ── */}
      {viewTab === 1 && (
        <Paper sx={{
          borderRadius: 2,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
          overflow: 'hidden',
          background: '#ffffff',
          width: '100%',
        }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ background: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 60 }}>Q#</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 110 }}>LO CODE</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5 }}>QUESTION PROMPT (BILINGUAL)</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 100 }}>DIAGRAM</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 140 }}>CORRECT ANSWER</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 80 }}>MARKS</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.76rem', py: 1.5, width: 100 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                      No questions matched your search criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((q) => {
                    const correctOpt = q.options?.find(o => o.is_correct);
                    return (
                      <TableRow key={q.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                          Q{q.question_number}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={q.lo_code || 'LO-GENERAL'}
                            size="small"
                            sx={{
                              background: '#eff6ff',
                              color: '#0284c7',
                              fontWeight: 800,
                              fontSize: '0.68rem',
                              border: '1px solid rgba(2,132,199,0.25)',
                              borderRadius: 1.5,
                              height: 22,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                            {q.question_text_en}
                          </Typography>
                          {q.question_text_hi && (
                            <Typography sx={{ fontSize: '0.78rem', color: '#64748b', mt: 0.25 }}>
                              {q.question_text_hi}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {q.question_image_url ? (
                            <Chip
                              icon={<ImageIcon sx={{ fontSize: 14 }} />}
                              label="Diagram"
                              size="small"
                              sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 700, height: 22, fontSize: '0.68rem' }}
                            />
                          ) : (
                            <Typography sx={{ fontSize: '0.74rem', color: '#94a3b8' }}>None</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <Box sx={{
                              width: 20, height: 20, borderRadius: 1,
                              background: '#10b981', color: '#ffffff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800,
                            }}>
                              ✓
                            </Box>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                              [{correctOpt?.option_key || 'A'}] {correctOpt?.option_text_en || correctOpt?.option_text_hi || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>
                          {q.marks || 1.0} M
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                            <Tooltip title="Edit Question">
                              <IconButton size="small" onClick={() => handleEditQuestion(q)} sx={{ color: '#0284c7' }}>
                                <Edit sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Question">
                              <IconButton size="small" onClick={() => handleDeleteQuestion(q.id, q.question_number)} sx={{ color: '#ef4444' }}>
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ── 8. TAB 2: PAPER BLUEPRINT & LO MATRIX ── */}
      {viewTab === 2 && (
        <Box sx={{ width: '100%' }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Paper sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                background: '#ffffff',
              }}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook sx={{ color: '#0284c7' }} />
                  Curriculum Competency & Learning Outcome (LO) Blueprint
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem', mb: 2.5 }}>
                  Detailed learning outcome coverage for Paper [{activePaper?.paper_code}] Class {selectedClass} {selectedSubject}
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ background: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>LO CODE</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>COMPETENCY SPECIFICATION</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>QUESTIONS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#475569', fontSize: '0.74rem' }}>MARKS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activePaper?.questions?.map((q) => (
                        <TableRow key={q.id} hover>
                          <TableCell sx={{ fontWeight: 800, color: '#0284c7' }}>
                            {q.lo_code || 'LO-GENERAL'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.8rem', color: '#334155' }}>
                            {q.lo_description || q.question_text_en?.slice(0, 50) + '...'}
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`Q${q.question_number}`} size="small" sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#10b981' }}>
                            {q.marks || 1.0} M
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                background: '#ffffff',
                mb: 2.5,
              }}>
                <Typography sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WorkspacePremium sx={{ color: '#f59e0b' }} />
                  Paper Specifications
                </Typography>

                <Stack spacing={1.75}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Paper Code</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{activePaper?.paper_code || '1011'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Class & Subject</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0284c7' }}>Class {selectedClass} · {selectedSubject}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Questions</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{activePaper?.questions?.length || 15} Questions</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Total Maximum Marks</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>{activePaper?.total_marks || 30} Marks</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Exam Duration</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{activePaper?.duration_minutes || 45} Minutes</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>Academic Year</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>{activePaper?.academic_year || '2026-27'}</Typography>
                  </Box>
                </Stack>
              </Paper>

              <Paper sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
              }}>
                <Typography sx={{ fontWeight: 800, color: '#14532d', fontSize: '0.94rem', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lightbulb sx={{ color: '#10b981' }} />
                  SCERT Guidelines for Paper Creators
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.5 }}>
                  Ensure each question is tagged with a valid SCERT Learning Outcome (LO) code. Questions should include bilingual text where applicable and 4 clear distractor options with exactly one correct answer.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ── QUESTION AUTHORING & UPLOAD MODAL ── */}
      <Dialog
        open={openQuestionModal}
        onClose={() => setOpenQuestionModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2.5, overflow: 'hidden' },
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {isEditing ? `Edit Question #${formData.question_number}` : `Author Question #${formData.question_number}`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                {activePaper?.title} (Class {activePaper?.class_no})
              </Typography>
            </Box>
            <IconButton onClick={() => setOpenQuestionModal(false)} sx={{ color: '#ffffff' }}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>

        {/* Tab Navigation inside Dialog */}
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 1, background: '#f8fafc' }}
        >
          <Tab label="1. Bilingual Prompts & LO" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="2. Diagram & 4 Options" sx={{ fontWeight: 700, textTransform: 'none' }} />
          <Tab label="3. Live Student Preview" sx={{ fontWeight: 700, textTransform: 'none' }} />
        </Tabs>

        <DialogContent sx={{ p: 3 }}>
          {/* TAB 0: Prompts & LO */}
          {activeTab === 0 && (
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Question #"
                    type="number"
                    value={formData.question_number}
                    onChange={(e) => setFormData({ ...formData, question_number: parseInt(e.target.value, 10) || 1 })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Learning Outcome (LO) Code"
                    value={formData.lo_code}
                    placeholder="e.g. ENG101"
                    onChange={(e) => setFormData({ ...formData, lo_code: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Marks"
                    type="number"
                    value={formData.marks}
                    onChange={(e) => setFormData({ ...formData, marks: parseFloat(e.target.value) || 1.0 })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Learning Outcome (LO) Description"
                value={formData.lo_description}
                placeholder="e.g. Identifies letters of the alphabet and associates them with sounds."
                onChange={(e) => setFormData({ ...formData, lo_description: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="English Question Prompt *"
                placeholder="e.g. Look at the picture and choose the correct English word:"
                value={formData.question_text_en}
                onChange={(e) => setFormData({ ...formData, question_text_en: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                required
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Hindi Question Prompt (हिंदी अनुवाद)"
                placeholder="e.g. चित्र को देखिए और सही उत्तर का चयन कीजिए:"
                value={formData.question_text_hi}
                onChange={(e) => setFormData({ ...formData, question_text_hi: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Stack>
          )}

          {/* TAB 1: Diagram & Options */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              {/* Question Diagram Upload Section */}
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ color: '#0284c7' }} /> Question Diagram Image (Optional)
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleImageFileChange}
                    />
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                    >
                      {uploadingImage ? 'Uploading Image...' : 'Upload Image from Computer'}
                    </Button>

                    <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                      <InputLabel>Or Pick from SLA Paper 1021 Diagrams</InputLabel>
                      <Select
                        value={formData.question_image_url || ''}
                        label="Or Pick from SLA Paper 1021 Diagrams"
                        onChange={(e) => setFormData({ ...formData, question_image_url: e.target.value })}
                        sx={{ borderRadius: 2 }}
                      >
                        <MenuItem value=""><em>None (Text-only Question)</em></MenuItem>
                        {PRESET_DIAGRAMS.map((d, i) => (
                          <MenuItem key={i} value={d.url}>{d.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {formData.question_image_url ? (
                      <Box sx={{ position: 'relative', p: 1, background: '#ffffff', borderRadius: 2, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        <img
                          src={getFullImageUrl(formData.question_image_url)}
                          alt="Preview"
                          style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setFormData({ ...formData, question_image_url: '' })}
                          sx={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>No diagram image selected</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Box>

              {/* 4 Options Builder with Correct Answer Radio */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
                  4 Options & Correct Answer Selection:
                </Typography>

                <Stack spacing={1.5}>
                  {['A', 'B', 'C', 'D'].map((key) => {
                    const opt = formData.options.find(o => o.option_key === key) || {};
                    const isSelectedCorrect = formData.correct_option === key;

                    return (
                      <Paper
                        key={key}
                        elevation={0}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          border: isSelectedCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                          background: isSelectedCorrect ? 'rgba(16,185,129,0.04)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        <Tooltip title="Mark as Correct Answer">
                          <FormControlLabel
                            value={key}
                            control={
                              <Radio
                                checked={isSelectedCorrect}
                                onChange={() => handleCorrectOptionChange(key)}
                                sx={{
                                  color: '#cbd5e1',
                                  '&.Mui-checked': { color: '#10b981' },
                                }}
                              />
                            }
                            label={
                              <Chip
                                label={`Option ${key}`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  background: isSelectedCorrect ? '#10b981' : '#e2e8f0',
                                  color: isSelectedCorrect ? '#ffffff' : '#475569',
                                  borderRadius: 1.5,
                                }}
                              />
                            }
                            sx={{ mr: 0, minWidth: 110 }}
                          />
                        </Tooltip>

                        <TextField
                          size="small"
                          fullWidth
                          label={`Option ${key} (English)`}
                          placeholder={`Option ${key} text`}
                          value={opt.option_text_en || ''}
                          onChange={(e) => handleOptionTextChange(key, 'en', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        <TextField
                          size="small"
                          fullWidth
                          label={`Option ${key} (हिन्दी)`}
                          placeholder={`विकल्प ${key}`}
                          value={opt.option_text_hi || ''}
                          onChange={(e) => handleOptionTextChange(key, 'hi', e.target.value)}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            </Stack>
          )}

          {/* TAB 2: Live Student Preview */}
          {activeTab === 2 && (
            <Box sx={{ maxWidth: 500, mx: 'auto', p: 3, borderRadius: 2.5, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                📱 Mobile Screen Live Preview
              </Typography>

              <Card sx={{ borderRadius: 2.5, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff' }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>
                    QUESTION {formData.question_number} OF {activePaper?.total_questions || 15} · [{formData.lo_code}]
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5 }}>
                    {formData.question_text_en || 'Your English question prompt will appear here...'}
                  </Typography>
                  {formData.question_text_hi && (
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                      {formData.question_text_hi}
                    </Typography>
                  )}
                </Box>

                {formData.question_image_url && (
                  <Box sx={{ p: 2, textAlign: 'center', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <img
                      src={getFullImageUrl(formData.question_image_url)}
                      alt="Question Preview"
                      style={{ maxHeight: 140, maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </Box>
                )}

                <CardContent sx={{ p: 2 }}>
                  <Stack spacing={1.25}>
                    {formData.options.map((opt) => {
                      const isCorrect = opt.option_key === formData.correct_option;
                      return (
                        <Box
                          key={opt.option_key}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.8,
                            border: isCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                            background: isCorrect ? 'rgba(16,185,129,0.08)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                          }}
                        >
                          <Box
                            sx={{
                              width: 24, height: 24, borderRadius: 1.2,
                              background: isCorrect ? '#10b981' : '#cbd5e1',
                              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '0.75rem',
                            }}
                          >
                            {opt.option_key}
                          </Box>
                          <Typography sx={{ fontWeight: isCorrect ? 700 : 500, fontSize: '0.85rem', color: isCorrect ? '#065f46' : '#1e293b' }}>
                            {opt.option_text_en || `Option ${opt.option_key}`} {opt.option_text_hi ? `(${opt.option_text_hi})` : ''}
                          </Typography>
                          {isCorrect && (
                            <Chip label="Correct" size="small" color="success" sx={{ ml: 'auto', height: 20, fontSize: '0.65rem', fontWeight: 800 }} />
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          {activeTab > 0 && (
            <Button onClick={() => setActiveTab(t => t - 1)} startIcon={<ChevronLeft />} sx={{ borderRadius: 2 }}>
              Previous Step
            </Button>
          )}
          {activeTab < 2 && (
            <Button onClick={() => setActiveTab(t => t + 1)} endIcon={<ChevronRight />} sx={{ borderRadius: 2 }}>
              Next Step
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpenQuestionModal(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveQuestion}
            startIcon={<Check />}
            sx={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              fontWeight: 800, borderRadius: 2,
            }}
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── MOBILE APP ASSESSMENT SIMULATOR MODAL ── */}
      <Dialog
        open={openSimulator}
        onClose={() => setOpenSimulator(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden', background: '#0f172a' },
        }}
      >
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIphone sx={{ color: '#ffffff' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Shiksha Drishti Mobile Test Simulator
              </Typography>
            </Stack>
            <IconButton onClick={() => setOpenSimulator(false)} sx={{ color: '#ffffff' }}>
              <Close />
            </IconButton>
          </Stack>
        </Box>

        <DialogContent sx={{ p: 3, background: '#f8fafc' }}>
          {simResult ? (
            /* Test Result Card */
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box
                sx={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: simResult.percentage >= 60 ? '#10b981' : '#f59e0b',
                  color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mx: 'auto', mb: 2, fontSize: '2rem',
                }}
              >
                🏆
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                Score: {simResult.score} / {simResult.max_marks}
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: simResult.percentage >= 60 ? '#16a34a' : '#d97706', mb: 3 }}>
                Percentage: {simResult.percentage}% ({simResult.percentage >= 60 ? 'Passed / Promoted' : 'Needs Support'})
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', textAlign: 'left', mb: 1.5 }}>
                Question Breakdown:
              </Typography>
              <Stack spacing={1} sx={{ maxHeight: 240, overflowY: 'auto', textAlign: 'left' }}>
                {simResult.details?.map((d) => (
                  <Box
                    key={d.question_number}
                    sx={{
                      p: 1.25, borderRadius: 2,
                      background: d.is_correct ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      border: d.is_correct ? '1px solid #bbf7d0' : '1px solid #fecaca',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      Q{d.question_number}: Selected [{d.selected_option || 'None'}]
                    </Typography>
                    <Chip
                      label={d.is_correct ? `+${d.marks_obtained} Correct` : `Wrong (Ans: ${d.correct_option})`}
                      size="small"
                      color={d.is_correct ? 'success' : 'error'}
                      sx={{ fontWeight: 800, height: 22 }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          ) : activePaper?.questions?.length > 0 ? (
            /* Active Question in Simulator */
            (() => {
              const currentQ = activePaper.questions[simIndex];
              const totalQ = activePaper.questions.length;
              const selectedOpt = simAnswers[currentQ.question_number];

              return (
                <Box>
                  <LinearProgress
                    variant="determinate"
                    value={((simIndex + 1) / totalQ) * 100}
                    sx={{ height: 6, borderRadius: 3, mb: 2, background: '#e2e8f0', '& .MuiLinearProgress-bar': { background: '#0284c7' } }}
                  />

                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0284c7' }}>
                      QUESTION {simIndex + 1} OF {totalQ}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                      LO: {currentQ.lo_code}
                    </Typography>
                  </Stack>

                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                    {currentQ.question_text_en}
                  </Typography>
                  {currentQ.question_text_hi && (
                    <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
                      {currentQ.question_text_hi}
                    </Typography>
                  )}

                  {currentQ.question_image_url && (
                    <Box sx={{ p: 1.5, mb: 2, background: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                      <img
                        src={getFullImageUrl(currentQ.question_image_url)}
                        alt="Question Diagram"
                        style={{ maxHeight: 130, maxWidth: '100%', objectFit: 'contain' }}
                      />
                    </Box>
                  )}

                  <Stack spacing={1.25} sx={{ mb: 3 }}>
                    {currentQ.options?.map((opt) => {
                      const isChosen = selectedOpt === opt.option_key;
                      return (
                        <Button
                          key={opt.option_key}
                          fullWidth
                          variant="outlined"
                          onClick={() => handleSimOptionSelect(currentQ.question_number, opt.option_key)}
                          sx={{
                            justifyContent: 'flex-start',
                            p: 1.25,
                            borderRadius: 2,
                            borderColor: isChosen ? '#0284c7' : '#cbd5e1',
                            background: isChosen ? 'rgba(2,132,199,0.08)' : '#ffffff',
                            color: isChosen ? '#0284c7' : '#1e293b',
                            textTransform: 'none',
                            fontWeight: isChosen ? 800 : 600,
                            '&:hover': { background: isChosen ? 'rgba(2,132,199,0.12)' : '#f1f5f9' },
                          }}
                        >
                          <Box
                            sx={{
                              width: 24, height: 24, borderRadius: 1.2,
                              background: isChosen ? '#0284c7' : '#e2e8f0',
                              color: isChosen ? '#ffffff' : '#64748b',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '0.75rem', mr: 1.5, flexShrink: 0,
                            }}
                          >
                            {opt.option_key}
                          </Box>
                          <Typography sx={{ fontSize: '0.88rem' }}>
                            {opt.option_text_en} {opt.option_text_hi ? `(${opt.option_text_hi})` : ''}
                          </Typography>
                        </Button>
                      );
                    })}
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Button
                      size="small"
                      disabled={simIndex === 0}
                      onClick={() => setSimIndex(i => i - 1)}
                      startIcon={<ChevronLeft />}
                    >
                      Previous
                    </Button>

                    {simIndex < totalQ - 1 ? (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setSimIndex(i => i + 1)}
                        endIcon={<ChevronRight />}
                        sx={{ background: '#0284c7', borderRadius: 2 }}
                      >
                        Next
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSubmitSimTest}
                        disabled={submittingSim}
                        startIcon={<Send />}
                        sx={{ background: '#10b981', '&:hover': { background: '#059669' }, borderRadius: 2, fontWeight: 800 }}
                      >
                        {submittingSim ? 'Grading Test...' : 'Submit Test'}
                      </Button>
                    )}
                  </Stack>
                </Box>
              );
            })()
          ) : (
            <Typography>No questions to test</Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* ── CREATE NEW PAPER MODAL ── */}
      <Dialog
        open={openPaperModal}
        onClose={() => setOpenPaperModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Create Assessment Paper Blueprint
        </DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Paper Code (e.g. SLA-1022)"
              value={paperForm.paper_code}
              onChange={(e) => setPaperForm({ ...paperForm, paper_code: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Paper Title (English)"
              value={paperForm.title}
              onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              fullWidth
              size="small"
              label="Paper Title (Hindi)"
              value={paperForm.title_hi || ''}
              onChange={(e) => setPaperForm({ ...paperForm, title_hi: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Class (1-12)"
                  type="number"
                  value={paperForm.class_no}
                  onChange={(e) => setPaperForm({ ...paperForm, class_no: parseInt(e.target.value, 10) || 1 })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Subject"
                  value={paperForm.subject}
                  onChange={(e) => setPaperForm({ ...paperForm, subject: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Total Marks"
                  type="number"
                  value={paperForm.total_marks}
                  onChange={(e) => setPaperForm({ ...paperForm, total_marks: parseInt(e.target.value, 10) || 30 })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Duration (Mins)"
                  type="number"
                  value={paperForm.duration_minutes}
                  onChange={(e) => setPaperForm({ ...paperForm, duration_minutes: parseInt(e.target.value, 10) || 45 })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPaperModal(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePaper}
            sx={{
              fontWeight: 800,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            }}
          >
            Create Paper
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── BULK JSON IMPORT MODAL ── */}
      <Dialog
        open={openImportModal}
        onClose={() => setOpenImportModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', fontWeight: 800 }}>
          📥 Bulk Import Questions (JSON Format)
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Paste your question paper JSON below (supporting <code>image_mcq</code>, <code>text_mcq</code>, and standard options with correct answers):
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={12}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`[\n  {\n    "paperCode": "1011",\n    "class": 1,\n    "subject": "Hindi",\n    "totalMarks": 30,\n    "questions": [\n      {\n        "no": 1,\n        "type": "image_mcq",\n        "question": "चित्र पहचानकर सही उत्तर पर गोला लगाओ।",\n        "images": ["hi_q01.png"],\n        "options": [\n          { "key": "a", "text": "अंगूर" },\n          { "key": "b", "text": "आम" },\n          { "key": "c", "text": "पपीता" }\n        ],\n        "answer": "a"\n      }\n    ]\n  }\n]`}
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              '& .MuiOutlinedInput-root': { background: '#f8fafc', borderRadius: 2 },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e2e8f0' }}>
          <Button onClick={() => setOpenImportModal(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportJsonSubmit}
            disabled={importingJson}
            sx={{
              background: '#10b981',
              '&:hover': { background: '#059669' },
              fontWeight: 800,
              borderRadius: 2,
            }}
          >
            {importingJson ? 'Importing...' : 'Parse & Save to Database'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
