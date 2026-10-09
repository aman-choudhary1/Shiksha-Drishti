import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, IconButton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, Card, CardContent, Chip, Tooltip,
  CircularProgress, Radio, FormControlLabel, RadioGroup, FormControl,
  FormLabel, Select, MenuItem, InputLabel, Divider, Badge, Tabs, Tab,
  Alert, Paper, Stack, LinearProgress, Switch,
} from '@mui/material';
import {
  Add, CloudUpload, Delete, Edit, CheckCircle, Image as ImageIcon,
  PhoneIphone, AutoAwesome, Refresh, Search, BookmarkBorder,
  HelpOutlineOutlined, ChevronRight, ChevronLeft, Send, Check, Close,
  School, Assignment, Visibility, ContentCopy, Layers
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { questionBankApi } from '../../services/api';

const API_SERVER_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

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
  const papersForSelectedClassSubject = papers.filter(
    p => Number(p.class_no) === Number(selectedClass) && p.subject?.toLowerCase() === selectedSubject?.toLowerCase()
  );

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
          // If no exact match, try matching targetClass or use first available
          const classMatched = allPapers.find(p => Number(p.class_no) === Number(targetClass));
          if (classMatched) {
            setSelectedSubject(classMatched.subject);
            setSelectedPaperCode(classMatched.paper_code);
            fetchPaperDetails(classMatched.paper_code);
          } else {
            setActivePaper(null);
          }
        } else {
          handleSeedHindi1011();
        }
      }
    } catch (err) {
      enqueueSnackbar('Failed to load assessment papers: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPaperDetails = async (code) => {
    try {
      const res = await questionBankApi.getPaper(code);
      if (res.data?.success) {
        setActivePaper(res.data.data);
      }
    } catch (err) {
      enqueueSnackbar('Failed to load paper questions: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchPapers(1, 'Hindi');
  }, []);

  const handleClassChange = (newClass) => {
    setSelectedClass(newClass);
    const validSubjects = getSubjectsForClass(newClass);
    const nextSubject = validSubjects.includes(selectedSubject) ? selectedSubject : validSubjects[0];
    setSelectedSubject(nextSubject);
    
    // Find paper for this new class & subject
    const matched = papers.find(
      p => Number(p.class_no) === Number(newClass) && p.subject?.toLowerCase() === nextSubject?.toLowerCase()
    );

    if (matched) {
      setSelectedPaperCode(matched.paper_code);
      fetchPaperDetails(matched.paper_code);
    } else {
      setActivePaper(null);
    }
  };

  const handleSubjectChange = (newSubject) => {
    setSelectedSubject(newSubject);
    const matched = papers.find(
      p => Number(p.class_no) === Number(selectedClass) && p.subject?.toLowerCase() === newSubject?.toLowerCase()
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

  // JSON Import State
  const [openImportModal, setOpenImportModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importingJson, setImportingJson] = useState(false);

  // Seed SLA 1021
  const handleSeed1021 = async () => {
    try {
      setSeeding(true);
      const res = await questionBankApi.seedSla1021();
      if (res.data?.success) {
        enqueueSnackbar('✅ SLA Paper 1021 (English) loaded with 15 questions & diagrams!', { variant: 'success' });
        setSelectedPaperCode('1021');
        fetchPapers();
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
        fetchPapers();
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
    // If no active paper exists for the selected Class & Subject, create one automatically
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
      } catch (err) {
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

  // Option change handlers
  const handleOptionTextChange = (key, lang, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt =>
        opt.option_key === key
          ? { ...opt, [lang === 'en' ? 'option_text_en' : 'option_text_hi']: value }
          : opt
      ),
    }));
  };

  const handleCorrectOptionChange = (key) => {
    setFormData(prev => ({
      ...prev,
      correct_option: key,
      options: prev.options.map(opt => ({
        ...opt,
        is_correct: opt.option_key === key,
      })),
    }));
  };

  // Save Question Submission
  const handleSaveQuestion = async () => {
    if (!formData.question_text_en.trim()) {
      enqueueSnackbar('Please enter English question prompt', { variant: 'warning' });
      setActiveTab(0);
      return;
    }

    if (!activePaper?.id) {
      enqueueSnackbar('Please select an active assessment paper first', { variant: 'warning' });
      return;
    }

    try {
      const payload = {
        paper_id: activePaper.id,
        question_number: formData.question_number,
        question_text_en: formData.question_text_en,
        question_text_hi: formData.question_text_hi,
        question_image_url: formData.question_image_url || null,
        lo_code: formData.lo_code,
        lo_description: formData.lo_description,
        question_type: formData.question_type,
        marks: formData.marks,
        explanation_en: formData.explanation_en,
        explanation_hi: formData.explanation_hi,
        options: formData.options.map(o => ({
          ...o,
          is_correct: o.option_key === formData.correct_option,
        })),
      };

      const res = await questionBankApi.saveQuestion(payload);
      if (res.data?.success) {
        enqueueSnackbar(`✅ Question #${formData.question_number} saved successfully!`, { variant: 'success' });
        setOpenQuestionModal(false);
        fetchPaperDetails(selectedPaperCode);
      }
    } catch (err) {
      enqueueSnackbar('Failed to save question: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    }
  };

  // Create New Paper
  const handleSavePaper = async () => {
    if (!paperForm.paper_code || !paperForm.title) {
      enqueueSnackbar('Paper Code and Title are required', { variant: 'warning' });
      return;
    }
    try {
      const res = await questionBankApi.savePaper(paperForm);
      if (res.data?.success) {
        enqueueSnackbar('Assessment paper created successfully!', { variant: 'success' });
        setOpenPaperModal(false);
        setSelectedPaperCode(paperForm.paper_code);
        fetchPapers();
      }
    } catch (err) {
      enqueueSnackbar('Failed to create paper: ' + (err.response?.data?.message || err.message), { variant: 'error' });
    }
  };

  // Mobile App Simulator Handlers
  const handleStartSimulator = () => {
    setSimIndex(0);
    setSimAnswers({});
    setSimResult(null);
    setOpenSimulator(true);
  };

  const handleSimOptionSelect = (qNum, optKey) => {
    setSimAnswers(prev => ({ ...prev, [qNum]: optKey }));
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

  // Filter questions
  const filteredQuestions = (activePaper?.questions || []).filter(q => {
    if (!searchQuery) return true;
    const qStr = (q.question_text_en + ' ' + (q.question_text_hi || '') + ' ' + (q.lo_code || '')).toLowerCase();
    return qStr.includes(searchQuery.toLowerCase());
  });

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${API_SERVER_URL}${path}`;
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1400, mx: 'auto' }}>
      
      {/* ── TOP BANNER ── */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #071526 0%, #0f3460 50%, #0284c7 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 12px 36px rgba(2,132,199,0.18)',
          mb: 3,
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
                <Box sx={{ p: 1, borderRadius: 2, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                  <Layers sx={{ fontSize: 24, color: '#38bdf8' }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  Assessment Question Bank & Paper Authoring
                </Typography>
                <Chip label="Bilingual · EN/हिन्दी" size="small" sx={{ background: 'rgba(56,189,248,0.2)', color: '#38bdf8', fontWeight: 800, border: '1px solid rgba(56,189,248,0.4)' }} />
              </Stack>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 750 }}>
                Author, extract diagram images from SLA PDFs, configure 4 bilingual options with correct answers, and sync directly to PostgreSQL for the Shiksha Drishti Mobile App.
              </Typography>
            </Box>

            {/* Quick Action Buttons */}
            <Stack direction="row" spacing={1.25} flexWrap="wrap">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleSeedHindi1011}
                disabled={seeding}
                sx={{
                  color: '#fbbf24', borderColor: 'rgba(251,191,36,0.4)', borderRadius: 2.5, fontWeight: 700,
                  '&:hover': { background: 'rgba(251,191,36,0.1)', borderColor: '#fbbf24' },
                }}
              >
                {seeding ? 'Loading...' : '⚡ Hindi 1011 (30 M)'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleSeed1021}
                disabled={seeding}
                sx={{
                  color: '#38bdf8', borderColor: 'rgba(56,189,248,0.4)', borderRadius: 2.5, fontWeight: 700,
                  '&:hover': { background: 'rgba(56,189,248,0.1)', borderColor: '#38bdf8' },
                }}
              >
                {seeding ? 'Loading...' : '⚡ SLA 1021 (English)'}
              </Button>

              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setOpenImportModal(true)}
                sx={{
                  color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: 2.5, fontWeight: 700,
                  '&:hover': { background: 'rgba(255,255,255,0.1)', borderColor: '#ffffff' },
                }}
              >
                📥 Import JSON
              </Button>

              <Button
                variant="contained"
                startIcon={<PhoneIphone />}
                onClick={handleStartSimulator}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 2.5, fontWeight: 800, boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                  '&:hover': { background: '#059669', transform: 'translateY(-1px)' },
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
                  borderRadius: 2.5, fontWeight: 800, boxShadow: '0 4px 14px rgba(2,132,199,0.4)',
                  '&:hover': { background: '#0369a1', transform: 'translateY(-1px)' },
                }}
              >
                + Add Question
              </Button>
            </Stack>
          </Stack>

          {/* ── STEP 1: CLASS SELECTOR ── */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
              STEP 1: SELECT CLASS (कक्षा चुनें)
            </Typography>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((cls) => {
                const isSelected = Number(selectedClass) === cls;
                return (
                  <Chip
                    key={cls}
                    label={`Class ${cls}`}
                    onClick={() => handleClassChange(cls)}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      px: 0.5,
                      cursor: 'pointer',
                      borderRadius: 2,
                      background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.12)',
                      color: isSelected ? '#0f3460' : '#ffffff',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                      '&:hover': {
                        background: isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)',
                      },
                      transition: 'all 0.15s ease',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* ── STEP 2: SUBJECT SELECTOR ── */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 1 }}>
              STEP 2: SELECT SUBJECT (विषय चुनें - CLASS {selectedClass})
            </Typography>
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
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
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      px: 1,
                      cursor: 'pointer',
                      borderRadius: 2,
                      background: isSelected ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      border: isSelected ? '2px solid #6ee7b7' : '1px solid rgba(255,255,255,0.2)',
                      boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.35)' : 'none',
                      '&:hover': {
                        background: isSelected ? '#059669' : 'rgba(255,255,255,0.25)',
                      },
                      transition: 'all 0.15s ease',
                    }}
                  />
                );
              })}
            </Stack>
          </Box>

          {/* ── STEP 3: ACTIVE PAPER & STATS ── */}
          <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.15)' }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              {papersForSelectedClassSubject.length > 0 ? (
                <FormControl fullWidth size="small" sx={{ background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                  <InputLabel sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Active Paper for Class {selectedClass} {selectedSubject}</InputLabel>
                  <Select
                    value={selectedPaperCode}
                    label={`Active Paper for Class ${selectedClass} ${selectedSubject}`}
                    onChange={(e) => handlePaperChange(e.target.value)}
                    sx={{
                      color: '#ffffff',
                      '& .MuiSelect-icon': { color: '#ffffff' },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    }}
                  >
                    {papersForSelectedClassSubject.map((p) => (
                      <MenuItem key={p.id} value={p.paper_code}>
                        📄 Paper [{p.paper_code}] {p.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ background: 'rgba(239,68,68,0.15)', border: '1px dashed rgba(239,68,68,0.4)', p: 1.25, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: '#fca5a5', fontWeight: 700 }}>
                    No paper created yet for Class {selectedClass} · {selectedSubject}
                  </Typography>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6} md={8}>
              {activePaper ? (
                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ color: '#ffffff' }}>
                  <Box sx={{ background: 'rgba(255,255,255,0.08)', px: 2, py: 0.75, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontWeight: 600 }}>CLASS & SUBJECT</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>Class {activePaper.class_no} · {activePaper.subject}</Typography>
                  </Box>
                  <Box sx={{ background: 'rgba(255,255,255,0.08)', px: 2, py: 0.75, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontWeight: 600 }}>LOADED QUESTIONS</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#38bdf8' }}>{activePaper.questions?.length || 0} Questions</Typography>
                  </Box>
                  <Box sx={{ background: 'rgba(255,255,255,0.08)', px: 2, py: 0.75, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontWeight: 600 }}>TOTAL MARKS</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>{activePaper.total_marks} Marks</Typography>
                  </Box>
                  <Box sx={{ background: 'rgba(255,255,255,0.08)', px: 2, py: 0.75, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', fontWeight: 600 }}>PAPER CODE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>{activePaper.paper_code}</Typography>
                  </Box>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      setPaperForm(prev => ({
                        ...prev,
                        paper_code: `${selectedClass}0${getSubjectsForClass(selectedClass).indexOf(selectedSubject) + 1}1`,
                        title: `Class ${selectedClass} ${selectedSubject} Assessment`,
                        class_no: selectedClass,
                        subject: selectedSubject,
                      }));
                      setOpenPaperModal(true);
                    }}
                    sx={{ background: '#38bdf8', color: '#071526', fontWeight: 800, '&:hover': { background: '#7dd3fc' } }}
                  >
                    + Create Paper for Class {selectedClass} {selectedSubject}
                  </Button>
                </Stack>
              )}
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search questions by English/Hindi text or LO Code (e.g. ENG101)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
          }}
          sx={{
            minWidth: { xs: '100%', sm: 380 },
            '& .MuiOutlinedInput-root': { borderRadius: 2.5, background: '#ffffff' },
          }}
        />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label={`${filteredQuestions.length} Questions Loaded`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 2 }}
          />
          <Button
            size="small"
            variant="outlined"
            onClick={() => setOpenPaperModal(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            + Create New Paper
          </Button>
        </Stack>
      </Stack>

      {/* ── QUESTIONS CARD GRID ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredQuestions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: '#ffffff', border: '1px dashed #cbd5e1' }}>
          <ImageIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#334155' }}>No Questions Found</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>Click "+ Add Question" or click "Seed / Reset SLA 1021" to load questions from the SLA PDF.</Typography>
          <Button variant="contained" startIcon={<Refresh />} onClick={handleSeed1021}>
            Seed SLA 1021 Sample Questions
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredQuestions.map((q) => {
            const hasImage = Boolean(q.question_image_url);
            return (
              <Grid item xs={12} md={6} lg={4} key={q.id}>
                <Card
                  sx={{
                    borderRadius: 3.5,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(2,132,199,0.12)',
                      borderColor: '#bae6fd',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Header Row: Q-Number & LO Badge */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 28, height: 28, borderRadius: 1.5,
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            color: '#ffffff', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem',
                          }}
                        >
                          Q{q.question_number}
                        </Box>
                        <Chip
                          label={q.lo_code || 'LO-GENERAL'}
                          size="small"
                          sx={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: '0.7rem', border: '1px solid #bbf7d0' }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Edit Question">
                          <IconButton size="small" onClick={() => handleEditQuestion(q)} sx={{ color: '#0284c7' }}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Question">
                          <IconButton size="small" onClick={() => handleDeleteQuestion(q.id, q.question_number)} sx={{ color: '#ef4444' }}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>

                    {/* Question Diagram Image (if available) */}
                    {hasImage && (
                      <Box
                        sx={{
                          mb: 1.5,
                          p: 1,
                          borderRadius: 2.5,
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minHeight: 120,
                          maxHeight: 140,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={getFullImageUrl(q.question_image_url)}
                          alt={`Diagram Q${q.question_number}`}
                          style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }}
                        />
                      </Box>
                    )}

                    {/* Bilingual Prompt */}
                    <Box sx={{ mb: 2, flex: 1 }}>
                      <Typography sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', mb: 0.5, lineHeight: 1.35 }}>
                        {q.question_text_en}
                      </Typography>
                      {q.question_text_hi && (
                        <Typography sx={{ fontWeight: 500, color: '#475569', fontSize: '0.82rem', lineHeight: 1.35 }}>
                          {q.question_text_hi}
                        </Typography>
                      )}
                    </Box>

                    {/* 4 Options Grid */}
                    <Grid container spacing={1} sx={{ mt: 'auto' }}>
                      {q.options?.map((opt) => {
                        const isCorrect = opt.is_correct;
                        return (
                          <Grid item xs={6} key={opt.option_key}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                background: isCorrect ? 'rgba(16,185,129,0.1)' : '#f8fafc',
                                border: isCorrect ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  width: 20, height: 20, borderRadius: 1,
                                  background: isCorrect ? '#10b981' : '#cbd5e1',
                                  color: '#ffffff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.7rem', fontWeight: 800, flexShrink: 0,
                                }}
                              >
                                {isCorrect ? '✓' : opt.option_key}
                              </Box>
                              <Box sx={{ overflow: 'hidden' }}>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: isCorrect ? 700 : 500, color: isCorrect ? '#065f46' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {opt.option_text_en || opt.option_text_hi || `Option ${opt.option_key}`}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* ── QUESTION AUTHORING & UPLOAD MODAL ── */}
      <Dialog
        open={openQuestionModal}
        onClose={() => setOpenQuestionModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3.5, overflow: 'hidden' },
        }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)', color: '#ffffff', pb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {isEditing ? `Edit Question #${formData.question_number}` : `Author Question #${formData.question_number}`}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
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
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="English Question Prompt *"
                placeholder="e.g. Look at the picture and choose the correct English word:"
                value={formData.question_text_en}
                onChange={(e) => setFormData({ ...formData, question_text_en: e.target.value })}
                required
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Hindi Question Prompt (हिंदी अनुवाद)"
                placeholder="e.g. चित्र को देखिए और सही अंग्रेजी शब्द का चयन कीजिए:"
                value={formData.question_text_hi}
                onChange={(e) => setFormData({ ...formData, question_text_hi: e.target.value })}
              />
            </Stack>
          )}

          {/* TAB 1: Diagram & Options */}
          {activeTab === 1 && (
            <Stack spacing={3}>
              {/* Question Diagram Upload Section */}
              <Box sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
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

                    {/* Presets dropdown */}
                    <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                      <InputLabel>Or Pick from SLA Paper 1021 Diagrams</InputLabel>
                      <Select
                        value={formData.question_image_url || ''}
                        label="Or Pick from SLA Paper 1021 Diagrams"
                        onChange={(e) => setFormData({ ...formData, question_image_url: e.target.value })}
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
                          borderRadius: 2.5,
                          border: isSelectedCorrect ? '2px solid #10b981' : '1px solid #e2e8f0',
                          background: isSelectedCorrect ? 'rgba(16,185,129,0.04)' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                      >
                        {/* Radio for picking correct answer */}
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
                                }}
                              />
                            }
                            sx={{ mr: 0, minWidth: 110 }}
                          />
                        </Tooltip>

                        {/* English option text */}
                        <TextField
                          size="small"
                          fullWidth
                          label={`Option ${key} (English)`}
                          placeholder={`Option ${key} text`}
                          value={opt.option_text_en || ''}
                          onChange={(e) => handleOptionTextChange(key, 'en', e.target.value)}
                        />

                        {/* Hindi option text */}
                        <TextField
                          size="small"
                          fullWidth
                          label={`Option ${key} (हिन्दी)`}
                          placeholder={`विकल्प ${key}`}
                          value={opt.option_text_hi || ''}
                          onChange={(e) => handleOptionTextChange(key, 'hi', e.target.value)}
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
            <Box sx={{ maxWidth: 500, mx: 'auto', p: 3, borderRadius: 3, border: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                📱 Mobile Screen Live Preview
              </Typography>

              <Card sx={{ borderRadius: 3, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', overflow: 'hidden' }}>
                <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)', color: '#ffffff' }}>
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
                            borderRadius: 2,
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
            <Button onClick={() => setActiveTab(t => t - 1)} startIcon={<ChevronLeft />}>
              Previous Step
            </Button>
          )}
          {activeTab < 2 && (
            <Button onClick={() => setActiveTab(t => t + 1)} endIcon={<ChevronRight />}>
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
          sx: { borderRadius: 4, overflow: 'hidden', background: '#0f172a' },
        }}
      >
        <Box sx={{ p: 2, background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)', color: '#ffffff' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneIphone sx={{ color: '#38bdf8' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
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
                    <Box sx={{ p: 1.5, mb: 2, background: '#ffffff', borderRadius: 2.5, border: '1px solid #e2e8f0', textAlign: 'center' }}>
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
                            borderRadius: 2.5,
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
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Create Assessment Paper</DialogTitle>
        <DialogContent sx={{ p: 2.5 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              label="Paper Code (e.g. SLA-1022)"
              value={paperForm.paper_code}
              onChange={(e) => setPaperForm({ ...paperForm, paper_code: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              label="Paper Title"
              value={paperForm.title}
              onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
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
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  size="small"
                  label="Subject"
                  value={paperForm.subject}
                  onChange={(e) => setPaperForm({ ...paperForm, subject: e.target.value })}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPaperModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePaper} sx={{ fontWeight: 800 }}>
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
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)', color: '#ffffff', fontWeight: 800 }}>
          📥 Bulk Import Questions (JSON Format)
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#475569', mb: 2 }}>
            Paste your question paper JSON below (supporting <code>image_mcq</code>, <code>text_mcq</code>, <code>odd_one_out_image</code>, and <code>fill_blank</code> types with <code>hint</code> and <code>answer</code>):
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
          <Button onClick={() => setOpenImportModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleImportJsonSubmit}
            disabled={importingJson}
            sx={{ background: '#10b981', '&:hover': { background: '#059669' }, fontWeight: 800 }}
          >
            {importingJson ? 'Importing...' : 'Parse & Save to Database'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
