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
      const parsedClass = parseInt(String(targetClass).replace(/\D/g, ''), 10);
      const searchClass = isNaN(parsedClass) ? targetClass : parsedClass;
      
      paperRes = await pool.query(
        `SELECT * FROM sd_assessment_papers 
         WHERE (class_no = $1 OR class_no::text = $2::text) 
           AND (subject ILIKE $3 OR $4 ILIKE CONCAT('%', subject, '%')) 
           AND is_active = true 
         ORDER BY id DESC LIMIT 1`,
        [searchClass, String(targetClass), `%${targetSubject}%`, targetSubject]
      );

      // Fallback: If no exact paper for class+subject, check closest paper for that subject
      if (!paperRes || paperRes.rows.length === 0) {
        paperRes = await pool.query(
          `SELECT * FROM sd_assessment_papers 
           WHERE (subject ILIKE $1 OR $2 ILIKE CONCAT('%', subject, '%')) AND is_active = true 
           ORDER BY id ASC LIMIT 1`,
          [`%${targetSubject}%`, targetSubject]
        );
      }
    } else if (targetClass) {
      const parsedClass = parseInt(String(targetClass).replace(/\D/g, ''), 10);
      const searchClass = isNaN(parsedClass) ? targetClass : parsedClass;
      // 3. Fetch first active paper for this class
      paperRes = await pool.query(
        `SELECT * FROM sd_assessment_papers 
         WHERE (class_no = $1 OR class_no::text = $2::text) AND is_active = true 
         ORDER BY id ASC LIMIT 1`,
        [searchClass, String(targetClass)]
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

/**
 * 6. GET /api/mobile/assessments/classes
 * Class list of the school whose teacher is logged in.
 * Supports:
 * - JWT authentication (req.user.primary_udise, req.user.id)
 * - Optional query overrides: ?school_udise=... or ?teacher_id=... or ?username=...
 * - Returns school metadata, teacher info, and list of classes with student count & test availability.
 */
exports.getTeacherSchoolClasses = async (req, res, next) => {
  try {
    let teacherId = req.user?.id || req.query.teacher_id || req.query.user_id;
    let schoolUdise = req.user?.primary_udise || req.query.school_udise || req.query.udise;
    let username = req.user?.username || req.query.username;

    let teacher = null;

    // 1. Resolve teacher info if available
    if (teacherId || username) {
      const uRes = await pool.query(
        `SELECT id, username, full_name, primary_udise, role 
         FROM sd_users 
         WHERE (id::text = $1 OR username = $2) AND is_active = true 
         LIMIT 1`,
        [teacherId ? String(teacherId) : null, username || null]
      );
      if (uRes.rows.length > 0) {
        teacher = uRes.rows[0];
        if (!schoolUdise) {
          schoolUdise = teacher.primary_udise;
        }
      }
    } else if (req.user) {
      teacher = {
        id: req.user.id,
        username: req.user.username,
        full_name: req.user.full_name,
        primary_udise: req.user.primary_udise,
        role: req.user.role,
      };
    }

    // 2. Resolve school UDISE fallback
    if (!schoolUdise) {
      const sFallback = await pool.query(
        `SELECT primary_udise FROM sd_users WHERE role = 'TEACHER' AND primary_udise IS NOT NULL LIMIT 1`
      );
      schoolUdise = sFallback.rows.length > 0 ? sFallback.rows[0].primary_udise : 22050904705;
    }

    // 3. Fetch school metadata
    const schoolRes = await pool.query(
      `SELECT udise_code, school_name, cluster_cd, cluster_name, block_cd, block_name, 
              district_cd, district_name, school_type, school_management, hos_name
       FROM sd_schools 
       WHERE udise_code = $1`,
      [schoolUdise]
    );

    const school = schoolRes.rows[0] || {
      udise_code: Number(schoolUdise),
      school_name: `Government School (${schoolUdise})`,
      cluster_name: 'Raipur Cluster',
      block_name: 'Raipur Urban',
      district_name: 'Raipur',
      school_type: 'Government',
    };

    // 4. Fetch teacher's specifically assigned classes
    const assignedClassIds = new Set();
    if (teacher?.id) {
      const assignRes = await pool.query(
        `SELECT class_id FROM sd_teacher_assignments 
         WHERE user_id = $1 AND school_udise = $2 AND is_active = true`,
        [teacher.id, schoolUdise]
      );
      assignRes.rows.forEach((r) => assignedClassIds.add(Number(r.class_id)));
    }

    // 5. Fetch all active classes with student counts in this school and available tests
    const classesRes = await pool.query(
      `SELECT 
        c.id AS class_id,
        c.class_num AS class_no,
        c.class_name,
        CASE 
          WHEN c.class_num = 1 THEN 'कक्षा 1'
          WHEN c.class_num = 2 THEN 'कक्षा 2'
          WHEN c.class_num = 3 THEN 'कक्षा 3'
          WHEN c.class_num = 4 THEN 'कक्षा 4'
          WHEN c.class_num = 5 THEN 'कक्षा 5'
          WHEN c.class_num = 6 THEN 'कक्षा 6'
          WHEN c.class_num = 7 THEN 'कक्षा 7'
          WHEN c.class_num = 8 THEN 'कक्षा 8'
          WHEN c.class_num = 9 THEN 'कक्षा 9'
          WHEN c.class_num = 10 THEN 'कक्षा 10'
          WHEN c.class_num = 11 THEN 'कक्षा 11'
          WHEN c.class_num = 12 THEN 'कक्षा 12'
          ELSE CONCAT('कक्षा ', c.class_num)
        END AS class_name_hi,
        COALESCE(st.student_count, 0) AS total_students,
        COALESCE(tp.test_count, 0) AS available_tests_count
      FROM sd_classes c
      LEFT JOIN (
        SELECT class_id, COUNT(id) AS student_count
        FROM sd_students
        WHERE school_udise = $1 AND is_active = true
        GROUP BY class_id
      ) st ON st.class_id = c.id
      LEFT JOIN (
        SELECT class_no, COUNT(id) AS test_count
        FROM sd_assessment_papers
        WHERE is_active = true
        GROUP BY class_no
      ) tp ON tp.class_no = c.class_num
      WHERE c.is_active = true
      ORDER BY c.class_num ASC`,
      [schoolUdise]
    );

    const formattedClasses = classesRes.rows.map((row) => ({
      class_id: Number(row.class_id),
      class_no: Number(row.class_no),
      class_name: row.class_name,
      class_name_hi: row.class_name_hi,
      total_students: Number(row.total_students),
      is_assigned: assignedClassIds.has(Number(row.class_id)) || assignedClassIds.has(Number(row.class_no)),
      has_mock_tests: Number(row.available_tests_count) > 0,
      available_tests_count: Number(row.available_tests_count),
    }));

    return res.json({
      success: true,
      message: "Class list retrieved successfully for teacher's school",
      school: {
        udise_code: Number(school.udise_code),
        school_name: school.school_name,
        cluster_name: school.cluster_name,
        block_name: school.block_name,
        district_name: school.district_name,
        school_type: school.school_type,
      },
      teacher: {
        id: teacher?.id ? Number(teacher.id) : null,
        username: teacher?.username || null,
        name: teacher?.full_name || null,
        role: teacher?.role || 'TEACHER',
        assigned_classes_count: assignedClassIds.size,
      },
      total_classes: formattedClasses.length,
      classes: formattedClasses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. GET /api/mobile/assessments/students
 * OR GET /api/mobile/assessments/classes/:classId/students
 * OR GET /api/mobile/assessments/class/:classNo/students
 * Students list of selected class.
 * Query params: class / class_id / class_no, school_udise, search, gender
 */
exports.getClassStudents = async (req, res, next) => {
  try {
    const rawClass = req.params.classId || req.params.classNo || req.query.class || req.query.class_id || req.query.class_no;
    const { search, gender } = req.query;

    let targetClassNum = rawClass ? parseInt(String(rawClass).replace(/\D/g, ''), 10) : 1;
    if (isNaN(targetClassNum) || targetClassNum <= 0) targetClassNum = 1;

    // Resolve class row
    const classRes = await pool.query(
      `SELECT id, class_num, class_name FROM sd_classes WHERE class_num = $1 OR id = $1 LIMIT 1`,
      [targetClassNum]
    );

    const classRow = classRes.rows[0] || {
      id: targetClassNum,
      class_num: targetClassNum,
      class_name: `Class ${targetClassNum}`,
    };

    // Resolve school UDISE
    let schoolUdise = req.user?.primary_udise || req.query.school_udise || req.query.udise;
    if (!schoolUdise && (req.query.teacher_id || req.user?.id)) {
      const tId = req.query.teacher_id || req.user.id;
      const tRes = await pool.query('SELECT primary_udise FROM sd_users WHERE id = $1', [tId]);
      if (tRes.rows.length) schoolUdise = tRes.rows[0].primary_udise;
    }
    if (!schoolUdise) {
      schoolUdise = 22050904705;
    }

    // Fetch school info
    const sRes = await pool.query(
      `SELECT udise_code, school_name FROM sd_schools WHERE udise_code = $1`,
      [schoolUdise]
    );
    const school = sRes.rows[0] || { udise_code: schoolUdise, school_name: `School ${schoolUdise}` };

    // Query students
    let query = `
      SELECT 
        s.id,
        s.roll_number,
        s.student_name,
        s.gender,
        TO_CHAR(s.dob, 'YYYY-MM-DD') AS dob,
        s.guardian_name,
        s.is_active,
        s.class_id,
        c.class_num AS class_no,
        c.class_name,
        COALESCE(sub.sub_count, 0) AS mock_tests_taken,
        sub.last_percentage AS last_score_percentage,
        sub.last_date AS last_test_date
      FROM sd_students s
      JOIN sd_classes c ON s.class_id = c.id
      LEFT JOIN (
        SELECT 
          student_id,
          COUNT(id) AS sub_count,
          MAX(percentage) AS last_percentage,
          MAX(submitted_at) AS last_date
        FROM sd_student_assessment_submissions
        GROUP BY student_id
      ) sub ON sub.student_id = s.id::text
      WHERE s.school_udise = $1 
        AND (s.class_id = $2 OR c.class_num = $3)
        AND s.is_active = true
    `;
    const params = [schoolUdise, classRow.id, classRow.class_num];

    if (gender && ['M', 'F', 'O'].includes(gender.toUpperCase())) {
      params.push(gender.toUpperCase());
      query += ` AND s.gender = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      const rollNumSearch = parseInt(search.trim(), 10);
      if (!isNaN(rollNumSearch)) {
        params.push(rollNumSearch);
        query += ` AND (s.student_name ILIKE $${params.length - 1} OR s.roll_number = $${params.length})`;
      } else {
        query += ` AND s.student_name ILIKE $${params.length}`;
      }
    }

    query += ` ORDER BY s.roll_number ASC, s.student_name ASC`;

    const studentsRes = await pool.query(query, params);

    // If this specific school had 0 students in this class, provide fallback from statewide students
    let students = studentsRes.rows;
    if (students.length === 0 && !search) {
      const fallbackRes = await pool.query(
        `SELECT 
          s.id,
          s.roll_number,
          s.student_name,
          s.gender,
          TO_CHAR(s.dob, 'YYYY-MM-DD') AS dob,
          s.guardian_name,
          s.is_active,
          s.class_id,
          c.class_num AS class_no,
          c.class_name,
          0 AS mock_tests_taken,
          NULL AS last_score_percentage,
          NULL AS last_test_date
        FROM sd_students s
        JOIN sd_classes c ON s.class_id = c.id
        WHERE (s.class_id = $1 OR c.class_num = $2) AND s.is_active = true
        ORDER BY s.roll_number ASC
        LIMIT 20`,
        [classRow.id, classRow.class_num]
      );
      if (fallbackRes.rows.length > 0) {
        students = fallbackRes.rows;
      }
    }

    const formattedStudents = students.map((s) => ({
      id: Number(s.id),
      roll_number: Number(s.roll_number),
      student_name: s.student_name,
      gender: s.gender,
      dob: s.dob,
      guardian_name: s.guardian_name,
      is_active: s.is_active,
      class_no: Number(s.class_no || classRow.class_num),
      class_name: s.class_name || classRow.class_name,
      mock_tests_taken: Number(s.mock_tests_taken || 0),
      last_score_percentage: s.last_score_percentage ? Number(s.last_score_percentage) : null,
      last_test_date: s.last_test_date || null,
    }));

    return res.json({
      success: true,
      message: `Retrieved ${formattedStudents.length} students for Class ${classRow.class_num}`,
      class: {
        class_id: Number(classRow.id),
        class_no: Number(classRow.class_num),
        class_name: classRow.class_name,
        class_name_hi: `कक्षा ${classRow.class_num}`,
      },
      school: {
        udise_code: Number(school.udise_code),
        school_name: school.school_name,
      },
      total_students: formattedStudents.length,
      students: formattedStudents,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. GET /api/mobile/assessments/subjects
 * OR GET /api/mobile/assessments/classes/:classId/subjects
 * OR GET /api/mobile/assessments/class/:classNo/subjects
 * Subject list of selected class with mock test availability.
 */
exports.getClassSubjects = async (req, res, next) => {
  try {
    const rawClass = req.params.classId || req.params.classNo || req.query.class || req.query.class_id || req.query.class_no;
    let targetClassNum = rawClass ? parseInt(String(rawClass).replace(/\D/g, ''), 10) : 1;
    if (isNaN(targetClassNum) || targetClassNum <= 0) targetClassNum = 1;

    // Define standard subject curricula per class level in Chhattisgarh
    let baseSubjects = [];
    if (targetClassNum <= 2) {
      // Class 1 - 2
      baseSubjects = [
        { id: 1, code: 'HINDI', name: 'Hindi', name_hi: 'हिन्दी', icon: 'menu_book', color: '#f97316' },
        { id: 2, code: 'ENG', name: 'English', name_hi: 'अंग्रेजी', icon: 'translate', color: '#0284c7' },
        { id: 3, code: 'MATH', name: 'Mathematics', name_hi: 'गणित', icon: 'calculate', color: '#10b981' },
      ];
    } else if (targetClassNum <= 5) {
      // Class 3 - 5
      baseSubjects = [
        { id: 1, code: 'HINDI', name: 'Hindi', name_hi: 'हिन्दी', icon: 'menu_book', color: '#f97316' },
        { id: 2, code: 'ENG', name: 'English', name_hi: 'अंग्रेजी', icon: 'translate', color: '#0284c7' },
        { id: 3, code: 'MATH', name: 'Mathematics', name_hi: 'गणित', icon: 'calculate', color: '#10b981' },
        { id: 4, code: 'SCI', name: 'Science', name_hi: 'पर्यावरण अध्ययन (EVS)', icon: 'eco', color: '#8b5cf6' },
      ];
    } else {
      // Class 6 - 12
      baseSubjects = [
        { id: 1, code: 'HINDI', name: 'Hindi', name_hi: 'हिन्दी', icon: 'menu_book', color: '#f97316' },
        { id: 2, code: 'ENG', name: 'English', name_hi: 'अंग्रेजी', icon: 'translate', color: '#0284c7' },
        { id: 3, code: 'MATH', name: 'Mathematics', name_hi: 'गणित', icon: 'calculate', color: '#10b981' },
        { id: 4, code: 'SCI', name: 'Science', name_hi: 'विज्ञान', icon: 'science', color: '#06b6d4' },
        { id: 5, code: 'SST', name: 'Social Science', name_hi: 'सामाजिक विज्ञान', icon: 'public', color: '#eab308' },
        { id: 6, code: 'SANSKRIT', name: 'Sanskrit', name_hi: 'संस्कृत', icon: 'auto_stories', color: '#ec4899' },
      ];
    }

    // Query active assessment papers for this class
    const papersRes = await pool.query(
      `SELECT id, paper_code, title, title_hi, subject, total_questions, total_marks, duration_minutes 
       FROM sd_assessment_papers 
       WHERE class_no = $1 AND is_active = true 
       ORDER BY id ASC`,
      [targetClassNum]
    );

    const papers = papersRes.rows;

    // Map each subject with mock test paper details
    const formattedSubjects = baseSubjects.map((sub) => {
      // Find matching paper by subject name
      const matchedPaper = papers.find((p) => {
        const pSub = p.subject.toLowerCase();
        const sName = sub.name.toLowerCase();
        return pSub.includes(sName) || sName.includes(pSub) || (sub.code === 'SCI' && pSub.includes('science'));
      });

      if (matchedPaper) {
        return {
          id: sub.id,
          code: sub.code,
          name: sub.name,
          name_hi: sub.name_hi,
          icon: sub.icon,
          color: sub.color,
          has_mock_test: true,
          paper_code: matchedPaper.paper_code,
          paper_id: matchedPaper.id,
          paper_title: matchedPaper.title,
          paper_title_hi: matchedPaper.title_hi,
          total_questions: Number(matchedPaper.total_questions || 10),
          total_marks: Number(matchedPaper.total_marks || 20),
          duration_minutes: Number(matchedPaper.duration_minutes || 30),
          fetch_questions_url: `/api/mobile/assessments/paper?class=${targetClassNum}&subject=${encodeURIComponent(sub.name)}`,
          direct_paper_url: `/api/mobile/assessments/paper/${matchedPaper.paper_code}`,
        };
      } else {
        return {
          id: sub.id,
          code: sub.code,
          name: sub.name,
          name_hi: sub.name_hi,
          icon: sub.icon,
          color: sub.color,
          has_mock_test: false,
          paper_code: null,
          paper_id: null,
          paper_title: null,
          paper_title_hi: null,
          total_questions: null,
          total_marks: null,
          duration_minutes: null,
          fetch_questions_url: `/api/mobile/assessments/paper?class=${targetClassNum}&subject=${encodeURIComponent(sub.name)}`,
          direct_paper_url: null,
        };
      }
    });

    return res.json({
      success: true,
      message: `Subjects retrieved successfully for Class ${targetClassNum}`,
      class: {
        class_no: targetClassNum,
        class_name: `Class ${targetClassNum}`,
        class_name_hi: `कक्षा ${targetClassNum}`,
      },
      total_subjects: formattedSubjects.length,
      available_tests_count: formattedSubjects.filter((s) => s.has_mock_test).length,
      subjects: formattedSubjects,
    });
  } catch (err) {
    next(err);
  }
};

