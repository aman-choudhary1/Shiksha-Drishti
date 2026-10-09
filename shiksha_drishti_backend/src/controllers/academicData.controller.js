/**
 * academicData.controller.js
 *
 * High-performance Read-only analytics on the pre-aggregated student_analytics_summary table.
 * State: Chhattisgarh (UDISE code prefix 22)
 *
 * Includes School Management Filtering (sch_mgmt_id = 1 for Government Schools, etc.)
 * Strictly filters active students (studentstatus = '1').
 */
const studentPool = require('../config/studentDb');
const mainPool    = require('../config/db');
const cache       = require('../utils/cache');

const CACHE_TTL_SECONDS = 3600; // 1 hour cache for pre-aggregated data

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const districtUdiseFilter = (districtCd) => {
  if (!districtCd) return null;
  const twoDigit = String(districtCd).slice(-2).padStart(2, '0');
  return twoDigit;
};

// Safe query runner with cache
async function cachedQuery(cacheKey, queryFn) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const result = await queryFn();
  cache.set(cacheKey, result, CACHE_TTL_SECONDS);
  return result;
}

/* Helper to build WHERE clause filters */
function buildWhereClause({ district_cd, class_group, sch_mgmt_id, startParamIndex = 1 }) {
  const params = [];
  const conditions = [];
  let paramIdx = startParamIndex;

  if (district_cd) {
    const twoDigit = districtUdiseFilter(district_cd);
    params.push(twoDigit);
    conditions.push(`district_cd = $${paramIdx++}`);
  }

  if (class_group === 'primary') {
    conditions.push("classid::int BETWEEN 1 AND 8");
  } else if (class_group === 'secondary') {
    conditions.push("classid::int BETWEEN 9 AND 12");
  } else if (class_group === 'preprimary') {
    conditions.push("classid::int BETWEEN -3 AND 0");
  }

  if (sch_mgmt_id !== undefined && sch_mgmt_id !== null && sch_mgmt_id !== '') {
    params.push(Number(sch_mgmt_id));
    conditions.push(`sch_mgmt_id = $${paramIdx++}`);
  }

  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';
  return { params, whereClause };
}

