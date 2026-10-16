import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// Official Color Palette
const COLORS = {
  NAVY_HEADER:    '0F2942', // Deep Government Navy
  NAVY_ACCENT:    '0F3460', // VSK Blue
  BLUE_ACCENT:    '0284C7', // Official Brand Blue
  GOLD_ACCENT:    'F59E0B', // Amber / Gold Ribbon
  GREEN_ACCENT:   '10B981', // Emerald
  LIGHT_BG:       'F8FAFC', // Slate 50
  ZEBRA_BG:       'F1F5F9', // Slate 100
  BORDER_GRAY:    'CBD5E1', // Slate 300
  BORDER_LIGHT:   'E2E8F0', // Slate 200
  TEXT_DARK:      '0F172A', // Slate 900
  TEXT_MUTED:     '64748B', // Slate 500
  WHITE:          'FFFFFF',
  LOCKED_BG:      'F1F5F9', // Protected metadata cell color
  INPUT_BG:       'FEF3C7', // Soft amber for entry notice
};

/**
 * Generate and download an Excel template customized for the specific assessment, class, and subjects.
 * Pre-populates all enrolled students with their roll numbers, names, and system IDs.
 */
export async function downloadMarksExcelTemplate({ assessment, subjects, reportCard, schoolName }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Shiksha Drishti - Vidya Samiksha Kendra (VSK)';
  workbook.lastModifiedBy = 'Teacher Portal';
  workbook.created = new Date();
  workbook.modified = new Date();

  const totalCols = 4 + subjects.length; // Roll, Name, Student ID, Gender + Subjects

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 1: MARKS ENTRY
  // ─────────────────────────────────────────────────────────────────────────────
  const ws = workbook.addWorksheet('Marks Entry', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 6, activeCell: 'E7', showGridLines: true }],
    properties: { tabColor: { argb: '0284C7' } },
  });

  // Row 1: Gold Accent Ribbon
  ws.mergeCells(1, 1, 1, totalCols);
  const r1 = ws.getRow(1);
  r1.height = 6;
  r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GOLD_ACCENT } };

  // Row 2: Government Header Masthead
  ws.mergeCells(2, 1, 2, totalCols);
  const r2 = ws.getRow(2);
  r2.height = 32;
  const c2 = r2.getCell(1);
  c2.value = 'GOVERNMENT OF CHHATTISGARH · VIDYA SAMIKSHA KENDRA (VSK)';
  c2.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.WHITE } };
  c2.alignment = { vertical: 'middle', horizontal: 'center' };
  c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };

  // Row 3: Assessment Title & School Info
  ws.mergeCells(3, 1, 3, totalCols);
  const r3 = ws.getRow(3);
  r3.height = 24;
  const c3 = r3.getCell(1);
  const asmtName = assessment?.assessment_name || 'Class Assessment';
  const className = assessment?.class_name || 'Class';
  const schoolTitle = schoolName || assessment?.school_name || `School UDISE: ${assessment?.school_udise || 'N/A'}`;
  c3.value = `OFFICIAL MARKS ENTRY TEMPLATE: ${asmtName.toUpperCase()} · ${className.toUpperCase()}`;
  c3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '93C5FD' } };
  c3.alignment = { vertical: 'middle', horizontal: 'center' };
  c3.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_ACCENT } };

  // Row 4: Important Teacher Instructions Banner
  ws.mergeCells(4, 1, 4, totalCols);
  const r4 = ws.getRow(4);
  r4.height = 24;
  const c4 = r4.getCell(1);
  c4.value = `ℹ️ INSTRUCTIONS: Enter marks between 0 and Max Marks. For absent students, type "AB". Do NOT edit or remove Student IDs.`;
  c4.font = { name: 'Calibri', size: 9, bold: true, color: { argb: '92400E' } };
  c4.alignment = { vertical: 'middle', horizontal: 'center' };
  c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.INPUT_BG } };
  c4.border = { bottom: { style: 'medium', color: { argb: COLORS.GOLD_ACCENT } } };

  // Row 5: Hidden / System Metadata Reference Row (Used for deterministic subject and student mapping)
  const r5 = ws.getRow(5);
  r5.height = 14;
  r5.getCell(1).value = 'SYS_ROLL';
  r5.getCell(2).value = 'SYS_NAME';
  r5.getCell(3).value = 'SYS_STUDENT_ID';
  r5.getCell(4).value = 'SYS_GENDER';

  subjects.forEach((subj, idx) => {
    const colIdx = 5 + idx;
    const cell = r5.getCell(colIdx);
    cell.value = `SUBJ_ID:${subj.subject_id}`;
    cell.font = { name: 'Calibri', size: 7, color: { argb: COLORS.TEXT_MUTED } };
    cell.alignment = { horizontal: 'center' };
  });

  // Row 6: Visible Table Header
  const r6 = ws.getRow(6);
  r6.height = 36;

  const fixedHeaders = [
    { label: 'Roll No', width: 12, col: 1 },
    { label: 'Student Name', width: 28, col: 2 },
    { label: 'Student ID\n(System Ref)', width: 22, col: 3 },
    { label: 'Gender', width: 12, col: 4 },
  ];

  fixedHeaders.forEach(h => {
    const cell = r6.getCell(h.col);
    cell.value = h.label;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.WHITE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.NAVY_HEADER } },
      bottom: { style: 'medium', color: { argb: COLORS.NAVY_HEADER } },
      left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } },
      right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } },
    };
    ws.getColumn(h.col).width = h.width;
  });

  subjects.forEach((subj, idx) => {
    const colIdx = 5 + idx;
    const cell = r6.getCell(colIdx);
    cell.value = `${subj.subject_name}\n[Max: ${subj.max_marks}]`;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.WHITE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    // Gradient look: alternating deep blue
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? '0369A1' : '0284C7' } };
    cell.border = {
      top: { style: 'medium', color: { argb: '0369A1' } },
      bottom: { style: 'medium', color: { argb: '0369A1' } },
      left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
    };
    ws.getColumn(colIdx).width = Math.max(18, (subj.subject_name || '').length + 4);
  });

  // Populate Student Rows
  const studentList = reportCard && reportCard.length > 0 ? reportCard : [];
  let currentRowIdx = 7;

  studentList.forEach((st, sIdx) => {
    const row = ws.getRow(currentRowIdx);
    row.height = 22;
    const isZebra = sIdx % 2 === 1;
    const bgArgb = isZebra ? COLORS.ZEBRA_BG : COLORS.WHITE;

    // Col 1: Roll No
    const cRoll = row.getCell(1);
    cRoll.value = st.roll_number ?? (sIdx + 1);
    cRoll.alignment = { vertical: 'middle', horizontal: 'center' };
    cRoll.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };

    // Col 2: Student Name
    const cName = row.getCell(2);
    cName.value = st.student_name || 'Student';
    cName.alignment = { vertical: 'middle', horizontal: 'left' };
    cName.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };

    // Col 3: Student ID (Locked reference for matching)
    const cId = row.getCell(3);
    cId.value = String(st.student_id);
    cId.alignment = { vertical: 'middle', horizontal: 'center' };
    cId.font = { name: 'Consolas', size: 9, color: { argb: COLORS.TEXT_MUTED } };

    // Col 4: Gender
    const cGender = row.getCell(4);
    cGender.value = st.gender || '—';
    cGender.alignment = { vertical: 'middle', horizontal: 'center' };
    cGender.font = { name: 'Calibri', size: 9, color: { argb: COLORS.TEXT_MUTED } };

    // Lock fixed info columns styling
    [1, 2, 3, 4].forEach(colI => {
      const cell = row.getCell(colI);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colI === 3 ? COLORS.LOCKED_BG : bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      };
    });

    // Subject Marks Columns
    subjects.forEach((subj, subIdx) => {
      const colIdx = 5 + subIdx;
      const cell = row.getCell(colIdx);

      // Check if student already has a mark recorded in reportCard
      const existingSm = st.subject_marks?.find(sm => String(sm.subject_id) === String(subj.subject_id));
      if (existingSm) {
        if (existingSm.is_absent) {
          cell.value = 'AB';
        } else if (existingSm.marks_obtained !== null && existingSm.marks_obtained !== undefined) {
          cell.value = Number(existingSm.marks_obtained);
        }
      }

      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.TEXT_DARK } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      };

      // Add Data Validation note / prompt to guide teacher
      cell.note = `Allowed: 0 to ${subj.max_marks}, or 'AB' for Absent.`;
    });

    currentRowIdx++;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SHEET 2: INSTRUCTIONS & GUIDELINES (Bilingual Hindi & English)
  // ─────────────────────────────────────────────────────────────────────────────
  const wsInst = workbook.addWorksheet('Instructions & Rules', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'F59E0B' } },
  });

  wsInst.getColumn(1).width = 16;
  wsInst.getColumn(2).width = 65;
  wsInst.getColumn(3).width = 65;

  // Header Banner
  wsInst.mergeCells(1, 1, 1, 3);
  const ir1 = wsInst.getRow(1);
  ir1.height = 30;
  const ic1 = ir1.getCell(1);
  ic1.value = '📋 GUIDELINES FOR TEACHERS: EXCEL MARKS ENTRY / अंक प्रविष्टि निर्देश';
  ic1.font = { name: 'Calibri', size: 12, bold: true, color: { argb: COLORS.WHITE } };
  ic1.alignment = { vertical: 'middle', horizontal: 'center' };
  ic1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };

  const instHeaders = ['Step / चरण', 'English Instructions', 'हिंदी निर्देश (हिदायतें)'];
  const ir2 = wsInst.getRow(3);
  ir2.height = 25;
  instHeaders.forEach((h, i) => {
    const c = ir2.getCell(i + 1);
    c.value = h;
    c.font = { bold: true, color: { argb: COLORS.WHITE }, size: 10 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_ACCENT } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  const instructionsData = [
    {
      step: 'Step 1 / चरण 1',
      en: 'Open the "Marks Entry" sheet. Each column represents an approved subject for this assessment.',
      hi: '"Marks Entry" शीट खोलें। प्रत्येक कॉलम इस मूल्यांकन के लिए निर्धारित विषय दर्शाता है।',
    },
    {
      step: 'Step 2 / चरण 2',
      en: 'Enter numeric marks scored by each student (e.g., 45, 78.5). Marks must be between 0 and the Max Marks shown in the column header.',
      hi: 'विद्यार्थी द्वारा प्राप्त अंक दर्ज करें (उदा. 45, 78.5)। अंक 0 से अधिकतम अंक (Max Marks) के बीच होने चाहिए।',
    },
    {
      step: 'Step 3 / चरण 3',
      en: 'If a student was ABSENT for an exam, type "AB" or "A" in the subject cell.',
      hi: 'यदि विद्यार्थी परीक्षा में अनुपस्थित था, तो उस विषय के सेल में "AB" या "A" लिखें।',
    },
    {
      step: 'Step 4 / चरण 4',
      en: 'DO NOT edit, alter, or delete Roll No, Student Name, or Student ID columns. These are used by the system for safe matching.',
      hi: 'रोल नंबर, छात्र का नाम या छात्र आईडी (Student ID) में कोई बदलाव न करें। यह मिलान के लिए अनिवार्य हैं।',
    },
    {
      step: 'Step 5 / चरण 5',
      en: 'Save the Excel file on your computer/phone and upload it back on the Shiksha Drishti Portal using "Upload Excel Marks".',
      hi: 'एक्सेल फाइल को सहेजें (Save करें) और शिक्षा दृष्टि पोर्टल पर "Upload Excel Marks" बटन दबाकर अपलोड करें।',
    },
    {
      step: 'Step 6 / चरण 6',
      en: 'The portal will instantly validate all entries and show a live preview. Click "Save & Apply Marks" to complete data entry.',
      hi: 'पोर्टल तुरंत अंकों की जाँच करेगा और पूर्वावलोकन दिखाएगा। "Save & Apply Marks" पर क्लिक कर अंक सुरक्षित करें।',
    },
  ];

  instructionsData.forEach((item, idx) => {
    const row = wsInst.getRow(4 + idx);
    row.height = 28;
    const isZebra = idx % 2 === 1;
    const bg = isZebra ? COLORS.ZEBRA_BG : COLORS.WHITE;

    row.getCell(1).value = item.step;
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell(1).font = { bold: true, size: 9, color: { argb: COLORS.NAVY_ACCENT } };

    row.getCell(2).value = item.en;
    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    row.getCell(2).font = { size: 9.5 };

    row.getCell(3).value = item.hi;
    row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    row.getCell(3).font = { size: 9.5 };

    [1, 2, 3].forEach(cI => {
      const cell = row.getCell(cI);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
        right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      };
    });
  });

  // Export buffer & trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const safeAsmt = (asmtName || 'Assessment').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeClass = (className || 'Class').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeClass}_${safeAsmt}_Marks_Entry_Template.xlsx`;

  saveAs(new Blob([buffer]), filename);
  return filename;
}

