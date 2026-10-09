const pool = require('../config/db');
const path = require('path');
const fs = require('fs');

/**
 * 1. Get All Assessment Papers
 */
exports.getAllPapers = async (req, res, next) => {
  try {
    const { class_no, subject } = req.query;
    let query = `
      SELECT p.*, 
        COUNT(q.id) as actual_question_count
      FROM sd_assessment_papers p
      LEFT JOIN sd_mobile_questions q ON p.id = q.paper_id
      WHERE 1=1
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
    query += ` GROUP BY p.id ORDER BY p.class_no ASC, p.id DESC`;

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Get Single Assessment Paper with all Questions, Options and Answers
 */
exports.getPaperByCode = async (req, res, next) => {
  try {
    const { paperCode } = req.params;
    const paperRes = await pool.query(
      `SELECT * FROM sd_assessment_papers WHERE paper_code = $1 OR id::text = $1`,
      [paperCode]
    );

    if (paperRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment paper not found' });
    }

    const paper = paperRes.rows[0];

    const questionsRes = await pool.query(
      `SELECT 
        q.id,
        q.paper_id,
        q.question_number,
        q.question_text_en,
        q.question_text_hi,
        q.question_image_url,
        q.lo_code,
        q.lo_description,
        q.question_type,
        q.marks,
        q.explanation_en,
        q.explanation_hi,
        COALESCE(
          json_agg(
            json_build_object(
              'id', o.id,
              'option_key', o.option_key,
              'option_text_en', o.option_text_en,
              'option_text_hi', o.option_text_hi,
              'option_image_url', o.option_image_url,
              'is_correct', o.is_correct
            ) ORDER BY o.option_key ASC
          ) FILTER (WHERE o.id IS NOT NULL), '[]'::json
        ) as options
      FROM sd_mobile_questions q
      LEFT JOIN sd_mobile_question_options o ON q.id = o.question_id
      WHERE q.paper_id = $1
      GROUP BY q.id
      ORDER BY q.question_number ASC`,
      [paper.id]
    );

    return res.json({
      success: true,
      data: {
        ...paper,
        questions: questionsRes.rows,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Create or Update an Assessment Paper
 */
exports.savePaper = async (req, res, next) => {
  try {
    const {
      paper_code,
      title,
      title_hi,
      class_no,
      subject,
      total_questions,
      total_marks,
      duration_minutes,
      academic_year,
      instructions_en,
      instructions_hi,
    } = req.body;

    if (!paper_code || !title || !class_no || !subject) {
      return res.status(400).json({ success: false, message: 'Missing required paper fields' });
    }

    const query = `
      INSERT INTO sd_assessment_papers (
        paper_code, title, title_hi, class_no, subject, total_questions, total_marks,
        duration_minutes, academic_year, instructions_en, instructions_hi
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (paper_code) DO UPDATE SET
        title = EXCLUDED.title,
        title_hi = EXCLUDED.title_hi,
        class_no = EXCLUDED.class_no,
        subject = EXCLUDED.subject,
        total_questions = EXCLUDED.total_questions,
        total_marks = EXCLUDED.total_marks,
        duration_minutes = EXCLUDED.duration_minutes,
        academic_year = EXCLUDED.academic_year,
        instructions_en = EXCLUDED.instructions_en,
        instructions_hi = EXCLUDED.instructions_hi,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const values = [
      paper_code,
      title,
      title_hi || null,
      parseInt(class_no, 10),
      subject,
      parseInt(total_questions || 15, 10),
      parseInt(total_marks || 15, 10),
      parseInt(duration_minutes || 45, 10),
      academic_year || '2026-27',
      instructions_en || null,
      instructions_hi || null,
    ];

    const result = await pool.query(query, values);
    return res.json({ success: true, message: 'Assessment paper saved successfully', data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Create or Update a Question with its 4 Options
 */
exports.saveQuestion = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const {
      paper_id,
      question_number,
      question_text_en,
      question_text_hi,
      question_image_url,
      lo_code,
      lo_description,
      question_type = 'MCQ',
      marks = 1.0,
      explanation_en,
      explanation_hi,
      options = [],
    } = req.body;

    if (!paper_id || !question_number || !question_text_en) {
      return res.status(400).json({ success: false, message: 'Missing paper_id, question_number, or question_text_en' });
    }

    await client.query('BEGIN');

    // 1. Insert or update question
    const qQuery = `
      INSERT INTO sd_mobile_questions (
        paper_id, question_number, question_text_en, question_text_hi,
        question_image_url, lo_code, lo_description, question_type, marks,
        explanation_en, explanation_hi, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
      ON CONFLICT (paper_id, question_number) DO UPDATE SET
        question_text_en = EXCLUDED.question_text_en,
        question_text_hi = EXCLUDED.question_text_hi,
        question_image_url = EXCLUDED.question_image_url,
        lo_code = EXCLUDED.lo_code,
        lo_description = EXCLUDED.lo_description,
        question_type = EXCLUDED.question_type,
        marks = EXCLUDED.marks,
        explanation_en = EXCLUDED.explanation_en,
        explanation_hi = EXCLUDED.explanation_hi,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    const qVals = [
      paper_id,
      parseInt(question_number, 10),
      question_text_en,
      question_text_hi || null,
      question_image_url || null,
      lo_code || null,
      lo_description || null,
      question_type,
      parseFloat(marks || 1.0),
      explanation_en || null,
      explanation_hi || null,
    ];

    const qRes = await client.query(qQuery, qVals);
    const savedQuestion = qRes.rows[0];

    // 2. Clear old options and re-insert new options
    await client.query('DELETE FROM sd_mobile_question_options WHERE question_id = $1', [savedQuestion.id]);

    if (Array.isArray(options) && options.length > 0) {
      for (const opt of options) {
        if (!opt.option_key) continue;
        await client.query(
          `INSERT INTO sd_mobile_question_options (
            question_id, option_key, option_text_en, option_text_hi, option_image_url, is_correct
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            savedQuestion.id,
            opt.option_key.toUpperCase(),
            opt.option_text_en || '',
            opt.option_text_hi || null,
            opt.option_image_url || null,
            Boolean(opt.is_correct),
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Fetch back the complete question with options
    const fullRes = await pool.query(
      `SELECT q.*,
        json_agg(
          json_build_object(
            'id', o.id,
            'option_key', o.option_key,
            'option_text_en', o.option_text_en,
            'option_text_hi', o.option_text_hi,
            'option_image_url', o.option_image_url,
            'is_correct', o.is_correct
          ) ORDER BY o.option_key ASC
        ) as options
      FROM sd_mobile_questions q
      LEFT JOIN sd_mobile_question_options o ON q.id = o.question_id
      WHERE q.id = $1
      GROUP BY q.id`,
      [savedQuestion.id]
    );

    return res.json({
      success: true,
      message: `Question #${question_number} saved successfully`,
      data: fullRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * 5. Delete a Question
 */
exports.deleteQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM sd_mobile_questions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    return res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Upload Image Endpoint (Multer file upload)
 */
exports.uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    // Return relative URL that the frontend and mobile apps can request
    const relativeUrl = `/uploads/questions/${req.file.filename}`;
    return res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: relativeUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * 7. One-Click Seed SLA Paper 1021
 */
exports.seedSlaPaper1021 = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Paper 1021
    const paperRes = await client.query(`
      INSERT INTO sd_assessment_papers (
        paper_code, title, title_hi, class_no, subject, total_questions, total_marks,
        duration_minutes, academic_year, instructions_en, instructions_hi
      ) VALUES (
        '1021',
        'State Level Assessment (SLA) 2018-19 - Class 1 English',
        'राज्य स्तरीय आंकलन (SLA) 2018-19 - कक्षा 1 अंग्रेजी',
        1,
        'English',
        15,
        15,
        45,
        '2018-19',
        'All questions are compulsory. Choose the one best option for each question.',
        'सभी प्रश्न अनिवार्य हैं। प्रत्येक प्रश्न के लिए केवल एक सही विकल्प चुनिए।'
      )
      ON CONFLICT (paper_code) DO UPDATE SET
        title = EXCLUDED.title,
        title_hi = EXCLUDED.title_hi
      RETURNING id;
    `);

    const paperId = paperRes.rows[0].id;

    // SLA 1021 Complete Question Dataset with bilingual prompts, images, LO codes, and options
    const questionsData = [
      {
        qNum: 1,
        textEn: "Identify the starting alphabet letter for the word 'SUN':",
        textHi: "शब्द 'SUN' के लिए पहला प्रारंभिक अक्षर पहचानिए:",
        imageUrl: null,
        loCode: "ENG101",
        loDesc: "Identifies letters of the alphabet and associates them with sounds.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'S', textHi: 'S (एस)', correct: true },
          { key: 'B', textEn: 'M', textHi: 'M (एम)', correct: false },
          { key: 'C', textEn: 'P', textHi: 'P (पी)', correct: false },
          { key: 'D', textEn: 'T', textHi: 'T (टी)', correct: false },
        ]
      },
      {
        qNum: 2,
        textEn: "Look at the picture and choose the correct English word:",
        textHi: "चित्र को देखिए और सही अंग्रेजी शब्द का चयन कीजिए:",
        imageUrl: "/uploads/questions/1021/page_2_img_1_jpeg.png",
        loCode: "ENG102",
        loDesc: "Recognizes everyday objects and names them in English.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Glass', textHi: 'ग्लास (Glass)', correct: true },
          { key: 'B', textEn: 'Cup', textHi: 'कप (Cup)', correct: false },
          { key: 'C', textEn: 'Plate', textHi: 'प्लेट (Plate)', correct: false },
          { key: 'D', textEn: 'Spoon', textHi: 'चम्मच (Spoon)', correct: false },
        ]
      },
      {
        qNum: 3,
        textEn: "Choose the correct spelling for the picture shown:",
        textHi: "दिखाए गए चित्र के लिए सही वर्तनी (Spelling) चुनिए:",
        imageUrl: "/uploads/questions/1021/page_3_img_2_jpeg.png",
        loCode: "ENG103",
        loDesc: "Associates words with basic picture representations.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'SUN', textHi: 'SUN (सूरज)', correct: true },
          { key: 'B', textEn: 'SON', textHi: 'SON', correct: false },
          { key: 'C', textEn: 'RUN', textHi: 'RUN', correct: false },
          { key: 'D', textEn: 'GUN', textHi: 'GUN', correct: false },
        ]
      },
      {
        qNum: 4,
        textEn: "Which domestic animal makes the sound 'Moo Moo'?",
        textHi: "कौन सा पालतू पशु 'मू-मू' की ध्वनि निकालता है?",
        imageUrl: null,
        loCode: "ENG104",
        loDesc: "Identifies familiar animal sounds and names.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Dog', textHi: 'Dog (कुत्ता)', correct: false },
          { key: 'B', textEn: 'Cat', textHi: 'Cat (बिल्ली)', correct: false },
          { key: 'C', textEn: 'Cow', textHi: 'Cow (गाय)', correct: true },
          { key: 'D', textEn: 'Duck', textHi: 'Duck (बतख)', correct: false },
        ]
      },
      {
        qNum: 5,
        textEn: "Which of the following is a Rhyming Word for 'CAT'?",
        textHi: "शब्द 'CAT' के लिए समान तुक वाला शब्द (Rhyming Word) कौन सा है?",
        imageUrl: null,
        loCode: "ENG105",
        loDesc: "Recognizes simple rhyming words and word families.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'BAT', textHi: 'BAT', correct: true },
          { key: 'B', textEn: 'DOG', textHi: 'DOG', correct: false },
          { key: 'C', textEn: 'HEN', textHi: 'HEN', correct: false },
          { key: 'D', textEn: 'PIG', textHi: 'PIG', correct: false },
        ]
      },
      {
        qNum: 6,
        textEn: "Which group consists entirely of clothing items (Clothes)?",
        textHi: "निम्न में से कौन सा समूह केवल वस्त्रों (कपड़ों) का है?",
        imageUrl: "/uploads/questions/1021/page_3_img_5_jpeg.png",
        loCode: "ENG106",
        loDesc: "Categorizes objects into everyday thematic groups.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Shirt, Pant, Frock', textHi: 'शर्ट, पैंट, फ्रॉक', correct: true },
          { key: 'B', textEn: 'Apple, Banana, Mango', textHi: 'सेब, केला, आम', correct: false },
          { key: 'C', textEn: 'Pen, Pencil, Eraser', textHi: 'पेन, पेंसिल, रबर', correct: false },
          { key: 'D', textEn: 'Table, Chair, Bed', textHi: 'मेज, कुर्सी, बिस्तर', correct: false },
        ]
      },
      {
        qNum: 7,
        textEn: "Find the odd one out from the given list:",
        textHi: "दी गई सूची में से विजातीय (अलग) वस्तु को चुनिए:",
        imageUrl: null,
        loCode: "ENG106",
        loDesc: "Distinguishes items from contrasting categories.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Apple', textHi: 'Apple (फल)', correct: false },
          { key: 'B', textEn: 'Mango', textHi: 'Mango (फल)', correct: false },
          { key: 'C', textEn: 'Banana', textHi: 'Banana (फल)', correct: false },
          { key: 'D', textEn: 'Pencil', textHi: 'Pencil (लेखन सामग्री - अलग)', correct: true },
        ]
      },
      {
        qNum: 8,
        textEn: "Identify the picture that represents the word 'BAT':",
        textHi: "उस चित्र को पहचानिए जो 'BAT' शब्द को दर्शाता है:",
        imageUrl: "/uploads/questions/1021/page_4_img_1_jpeg.png",
        loCode: "ENG102",
        loDesc: "Matches English words with corresponding pictures.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Bat (Cricket Bat)', textHi: 'बल्ला (Bat)', correct: true },
          { key: 'B', textEn: 'Ball', textHi: 'गेंद (Ball)', correct: false },
          { key: 'C', textEn: 'Fan', textHi: 'पंखा (Fan)', correct: false },
          { key: 'D', textEn: 'Spoon', textHi: 'चम्मच (Spoon)', correct: false },
        ]
      },
      {
        qNum: 9,
        textEn: "Count the total number of letters in the word 'ELEPHANT':",
        textHi: "'ELEPHANT' शब्द में कुल कितने अक्षर (Letters) हैं?",
        imageUrl: null,
        loCode: "ENG101",
        loDesc: "Counts and reads letters within written English words.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: '6 Letters', textHi: '6 अक्षर', correct: false },
          { key: 'B', textEn: '7 Letters', textHi: '7 अक्षर', correct: false },
          { key: 'C', textEn: '8 Letters', textHi: '8 अक्षर (E-L-E-P-H-A-N-T)', correct: true },
          { key: 'D', textEn: '9 Letters', textHi: '9 अक्षर', correct: false },
        ]
      },
      {
        qNum: 10,
        textEn: "Where is the bird in the picture flying?",
        textHi: "चित्र में पक्षी कहाँ उड़ रहा है?",
        imageUrl: "/uploads/questions/1021/page_5_img_1_jpeg.png",
        loCode: "ENG107",
        loDesc: "Understands simple prepositional and positional phrases.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'In the cage', textHi: 'पिंजरे में', correct: false },
          { key: 'B', textEn: 'In the sky', textHi: 'आसमान में (In the sky)', correct: true },
          { key: 'C', textEn: 'Under water', textHi: 'पानी के नीचे', correct: false },
          { key: 'D', textEn: 'Inside a box', textHi: 'डिब्बे के अंदर', correct: false },
        ]
      },
      {
        qNum: 11,
        textEn: "Complete the sentence based on the picture: 'The cat is _____ the table.'",
        textHi: "चित्र देखकर वाक्य पूरा करें: 'The cat is _____ the table.'",
        imageUrl: "/uploads/questions/1021/page_5_img_2_jpeg.png",
        loCode: "ENG107",
        loDesc: "Demonstrates understanding of prepositions (on, in, under).",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'on', textHi: 'on (पर / ऊपर)', correct: true },
          { key: 'B', textEn: 'under', textHi: 'under (नीचे)', correct: false },
          { key: 'C', textEn: 'in', textHi: 'in (अंदर)', correct: false },
          { key: 'D', textEn: 'behind', textHi: 'behind (पीछे)', correct: false },
        ]
      },
      {
        qNum: 12,
        textEn: "Look at the picture. Where is the ball situated?",
        textHi: "चित्र को ध्यान से देखें। गेंद कहाँ रखी है?",
        imageUrl: "/uploads/questions/1021/page_6_img_2_jpeg.png",
        loCode: "ENG107",
        loDesc: "Identifies object positions in visual contexts.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'In the box', textHi: 'डिब्बे के अंदर (In the box)', correct: true },
          { key: 'B', textEn: 'Under the car', textHi: 'गाड़ी के नीचे', correct: false },
          { key: 'C', textEn: 'On the roof', textHi: 'छत पर', correct: false },
          { key: 'D', textEn: 'Behind the door', textHi: 'दरवाजे के पीछे', correct: false },
        ]
      },
      {
        qNum: 13,
        textEn: "Complete the statement: 'This is Ahil. He is a ______.'",
        textHi: "वाक्य पूर्ण करें: 'This is Ahil. He is a ______.'",
        imageUrl: "/uploads/questions/1021/page_5_img_3_jpeg.png",
        loCode: "ENG108",
        loDesc: "Reads and understands simple sentences describing gender and person.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Boy', textHi: 'Boy (लड़का)', correct: true },
          { key: 'B', textEn: 'Girl', textHi: 'Girl (लड़की)', correct: false },
          { key: 'C', textEn: 'Bird', textHi: 'Bird (पक्षी)', correct: false },
          { key: 'D', textEn: 'Tree', textHi: 'Tree (पेड़)', correct: false },
        ]
      },
      {
        qNum: 14,
        textEn: "Identify the fruit shown in the image:",
        textHi: "चित्र में दिखाए गए फल को पहचानिए:",
        imageUrl: "/uploads/questions/1021/page_6_img_3_jpeg.png",
        loCode: "ENG102",
        loDesc: "Identifies common fruits and vocabulary.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'Mango', textHi: 'Mango (आम)', correct: true },
          { key: 'B', textEn: 'Apple', textHi: 'Apple (सेब)', correct: false },
          { key: 'C', textEn: 'Grapes', textHi: 'Grapes (अंगूर)', correct: false },
          { key: 'D', textEn: 'Orange', textHi: 'Orange (संतरा)', correct: false },
        ]
      },
      {
        qNum: 15,
        textEn: "Which capital alphabet letter is displayed in the picture?",
        textHi: "चित्र में अंग्रेजी का कौन सा बड़ा अक्षर (Capital Letter) दिखाया गया है?",
        imageUrl: "/uploads/questions/1021/page_6_img_4_jpeg.png",
        loCode: "ENG101",
        loDesc: "Recognizes upper-case English alphabet letters.",
        marks: 1.0,
        options: [
          { key: 'A', textEn: 'M', textHi: 'M', correct: true },
          { key: 'B', textEn: 'W', textHi: 'W', correct: false },
          { key: 'C', textEn: 'N', textHi: 'N', correct: false },
          { key: 'D', textEn: 'V', textHi: 'V', correct: false },
        ]
      },
    ];

    for (const q of questionsData) {
      const qRes = await client.query(
        `INSERT INTO sd_mobile_questions (
          paper_id, question_number, question_text_en, question_text_hi,
          question_image_url, lo_code, lo_description, question_type, marks, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'MCQ', $8, CURRENT_TIMESTAMP)
        ON CONFLICT (paper_id, question_number) DO UPDATE SET
          question_text_en = EXCLUDED.question_text_en,
          question_text_hi = EXCLUDED.question_text_hi,
          question_image_url = EXCLUDED.question_image_url,
          lo_code = EXCLUDED.lo_code,
          lo_description = EXCLUDED.lo_description,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id;`,
        [paperId, q.qNum, q.textEn, q.textHi, q.imageUrl, q.loCode, q.loDesc, q.marks]
      );

      const qId = qRes.rows[0].id;
      await client.query('DELETE FROM sd_mobile_question_options WHERE question_id = $1', [qId]);

      for (const opt of q.options) {
        await client.query(
          `INSERT INTO sd_mobile_question_options (
            question_id, option_key, option_text_en, option_text_hi, is_correct
          ) VALUES ($1, $2, $3, $4, $5)`,
          [qId, opt.key, opt.textEn, opt.textHi, opt.correct]
        );
      }
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'SLA Assessment Paper 1021 seeded successfully with 15 questions, bilingual texts, and images!',
      paperId,
      paperCode: '1021',
      totalQuestions: 15,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

/**
 * 8. Mobile App Assessment Submission Endpoint
 */
exports.submitAssessment = async (req, res, next) => {
  try {
    const { student_id, student_name, paper_id, school_id, class_no, answers } = req.body;

    if (!paper_id || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Missing paper_id or answers array' });
    }

    // Fetch correct answers for this paper
    const qRes = await pool.query(
      `SELECT q.id, q.question_number, q.marks, o.option_key as correct_option
       FROM sd_mobile_questions q
       JOIN sd_mobile_question_options o ON q.id = o.question_id AND o.is_correct = true
       WHERE q.paper_id = $1`,
      [paper_id]
    );

    let totalScore = 0;
    let maxMarks = 0;
    const answerMap = {};
    for (const a of answers) {
      answerMap[a.question_number || a.question_id] = a.selected_option;
    }

    const evaluationDetails = [];
    for (const q of qRes.rows) {
      const qMarks = parseFloat(q.marks || 1.0);
      maxMarks += qMarks;
      const selected = answerMap[q.question_number] || answerMap[q.id];
      const isCorrect = selected && selected.toUpperCase() === q.correct_option.toUpperCase();
      if (isCorrect) {
        totalScore += qMarks;
      }
      evaluationDetails.push({
        question_number: q.question_number,
        selected_option: selected || null,
        correct_option: q.correct_option,
        is_correct: Boolean(isCorrect),
        marks_obtained: isCorrect ? qMarks : 0,
      });
    }

    const percentage = maxMarks > 0 ? ((totalScore / maxMarks) * 100).toFixed(2) : 0;

    const subRes = await pool.query(
      `INSERT INTO sd_student_assessment_submissions (
        student_id, student_name, paper_id, school_id, class_no, total_score, max_marks, percentage, answers_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        student_id || 'DEMO_STUDENT_001',
        student_name || 'Demo Student',
        paper_id,
        school_id || 1,
        class_no || 1,
        totalScore,
        maxMarks,
        percentage,
        JSON.stringify(evaluationDetails),
      ]
    );

    return res.json({
      success: true,
      message: 'Assessment submitted and scored successfully!',
      submission: subRes.rows[0],
      score: totalScore,
      max_marks: maxMarks,
      percentage: parseFloat(percentage),
      details: evaluationDetails,
    });
  } catch (err) {
    next(err);
  }
};