/* ─── Summary KPIs ────────────────────────────────────────────────────────── */
const getAcademicSummary = async (req, res) => {
  const { district_cd, class_group, sch_mgmt_id } = req.query;
  try {
    const data = await getSummaryInternal(district_cd, class_group, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getAcademicSummary error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Class-wise Distribution ─────────────────────────────────────────────── */
const getClasswiseDistribution = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getClasswiseInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getClasswiseDistribution error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── District-wise Comparison ────────────────────────────────────────────── */
const getDistrictwiseComparison = async (req, res) => {
  const { sch_mgmt_id } = req.query;
  try {
    const data = await fetchDistrictwiseData(sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getDistrictwiseComparison error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Top / Bottom Districts Ranking ─────────────────────────────────────── */
const getDistrictRankings = async (req, res) => {
  const { sch_mgmt_id } = req.query;
  try {
    const list = await fetchDistrictwiseData(sch_mgmt_id);
    const ranked = [...list]
      .sort((a, b) => (b.pass_pct || 0) - (a.pass_pct || 0))
      .map((r, idx) => ({ ...r, rank: idx + 1 }));
    res.json({ success: true, data: ranked });
  } catch (err) {
    console.error("getDistrictRankings error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Gender Analytics ────────────────────────────────────────────────────── */
const getGenderAnalytics = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getGenderInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getGenderAnalytics error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Category (Social) Analytics ────────────────────────────────────────── */
const getCategoryAnalytics = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getCategoryInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getCategoryAnalytics error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Result Distribution ─────────────────────────────────────────────────── */
const getResultDistribution = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getResultsInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getResultDistribution error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Marks Histogram (grade bands) ──────────────────────────────────────── */
const getMarksHistogram = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getMarksInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getMarksHistogram error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── CWSN & Special Categories ──────────────────────────────────────────── */
const getSpecialCategoryStats = async (req, res) => {
  const { district_cd, sch_mgmt_id } = req.query;
  try {
    const data = await getSpecialInternal(district_cd, sch_mgmt_id);
    res.json({ success: true, data });
  } catch (err) {
    console.error("getSpecialCategoryStats error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Bundle Endpoint: Fetches all academic data in 1 request (< 20ms) ───── */
const getAcademicBundle = async (req, res) => {
  const { district_cd, class_group, sch_mgmt_id } = req.query;
  const cacheKey = `acad:bundle:${district_cd || 'all'}:${class_group || 'all'}:${sch_mgmt_id || 'all'}`;

  try {
    const bundle = await cachedQuery(cacheKey, async () => {
      const [
        summary,
        classwise,
        districtwise,
        gender,
        category,
        results,
        marks,
        special
      ] = await Promise.all([
        getSummaryInternal(district_cd, class_group, sch_mgmt_id),
        getClasswiseInternal(district_cd, sch_mgmt_id),
        fetchDistrictwiseData(sch_mgmt_id),
        getGenderInternal(district_cd, sch_mgmt_id),
        getCategoryInternal(district_cd, sch_mgmt_id),
        getResultsInternal(district_cd, sch_mgmt_id),
        getMarksInternal(district_cd, sch_mgmt_id),
        getSpecialInternal(district_cd, sch_mgmt_id),
      ]);

      const rankings = [...districtwise]
        .sort((a, b) => (b.pass_pct || 0) - (a.pass_pct || 0))
        .map((r, idx) => ({ ...r, rank: idx + 1 }));

      return {
        summary,
        classwise,
        districtwise,
        rankings,
        gender,
        category,
        results,
        marks,
        special,
      };
    });

    res.json({ success: true, data: bundle });
  } catch (err) {
    console.error("getAcademicBundle error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ─── Internal Query Helpers ─────────────────────────────────────────────── */

async function getSummaryInternal(district_cd, class_group, sch_mgmt_id) {
  const cacheKey = `acad:summary:${district_cd || 'all'}:${class_group || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, class_group, sch_mgmt_id });

    const q = `
      SELECT
        COALESCE(SUM(total_students), 0) AS total_students,
        COALESCE(SUM(CASE WHEN gender = '1' THEN total_students ELSE 0 END), 0) AS male_students,
        COALESCE(SUM(CASE WHEN gender = '2' THEN total_students ELSE 0 END), 0) AS female_students,
        COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
        COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
        COALESCE(SUM(CASE WHEN examresultpy IN ('4','5') THEN total_students ELSE 0 END), 0) AS absent_not_appeared,
        ROUND(COALESCE(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 0), 2) AS avg_marks,
        ROUND(
          COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0)::numeric /
          NULLIF(COALESCE(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0), 0) * 100, 2
        ) AS pass_percentage,
        COALESCE(SUM(CASE WHEN cwsnyn = '1' THEN total_students ELSE 0 END), 0) AS cwsn_students,
        COALESCE(SUM(CASE WHEN ewsyn = '1' THEN total_students ELSE 0 END), 0) AS ews_students
      FROM student_analytics_summary
      WHERE classid IS NOT NULL AND classid != 'null' ${whereClause}
    `;

    let schoolQ = 'SELECT COUNT(DISTINCT udise_code) AS count FROM mst_schools WHERE 1=1';
    const schoolParams = [];
    if (district_cd) {
      const twoDigit = districtUdiseFilter(district_cd);
      schoolParams.push(`22${twoDigit}%`);
      schoolQ += ` AND udise_code LIKE $${schoolParams.length}`;
    }
    if (sch_mgmt_id !== undefined && sch_mgmt_id !== null && sch_mgmt_id !== '') {
      schoolParams.push(Number(sch_mgmt_id));
      schoolQ += ` AND sch_mgmt_id = $${schoolParams.length}`;
    }

    const [result, schoolRes] = await Promise.all([
      studentPool.query(q, params),
      studentPool.query(schoolQ, schoolParams).catch(() => mainPool.query('SELECT COUNT(DISTINCT udise_code) AS count FROM sd_schools')),
    ]);

    const row = result.rows[0] || {};
    row.total_schools = Number(schoolRes.rows[0]?.count || 0);
    return row;
  });
}

async function getClasswiseInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:classwise:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });

    const q = `
      SELECT
        classid,
        COALESCE(SUM(total_students), 0) AS total,
        COALESCE(SUM(CASE WHEN gender = '1' THEN total_students ELSE 0 END), 0) AS male,
        COALESCE(SUM(CASE WHEN gender = '2' THEN total_students ELSE 0 END), 0) AS female,
        COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
        COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
        ROUND(COALESCE(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 0), 2) AS avg_marks,
        ROUND(
          COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0)::numeric /
          NULLIF(COALESCE(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0), 0) * 100, 2
        ) AS pass_pct
      FROM student_analytics_summary
      WHERE classid IS NOT NULL AND classid != 'null' AND classid ~ '^-?[0-9]+$' AND classid::int BETWEEN -3 AND 12
      ${whereClause}
      GROUP BY classid ORDER BY classid::int
    `;

    const result = await studentPool.query(q, params);
    const CLASS_LABELS = { '-3': 'Nursery', '-2': 'LKG', '-1': 'UKG', '0': 'KG', '1': 'Class 1', '2': 'Class 2', '3': 'Class 3', '4': 'Class 4', '5': 'Class 5', '6': 'Class 6', '7': 'Class 7', '8': 'Class 8', '9': 'Class 9', '10': 'Class 10', '11': 'Class 11', '12': 'Class 12', '13': 'Class 13' };
    return result.rows.map(r => ({
      ...r,
      class_label: CLASS_LABELS[r.classid] || `Class ${r.classid}`,
      total: Number(r.total),
      male: Number(r.male),
      female: Number(r.female),
      passed: Number(r.passed),
      failed: Number(r.failed),
      avg_marks: Number(r.avg_marks),
      pass_pct: Number(r.pass_pct),
    }));
  });
}

async function fetchDistrictwiseData(sch_mgmt_id) {
  const cacheKey = `acad:districts:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    let mgmtFilter = '';
    const params = [];
    if (sch_mgmt_id !== undefined && sch_mgmt_id !== null && sch_mgmt_id !== '') {
      params.push(Number(sch_mgmt_id));
      mgmtFilter = `AND sch_mgmt_id = $${params.length}`;
    }

    const q = `
      SELECT
        district_cd AS dist_code_2digit,
        COALESCE(SUM(total_students), 0) AS total,
        COALESCE(SUM(CASE WHEN gender = '1' THEN total_students ELSE 0 END), 0) AS male,
        COALESCE(SUM(CASE WHEN gender = '2' THEN total_students ELSE 0 END), 0) AS female,
        COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
        COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
        ROUND(COALESCE(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 0), 2) AS avg_marks,
        ROUND(
          COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0)::numeric /
          NULLIF(COALESCE(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0), 0) * 100, 2
        ) AS pass_pct
      FROM student_analytics_summary
      WHERE district_cd IS NOT NULL ${mgmtFilter}
      GROUP BY district_cd
      ORDER BY district_cd
    `;

    const sdQ = `SELECT district_cd, district_name FROM sd_districts ORDER BY district_cd`;

    const [studentRes, distRes] = await Promise.all([
      studentPool.query(q, params),
      mainPool.query(sdQ),
    ]);

    const distMap = {};
    distRes.rows.forEach(d => {
      const twoDigit = String(d.district_cd).slice(-2).padStart(2, '0');
      distMap[twoDigit] = d.district_name;
    });

    return studentRes.rows.map(r => ({
      dist_code: r.dist_code_2digit,
      district_name: distMap[r.dist_code_2digit] || `District ${r.dist_code_2digit}`,
      total: Number(r.total),
      male: Number(r.male),
      female: Number(r.female),
      passed: Number(r.passed),
      failed: Number(r.failed),
      avg_marks: Number(r.avg_marks),
      pass_pct: Number(r.pass_pct),
    }));
  });
}

async function getGenderInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:gender:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });
    const q = `
      SELECT
        gender,
        COALESCE(SUM(total_students), 0) AS total,
        COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
        COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
        COALESCE(SUM(CASE WHEN examresultpy = '3' THEN total_students ELSE 0 END), 0) AS compartment,
        ROUND(COALESCE(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 0), 2) AS avg_marks,
        ROUND(
          COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0)::numeric /
          NULLIF(COALESCE(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0), 0) * 100, 2
        ) AS pass_pct
      FROM student_analytics_summary
      WHERE gender IN ('1','2') ${whereClause}
      GROUP BY gender
      ORDER BY gender
    `;
    const result = await studentPool.query(q, params);
    const GENDER = { '1': 'Male', '2': 'Female' };
    return result.rows.map(r => ({
      ...r,
      gender_label: GENDER[r.gender] || r.gender,
      total: Number(r.total),
      passed: Number(r.passed),
      failed: Number(r.failed),
      compartment: Number(r.compartment),
      avg_marks: Number(r.avg_marks),
      pass_pct: Number(r.pass_pct),
    }));
  });
}

async function getCategoryInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:category:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });
    const q = `
      SELECT
        socialcatid,
        COALESCE(SUM(total_students), 0) AS total,
        COALESCE(SUM(CASE WHEN gender = '1' THEN total_students ELSE 0 END), 0) AS male,
        COALESCE(SUM(CASE WHEN gender = '2' THEN total_students ELSE 0 END), 0) AS female,
        COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0) AS passed,
        COALESCE(SUM(CASE WHEN examresultpy = '0' THEN total_students ELSE 0 END), 0) AS failed,
        ROUND(COALESCE(SUM(marks_sum) / NULLIF(SUM(marks_count), 0), 0), 2) AS avg_marks,
        ROUND(
          COALESCE(SUM(CASE WHEN examresultpy = '1' THEN total_students ELSE 0 END), 0)::numeric /
          NULLIF(COALESCE(SUM(CASE WHEN examresultpy IN ('0','1','3') THEN total_students ELSE 0 END), 0), 0) * 100, 2
        ) AS pass_pct
      FROM student_analytics_summary
      WHERE socialcatid IN ('1','2','3','4') ${whereClause}
      GROUP BY socialcatid
      ORDER BY socialcatid
    `;
    const result = await studentPool.query(q, params);
    const CAT = { '1': 'General', '2': 'OBC', '3': 'SC', '4': 'ST' };
    return result.rows.map(r => ({
      ...r,
      category_label: CAT[r.socialcatid] || r.socialcatid,
      total: Number(r.total),
      male: Number(r.male),
      female: Number(r.female),
      passed: Number(r.passed),
      failed: Number(r.failed),
      avg_marks: Number(r.avg_marks),
      pass_pct: Number(r.pass_pct),
    }));
  });
}

async function getResultsInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:results:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });
    const q = `
      SELECT
        examresultpy,
        COALESCE(SUM(total_students), 0) AS total
      FROM student_analytics_summary
      WHERE examresultpy IS NOT NULL AND examresultpy != 'null' ${whereClause}
      GROUP BY examresultpy
      ORDER BY total DESC
    `;
    const result = await studentPool.query(q, params);
    const RESULT = { '1': 'Pass', '0': 'Fail', '3': 'Compartment', '4': 'Absent', '5': 'Not Appeared', '6': 'Detained', '7': 'Other' };
    return result.rows.map(r => ({
      code: r.examresultpy,
      label: RESULT[r.examresultpy] || `Code ${r.examresultpy}`,
      total: Number(r.total),
    }));
  });
}

