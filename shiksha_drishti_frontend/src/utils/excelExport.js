import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ── Color Theme Constants ─────────────────────────────────────────────────────
const COLORS = {
  NAVY_HEADER:    '0F2942', // Deep Government Navy
  NAVY_SUBHEADER: '0A192F',
  BLUE_ACCENT:    '0284C7', // Official VSK Blue
  GOLD_ACCENT:    'F59E0B', // Amber / Gold Ribbon
  SAFFRON_BAR:    'EA580C', // Tricolor Saffron
  LIGHT_BG:       'F8FAFC', // Slate 50
  ZEBRA_BG:       'F1F5F9', // Slate 100
  BORDER_GRAY:    'CBD5E1', // Slate 300
  BORDER_LIGHT:   'E2E8F0', // Slate 200
  TEXT_DARK:      '0F172A', // Slate 900
  TEXT_MUTED:     '64748B', // Slate 500
  WHITE:          'FFFFFF',

  // Performance Tier Palettes
  TIER_EXCELLENT_BG:  'DCFCE7', // Mint 100
  TIER_EXCELLENT_TXT: '15803D', // Green 700
  TIER_GOOD_BG:       'E0F2FE', // Sky 100
  TIER_GOOD_TXT:      '0369A1', // Sky 700
  TIER_AVERAGE_BG:    'FEF3C7', // Amber 100
  TIER_AVERAGE_TXT:   'B45309', // Amber 700
  TIER_CRITICAL_BG:   'FEE2E2', // Rose 100
  TIER_CRITICAL_TXT:  'B91C1C', // Rose 700

  // Card Backgrounds
  CARD_BLUE_BG:   'EFF6FF',
  CARD_GREEN_BG:  'F0FDF4',
  CARD_AMBER_BG:  'FFFBEB',
  CARD_PURPLE_BG: 'FAF5FF',
};

// ── Helper: Style the Executive Masthead Banner ───────────────────────────────
function styleHeaderBanner(worksheet, startRow, endColNum, mainTitle, subTitle, scopeText) {
  // Row 1: Tricolor / Gold Accent Top Ribbon
  worksheet.mergeCells(startRow, 1, startRow, endColNum);
  const rowRibbon = worksheet.getRow(startRow);
  rowRibbon.height = 6;
  const cellRibbon = rowRibbon.getCell(1);
  cellRibbon.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.GOLD_ACCENT } };

  // Row 2: Primary Government Masthead
  worksheet.mergeCells(startRow + 1, 1, startRow + 1, endColNum);
  const rowGov = worksheet.getRow(startRow + 1);
  rowGov.height = 36;
  const cellGov = rowGov.getCell(1);
  cellGov.value = `🏛️ GOVERNMENT OF CHHATTISGARH · DEPARTMENT OF SCHOOL EDUCATION`;
  cellGov.font = { name: 'Calibri', size: 13, bold: true, color: { argb: COLORS.WHITE } };
  cellGov.alignment = { vertical: 'middle', horizontal: 'center' };
  cellGov.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };

  // Row 3: Department & Report Title Sub-banner
  worksheet.mergeCells(startRow + 2, 1, startRow + 2, endColNum);
  const rowSub = worksheet.getRow(startRow + 2);
  rowSub.height = 26;
  const cellSub = rowSub.getCell(1);
  cellSub.value = `VIDYA SAMIKSHA KENDRA (VSK) · ${mainTitle.toUpperCase()}`;
  cellSub.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.WHITE } };
  cellSub.alignment = { vertical: 'middle', horizontal: 'center' };
  cellSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.BLUE_ACCENT } };

  // Row 4: Telemetry & Security Metadata Ribbon
  worksheet.mergeCells(startRow + 3, 1, startRow + 3, endColNum);
  const rowMeta = worksheet.getRow(startRow + 3);
  rowMeta.height = 22;
  const cellMeta = rowMeta.getCell(1);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  cellMeta.value = `Generated: ${dateStr} ${timeStr} | Academic Session: 2026-27 | Subtitle: ${subTitle} | Scope: ${scopeText || 'State-Wide'} | Classification: OFFICIAL STATE GOVERNANCE RECORD`;
  cellMeta.font = { name: 'Calibri', size: 9, italic: true, bold: false, color: { argb: COLORS.TEXT_MUTED } };
  cellMeta.alignment = { vertical: 'middle', horizontal: 'center' };
  cellMeta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  cellMeta.border = {
    top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
    bottom: { style: 'medium', color: { argb: COLORS.BLUE_ACCENT } },
  };

  // Row 5: Spacing row
  worksheet.getRow(startRow + 4).height = 10;
}

// ── Helper: Format Data Table Headers ─────────────────────────────────────────
function styleTableHeaders(row, colCount) {
  row.height = 30;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.WHITE } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.NAVY_HEADER } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.NAVY_HEADER } },
      bottom: { style: 'medium', color: { argb: COLORS.BLUE_ACCENT } },
      left: { style: 'thin', color: { argb: '334155' } },
      right: { style: 'thin', color: { argb: '334155' } },
    };
  }
}

// ── Helper: Apply standard zebra data row styling ─────────────────────────────
function styleDataRow(row, colCount, isEven = false) {
  row.height = 23;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    if (!cell.fill) {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.ZEBRA_BG : COLORS.WHITE },
      };
    }
    cell.border = {
      top: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      bottom: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
    };
    if (!cell.font) {
      cell.font = { name: 'Calibri', size: 10, color: { argb: COLORS.TEXT_DARK } };
    }
    if (!cell.alignment) {
      cell.alignment = { vertical: 'middle', horizontal: typeof cell.value === 'number' ? 'right' : 'left' };
    }
  }
}