/**
 * Robust Client-Side Excel Parser & Strict Validator
 * Checks:
 * 1. Matching students against current assessment class
 * 2. Unaltered student identification
 * 3. Numeric bounds: 0 <= mark <= max_marks
 * 4. Absent flag ('AB' / 'A' / 'ABSENT')
 * 5. Returns parsed rows, error diagnostics, and ready-to-save payload.
 */
export async function parseAndValidateMarksExcel({ file, subjects, reportCard }) {
  if (!file) throw new Error('No file selected for parsing.');

  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  // Locate worksheet
  let ws = workbook.getWorksheet('Marks Entry');
  if (!ws) {
    ws = workbook.worksheets[0]; // Fallback to first sheet
  }
  if (!ws) {
    throw new Error('Invalid Excel file. No worksheets found.');
  }

  // Build lookups for valid students in this assessment
  const studentById = new Map();
  const studentByRoll = new Map();

  (reportCard || []).forEach(st => {
    studentById.set(String(st.student_id), st);
    if (st.roll_number !== undefined && st.roll_number !== null) {
      studentByRoll.set(String(st.roll_number).trim(), st);
    }
  });

  // Helper to extract clean text from any ExcelJS cell value
  const getCellText = (cell) => {
    if (!cell) return '';
    const val = cell.value;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
      if ('result' in val) return String(val.result || '').trim();
      if ('richText' in val && Array.isArray(val.richText)) {
        return val.richText.map(t => t.text || '').join('').trim();
      }
      if ('text' in val) return String(val.text || '').trim();
    }
    return String(val).trim();
  };

  const cleanHeader = (str) =>
    String(str || '')
      .toLowerCase()
      .replace(/\[.*?\]|\(.*?\)/g, '') // remove [Max: 100]
      .replace(/[^a-z0-9]/g, ' ')      // remove punctuation and newlines
      .replace(/\s+/g, ' ')            // collapse whitespace
      .trim();

  // Identify column indices
  let studentIdCol = 3; // Default Col C
  let rollNoCol = 1;    // Default Col A
  let studentNameCol = 2; // Default Col B

  const row5 = ws.getRow(5);
  const row6 = ws.getRow(6);
  const colCount = Math.max(ws.columnCount, ws.actualColumnCount, 25);

  // Locate ID, Roll, and Name columns
  for (let c = 1; c <= colCount; c++) {
    const val5 = getCellText(row5.getCell(c));
    const val6 = getCellText(row6.getCell(c));
    const clean6 = cleanHeader(val6);

    if (val5.includes('SYS_STUDENT_ID') || clean6.includes('student id')) {
      studentIdCol = c;
    } else if (val5.includes('SYS_ROLL') || clean6.includes('roll')) {
      rollNoCol = c;
    } else if (val5.includes('SYS_NAME') || clean6.includes('student name')) {
      studentNameCol = c;
    }
  }

  // Subject Column Mapping with Guaranteed 1-to-1 Assignment (prevents Social Science / Science collision)
  const assignedSubjectIds = new Set();
  const subjectColMap = new Map(); // colIndex -> subject object

  const getSubjectAliases = (subj) => {
    const sName = cleanHeader(subj.subject_name);
    const sCode = cleanHeader(subj.code);
    const aliases = new Set([sName, sCode]);

    if (sName.includes('social')) {
      aliases.add('social science');
      aliases.add('social studies');
      aliases.add('sst');
      aliases.add('samajik vigyan');
      aliases.add('social');
    } else if (sName === 'science') {
      aliases.add('science');
      aliases.add('sci');
      aliases.add('general science');
      aliases.add('vigyan');
    } else if (sName.includes('math')) {
      aliases.add('math');
      aliases.add('maths');
      aliases.add('mathematics');
      aliases.add('ganit');
    } else if (sName.includes('hindi')) {
      aliases.add('hindi');
    } else if (sName.includes('english')) {
      aliases.add('english');
      aliases.add('eng');
    } else if (sName.includes('sanskrit')) {
      aliases.add('sanskrit');
      aliases.add('sans');
    }
    aliases.delete('');
    return aliases;
  };

  // PASS 1: Metadata Row 5 direct match (SUBJ_ID:X)
  for (let c = 1; c <= colCount; c++) {
    const val5 = getCellText(row5.getCell(c));
    if (!val5) continue;
    for (const subj of subjects) {
      if (assignedSubjectIds.has(subj.subject_id)) continue;
      if (val5 === `SUBJ_ID:${subj.subject_id}` || val5 === String(subj.subject_id)) {
        subjectColMap.set(c, subj);
        assignedSubjectIds.add(subj.subject_id);
        break;
      }
    }
  }

  // PASS 2: Exact Name / Code / Alias match from Row 6 Header
  for (let c = 1; c <= colCount; c++) {
    if (subjectColMap.has(c)) continue;
    const clean6 = cleanHeader(getCellText(row6.getCell(c)));
    if (!clean6) continue;

    for (const subj of subjects) {
      if (assignedSubjectIds.has(subj.subject_id)) continue;
      const aliases = getSubjectAliases(subj);
      if (aliases.has(clean6)) {
        subjectColMap.set(c, subj);
        assignedSubjectIds.add(subj.subject_id);
        break;
      }
    }
  }

  // PASS 3: Longest Match First on unassigned subjects (resolves 'Social Science' before 'Science')
  const unassignedSubjects = subjects
    .filter(s => !assignedSubjectIds.has(s.subject_id))
    .sort((a, b) => (b.subject_name || '').length - (a.subject_name || '').length);

  for (let c = 1; c <= colCount; c++) {
    if (subjectColMap.has(c)) continue;
    const clean6 = cleanHeader(getCellText(row6.getCell(c)));
    if (!clean6) continue;

    for (const subj of unassignedSubjects) {
      if (assignedSubjectIds.has(subj.subject_id)) continue;
      const aliases = getSubjectAliases(subj);

      let matched = false;
      for (const alias of aliases) {
        if (!alias) continue;
        const regex = new RegExp(`(^|\\s)${alias}(\\s|$)`, 'i');
        if (regex.test(clean6)) {
          matched = true;
          break;
        }
      }

      if (matched) {
        subjectColMap.set(c, subj);
        assignedSubjectIds.add(subj.subject_id);
        break;
      }
    }
  }

  // PASS 4: If any subject columns remain unassigned, map sequential columns starting from Col 5
  if (assignedSubjectIds.size < subjects.length) {
    let subIdx = 0;
    for (const subj of subjects) {
      if (!assignedSubjectIds.has(subj.subject_id)) {
        let targetCol = 5 + subIdx;
        while (subjectColMap.has(targetCol)) {
          targetCol++;
        }
        if (targetCol <= colCount) {
          subjectColMap.set(targetCol, subj);
          assignedSubjectIds.add(subj.subject_id);
        }
      }
      subIdx++;
    }
  }

  const errorsList = [];
  const parsedStudents = [];
  const validMarksPayload = [];
  let totalMarksToUpdate = 0;
  let absentCount = 0;

  // Iterate over data rows starting at Row 7
  const totalRows = ws.rowCount;

  for (let r = 7; r <= totalRows; r++) {
    const row = ws.getRow(r);

    // 1. Detect and safely skip any footer, disclaimer, or metadata text anywhere in this row
    let isFooterOrDisclaimer = false;
    row.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value && typeof cell.value === 'object' && 'result' in cell.value ? cell.value.result : cell.value;
      const txt = String(val || '').toLowerCase();
      if (
        txt.includes('vidya samiksha') ||
        txt.includes('generated on') ||
        txt.includes('keep original') ||
        txt.includes('samagra shiksha') ||
        txt.includes('instructions:') ||
        txt.includes('guidelines') ||
        txt.includes('chhattisgarh') ||
        txt.includes('department of school')
      ) {
        isFooterOrDisclaimer = true;
      }
    });

    if (isFooterOrDisclaimer) {
      continue; // Safely skip footer/disclaimer row
    }

    // Read identifier cells
    const rawId = row.getCell(studentIdCol).value;
    const rawRoll = row.getCell(rollNoCol).value;
    const rawName = row.getCell(studentNameCol).value;

    const valId = rawId && typeof rawId === 'object' && 'result' in rawId ? rawId.result : rawId;
    const valRoll = rawRoll && typeof rawRoll === 'object' && 'result' in rawRoll ? rawRoll.result : rawRoll;
    const valName = rawName && typeof rawName === 'object' && 'result' in rawName ? rawName.result : rawName;

    const strId = valId !== null && valId !== undefined ? String(valId).trim() : '';
    const strRoll = valRoll !== null && valRoll !== undefined ? String(valRoll).trim() : '';
    const strName = valName !== null && valName !== undefined ? String(valName).trim() : '';

    // Extra safety: If text is excessively long or has footer keywords, skip
    const combinedStr = `${strId} ${strRoll} ${strName}`.toLowerCase();
    if (
      combinedStr.includes('vidya samiksha') ||
      combinedStr.includes('generated on') ||
      combinedStr.includes('keep original') ||
      strRoll.length > 30 ||
      strId.length > 50
    ) {
      continue;
    }

    // If whole row is empty, stop or skip
    if (!strId && !strRoll && !strName) {
      // Check if any mark cells have values
      let hasAnyVal = false;
      for (const colIdx of subjectColMap.keys()) {
        const cVal = row.getCell(colIdx).value;
        if (cVal !== null && cVal !== undefined && String(cVal).trim() !== '') {
          hasAnyVal = true;
          break;
        }
      }
      if (!hasAnyVal) continue; // Clean trailing blank row
    }

    // Match student
    let matchedStudent = null;
    if (strId && studentById.has(strId)) {
      matchedStudent = studentById.get(strId);
    } else if (strRoll && studentByRoll.has(strRoll)) {
      matchedStudent = studentByRoll.get(strRoll);
    }

    // If student was not matched, verify if it's a real student row or stray text/note
    if (!matchedStudent) {
      const rollIsNumeric = !isNaN(Number(strRoll)) && strRoll !== '';
      const idLooksValid = /^[0-9a-fA-F-]+$/.test(strId);
      // If neither roll nor id looks like a valid student identifier, and name is missing or long, skip
      if (!rollIsNumeric && !idLooksValid && (!strName || strName.length > 40)) {
        continue;
      }
    }

    const rowErrors = [];
    const studentDisplayName = matchedStudent?.student_name || strName || `Row ${r}`;
    const studentRollDisplay = matchedStudent?.roll_number || strRoll || '—';

    if (!matchedStudent) {
      const errMsg = `Row ${r}: Student "${strName || 'Unknown'}" (Roll #${strRoll || '?'}, ID: ${strId || '?'}) is not enrolled in this assessment class.`;
      rowErrors.push(errMsg);
      errorsList.push({
        row: r,
        studentName: studentDisplayName,
        rollNo: studentRollDisplay,
        subject: 'General',
        message: errMsg,
        type: 'FATAL',
      });
    }

    const studentSubjectMarks = [];

    // Parse marks for mapped subjects
    for (const [colIdx, subj] of subjectColMap.entries()) {
      const cell = row.getCell(colIdx);
      let rawVal = cell.value;

      // ExcelJS formula result handling
      if (rawVal && typeof rawVal === 'object' && 'result' in rawVal) {
        rawVal = rawVal.result;
      }

      let marksObtained = null;
      let isAbsent = false;
      let cellStatus = 'EMPTY'; // EMPTY, VALID, ABSENT, ERROR
      let cellError = null;

      if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
        const strVal = String(rawVal).trim().toUpperCase();

        if (strVal === 'AB' || strVal === 'A' || strVal === 'ABSENT' || strVal === 'अनुपस्थित') {
          isAbsent = true;
          cellStatus = 'ABSENT';
          absentCount++;
        } else {
          const num = Number(strVal);
          if (isNaN(num)) {
            cellStatus = 'ERROR';
            cellError = `Invalid value "${strVal}". Expected number (0-${subj.max_marks}) or "AB".`;
          } else if (num < 0) {
            cellStatus = 'ERROR';
            cellError = `Negative marks (${num}) are not permitted.`;
          } else if (num > subj.max_marks) {
            cellStatus = 'ERROR';
            cellError = `Marks (${num}) exceeds maximum allowed (${subj.max_marks}) for ${subj.subject_name}.`;
          } else {
            marksObtained = num;
            cellStatus = 'VALID';
            totalMarksToUpdate++;
          }
        }
      }

      if (cellStatus === 'ERROR') {
        const errorDetail = `Row ${r} (${studentDisplayName}) · ${subj.subject_name}: ${cellError}`;
        rowErrors.push(errorDetail);
        errorsList.push({
          row: r,
          studentName: studentDisplayName,
          rollNo: studentRollDisplay,
          subject: subj.subject_name,
          message: cellError,
          type: 'FATAL',
        });
      }

      studentSubjectMarks.push({
        subject_id: subj.subject_id,
        subject_name: subj.subject_name,
        max_marks: subj.max_marks,
        marks_obtained: marksObtained,
        is_absent: isAbsent,
        status: cellStatus,
        error: cellError,
      });

      // If valid mark or absent, add to payload if student was matched
      if (matchedStudent && (cellStatus === 'VALID' || cellStatus === 'ABSENT')) {
        validMarksPayload.push({
          student_id: matchedStudent.student_id,
          subject_id: subj.subject_id,
          marks_obtained: marksObtained,
          is_absent: isAbsent,
        });
      }
    }

    parsedStudents.push({
      row: r,
      student_id: matchedStudent?.student_id || strId,
      roll_number: studentRollDisplay,
      student_name: studentDisplayName,
      is_enrolled: !!matchedStudent,
      subject_marks: studentSubjectMarks,
      hasErrors: rowErrors.length > 0,
      errors: rowErrors,
    });
  }

  const validRowsCount = parsedStudents.filter(s => !s.hasErrors && s.is_enrolled).length;
  const errorRowsCount = parsedStudents.filter(s => s.hasErrors || !s.is_enrolled).length;

  return {
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    totalStudentsParsed: parsedStudents.length,
    validRowsCount,
    errorRowsCount,
    totalMarksToUpdate,
    absentCount,
    subjectsCount: subjectColMap.size,
    errorsList,
    parsedStudents,
    payload: validMarksPayload,
    hasFatalErrors: errorsList.length > 0,
  };
}