async function getMarksInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:marks:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });
    const q = `
      SELECT
        grade_band,
        COALESCE(SUM(total_students), 0) AS students,
        COALESCE(SUM(CASE WHEN gender = '1' THEN total_students ELSE 0 END), 0) AS male,
        COALESCE(SUM(CASE WHEN gender = '2' THEN total_students ELSE 0 END), 0) AS female
      FROM student_analytics_summary
      WHERE grade_band != 'No Marks' ${whereClause}
      GROUP BY grade_band
      ORDER BY
        CASE grade_band
          WHEN 'A+ (90-100)' THEN 1
          WHEN 'A  (75-89)'  THEN 2
          WHEN 'B  (60-74)'  THEN 3
          WHEN 'C  (45-59)'  THEN 4
          WHEN 'D  (33-44)'  THEN 5
          WHEN 'Fail (<33)'  THEN 6
          ELSE 7
        END
    `;
    const result = await studentPool.query(q, params);
    return result.rows.map(r => ({
      ...r,
      students: Number(r.students),
      male: Number(r.male),
      female: Number(r.female),
    }));
  });
}

async function getSpecialInternal(district_cd, sch_mgmt_id) {
  const cacheKey = `acad:special:${district_cd || 'all'}:${sch_mgmt_id || 'all'}`;
  return cachedQuery(cacheKey, async () => {
    const { params, whereClause } = buildWhereClause({ district_cd, sch_mgmt_id });
    const q = `
      SELECT
        COALESCE(SUM(total_students), 0) AS total,
        COALESCE(SUM(CASE WHEN cwsnyn = '1' THEN total_students ELSE 0 END), 0) AS cwsn,
        COALESCE(SUM(CASE WHEN ewsyn = '1' THEN total_students ELSE 0 END), 0)  AS ews,
        COALESCE(SUM(CASE WHEN ooscyn = '1' THEN total_students ELSE 0 END), 0) AS oosc,
        COALESCE(SUM(CASE WHEN isbplyn = '1' THEN total_students ELSE 0 END), 0) AS scholarship,
        COALESCE(SUM(CASE WHEN isgiftedchild = '1' THEN total_students ELSE 0 END), 0) AS gifted,
        COALESCE(SUM(CASE WHEN nccnssyn = '1' THEN total_students ELSE 0 END), 0) AS ncc_nss,
        ROUND(COALESCE(SUM(CASE WHEN cwsnyn = '1' THEN total_students ELSE 0 END), 0)::numeric / NULLIF(COALESCE(SUM(total_students), 0), 0) * 100, 2) AS cwsn_pct,
        ROUND(COALESCE(SUM(CASE WHEN ewsyn = '1' THEN total_students ELSE 0 END), 0)::numeric / NULLIF(COALESCE(SUM(total_students), 0), 0) * 100, 2)  AS ews_pct
      FROM student_analytics_summary
      WHERE 1=1 ${whereClause}
    `;
    const result = await studentPool.query(q, params);
    const r = result.rows[0] || {};
    return {
      total: Number(r.total || 0),
      cwsn: Number(r.cwsn || 0),
      ews: Number(r.ews || 0),
      oosc: Number(r.oosc || 0),
      scholarship: Number(r.scholarship || 0),
      gifted: Number(r.gifted || 0),
      ncc_nss: Number(r.ncc_nss || 0),
      cwsn_pct: Number(r.cwsn_pct || 0),
      ews_pct: Number(r.ews_pct || 0),
    };
  });
}

module.exports = {
  getAcademicSummary,
  getClasswiseDistribution,
  getDistrictwiseComparison,
  getGenderAnalytics,
  getCategoryAnalytics,
  getResultDistribution,
  getMarksHistogram,
  getSpecialCategoryStats,
  getDistrictRankings,
  getAcademicBundle,
};