// ── Helper: Apply Tier Badging to a Cell ──────────────────────────────────────
function applyTierStyle(cell, tier) {
  cell.font = { name: 'Calibri', size: 9.5, bold: true };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  const normalized = String(tier || '').toLowerCase();
  
  if (normalized.includes('excellent') || normalized.includes('optimal') || normalized.includes('high') && !normalized.includes('achiever')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_EXCELLENT_BG } };
    cell.font.color = { argb: COLORS.TIER_EXCELLENT_TXT };
  } else if (normalized.includes('good') || normalized.includes('on_track') || normalized.includes('medium')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_GOOD_BG } };
    cell.font.color = { argb: COLORS.TIER_GOOD_TXT };
  } else if (normalized.includes('average') || normalized.includes('watchlist') || normalized.includes('workshop')) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_AVERAGE_BG } };
    cell.font.color = { argb: COLORS.TIER_AVERAGE_TXT };
  } else {
    // Critical / Needs Attention
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_CRITICAL_BG } };
    cell.font.color = { argb: COLORS.TIER_CRITICAL_TXT };
  }
}

// ── Helper: Auto Fit Column Widths with generous padding ─────────────────────
function autoFitColumns(worksheet, minWidth = 14) {
  worksheet.columns.forEach((col) => {
    let maxLen = minWidth;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const val = cell.value ? String(cell.value) : '';
      if (!cell.isMerged && val.length > maxLen && val.length < 55) {
        maxLen = val.length;
      }
    });
    col.width = Math.min(50, maxLen + 4);
  });
}

// ── Helper: Add Official Footer and Signature block ───────────────────────────
function addOfficialFooter(worksheet, startRow, endColNum) {
  worksheet.getRow(startRow).height = 12; // spacer

  worksheet.mergeCells(startRow + 1, 1, startRow + 1, endColNum);
  const rowFoot = worksheet.getRow(startRow + 1);
  rowFoot.height = 20;
  const cellFoot = rowFoot.getCell(1);
  cellFoot.value = `🔒 CONFIDENTIAL & PROPRIETARY — VIDYA SAMIKSHA KENDRA (VSK), SAMAGRA SHIKSHA, CHHATTISGARH`;
  cellFoot.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  cellFoot.alignment = { vertical: 'middle', horizontal: 'center' };
  cellFoot.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  cellFoot.border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };

  worksheet.mergeCells(startRow + 2, 1, startRow + 2, endColNum);
  const rowSign = worksheet.getRow(startRow + 2);
  rowSign.height = 18;
  const cellSign = rowSign.getCell(1);
  cellSign.value = `Electronically Certified Telemetry Record · Directorate of Public Instruction (DPI) · Raipur · System Ref: VSK-CG-2026-X89`;
  cellSign.font = { name: 'Calibri', size: 8, italic: true, color: { argb: COLORS.TEXT_MUTED } };
  cellSign.alignment = { vertical: 'middle', horizontal: 'center' };
  cellSign.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. EXCEL EXPORT: Comprehensive Multi-Sheet State Executive Dossier
