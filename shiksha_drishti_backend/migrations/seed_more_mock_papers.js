require('dotenv').config();
const pool = require('../src/config/db');

async function seedMorePapers() {
  const client = await pool.connect();
  try {
    console.log('🚀 Seeding comprehensive mock test papers for classes 3 to 10...');
    await client.query('BEGIN');

    const additionalPapers = [
      // ── Class 3 Hindi ──
      {
        paper_code: '3011',
        title: 'Class 3 Hindi Mock Test - Vyakaran & Comprehension',
        title_hi: 'कक्षा 3 हिन्दी मॉक टेस्ट - व्याकरण और बोध',
        class_no: 3, subject: 'Hindi', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: 'संज्ञा के कितने मुख्य भेद होते हैं?', q_en: 'How many main types of Noun (Sangya) are there?', hint: 'व्यक्तिवाचक, जातिवाचक, भाववाचक', ans: 'b',
            options: [{ key: 'A', hi: '2', en: '2', correct: false }, { key: 'B', hi: '3', en: '3', correct: true }, { key: 'C', hi: '4', en: '4', correct: false }, { key: 'D', hi: '5', en: '5', correct: false }] },
          { no: 2, q_hi: '"मित्र" का पर्यायवाची शब्द क्या है?', q_en: 'What is a synonym for "Friend"?', hint: 'दोस्त', ans: 'a',
            options: [{ key: 'A', hi: 'दोस्त', en: 'Dost', correct: true }, { key: 'B', hi: 'शत्रु', en: 'Enemy', correct: false }, { key: 'C', hi: 'पड़ोसी', en: 'Neighbor', correct: false }, { key: 'D', hi: 'अजनबी', en: 'Stranger', correct: false }] },
          { no: 3, q_hi: '"सत्य" का विलोम शब्द क्या है?', q_en: 'What is the antonym of "Satya" (Truth)?', hint: 'झूठ', ans: 'c',
            options: [{ key: 'A', hi: 'न्याय', en: 'Justice', correct: false }, { key: 'B', hi: 'धर्म', en: 'Duty', correct: false }, { key: 'C', hi: 'असत्य', en: 'Untruth', correct: true }, { key: 'D', hi: 'ज्ञान', en: 'Knowledge', correct: false }] },
          { no: 4, q_hi: 'जिस शब्द से किसी काम के करने या होने का बोध हो, उसे क्या कहते हैं?', q_en: 'Action word is called:', hint: 'Verb in Hindi.', ans: 'b',
            options: [{ key: 'A', hi: 'सर्वनाम', en: 'Pronoun', correct: false }, { key: 'B', hi: 'क्रिया', en: 'Verb', correct: true }, { key: 'C', hi: 'विशेषण', en: 'Adjective', correct: false }, { key: 'D', hi: 'संज्ञा', en: 'Noun', correct: false }] },
          { no: 5, q_hi: '"चिड़िया" का बहुवचन क्या है?', q_en: 'Plural of Chidiya:', hint: 'चिड़ियाँ', ans: 'a',
            options: [{ key: 'A', hi: 'चिड़ियाँ', en: 'Chidiyan', correct: true }, { key: 'B', hi: 'चिड़िये', en: 'Chidiye', correct: false }, { key: 'C', hi: 'चिड़ियों', en: 'Chidiyon', correct: false }, { key: 'D', hi: 'चिड़ियाएं', en: 'Chidiyaen', correct: false }] }
        ]
      },

      // ── Class 3 Mathematics ──
      {
        paper_code: '3021',
        title: 'Class 3 Mathematics Mock Test - Multiplication & Division',
        title_hi: 'कक्षा 3 गणित मॉक टेस्ट - गुणा और भाग',
        class_no: 3, subject: 'Mathematics', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: '8 × 7 = ?', q_en: '8 multiplied by 7 equals:', hint: 'Table of 8.', ans: 'b',
            options: [{ key: 'A', hi: '54', en: '54', correct: false }, { key: 'B', hi: '56', en: '56', correct: true }, { key: 'C', hi: '64', en: '64', correct: false }, { key: 'D', hi: '48', en: '48', correct: false }] },
          { no: 2, q_hi: '36 ÷ 6 = ?', q_en: '36 divided by 6 equals:', hint: 'Divide by 6.', ans: 'a',
            options: [{ key: 'A', hi: '6', en: '6', correct: true }, { key: 'B', hi: '5', en: '5', correct: false }, { key: 'C', hi: '7', en: '7', correct: false }, { key: 'D', hi: '8', en: '8', correct: false }] },
          { no: 3, q_hi: '100 में कितने 10 होते हैं?', q_en: 'How many tens make 100?', hint: '10 times 10.', ans: 'c',
            options: [{ key: 'A', hi: '5', en: '5', correct: false }, { key: 'B', hi: '8', en: '8', correct: false }, { key: 'C', hi: '10', en: '10', correct: true }, { key: 'D', hi: '20', en: '20', correct: false }] },
          { no: 4, q_hi: 'एक वृत्त (Circle) के कितने कोने होते हैं?', q_en: 'How many corners does a circle have?', hint: 'Round shape.', ans: 'd',
            options: [{ key: 'A', hi: '1', en: '1', correct: false }, { key: 'B', hi: '2', en: '2', correct: false }, { key: 'C', hi: '4', en: '4', correct: false }, { key: 'D', hi: '0 (शून्य)', en: '0 (Zero)', correct: true }] },
          { no: 5, q_hi: '250 + 150 = ?', q_en: '250 + 150 equals:', hint: 'Simple sum.', ans: 'b',
            options: [{ key: 'A', hi: '350', en: '350', correct: false }, { key: 'B', hi: '400', en: '400', correct: true }, { key: 'C', hi: '450', en: '450', correct: false }, { key: 'D', hi: '500', en: '500', correct: false }] }
        ]
      },

      // ── Class 4 Mathematics ──
      {
        paper_code: '4021',
        title: 'Class 4 Mathematics Mock Test - Fractions & Measurements',
        title_hi: 'कक्षा 4 गणित मॉक टेस्ट - भिन्न और मापन',
        class_no: 4, subject: 'Mathematics', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: '1 किलोग्राम (kg) में कितने ग्राम (g) होते हैं?', q_en: 'How many grams in 1 kilogram?', hint: 'Kilo means 1000.', ans: 'b',
            options: [{ key: 'A', hi: '100', en: '100', correct: false }, { key: 'B', hi: '1000', en: '1000', correct: true }, { key: 'C', hi: '500', en: '500', correct: false }, { key: 'D', hi: '10', en: '10', correct: false }] },
          { no: 2, q_hi: '1/2 (आधा) का दशमलव रूप क्या है?', q_en: 'What is the decimal form of 1/2?', hint: 'Half.', ans: 'a',
            options: [{ key: 'A', hi: '0.5', en: '0.5', correct: true }, { key: 'B', hi: '0.2', en: '0.2', correct: false }, { key: 'C', hi: '0.25', en: '0.25', correct: false }, { key: 'D', hi: '1.2', en: '1.2', correct: false }] },
          { no: 3, q_hi: '1 लीटर में कितने मिलीलीटर (mL) होते हैं?', q_en: 'How many milliliters in 1 liter?', hint: 'Metric liquid volume.', ans: 'c',
            options: [{ key: 'A', hi: '100 mL', en: '100 mL', correct: false }, { key: 'B', hi: '500 mL', en: '500 mL', correct: false }, { key: 'C', hi: '1000 mL', en: '1000 mL', correct: true }, { key: 'D', hi: '10000 mL', en: '10000 mL', correct: false }] },
          { no: 4, q_hi: '12 × 12 = ?', q_en: '12 multiplied by 12 equals:', hint: 'Square of 12.', ans: 'b',
            options: [{ key: 'A', hi: '124', en: '124', correct: false }, { key: 'B', hi: '144', en: '144', correct: true }, { key: 'C', hi: '132', en: '132', correct: false }, { key: 'D', hi: '154', en: '154', correct: false }] },
          { no: 5, q_hi: 'एक वर्ग (Square) की परिमाप (Perimeter) का सूत्र क्या है?', q_en: 'Perimeter of a square:', hint: '4 times side.', ans: 'a',
            options: [{ key: 'A', hi: '4 × भुजा', en: '4 × side', correct: true }, { key: 'B', hi: 'भुजा × भुजा', en: 'side × side', correct: false }, { key: 'C', hi: '2 × भुजा', en: '2 × side', correct: false }, { key: 'D', hi: '3 × भुजा', en: '3 × side', correct: false }] }
        ]
      },

      // ── Class 5 Mathematics ──
      {
        paper_code: '5021',
        title: 'Class 5 Mathematics Mock Test - Area & Geometry',
        title_hi: 'कक्षा 5 गणित मॉक टेस्ट - क्षेत्रफल और ज्यामिति',
        class_no: 5, subject: 'Mathematics', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: 'आयत (Rectangle) का क्षेत्रफल ज्ञात करने का सूत्र क्या है?', q_en: 'Formula for area of a rectangle:', hint: 'Length × Breadth.', ans: 'a',
            options: [{ key: 'A', hi: 'लंबाई × चौड़ाई', en: 'Length × Breadth', correct: true }, { key: 'B', hi: '2 × (लंबाई + चौड़ाई)', en: '2 × (Length + Breadth)', correct: false }, { key: 'C', hi: 'लंबाई + चौड़ाई', en: 'Length + Breadth', correct: false }, { key: 'D', hi: 'भुजा × भुजा', en: 'Side × Side', correct: false }] },
          { no: 2, q_hi: 'समकोण (Right angle) का मान कितने अंश होता है?', q_en: 'Measure of a right angle in degrees:', hint: 'L-shape angle.', ans: 'b',
            options: [{ key: 'A', hi: '45°', en: '45°', correct: false }, { key: 'B', hi: '90°', en: '90°', correct: true }, { key: 'C', hi: '180°', en: '180°', correct: false }, { key: 'D', hi: '60°', en: '60°', correct: false }] },
          { no: 3, q_hi: '1000 में 100 का भाग देने पर क्या प्राप्त होगा?', q_en: '1000 divided by 100 equals:', hint: 'Cancel zeros.', ans: 'c',
            options: [{ key: 'A', hi: '1', en: '1', correct: false }, { key: 'B', hi: '5', en: '5', correct: false }, { key: 'C', hi: '10', en: '10', correct: true }, { key: 'D', hi: '100', en: '100', correct: false }] },
          { no: 4, q_hi: 'किसी त्रिभुज के तीनों आंतरिक कोणों का योग कितना होता है?', q_en: 'Sum of all three angles of a triangle:', hint: 'Sum of angles.', ans: 'd',
            options: [{ key: 'A', hi: '90°', en: '90°', correct: false }, { key: 'B', hi: '120°', en: '120°', correct: false }, { key: 'C', hi: '360°', en: '360°', correct: false }, { key: 'D', hi: '180°', en: '180°', correct: true }] },
          { no: 5, q_hi: '75 का 20% कितना होगा?', q_en: 'What is 20% of 75?', hint: '75 × 20 / 100.', ans: 'b',
            options: [{ key: 'A', hi: '10', en: '10', correct: false }, { key: 'B', hi: '15', en: '15', correct: true }, { key: 'C', hi: '20', en: '20', correct: false }, { key: 'D', hi: '25', en: '25', correct: false }] }
        ]
      },

      // ── Class 6 Mathematics ──
      {
        paper_code: '6021',
        title: 'Class 6 Mathematics Mock Test - Integers & Algebra',
        title_hi: 'कक्षा 6 गणित मॉक टेस्ट - पूर्णांक और बीजगणित',
        class_no: 6, subject: 'Mathematics', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: '(-5) + (-3) = ?', q_en: '(-5) + (-3) equals:', hint: 'Negative plus negative.', ans: 'c',
            options: [{ key: 'A', hi: '-2', en: '-2', correct: false }, { key: 'B', hi: '8', en: '8', correct: false }, { key: 'C', hi: '-8', en: '-8', correct: true }, { key: 'D', hi: '15', en: '15', correct: false }] },
          { no: 2, q_hi: 'सबसे छोटी अभाज्य संख्या (Prime number) कौन सी है?', q_en: 'Which is the smallest prime number?', hint: 'Smallest even prime.', ans: 'b',
            options: [{ key: 'A', hi: '1', en: '1', correct: false }, { key: 'B', hi: '2', en: '2', correct: true }, { key: 'C', hi: '3', en: '3', correct: false }, { key: 'D', hi: '0', en: '0', correct: false }] },
          { no: 3, q_hi: 'यदि 2x = 10, तो x का मान क्या होगा?', q_en: 'If 2x = 10, what is the value of x?', hint: 'Divide by 2.', ans: 'a',
            options: [{ key: 'A', hi: '5', en: '5', correct: true }, { key: 'B', hi: '10', en: '10', correct: false }, { key: 'C', hi: '2', en: '2', correct: false }, { key: 'D', hi: '20', en: '20', correct: false }] },
          { no: 4, q_hi: 'वृत्त का व्यास (Diameter) उसकी त्रिज्या (Radius) का कितना गुना होता है?', q_en: 'Diameter is how many times the radius?', hint: 'D = 2r.', ans: 'b',
            options: [{ key: 'A', hi: '1 गुना', en: '1 time', correct: false }, { key: 'B', hi: '2 गुना', en: '2 times', correct: true }, { key: 'C', hi: '3 गुना', en: '3 times', correct: false }, { key: 'D', hi: 'आधा', en: 'Half', correct: false }] },
          { no: 5, q_hi: '3/4 का प्रतिशत मान क्या होगा?', q_en: 'Percentage value of 3/4:', hint: '(3/4) × 100.', ans: 'd',
            options: [{ key: 'A', hi: '50%', en: '50%', correct: false }, { key: 'B', hi: '25%', en: '25%', correct: false }, { key: 'C', hi: '60%', en: '60%', correct: false }, { key: 'D', hi: '75%', en: '75%', correct: true }] }
        ]
      },

      // ── Class 10 Science ──
      {
        paper_code: '10031',
        title: 'Class 10 Science Mock Test - Chemical Reactions & Electricity',
        title_hi: 'कक्षा 10 विज्ञान मॉक टेस्ट - रासायनिक अभिक्रियाएं एवं विद्युत',
        class_no: 10, subject: 'Science', total_questions: 10, total_marks: 20, duration_minutes: 30,
        questions: [
          { no: 1, q_hi: 'विद्युत धारा (Electric Current) का SI मात्रक क्या है?', q_en: 'SI unit of Electric Current:', hint: 'Symbol A.', ans: 'a',
            options: [{ key: 'A', hi: 'एम्पीयर (Ampere)', en: 'Ampere', correct: true }, { key: 'B', hi: 'वोल्ट (Volt)', en: 'Volt', correct: false }, { key: 'C', hi: 'ओम (Ohm)', en: 'Ohm', correct: false }, { key: 'D', hi: 'वाट (Watt)', en: 'Watt', correct: false }] },
          { no: 2, q_hi: 'ओहम का नियम (Ohm\'s Law) क्या है?', q_en: 'Which equation represents Ohm\'s Law?', hint: 'V = I × R.', ans: 'b',
            options: [{ key: 'A', hi: 'V = I / R', en: 'V = I / R', correct: false }, { key: 'B', hi: 'V = I × R', en: 'V = I × R', correct: true }, { key: 'C', hi: 'I = V × R', en: 'I = V × R', correct: false }, { key: 'D', hi: 'R = V × I', en: 'R = V × I', correct: false }] },
          { no: 3, q_hi: 'मानव नेत्र के किस भाग पर वस्तु का प्रतिबिम्ब बनता है?', q_en: 'On which part of human eye is image formed?', hint: 'Screen at the back of eye.', ans: 'c',
            options: [{ key: 'A', hi: 'कॉर्निया (Cornea)', en: 'Cornea', correct: false }, { key: 'B', hi: 'पुतली (Pupil)', en: 'Pupil', correct: false }, { key: 'C', hi: 'रेटिना (Retina)', en: 'Retina', correct: true }, { key: 'D', hi: 'आइरिस (Iris)', en: 'Iris', correct: false }] },
          { no: 4, q_hi: 'शुद्ध जल का pH मान कितना होता है?', q_en: 'What is the pH value of pure water?', hint: 'Neutral pH.', ans: 'b',
            options: [{ key: 'A', hi: '0', en: '0', correct: false }, { key: 'B', hi: '7', en: '7', correct: true }, { key: 'C', hi: '14', en: '14', correct: false }, { key: 'D', hi: '1', en: '1', correct: false }] },
          { no: 5, q_hi: 'पादपों में जाइलम (Xylem) किसके परिवहन के लिए उत्तरदायी है?', q_en: 'Xylem tissue in plants is responsible for transport of:', hint: 'Water and minerals.', ans: 'a',
            options: [{ key: 'A', hi: 'जल (Water)', en: 'Water', correct: true }, { key: 'B', hi: 'भोजन (Food)', en: 'Food', correct: false }, { key: 'C', hi: 'अमीनो अम्ल', en: 'Amino acids', correct: false }, { key: 'D', hi: 'ऑक्सीजन', en: 'Oxygen', correct: false }] }
        ]
      }
    ];

    for (const p of additionalPapers) {
      const pRes = await client.query(`
        INSERT INTO sd_assessment_papers (
          paper_code, title, title_hi, class_no, subject, total_questions, total_marks, duration_minutes, academic_year, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '2026-27', true)
        ON CONFLICT (paper_code) DO UPDATE SET
          title = EXCLUDED.title,
          title_hi = EXCLUDED.title_hi,
          class_no = EXCLUDED.class_no,
          subject = EXCLUDED.subject,
          total_questions = EXCLUDED.total_questions,
          total_marks = EXCLUDED.total_marks,
          is_active = true
        RETURNING id
      `, [p.paper_code, p.title, p.title_hi, p.class_no, p.subject, p.total_questions, p.total_marks, p.duration_minutes]);

      const paperId = pRes.rows[0].id;

      for (const q of p.questions) {
        const qRes = await client.query(`
          INSERT INTO sd_mobile_questions (
            paper_id, question_number, question_text_en, question_text_hi, question_type, marks, hint, answer_text
          ) VALUES ($1, $2, $3, $4, 'text_mcq', 2, $5, $6)
          ON CONFLICT (paper_id, question_number) DO UPDATE SET
            question_text_en = EXCLUDED.question_text_en,
            question_text_hi = EXCLUDED.question_text_hi,
            hint = EXCLUDED.hint,
            answer_text = EXCLUDED.answer_text
          RETURNING id
        `, [paperId, q.no, q.q_en, q.q_hi, q.hint, q.ans]);

        const questionId = qRes.rows[0].id;

        for (const opt of q.options) {
          await client.query(`
            INSERT INTO sd_mobile_question_options (
              question_id, option_key, option_text_en, option_text_hi, is_correct
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (question_id, option_key) DO UPDATE SET
              option_text_en = EXCLUDED.option_text_en,
              option_text_hi = EXCLUDED.option_text_hi,
              is_correct = EXCLUDED.is_correct
          `, [questionId, opt.key, opt.en, opt.hi, opt.correct]);
        }
      }
      console.log(`✅ Seeded Paper ${p.paper_code}: Class ${p.class_no} ${p.subject} with ${p.questions.length} questions`);
    }

    await client.query('COMMIT');
    console.log('🎉 Additional mock test papers successfully created!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding additional papers:', err);
    throw err;
  } finally {
    client.release();
  }
}

seedMorePapers().then(() => process.exit(0)).catch(() => process.exit(1));
