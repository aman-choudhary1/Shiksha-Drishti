const pool = require('../config/db');

/**
 * Helper to normalize image paths to full/relative URLs
 */
function normalizeImagePath(img) {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/uploads/')) {
    return img;
  }
  return `/uploads/questions/${img}`;
}

/**
 * 1. GET /api/mobile/assessments/papers
 * Returns list of available assessment papers for mobile apps
 */
exports.getMobilePapers = async (req, res, next) => {
  try {
    const { class_no, subject } = req.query;
    let query = `
      SELECT 
        p.paper_code AS "paperCode",
        p.title,
        p.title_hi,
        p.class_no AS "class",
        p.subject,
        p.total_marks AS "totalMarks",
        p.total_questions AS "totalQuestions",
        p.duration_minutes AS "durationMinutes",
        p.academic_year AS "academicYear",
        COUNT(q.id) AS "questionsCount"
      FROM sd_assessment_papers p
      LEFT JOIN sd_mobile_questions q ON p.id = q.paper_id
      WHERE p.is_active = true
    `;
    const params = [];
    if (class_no) {
      params.push(class_no);
      query += ` AND p.class_no = $${params.length}`;
    }
    if (subject) {
      params.push(subject);
      query += ` AND p.subject ILIKE $${params.length}`;
    }
    query += ` GROUP BY p.id ORDER BY p.class_no ASC, p.paper_code ASC`;

    const result = await pool.query(query, params);
    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 1.1 GET /api/mobile/assessments/student-menu?class=1
 * Simple mobile menu listing available subject tests for a student's class
 */
exports.getStudentMenu = async (req, res, next) => {
  try {
    const classNo = parseInt(req.query.class || req.query.class_no || 1, 10);
    const result = await pool.query(
      `SELECT 
        p.paper_code AS "paperCode",
        p.title,
        p.title_hi,
        p.class_no AS "class",
        p.subject,
        p.total_marks AS "totalMarks",
        p.total_questions AS "totalQuestions",
        p.duration_minutes AS "durationMinutes",
        COUNT(q.id) AS "questionsCount",
        CONCAT('/api/mobile/assessments/paper/', p.paper_code) AS "fetchUrl"
      FROM sd_assessment_papers p
      LEFT JOIN sd_mobile_questions q ON p.id = q.paper_id
      WHERE p.class_no = $1 AND p.is_active = true
      GROUP BY p.id
      ORDER BY p.id ASC`,
      [classNo]
    );

    return res.json({
      success: true,
      class: classNo,
      availableTestsCount: result.rows.length,
      tests: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. GET /api/mobile/assessments/paper/:paperCode?
 * OR GET /api/mobile/assessments/paper?class=1&subject=Hindi
 * OR GET /api/mobile/assessments/paper/class/:classNo/subject/:subject
 * Flexible paper fetcher by PaperCode OR Class & Subject
 */
exports.getMobilePaperByCode = async (req, res, next) => {
  try {
    const { paperCode, classNo, subject: routeSubject } = req.params;
    const { class: queryClass, class_no, subject: querySubject } = req.query;
    const includeAnswers = req.query.include_answers !== 'false';

    const targetClass = classNo || queryClass || class_no;
    const targetSubject = routeSubject || querySubject;

    let paperRes;

    if (paperCode && paperCode !== 'by-class-subject') {
      // 1. Fetch by Paper Code
      paperRes = await pool.query(
        `SELECT * FROM sd_assessment_papers WHERE (paper_code = $1 OR id::text = $1) AND is_active = true LIMIT 1`,
        [paperCode]
      );
    } else if (targetClass && targetSubject) {
      // 2. Fetch directly by Class & Subject (No Paper Code needed!)
      paperRes = await pool.query(
        `SELECT * FROM sd_assessment_papers 
         WHERE class_no = $1 AND subject ILIKE $2 AND is_active = true 
         ORDER BY id DESC LIMIT 1`,
        [targetClass, `%${targetSubject}%`]
      );
    } else if (targetClass) {
      // 3. Fetch first active paper for this class
      paperRes = await pool.query(
        `SELECT * FROM sd_assessment_papers 
         WHERE class_no = $1 AND is_active = true 
         ORDER BY id ASC LIMIT 1`,
        [targetClass]
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a paperCode (e.g. /paper/1011) or query params ?class=1&subject=Hindi',
      });
    }

    if (!paperRes || paperRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: paperCode
          ? `Assessment paper with code '${paperCode}' not found.`
          : `No active assessment paper found for Class ${targetClass} ${targetSubject || ''}.`,
      });
    }

    const paper = paperRes.rows[0];

    const questionsRes = await pool.query(
      `SELECT 
        q.id,
        q.question_number AS "no",
        q.question_type AS "type",
        COALESCE(q.question_text_hi, q.question_text_en) AS "question",
        q.question_text_en AS "question_en",
        q.question_text_hi AS "question_hi",
        q.question_image_url,
        q.images_json,
        q.hint,
        q.answer_text,
        q.lo_code,
        q.marks,
        COALESCE(
          json_agg(
            json_build_object(
              'key', LOWER(o.option_key),
              'text', COALESCE(o.option_text_hi, o.option_text_en),
              'text_en', o.option_text_en,
              'text_hi', o.option_text_hi,
              'image', o.option_image_url,
              'is_correct', o.is_correct
            ) ORDER BY o.option_key ASC
          ) FILTER (WHERE o.id IS NOT NULL), '[]'::json
        ) AS options
      FROM sd_mobile_questions q
      LEFT JOIN sd_mobile_question_options o ON q.id = o.question_id
      WHERE q.paper_id = $1
      GROUP BY q.id
      ORDER BY q.question_number ASC`,
      [paper.id]
    );

    // Format questions to exact structure
    const formattedQuestions = questionsRes.rows.map((q) => {
      // Find correct answer
      let answer = null;
      if (includeAnswers) {
        if (q.type === 'fill_blank') {
          answer = q.answer_text || null;
        } else {
          const correctOpt = (q.options || []).find((o) => o.is_correct);
          answer = correctOpt ? correctOpt.key : (q.answer_text ? q.answer_text.toLowerCase() : null);
        }
      }

      // Format images array
      let images = [];
      if (Array.isArray(q.images_json) && q.images_json.length > 0) {
        images = q.images_json.map(normalizeImagePath);
      } else if (q.question_image_url) {
        images = [normalizeImagePath(q.question_image_url)];
      }

      // Format options: if an option has an image, output { key, image }, if text output { key, text }
      const options = (q.options || []).map((opt) => {
        const optObj = { key: opt.key };
        if (opt.image) {
          optObj.image = normalizeImagePath(opt.image);
        }
        if (opt.text && !opt.image) {
          optObj.text = opt.text;
        } else if (opt.text) {
          optObj.text = opt.text;
        }
        return optObj;
      });

      const qObj = {
        no: q.no,
        type: q.type || 'text_mcq',
        question: q.question,
      };

      if (images.length > 0) {
        qObj.images = images;
      }

      if (q.hint) {
        qObj.hint = q.hint;
      }

      qObj.options = options;

      if (includeAnswers) {
        qObj.answer = answer;
      }

      return qObj;
    });

    const responsePayload = {
      paperCode: paper.paper_code,
      class: paper.class_no,
      subject: paper.subject,
      totalMarks: Number(paper.total_marks || 30),
      questions: formattedQuestions,
    };

    return res.json(responsePayload);
  } catch (err) {
    next(err);
  }
};

/**
 * 3. POST /api/mobile/assessments/submit
 * Mobile student test submission and auto-grading
 */
exports.submitMobileAssessment = async (req, res, next) => {
  try {
    const {
      paperCode,
      paper_id,
      studentId,
      student_id,
      studentName,
      student_name,
      schoolId,
      school_id,
      class_no,
      answers = [],
    } = req.body;

    const targetCode = paperCode || req.body.paper_code;
    let paper;

    if (targetCode) {
      const pRes = await pool.query('SELECT * FROM sd_assessment_papers WHERE paper_code = $1', [targetCode]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: `Paper ${targetCode} not found` });
      }
      paper = pRes.rows[0];
    } else if (paper_id) {
      const pRes = await pool.query('SELECT * FROM sd_assessment_papers WHERE id = $1', [paper_id]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: `Paper ID ${paper_id} not found` });
      }
      paper = pRes.rows[0];
    } else {
      return res.status(400).json({ success: false, message: 'Missing paperCode or paper_id' });
    }

    // Fetch all questions with answers for this paper
    const qRes = await pool.query(
      `SELECT 
        q.id,
        q.question_number,
        q.question_type,
        q.marks,
        q.answer_text,
        COALESCE(
          (SELECT LOWER(o.option_key) FROM sd_mobile_question_options o WHERE o.question_id = q.id AND o.is_correct = true LIMIT 1),
          LOWER(q.answer_text)
        ) AS correct_answer
      FROM sd_mobile_questions q
      WHERE q.paper_id = $1
      ORDER BY q.question_number ASC`,
      [paper.id]
    );

    // Map student answers by question number
    const submittedMap = {};
    for (const ans of answers) {
      const qNum = ans.no || ans.question_number || ans.question_id;
      const userVal = (ans.selected || ans.answer || ans.text || ans.selected_option || '').toString().trim();
      submittedMap[qNum] = userVal;
    }

    let totalScore = 0;
    let maxMarks = 0;
    const evaluationDetails = [];

    for (const q of qRes.rows) {
      const qMarks = parseFloat(q.marks || 1.0);
      maxMarks += qMarks;

      const userVal = submittedMap[q.question_number] || '';
      let isCorrect = false;

      if (q.question_type === 'fill_blank') {
        // String compare for fill in the blank
        const expected = (q.answer_text || q.correct_answer || '').trim().toLowerCase();
        isCorrect = expected && userVal.toLowerCase() === expected;
      } else {
        // MCQ key compare
        const expectedKey = (q.correct_answer || '').trim().toLowerCase();
        isCorrect = expectedKey && userVal.toLowerCase() === expectedKey;
      }

      const marksEarned = isCorrect ? qMarks : 0;
      totalScore += marksEarned;

      evaluationDetails.push({
        no: q.question_number,
        type: q.question_type,
        submitted: userVal || null,
        correct_answer: q.correct_answer || q.answer_text,
        is_correct: isCorrect,
        marks_obtained: marksEarned,
        max_marks: qMarks,
      });
    }

    const percentage = maxMarks > 0 ? Number(((totalScore / maxMarks) * 100).toFixed(2)) : 0;
    const status = percentage >= 60 ? 'PASSED' : percentage >= 33 ? 'PROMOTED' : 'NEEDS_SUPPORT';

    // Store in submission table
    const subRes = await pool.query(
      `INSERT INTO sd_student_assessment_submissions (
        student_id, student_name, paper_id, school_id, class_no, total_score, max_marks, percentage, answers_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, submitted_at`,
      [
        studentId || student_id || 'ANONYMOUS_MOBILE_STUDENT',
        studentName || student_name || 'Student',
        paper.id,
        schoolId || school_id || 1,
        class_no || paper.class_no,
        totalScore,
        maxMarks,
        percentage,
        JSON.stringify(evaluationDetails),
      ]
    );

    return res.json({
      success: true,
      submissionId: subRes.rows[0].id,
      paperCode: paper.paper_code,
      subject: paper.subject,
      class: paper.class_no,
      score: totalScore,
      maxMarks: maxMarks,
      percentage: percentage,
      status: status,
      submittedAt: subRes.rows[0].submitted_at,
      details: evaluationDetails,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. POST /api/mobile/assessments/import-json
 * Bulk import one or multiple papers directly using this exact JSON schema
 */
exports.importMobileJson = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const payload = req.body;
    const papersList = Array.isArray(payload) ? payload : [payload];

    if (papersList.length === 0 || !papersList[0].paperCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload. Expected object or array with paperCode, class, subject, and questions.',
      });
    }

    await client.query('BEGIN');
    const importedPapers = [];

    for (const p of papersList) {
      const paperCode = String(p.paperCode || p.paper_code);
      const classNo = parseInt(p.class || p.class_no || 1, 10);
      const subject = p.subject || 'General';
      const totalMarks = parseFloat(p.totalMarks || p.total_marks || 30);
      const questions = Array.isArray(p.questions) ? p.questions : [];

      // Upsert paper
      const paperUpsertRes = await client.query(
        `INSERT INTO sd_assessment_papers (
          paper_code, title, title_hi, class_no, subject, total_questions, total_marks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
        ON CONFLICT (paper_code) DO UPDATE SET
          class_no = EXCLUDED.class_no,
          subject = EXCLUDED.subject,
          total_questions = EXCLUDED.total_questions,
          total_marks = EXCLUDED.total_marks,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;`,
        [
          paperCode,
          `Assessment Paper ${paperCode} - Class ${classNo} ${subject}`,
          `मूल्यांकन पत्र ${paperCode} - कक्षा ${classNo} ${subject}`,
          classNo,
          subject,
          questions.length,
          totalMarks,
        ]
      );

      const paperId = paperUpsertRes.rows[0].id;

      // Upsert questions
      for (const q of questions) {
        const qNo = parseInt(q.no || q.question_number || 1, 10);
        const qType = q.type || 'text_mcq';
        const qText = q.question || q.question_text || '';
        const hint = q.hint || null;
        const answer = q.answer || null;
        const images = Array.isArray(q.images) ? q.images : (q.image ? [q.image] : []);
        const primaryImage = images.length > 0 ? images[0] : null;
        const marksPerQ = totalMarks > 0 && questions.length > 0 ? (totalMarks / questions.length) : 1.0;

        const qRes = await client.query(
          `INSERT INTO sd_mobile_questions (
            paper_id, question_number, question_text_en, question_text_hi,
            question_type, question_image_url, images_json, hint, answer_text, marks, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
          ON CONFLICT (paper_id, question_number) DO UPDATE SET
            question_text_en = EXCLUDED.question_text_en,
            question_text_hi = EXCLUDED.question_text_hi,
            question_type = EXCLUDED.question_type,
            question_image_url = EXCLUDED.question_image_url,
            images_json = EXCLUDED.images_json,
            hint = EXCLUDED.hint,
            answer_text = EXCLUDED.answer_text,
            marks = EXCLUDED.marks,
            updated_at = CURRENT_TIMESTAMP
          RETURNING id;`,
          [
            paperId,
            qNo,
            qText,
            qText,
            qType,
            primaryImage,
            JSON.stringify(images),
            hint,
            answer,
            marksPerQ,
          ]
        );

        const questionId = qRes.rows[0].id;

        // Clear and insert options
        await client.query('DELETE FROM sd_mobile_question_options WHERE question_id = $1', [questionId]);

        if (Array.isArray(q.options) && q.options.length > 0) {
          for (const opt of q.options) {
            const optKey = (opt.key || 'A').toUpperCase();
            const optText = opt.text || '';
            const optImg = opt.image || null;
            const isCorrect = answer && answer.toLowerCase() === optKey.toLowerCase();

            await client.query(
              `INSERT INTO sd_mobile_question_options (
                question_id, option_key, option_text_en, option_text_hi, option_image_url, is_correct
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [questionId, optKey, optText, optText, optImg, isCorrect]
            );
          }
        }
      }

      importedPapers.push({
        paperCode,
        class: classNo,
        subject,
        questionsCount: questions.length,
      });
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Successfully imported ${importedPapers.length} paper(s) with questions!`,
      data: importedPapers,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * 5. POST /api/mobile/assessments/seed-hindi-1011
 * Quick seed for the user-provided Paper 1011 (Hindi Class 1)
 */
exports.seedHindiPaper1011 = async (req, res, next) => {
  const paper1011Data = {
    paperCode: '1011',
    class: 1,
    subject: 'Hindi',
    totalMarks: 30,
    questions: [
      {
        no: 1,
        type: 'image_mcq',
        question: 'चित्र पहचानकर सही उत्तर पर गोला लगाओ।',
        images: ['hi_q01.png'],
        options: [
          { key: 'a', text: 'अंगूर' },
          { key: 'b', text: 'आम' },
          { key: 'c', text: 'पपीता' },
        ],
        answer: 'a',
      },
      {
        no: 2,
        type: 'image_mcq',
        question: 'चित्र पहचानकर सही उत्तर पर गोला लगाओ।',
        images: ['hi_q02.png'],
        options: [
          { key: 'a', text: 'कोयल' },
          { key: 'b', text: 'मोर' },
          { key: 'c', text: 'मैना' },
        ],
        answer: 'b',
      },
      {
        no: 3,
        type: 'image_mcq',
        question: 'चित्र पहचानकर सही उत्तर पर गोला लगाओ।',
        images: ['hi_q03.png'],
        options: [
          { key: 'a', text: 'झंडा' },
          { key: 'b', text: 'डंडा' },
          { key: 'c', text: 'खंभा' },
        ],
        answer: 'a',
      },
      {
        no: 4,
        type: 'text_mcq',
        question: 'समान ध्वनि वाले शब्द पर गोला लगाओ: आलू –',
        options: [
          { key: 'a', text: 'लालू' },
          { key: 'b', text: 'कूकी' },
          { key: 'c', text: 'सूखी' },
        ],
        answer: 'a',
      },
      {
        no: 5,
        type: 'text_mcq',
        question: 'समान ध्वनि वाले शब्द पर गोला लगाओ: दाल –',
        options: [
          { key: 'a', text: 'भात' },
          { key: 'b', text: 'रोटी' },
          { key: 'c', text: 'जाल' },
        ],
        answer: 'c',
      },
      {
        no: 6,
        type: 'text_mcq',
        question: 'समान ध्वनि वाले शब्द पर गोला लगाओ: पैसा –',
        options: [
          { key: 'a', text: 'मैना' },
          { key: 'b', text: 'जैसा' },
          { key: 'c', text: 'रैना' },
        ],
        answer: 'b',
      },
      {
        no: 7,
        type: 'odd_one_out_image',
        question: 'इन चित्रों में से कौन-सा चित्र अलग है?',
        options: [
          { key: 'a', image: 'hi_q07_a.png' },
          { key: 'b', image: 'hi_q07_b.png' },
          { key: 'c', image: 'hi_q07_c.png' },
        ],
        answer: 'c',
      },
      {
        no: 8,
        type: 'odd_one_out_image',
        question: 'इन चित्रों में से कौन-सा चित्र अलग है?',
        options: [
          { key: 'a', image: 'hi_q08_a.png' },
          { key: 'b', image: 'hi_q08_b.png' },
          { key: 'c', image: 'hi_q08_c.png' },
        ],
        answer: 'c',
      },
      {
        no: 9,
        type: 'text_mcq',
        question: 'दिए गए वर्ण के आधार पर सही शब्द चुनो: औ –',
        options: [
          { key: 'a', text: 'ओखली' },
          { key: 'b', text: 'औजार' },
          { key: 'c', text: 'ओढ़नी' },
        ],
        answer: 'b',
      },
      {
        no: 10,
        type: 'text_mcq',
        question: 'दिए गए वर्ण के आधार पर सही शब्द चुनो: स –',
        options: [
          { key: 'a', text: 'सरकस' },
          { key: 'b', text: 'शरबत' },
          { key: 'c', text: 'शहद' },
        ],
        answer: 'a',
      },
      {
        no: 11,
        type: 'text_mcq',
        question: 'दिए गए वर्ण के आधार पर सही शब्द चुनो: क्ष –',
        options: [
          { key: 'a', text: 'छतरी' },
          { key: 'b', text: 'क्षत्रिय' },
          { key: 'c', text: 'छोकरी' },
        ],
        answer: 'b',
      },
      {
        no: 12,
        type: 'text_mcq',
        question: 'गिलहरी को मज़ा क्यों आ रहा था?',
        options: [
          { key: 'a', text: 'पेड़ पर चढ़ने से' },
          { key: 'b', text: 'उछल-कूद करने से' },
          { key: 'c', text: 'झूला झूलने से' },
        ],
        answer: 'c',
      },
      {
        no: 13,
        type: 'fill_blank',
        question: 'बंदर की पूँछ कैसी थी?',
        hint: 'लं_______',
        options: [],
        answer: 'लंबी',
      },
      {
        no: 14,
        type: 'fill_blank',
        question: 'हलीम कहाँ गया?',
        hint: 'चाँ_______',
        options: [],
        answer: 'चाँद पर',
      },
      {
        no: 15,
        type: 'fill_blank',
        question: 'किस सब्जी का स्वाद कड़वा होता है?',
        hint: 'क_______ला',
        options: [],
        answer: 'करेला',
      },
    ],
  };

  req.body = paper1011Data;
  return exports.importMobileJson(req, res, next);
};