// ═════════════════════════════════════════════════════════════════════════════
export async function exportExecutiveDossierXlsx({ overview, districts, filterParams = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  workbook.lastModifiedBy = 'Shiksha Drishti Executive Intelligence Engine';
  workbook.created = new Date();
  workbook.modified = new Date();

  const kpis = overview?.kpis || {};
  const subjects = overview?.subjects || [];
  const critical = overview?.critical_schools || [];
  const topSchools = overview?.top_schools || [];
  const directives = overview?.state_directives || [];
  const scopeText = filterParams.district && filterParams.district !== 'ALL' ? filterParams.district : 'State-Wide';

  // ── Sheet 1: Executive Briefing & District League ───────────────────────────
  const wsLeague = workbook.addWorksheet('District League & KPIs', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 9, activeCell: 'A10', showGridLines: true }],
    properties: { tabColor: { argb: COLORS.BLUE_ACCENT } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  styleHeaderBanner(wsLeague, 1, 10, 'EXECUTIVE EDUCATION INTELLIGENCE DOSSIER', 'State Strategic Scorecard & District League Rankings', scopeText);

  // Scorecard Cards (Rows 6-7)
  // Card 1: Infrastructure
  wsLeague.mergeCells('A6:C6');
  wsLeague.mergeCells('A7:C7');
  const card1Title = wsLeague.getCell('A6');
  card1Title.value = 'OPERATIONAL INFRASTRUCTURE';
  card1Title.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  card1Title.alignment = { horizontal: 'center', vertical: 'middle' };
  card1Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  const card1Val = wsLeague.getCell('A7');
  card1Val.value = `${(kpis.total_schools || 0).toLocaleString()} Schools (${kpis.total_blocks || 0} Blocks · ${kpis.total_clusters || 0} Clusters)`;
  card1Val.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.NAVY_HEADER } };
  card1Val.alignment = { horizontal: 'center', vertical: 'middle' };
  card1Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_BLUE_BG } };

  // Card 2: Academic Mastery
  wsLeague.mergeCells('D6:F6');
  wsLeague.mergeCells('D7:F7');
  const card2Title = wsLeague.getCell('D6');
  card2Title.value = 'ACADEMIC PERFORMANCE BENCHMARK';
  card2Title.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  card2Title.alignment = { horizontal: 'center', vertical: 'middle' };
  card2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  const card2Val = wsLeague.getCell('D7');
  card2Val.value = `State Avg: ${kpis.state_avg_score || 0}% | Pass Rate: ${kpis.pass_rate_pct || 0}%`;
  card2Val.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };
  card2Val.alignment = { horizontal: 'center', vertical: 'middle' };
  card2Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_GREEN_BG } };

  // Card 3: Student Cohort
  wsLeague.mergeCells('G6:J6');
  wsLeague.mergeCells('G7:J7');
  const card3Title = wsLeague.getCell('G6');
  card3Title.value = 'STUDENT COHORT SEGREGATION';
  card3Title.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  card3Title.alignment = { horizontal: 'center', vertical: 'middle' };
  card3Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  const card3Val = wsLeague.getCell('G7');
  card3Val.value = `High Achievers (≥70%): ${(kpis.high_achievers_count || 0).toLocaleString()} | Remedial (<40%): ${(kpis.remedial_count || 0).toLocaleString()}`;
  card3Val.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.TIER_AVERAGE_TXT } };
  card3Val.alignment = { horizontal: 'center', vertical: 'middle' };
  card3Val.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_AMBER_BG } };

  // Border wrapping around KPI cards
  ['A6', 'B6', 'C6', 'A7', 'B7', 'C7'].forEach(addr => {
    wsLeague.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });
  ['D6', 'E6', 'F6', 'D7', 'E7', 'F7'].forEach(addr => {
    wsLeague.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });
  ['G6', 'H6', 'I6', 'J6', 'G7', 'H7', 'I7', 'J7'].forEach(addr => {
    wsLeague.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });

  // Spacer Row 8
  wsLeague.getRow(8).height = 10;

  // Table Headers at Row 9
  const leagueHeaders = ['Rank', 'District Code', 'District Name', 'Total Schools', 'Enrolled Students', 'Teachers', 'Avg Score (%)', 'Pass Rate (%)', 'High Achievers (≥70%)', 'Performance Tier'];
  const row9 = wsLeague.getRow(9);
  leagueHeaders.forEach((h, idx) => { row9.getCell(idx + 1).value = h; });
  styleTableHeaders(row9, 10);

  // Populate District League rows
  let currRow = 10;
  districts.forEach((d, idx) => {
    const row = wsLeague.getRow(currRow);
    row.getCell(1).value = `#${d.rank}`;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = { bold: true, color: { argb: COLORS.NAVY_HEADER } };

    row.getCell(2).value = d.district_cd;
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = d.district_name;
    row.getCell(3).font = { bold: true };

    row.getCell(4).value = Number(d.school_count || 0);
    row.getCell(4).numFmt = '#,##0';

    row.getCell(5).value = Number(d.enrolled_students || 0);
    row.getCell(5).numFmt = '#,##0';

    row.getCell(6).value = Number(d.teacher_count || 0);
    row.getCell(6).numFmt = '#,##0';

    row.getCell(7).value = Number(d.avg_score_pct || 0) / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).font = { bold: true };

    row.getCell(8).value = Number(d.pass_rate_pct || 0) / 100;
    row.getCell(8).numFmt = '0.0%';

    row.getCell(9).value = Number(d.high_achievers || 0);
    row.getCell(9).numFmt = '#,##0';

    row.getCell(10).value = d.performance_tier;

    styleDataRow(row, 10, idx % 2 === 1);
    applyTierStyle(row.getCell(10), d.performance_tier);
    currRow++;
  });

  // Summary Row with Excel Formulas
  const sumRow = wsLeague.getRow(currRow);
  sumRow.height = 26;
  sumRow.getCell(1).value = 'STATE TOTAL / AVG';
  sumRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  sumRow.getCell(4).value = { formula: `SUM(D10:D${currRow - 1})` };
  sumRow.getCell(4).numFmt = '#,##0';
  sumRow.getCell(5).value = { formula: `SUM(E10:E${currRow - 1})` };
  sumRow.getCell(5).numFmt = '#,##0';
  sumRow.getCell(6).value = { formula: `SUM(F10:F${currRow - 1})` };
  sumRow.getCell(6).numFmt = '#,##0';
  sumRow.getCell(7).value = { formula: `AVERAGE(G10:G${currRow - 1})` };
  sumRow.getCell(7).numFmt = '0.0%';
  sumRow.getCell(8).value = { formula: `AVERAGE(H10:H${currRow - 1})` };
  sumRow.getCell(8).numFmt = '0.0%';
  sumRow.getCell(9).value = { formula: `SUM(I10:I${currRow - 1})` };
  sumRow.getCell(9).numFmt = '#,##0';
  sumRow.getCell(10).value = 'STATE LEVEL';
  sumRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

  styleDataRow(sumRow, 10, false);
  for (let c = 1; c <= 10; c++) {
    sumRow.getCell(c).font = { bold: true, color: { argb: COLORS.NAVY_HEADER } };
    sumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    sumRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: COLORS.NAVY_HEADER } },
      left: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
      right: { style: 'thin', color: { argb: COLORS.BORDER_LIGHT } },
    };
  }

  addOfficialFooter(wsLeague, currRow + 1, 10);
  autoFitColumns(wsLeague);

  // ── Sheet 2: Subject Mastery Breakdown ──────────────────────────────────────
  if (subjects.length > 0) {
    const wsSub = workbook.addWorksheet('Subject Mastery', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
      properties: { tabColor: { argb: '8B5CF6' } }
    });
    styleHeaderBanner(wsSub, 1, 6, 'SUBJECT PERFORMANCE DIAGNOSTICS', 'Curriculum Mastery & Remedial Volume Breakdown', scopeText);
    
    const subHeaders = ['Subject Code', 'Subject Name', 'Evaluated Students', 'Avg Score (%)', 'Remedial Cohort (<40%)', 'Estimated Pass Rate (%)'];
    const sHeaderRow = wsSub.getRow(6);
    subHeaders.forEach((h, i) => { sHeaderRow.getCell(i + 1).value = h; });
    styleTableHeaders(sHeaderRow, 6);

    let sRowIdx = 7;
    subjects.forEach((s, idx) => {
      const r = wsSub.getRow(sRowIdx);
      r.getCell(1).value = s.subject_code;
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).value = s.subject_name;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = Number(s.student_count || 0);
      r.getCell(3).numFmt = '#,##0';
      r.getCell(4).value = Number(s.avg_score_pct || 0) / 100;
      r.getCell(4).numFmt = '0.0%';
      r.getCell(4).font = { bold: true };
      r.getCell(5).value = Number(s.weak_students_count || 0);
      r.getCell(5).numFmt = '#,##0';
      r.getCell(5).font = { color: { argb: COLORS.TIER_CRITICAL_TXT } };
      r.getCell(6).value = Number(s.student_count > 0 ? ((s.student_count - (s.weak_students_count || 0)) / s.student_count) : 0.85);
      r.getCell(6).numFmt = '0.0%';

      styleDataRow(r, 6, idx % 2 === 1);
      sRowIdx++;
    });

    // Summary Row for subjects
    const sSumRow = wsSub.getRow(sRowIdx);
    sSumRow.height = 26;
    sSumRow.getCell(1).value = 'STATE OVERVIEW';
    sSumRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    sSumRow.getCell(3).value = { formula: `SUM(C7:C${sRowIdx - 1})` };
    sSumRow.getCell(3).numFmt = '#,##0';
    sSumRow.getCell(4).value = { formula: `AVERAGE(D7:D${sRowIdx - 1})` };
    sSumRow.getCell(4).numFmt = '0.0%';
    sSumRow.getCell(5).value = { formula: `SUM(E7:E${sRowIdx - 1})` };
    sSumRow.getCell(5).numFmt = '#,##0';
    sSumRow.getCell(6).value = { formula: `AVERAGE(F7:F${sRowIdx - 1})` };
    sSumRow.getCell(6).numFmt = '0.0%';
    styleDataRow(sSumRow, 6, false);
    for (let c = 1; c <= 6; c++) {
      sSumRow.getCell(c).font = { bold: true, color: { argb: COLORS.NAVY_HEADER } };
      sSumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
      sSumRow.getCell(c).border = { top: { style: 'thin', color: { argb: '94A3B8' } }, bottom: { style: 'double', color: { argb: COLORS.NAVY_HEADER } } };
    }

    addOfficialFooter(wsSub, sRowIdx + 1, 6);
    autoFitColumns(wsSub);
  }

  // ── Sheet 3: Critical Schools Intervention Directory ────────────────────────
  if (critical.length > 0) {
    const wsCrit = workbook.addWorksheet('Critical Schools Directory', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
      properties: { tabColor: { argb: 'EF4444' } }
    });
    styleHeaderBanner(wsCrit, 1, 7, 'CRITICAL INTERVENTION SCHOOLS DIRECTORY', 'Urgent Action Mandate (<40% Average Score)', scopeText);
    
    const critHeaders = ['Priority', 'School Name', 'UDISE Code', 'Block Name', 'District Name', 'Avg Score (%)', 'Head of School (HOS)'];
    const cHeaderRow = wsCrit.getRow(6);
    critHeaders.forEach((h, i) => { cHeaderRow.getCell(i + 1).value = h; });
    styleTableHeaders(cHeaderRow, 7);

    let cRowIdx = 7;
    critical.forEach((sc, idx) => {
      const r = wsCrit.getRow(cRowIdx);
      r.getCell(1).value = `CRITICAL #${idx + 1}`;
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(1).font = { bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };

      r.getCell(2).value = sc.school_name;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = sc.udise || sc.udise_cd || '—';
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(4).value = sc.block_name;
      r.getCell(5).value = sc.district_name;
      r.getCell(6).value = Number(sc.avg_score_pct || 0) / 100;
      r.getCell(6).numFmt = '0.0%';
      r.getCell(6).font = { bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };
      r.getCell(7).value = sc.hos_name || 'Designated Headmaster';

      styleDataRow(r, 7, idx % 2 === 1);
      cRowIdx++;
    });

    addOfficialFooter(wsCrit, cRowIdx + 1, 7);
    autoFitColumns(wsCrit);
  }

  // ── Sheet 4: Top Performing Schools Honor Roll ──────────────────────────────
  if (topSchools.length > 0) {
    const wsTop = workbook.addWorksheet('Top Schools Honor Roll', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
      properties: { tabColor: { argb: '10B981' } }
    });
    styleHeaderBanner(wsTop, 1, 6, 'TOP PERFORMING SCHOOLS HONOR ROLL', 'Academic Excellence Benchmarks Across Chhattisgarh', scopeText);
    
    const topHeaders = ['Honor Rank', 'School Name', 'UDISE Code', 'Block Name', 'District Name', 'Avg Score (%)'];
    const tHeaderRow = wsTop.getRow(6);
    topHeaders.forEach((h, i) => { tHeaderRow.getCell(i + 1).value = h; });
    styleTableHeaders(tHeaderRow, 6);

    let tRowIdx = 7;
    topSchools.forEach((sc, idx) => {
      const r = wsTop.getRow(tRowIdx);
      r.getCell(1).value = `🏆 #${idx + 1}`;
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(1).font = { bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };

      r.getCell(2).value = sc.school_name;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = sc.udise || sc.udise_cd || '—';
      r.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(4).value = sc.block_name;
      r.getCell(5).value = sc.district_name;
      r.getCell(6).value = Number(sc.avg_score_pct || 0) / 100;
      r.getCell(6).numFmt = '0.0%';
      r.getCell(6).font = { bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };

      styleDataRow(r, 6, idx % 2 === 1);
      tRowIdx++;
    });

    addOfficialFooter(wsTop, tRowIdx + 1, 6);
    autoFitColumns(wsTop);
  }

  // ── Sheet 5: Mandated State Policy Directives ───────────────────────────────
  if (directives.length > 0) {
    const wsDir = workbook.addWorksheet('State Directives', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
      properties: { tabColor: { argb: 'F59E0B' } }
    });
    styleHeaderBanner(wsDir, 1, 5, 'MANDATED STATE POLICY DIRECTIVES', 'SCERT & DPI Pedagogical Governance Schedule', scopeText);
    
    const dirHeaders = ['Directive ID', 'Title', 'Priority Level', 'Target Scope', 'Operational Mandate Details'];
    const dHeaderRow = wsDir.getRow(6);
    dirHeaders.forEach((h, i) => { dHeaderRow.getCell(i + 1).value = h; });
    styleTableHeaders(dHeaderRow, 5);

    let dRowIdx = 7;
    directives.forEach((dir, idx) => {
      const r = wsDir.getRow(dRowIdx);
      r.getCell(1).value = dir.id;
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(1).font = { bold: true };

      r.getCell(2).value = dir.title;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = dir.priority;
      r.getCell(4).value = dir.scope || 'State-Wide';
      r.getCell(5).value = dir.detail;

      styleDataRow(r, 5, idx % 2 === 1);
      applyTierStyle(r.getCell(3), dir.priority === 'CRITICAL' ? 'Needs Attention' : dir.priority === 'HIGH' ? 'Average' : 'Good');
      dRowIdx++;
    });

    addOfficialFooter(wsDir, dRowIdx + 1, 5);
    autoFitColumns(wsDir);
  }

  // Write and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `Chhattisgarh_State_Executive_Education_Dossier_${new Date().toISOString().split('T')[0]}.xlsx`;
  saveAs(blob, filename);
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. EXCEL EXPORT: District Performance League
// ═════════════════════════════════════════════════════════════════════════════
export async function exportDistrictLeagueXlsx({ districts, filterParams = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  const ws = workbook.addWorksheet('District League', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
    properties: { tabColor: { argb: COLORS.BLUE_ACCENT } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  const scopeText = filterParams.district && filterParams.district !== 'ALL' ? filterParams.district : 'State-Wide';

  styleHeaderBanner(ws, 1, 10, 'DISTRICT PERFORMANCE LEAGUE & COMPARATIVE BENCHMARK', 'Official League Rankings, Infrastructure Coverage & Student Mastery', scopeText);

  const headers = ['Rank', 'District Code', 'District Name', 'Total Schools', 'Enrolled Students', 'Teachers', 'Avg Score (%)', 'Pass Rate (%)', 'High Achievers (≥70%)', 'Performance Tier'];
  const hRow = ws.getRow(6);
  headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
  styleTableHeaders(hRow, 10);

  let rIdx = 7;
  districts.forEach((d, idx) => {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = `#${d.rank}`;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = { bold: true, color: { argb: COLORS.NAVY_HEADER } };

    row.getCell(2).value = d.district_cd;
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = d.district_name;
    row.getCell(3).font = { bold: true };

    row.getCell(4).value = Number(d.school_count || 0);
    row.getCell(4).numFmt = '#,##0';

    row.getCell(5).value = Number(d.enrolled_students || 0);
    row.getCell(5).numFmt = '#,##0';

    row.getCell(6).value = Number(d.teacher_count || 0);
    row.getCell(6).numFmt = '#,##0';

    row.getCell(7).value = Number(d.avg_score_pct || 0) / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).font = { bold: true };

    row.getCell(8).value = Number(d.pass_rate_pct || 0) / 100;
    row.getCell(8).numFmt = '0.0%';

    row.getCell(9).value = Number(d.high_achievers || 0);
    row.getCell(9).numFmt = '#,##0';

    row.getCell(10).value = d.performance_tier;

    styleDataRow(row, 10, idx % 2 === 1);
    applyTierStyle(row.getCell(10), d.performance_tier);
    rIdx++;
  });

  // Summary Row
  const sumRow = ws.getRow(rIdx);
  sumRow.height = 26;
  sumRow.getCell(1).value = 'STATE TOTAL / AVG';
  sumRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  sumRow.getCell(4).value = { formula: `SUM(D7:D${rIdx - 1})` };
  sumRow.getCell(4).numFmt = '#,##0';
  sumRow.getCell(5).value = { formula: `SUM(E7:E${rIdx - 1})` };
  sumRow.getCell(5).numFmt = '#,##0';
  sumRow.getCell(6).value = { formula: `SUM(F7:F${rIdx - 1})` };
  sumRow.getCell(6).numFmt = '#,##0';
  sumRow.getCell(7).value = { formula: `AVERAGE(G7:G${rIdx - 1})` };
  sumRow.getCell(7).numFmt = '0.0%';
  sumRow.getCell(8).value = { formula: `AVERAGE(H7:H${rIdx - 1})` };
  sumRow.getCell(8).numFmt = '0.0%';
  sumRow.getCell(9).value = { formula: `SUM(I7:I${rIdx - 1})` };
  sumRow.getCell(9).numFmt = '#,##0';
  sumRow.getCell(10).value = 'ALL DISTRICTS';
  sumRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };

  styleDataRow(sumRow, 10, false);
  for (let c = 1; c <= 10; c++) {
    sumRow.getCell(c).font = { bold: true, color: { argb: COLORS.NAVY_HEADER } };
    sumRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E2E8F0' } };
    sumRow.getCell(c).border = {
      top: { style: 'thin', color: { argb: '94A3B8' } },
      bottom: { style: 'double', color: { argb: COLORS.NAVY_HEADER } }
    };
  }

  addOfficialFooter(ws, rIdx + 1, 10);
  autoFitColumns(ws);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Chhattisgarh_District_Performance_League_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. EXCEL EXPORT: Critical Intervention Schools
// ═════════════════════════════════════════════════════════════════════════════
export async function exportCriticalSchoolsXlsx({ criticalSchools, filterParams = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  const ws = workbook.addWorksheet('Critical Schools Master', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
    properties: { tabColor: { argb: 'EF4444' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  const scopeText = filterParams.district && filterParams.district !== 'ALL' ? filterParams.district : 'State-Wide';

  styleHeaderBanner(ws, 1, 7, 'CRITICAL INTERVENTION SCHOOLS ACTION MASTER', 'Schools scoring below 40% threshold requiring immediate DEO action', scopeText);

  const headers = ['Priority Rank', 'School Name', 'UDISE Code', 'Block Name', 'District Name', 'Average Score (%)', 'Head of School (HOS)'];
  const hRow = ws.getRow(6);
  headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
  styleTableHeaders(hRow, 7);

  let rIdx = 7;
  criticalSchools.forEach((sc, idx) => {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = `CRITICAL #${idx + 1}`;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = { bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };

    row.getCell(2).value = sc.school_name;
    row.getCell(2).font = { bold: true };
    row.getCell(3).value = sc.udise || sc.udise_cd || '—';
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(4).value = sc.block_name;
    row.getCell(5).value = sc.district_name;
    row.getCell(6).value = Number(sc.avg_score_pct || 0) / 100;
    row.getCell(6).numFmt = '0.0%';
    row.getCell(6).font = { bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };
    row.getCell(7).value = sc.hos_name || 'Designated Headmaster';

    styleDataRow(row, 7, idx % 2 === 1);
    rIdx++;
  });

  addOfficialFooter(ws, rIdx + 1, 7);
  autoFitColumns(ws);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Chhattisgarh_Critical_Intervention_Schools_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. EXCEL EXPORT: Question-Level LO Diagnostic Analytics
// ═════════════════════════════════════════════════════════════════════════════
export async function exportQuestionDiagnosticsXlsx({ questions, filterParams = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  const ws = workbook.addWorksheet('Question Diagnostics', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
    properties: { tabColor: { argb: '0284C7' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  const scopeText = filterParams.district && filterParams.district !== 'ALL' ? filterParams.district : 'State-Wide';

  styleHeaderBanner(ws, 1, 9, 'QUESTION LEARNING OUTCOME (LO) DIAGNOSTIC REPORT', 'Competency Gap Assessment & SCERT Pedagogical Directives', scopeText);

  const headers = ['Class / Grade', 'Subject', 'Question No', 'Max Marks', 'Avg Score (%)', 'Weak Students Count', 'Affected Districts', 'Action Priority', 'State Directive'];
  const hRow = ws.getRow(6);
  headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
  styleTableHeaders(hRow, 9);

  let rIdx = 7;
  (questions || []).forEach((q, idx) => {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = q.class_name;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(1).font = { bold: true };

    row.getCell(2).value = q.subject_name;
    row.getCell(2).font = { bold: true };

    row.getCell(3).value = q.question_number;
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(4).value = Number(q.max_marks || 10);
    row.getCell(4).numFmt = '#,##0';

    row.getCell(5).value = Number(q.avg_score_pct || 0) / 100;
    row.getCell(5).numFmt = '0.0%';
    row.getCell(5).font = { bold: true };

    row.getCell(6).value = Number(q.weak_students_count || 0);
    row.getCell(6).numFmt = '#,##0';
    row.getCell(6).font = { color: { argb: COLORS.TIER_CRITICAL_TXT } };

    row.getCell(7).value = Number(q.affected_districts_count || 1);
    row.getCell(7).numFmt = '#,##0';

    row.getCell(8).value = q.revision_priority || 'ON_TRACK';
    row.getCell(9).value = q.state_directive || '';

    styleDataRow(row, 9, idx % 2 === 1);
    applyTierStyle(row.getCell(8), q.revision_priority === 'STATE_INTERVENTION_URGENT' ? 'Needs Attention' : q.revision_priority === 'DISTRICT_WORKSHOP' ? 'Average' : 'Good');
    rIdx++;
  });

  addOfficialFooter(ws, rIdx + 1, 9);
  autoFitColumns(ws);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Chhattisgarh_Question_LO_Diagnostic_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. EXCEL EXPORT: Teacher Evaluation Compliance Matrix
// ═════════════════════════════════════════════════════════════════════════════
export async function exportTeacherComplianceXlsx({ teachers, filterParams = {} }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  const ws = workbook.addWorksheet('Teacher Matrix', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
    properties: { tabColor: { argb: '10B981' } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });
  const scopeText = filterParams.district && filterParams.district !== 'ALL' ? filterParams.district : 'State-Wide';

  styleHeaderBanner(ws, 1, 9, 'TEACHER EVALUATION & ASSESSMENT COMPLIANCE MATRIX', 'Faculty Assessment Telemetry & Student Mastery Rating', scopeText);

  const headers = ['Teacher Name', 'Username / ID', 'Assigned School', 'Block Name', 'District Name', 'Total Assessments', 'Submitted Evaluations', 'Compliance Rate (%)', 'Avg Student Score (%)'];
  const hRow = ws.getRow(6);
  headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
  styleTableHeaders(hRow, 9);

  let rIdx = 7;
  (teachers || []).forEach((t, idx) => {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = t.full_name;
    row.getCell(1).font = { bold: true };

    row.getCell(2).value = t.username;
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = t.school_name || '—';
    row.getCell(4).value = t.block_name || '—';
    row.getCell(5).value = t.district_name || '—';

    row.getCell(6).value = Number(t.total_assessments || 0);
    row.getCell(6).numFmt = '#,##0';

    row.getCell(7).value = Number(t.submitted_assessments || 0);
    row.getCell(7).numFmt = '#,##0';

    row.getCell(8).value = Number(t.compliance_rate || 0) / 100;
    row.getCell(8).numFmt = '0.0%';
    row.getCell(8).font = { bold: true };

    row.getCell(9).value = Number(t.avg_student_score || 0) / 100;
    row.getCell(9).numFmt = '0.0%';
    row.getCell(9).font = { bold: true };

    styleDataRow(row, 9, idx % 2 === 1);
    
    // Apply compliance badge
    const compRate = Number(t.compliance_rate || 0);
    if (compRate >= 90) {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_EXCELLENT_BG } };
      row.getCell(8).font.color = { argb: COLORS.TIER_EXCELLENT_TXT };
    } else if (compRate >= 75) {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_GOOD_BG } };
      row.getCell(8).font.color = { argb: COLORS.TIER_GOOD_TXT };
    } else if (compRate >= 50) {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_AVERAGE_BG } };
      row.getCell(8).font.color = { argb: COLORS.TIER_AVERAGE_TXT };
    } else {
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_CRITICAL_BG } };
      row.getCell(8).font.color = { argb: COLORS.TIER_CRITICAL_TXT };
    }

    rIdx++;
  });

  addOfficialFooter(ws, rIdx + 1, 9);
  autoFitColumns(ws);

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `Chhattisgarh_Teacher_Evaluation_Compliance_Matrix_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. EXCEL EXPORT: School Class & Subject Performance Benchmark (Above & Below)
// ═════════════════════════════════════════════════════════════════════════════
export async function exportSchoolSubjectBenchmarkXlsx({
  school = {},
  selectedClass = {},
  selectedSubject = {},
  stats = {},
  aboveStudents = [],
  belowStudents = [],
  matrix = [],
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Vidya Samiksha Kendra (VSK) Chhattisgarh';
  const className = selectedClass.class_name || 'Class';
  const subjectName = selectedSubject.name || selectedSubject.subject_name || 'Subject';
  const benchScore = stats.benchmark_used_pct || stats.class_subject_avg_pct || 75;

  // ── Sheet 1: Benchmark & Cohort Segregation ─────────────────────────────────
  const ws = workbook.addWorksheet(`${className} ${subjectName}`, {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 9, activeCell: 'A10', showGridLines: true }],
    properties: { tabColor: { argb: COLORS.BLUE_ACCENT } },
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
  });

  const mainTitle = `${school.school_name || 'SCHOOL'} · ${className.toUpperCase()} ${subjectName.toUpperCase()} BENCHMARK`;
  const subTitle = `Benchmark Threshold: ${benchScore}% | Total Tested: ${stats.total_students_tested || 0} Students`;
  const scopeText = `UDISE: ${school.udise_code || '—'} | Block: ${school.block_name || '—'} | District: ${school.district_name || '—'}`;

  styleHeaderBanner(ws, 1, 9, mainTitle, subTitle, scopeText);

  // Scorecard Cards (Rows 6-7)
  // Card 1: Benchmark
  ws.mergeCells('A6:B6');
  ws.mergeCells('A7:B7');
  ws.getCell('A6').value = 'CLASS SUBJECT AVERAGE';
  ws.getCell('A6').font = { size: 8.5, bold: true, color: { argb: COLORS.TEXT_MUTED } };
  ws.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('A6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  ws.getCell('A7').value = `${stats.class_subject_avg_pct || benchScore}% Average`;
  ws.getCell('A7').font = { size: 12, bold: true, color: { argb: COLORS.NAVY_HEADER } };
  ws.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('A7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_BLUE_BG } };

  // Card 2: Above Benchmark
  ws.mergeCells('C6:E6');
  ws.mergeCells('C7:E7');
  ws.getCell('C6').value = `ABOVE BENCHMARK (≥ ${benchScore}%)`;
  ws.getCell('C6').font = { size: 8.5, bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };
  ws.getCell('C6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('C6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  ws.getCell('C7').value = `${aboveStudents.length} Students (${stats.above_ratio_pct || 0}% of class)`;
  ws.getCell('C7').font = { size: 12, bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };
  ws.getCell('C7').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('C7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_GREEN_BG } };

  // Card 3: Below Benchmark
  ws.mergeCells('F6:I6');
  ws.mergeCells('F7:I7');
  ws.getCell('F6').value = `BELOW BENCHMARK / REMEDIAL (< ${benchScore}%)`;
  ws.getCell('F6').font = { size: 8.5, bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };
  ws.getCell('F6').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('F6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.LIGHT_BG } };
  ws.getCell('F7').value = `${belowStudents.length} Students (${stats.below_ratio_pct || 0}% of class) · ${stats.critical_remedial_count || 0} Critical (<40%)`;
  ws.getCell('F7').font = { size: 12, bold: true, color: { argb: COLORS.TIER_CRITICAL_TXT } };
  ws.getCell('F7').alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getCell('F7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.CARD_AMBER_BG } };

  // Border wrapping around KPI cards
  ['A6', 'B6', 'A7', 'B7'].forEach(addr => {
    ws.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });
  ['C6', 'D6', 'E6', 'C7', 'D7', 'E7'].forEach(addr => {
    ws.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });
  ['F6', 'G6', 'H6', 'I6', 'F7', 'G7', 'H7', 'I7'].forEach(addr => {
    ws.getCell(addr).border = { top: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, bottom: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, left: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } }, right: { style: 'thin', color: { argb: COLORS.BORDER_GRAY } } };
  });

  ws.getRow(8).height = 10;

  // Table Headers
  const headers = ['Cohort Category', 'Rank', 'Roll No', 'Student Name', 'Gender', 'Marks Obtained', 'Percentage Score (%)', 'Delta vs Avg (%)', 'Action Recommendation'];
  const hRow = ws.getRow(9);
  headers.forEach((h, i) => { hRow.getCell(i + 1).value = h; });
  styleTableHeaders(hRow, 9);

  let rIdx = 10;

  // 1. Above Benchmark Students
  aboveStudents.forEach((s, idx) => {
    const row = ws.getRow(rIdx);
    row.getCell(1).value = 'ABOVE AVERAGE (उच्च समूह)';
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.TIER_EXCELLENT_BG } };
    row.getCell(1).font = { bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };

    row.getCell(2).value = `#${s.rank || idx + 1}`;
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = s.roll_number;
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(4).value = s.student_name;
    row.getCell(4).font = { bold: true };

    row.getCell(5).value = s.gender === 'M' ? 'Male' : 'Female';
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(6).value = `${s.marks_obtained || 0} / ${s.max_marks || 100}`;
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(7).value = Number(s.score_pct || 0) / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).font = { bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };

    row.getCell(8).value = `+${s.delta_pct || 0}%`;
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).font = { bold: true, color: { argb: COLORS.TIER_EXCELLENT_TXT } };

    row.getCell(9).value = s.action_recommendation || 'Enrichment Tasks';

    styleDataRow(row, 9, idx % 2 === 1);
    rIdx++;
  });

  // 2. Below Benchmark Students
  belowStudents.forEach((s, idx) => {
    const row = ws.getRow(rIdx);
    const isCrit = Number(s.score_pct || 0) < 40;
    row.getCell(1).value = isCrit ? 'CRITICAL REMEDIAL (<40%)' : 'BELOW AVERAGE (सुधारात्मक)';
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: isCrit ? COLORS.TIER_CRITICAL_BG : COLORS.TIER_AVERAGE_BG } };
    row.getCell(1).font = { bold: true, color: { argb: isCrit ? COLORS.TIER_CRITICAL_TXT : COLORS.TIER_AVERAGE_TXT } };

    row.getCell(2).value = `Priority #${idx + 1}`;
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(3).value = s.roll_number;
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(4).value = s.student_name;
    row.getCell(4).font = { bold: true };

    row.getCell(5).value = s.gender === 'M' ? 'Male' : 'Female';
    row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(6).value = `${s.marks_obtained || 0} / ${s.max_marks || 100}`;
    row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

    row.getCell(7).value = Number(s.score_pct || 0) / 100;
    row.getCell(7).numFmt = '0.0%';
    row.getCell(7).font = { bold: true, color: { argb: isCrit ? COLORS.TIER_CRITICAL_TXT : COLORS.TIER_AVERAGE_TXT } };

    row.getCell(8).value = `${s.delta_pct || 0}%`;
    row.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell(8).font = { bold: true, color: { argb: isCrit ? COLORS.TIER_CRITICAL_TXT : COLORS.TIER_AVERAGE_TXT } };

    row.getCell(9).value = s.action_recommendation || 'Remedial Bridge Practice';

    styleDataRow(row, 9, idx % 2 === 1);
    rIdx++;
  });

  addOfficialFooter(ws, rIdx + 1, 9);
  autoFitColumns(ws);

  // ── Sheet 2: Cross-Subject Matrix ───────────────────────────────────────────
  if (matrix && matrix.length > 0) {
    const wsMatrix = workbook.addWorksheet(`${className} Subject Matrix`, {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 6, activeCell: 'A7', showGridLines: true }],
      properties: { tabColor: { argb: '8B5CF6' } },
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 }
    });
    styleHeaderBanner(wsMatrix, 1, 5, `${className.toUpperCase()} SUBJECT PERFORMANCE MATRIX`, `Cross-Subject Averages & Performance Levels`, scopeText);

    const mHeaders = ['Subject Code', 'Subject Name', 'Tested Students', 'Class Average (%)', 'Status vs Target'];
    const mRow = wsMatrix.getRow(6);
    mHeaders.forEach((h, i) => { mRow.getCell(i + 1).value = h; });
    styleTableHeaders(mRow, 5);

    let mIdx = 7;
    matrix.forEach((m, idx) => {
      const r = wsMatrix.getRow(mIdx);
      r.getCell(1).value = m.subject_code || '—';
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).value = m.subject_name;
      r.getCell(2).font = { bold: true };
      r.getCell(3).value = Number(m.student_count || 0);
      r.getCell(3).numFmt = '#,##0';
      r.getCell(4).value = Number(m.avg_score_pct || 0) / 100;
      r.getCell(4).numFmt = '0.0%';
      r.getCell(4).font = { bold: true };
      
      const score = Number(m.avg_score_pct || 0);
      const status = score >= 75 ? 'Optimal (≥75%)' : score >= 60 ? 'Satisfactory (60-74%)' : 'Needs Intervention (<60%)';
      r.getCell(5).value = status;
      applyTierStyle(r.getCell(5), score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention');

      styleDataRow(r, 5, idx % 2 === 1);
      mIdx++;
    });

    addOfficialFooter(wsMatrix, mIdx + 1, 5);
    autoFitColumns(wsMatrix);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${(school.school_name || 'School').replace(/\s+/g, '_')}_${className.replace(/\s+/g, '_')}_${subjectName.replace(/\s+/g, '_')}_Benchmark_Analysis.xlsx`;
  saveAs(new Blob([buffer]), filename);
}

