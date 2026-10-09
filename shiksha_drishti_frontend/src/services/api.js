import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors globally (avoid loop on logout or login endpoints)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.includes('/auth/login') || err.config?.url?.includes('/auth/logout');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('sd_token');
      localStorage.removeItem('sd_user');
      window.dispatchEvent(new Event('sd:unauthorized'));
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Master data
export const masterApi = {
  getSchool: (udise) => api.get(`/schools/${udise}`),
  getClasses: () => api.get('/classes'),
  getStudents: (classId, params) => api.get(`/classes/${classId}/students`, { params }),
  getClassStudents: (classId, params) => api.get(`/classes/${classId}/students`, { params }),
  getAcademicYears: () => api.get('/academic-years'),
  getSubjects: () => api.get('/subjects'),
  getQuestions: (params) => api.get('/questions', { params }),
  getLearningOutcomes: (params) => api.get('/learning-outcomes', { params }),
  getDistricts: () => api.get('/master/districts'),
  getBlocks: (params) => api.get('/master/blocks', { params }),
  getClusters: (params) => api.get('/master/clusters', { params }),
  getSchools: (params) => api.get('/master/schools', { params }),
};


// Assessments
export const assessmentApi = {
  list: (params) => api.get('/assessments', { params }),
  create: (data) => api.post('/assessments', data),
  get: (id) => api.get(`/assessments/${id}`),
  update: (id, data) => api.patch(`/assessments/${id}`, data),
  getStatus: (id) => api.get(`/assessments/${id}/status`),
  submit: (id) => api.post(`/assessments/${id}/submit`),

  // Subject marks (class report card)
  getSubjectMarks: (id) => api.get(`/assessments/${id}/subject-marks`),
  bulkSaveSubjectMarks: (id, data) => api.post(`/assessments/${id}/subject-marks/bulk`, data),

  // Question marks
  getQuestionMarks: (id, params) => api.get(`/assessments/${id}/question-marks`, { params }),
  bulkSaveQuestionMarks: (id, data) => api.post(`/assessments/${id}/question-marks/bulk`, data),

  // Performance analytics & intelligence
  getAnalytics: (id) => api.get(`/assessments/${id}/analytics`),
};

// Principal / School Admin APIs
export const principalApi = {
  getOverview: (params) => api.get('/principal/overview', { params }),
  getTeachers: (params) => api.get('/principal/teachers', { params }),
  getStudents: (params) => api.get('/principal/students', { params }),
  getExams: (params) => api.get('/principal/exams', { params }),
  getLearningOutcomes: (params) => api.get('/principal/learning-outcomes', { params }),
  getSubjectBenchmark: (params) => api.get('/principal/subject-benchmark', { params }),
};

// Cluster Academic Coordinator (CAC) APIs
export const clusterApi = {
  getOverview: (params) => api.get('/cluster/overview', { params }),
  getSchools: (params) => api.get('/cluster/schools', { params }),
  getSubjects: (params) => api.get('/cluster/subjects', { params }),
  getLearningOutcomes: (params) => api.get('/cluster/learning-outcomes', { params }),
  getVisits: (params) => api.get('/cluster/visits', { params }),
  createVisit: (data) => api.post('/cluster/visits', data),
};

// Block Education Officer (BEO) / Block Admin APIs
export const blockApi = {
  getOverview: (params) => api.get('/block/overview', { params }),
  getClusters: (params) => api.get('/block/clusters', { params }),
  getSchools: (params) => api.get('/block/schools', { params }),
  getQuestions: (params) => api.get('/block/questions', { params }),
  getFaculty: (params) => api.get('/block/faculty', { params }),
};

// District Education Officer (DEO) / District Admin APIs
export const districtApi = {
  getOverview: (params) => api.get('/district/overview', { params }),
  getSchools: (params) => api.get('/district/schools', { params }),
  getQuestions: (params) => api.get('/district/questions', { params }),
  getFaculty: (params) => api.get('/district/faculty', { params }),
};

// State Admin / Super Admin APIs
export const stateApi = {
  getOverview:  (params) => api.get('/state/overview',   { params }),
  getDistricts: (params) => api.get('/state/districts',  { params }),
  getQuestions: (params) => api.get('/state/questions',  { params }),
  getTeachers:  (params) => api.get('/state/teachers',   { params }),
  getStudents:  (params) => api.get('/state/students',   { params }),
};

// Academic (UDISE) Data APIs – read-only analytics on 6.9M student records
export const academicApi = {
  getBundle:           (params) => api.get('/academic/bundle',       { params }),
  getSummary:          (params) => api.get('/academic/summary',      { params }),
  getClasswise:        (params) => api.get('/academic/classwise',    { params }),
  getDistrictwise:     (params) => api.get('/academic/districtwise', { params }),
  getGender:           (params) => api.get('/academic/gender',       { params }),
  getCategory:         (params) => api.get('/academic/category',     { params }),
  getResults:          (params) => api.get('/academic/results',      { params }),
  getSpecial:          (params) => api.get('/academic/special',      { params }),
  getRankings:         (params) => api.get('/academic/rankings',     { params }),
};

// Question Bank & Assessment Authoring APIs (Mobile & Web)
export const questionBankApi = {
  getPapers: (params) => api.get('/question-bank/papers', { params }),
  getPaper: (paperCode) => api.get(`/question-bank/papers/${paperCode}`),
  savePaper: (data) => api.post('/question-bank/papers', data),
  saveQuestion: (data) => api.post('/question-bank/questions', data),
  deleteQuestion: (id) => api.delete(`/question-bank/questions/${id}`),
  uploadImage: (formData) => api.post('/question-bank/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  seedSla1021: () => api.post('/question-bank/seed-sla-1021'),
  submitAssessment: (data) => api.post('/question-bank/submit', data),

  // Dedicated Mobile App APIs (Exact JSON Schema)
  getMobilePapers: (params) => api.get('/mobile/assessments/papers', { params }),
  getMobilePaper: (paperCode, params) => api.get(`/mobile/assessments/paper/${paperCode}`, { params }),
  submitMobileAssessment: (data) => api.post('/mobile/assessments/submit', data),
  importMobileJson: (jsonPayload) => api.post('/mobile/assessments/import-json', jsonPayload),
  seedHindi1011: () => api.post('/mobile/assessments/seed-hindi-1011'),
};

export default api;
