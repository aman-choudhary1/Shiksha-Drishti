#!/usr/bin/env node
/**
 * seed_from_attendance.js
 * 
 * Imports master data from the existing vsk_attadance PostgreSQL database
 * into shiksha_drishti, then seeds all required reference data.
 *
 * Run AFTER run_migrations.js:
 *   node migrations/seed_from_attendance.js
 */
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Target: shiksha_drishti
const targetPool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Source: vsk_attadance (attendance system)
const sourcePool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.ATTENDANCE_DB_NAME || 'vsk_attadance',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  console.log('\n🎓 SHIKSHA DRISHTI — Seeding database...\n');

  // -----------------------------------------------------------------------
  // 1. Import schools from mst_schools (attendance DB)
  // -----------------------------------------------------------------------
  console.log('  ➤ Importing schools from mst_schools...');
  let schoolsImported = 0;
  try {
    const schools = await sourcePool.query(
      `SELECT udise_code, school_name, cluster_cd, cluster_name,
              block_cd, block_name, district_cd, district_name,
              latitude, longitude, hos_name, hos_mobile
       FROM mst_schools`
    );
    for (const s of schools.rows) {
      await targetPool.query(
        `INSERT INTO sd_schools
           (udise_code, school_name, cluster_cd, cluster_name,
            block_cd, block_name, district_cd, district_name,
            latitude, longitude, hos_name, hos_mobile)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (udise_code) DO UPDATE SET
           school_name = EXCLUDED.school_name,
           cluster_cd = EXCLUDED.cluster_cd, cluster_name = EXCLUDED.cluster_name,
           block_cd = EXCLUDED.block_cd, block_name = EXCLUDED.block_name,
           district_cd = EXCLUDED.district_cd, district_name = EXCLUDED.district_name,
           latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude,
           hos_name = EXCLUDED.hos_name, hos_mobile = EXCLUDED.hos_mobile,
           updated_at = now()`,
        [s.udise_code, s.school_name, s.cluster_cd, s.cluster_name,
         s.block_cd, s.block_name, s.district_cd, s.district_name,
         s.latitude, s.longitude, s.hos_name, s.hos_mobile]
      );
      schoolsImported++;
    }
    console.log(`    ✅ ${schoolsImported} schools imported`);
  } catch (err) {
    console.warn(`    ⚠️  Could not import from attendance DB: ${err.message}`);
    console.log('    → Seeding sample school instead...');
    await targetPool.query(
      `INSERT INTO sd_schools
         (udise_code, school_name, cluster_cd, cluster_name,
          block_cd, block_name, district_cd, district_name, latitude, longitude)
       VALUES
         (22050904705, 'Government Higher Secondary School Raipur', '2205090020',
          'Cluster Tikrapara', '220509', 'Raipur Block', '2205', 'Raipur',
          21.2514, 81.6296),
         (22050904706, 'Government Primary School Pandri', '2205090021',
          'Cluster Pandri', '220509', 'Raipur Block', '2205', 'Raipur',
          21.2456, 81.6387),
         (22050904707, 'Government Middle School Amanaka', '2205090022',
          'Cluster Amanaka', '220510', 'Abhanpur Block', '2205', 'Raipur',
          21.2398, 81.6512)
       ON CONFLICT (udise_code) DO NOTHING`,
    );
    console.log('    ✅ Sample schools seeded');
  }

  // -----------------------------------------------------------------------
  // 2. Academic Years
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding academic years...');
  await targetPool.query(
    `INSERT INTO sd_academic_years (year_label, start_date, end_date, is_active) VALUES
       ('2024-25', '2024-04-01', '2025-03-31', false),
       ('2025-26', '2025-04-01', '2026-03-31', false),
       ('2026-27', '2026-04-01', '2027-03-31', true)
     ON CONFLICT (year_label) DO NOTHING`
  );
  console.log('    ✅ Academic years seeded (2026-27 is active)');

  // -----------------------------------------------------------------------
  // 3. Classes (1–12)
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding classes...');
  const classInserts = Array.from({length: 12}, (_, i) => i + 1)
    .map(n => `(${n}, 'Class ${n}', true)`).join(',');
  await targetPool.query(
    `INSERT INTO sd_classes (class_num, class_name, is_active)
     VALUES ${classInserts}
     ON CONFLICT (class_num) DO NOTHING`
  );
  console.log('    ✅ Classes 1–12 seeded');

  // -----------------------------------------------------------------------
  // 4. Subjects
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding subjects...');
  await targetPool.query(
    `INSERT INTO sd_subjects (name, code, default_max_marks, sort_order) VALUES
       ('Hindi',          'HINDI', 100, 1),
       ('English',        'ENG',   100, 2),
       ('Mathematics',    'MATH',  100, 3),
       ('Science',        'SCI',   100, 4),
       ('Social Science', 'SST',   100, 5)
     ON CONFLICT (code) DO NOTHING`
  );
  console.log('    ✅ Subjects seeded');

  // -----------------------------------------------------------------------
  // 5. Learning Outcomes (for Class 6, all 5 subjects, 10 LOs each)
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding Learning Outcomes for Class 6...');
  const yearRes = await targetPool.query(`SELECT id FROM sd_academic_years WHERE is_active = true LIMIT 1`);
  const classRes = await targetPool.query(`SELECT id FROM sd_classes WHERE class_num = 6`);
  const class6Id = classRes.rows[0]?.id;

  const subjectRes = await targetPool.query(`SELECT id, code FROM sd_subjects ORDER BY sort_order`);
  const subjects = subjectRes.rows;

  const loDescriptions = {
    HINDI: [
      'अपठित गद्यांश को पढ़कर प्रश्नों के उत्तर देना',
      'वर्णमाला और मात्राओं का सही प्रयोग',
      'संज्ञा, सर्वनाम और विशेषण की पहचान',
      'क्रिया और काल का सही उपयोग',
      'पर्यायवाची और विलोम शब्द',
      'मुहावरे और लोकोक्तियों का अर्थ',
      'अनुच्छेद लेखन',
      'पत्र लेखन',
      'कविता की व्याख्या',
      'व्याकरण के नियमों का अनुप्रयोग',
    ],
    ENG: [
      'Reading and comprehension of unseen passage',
      'Correct use of articles and prepositions',
      'Tenses: Present, Past and Future',
      'Subject-verb agreement',
      'Vocabulary: synonyms and antonyms',
      'Letter writing',
      'Paragraph writing on given topic',
      'Noun, Pronoun and Adjective identification',
      'Active and Passive voice basics',
      'Story comprehension and question answering',
    ],
    MATH: [
      'Basic number operations: addition and subtraction',
      'Multiplication and division of whole numbers',
      'Fractions: understanding and basic operations',
      'Decimals: place value and comparison',
      'Basic geometry: lines, angles and shapes',
      'Perimeter and area of rectangles and squares',
      'Data handling: reading and interpreting bar graphs',
      'Ratio and proportion basics',
      'Introduction to algebra: simple equations',
      'Mensuration: volume of simple solids',
    ],
    SCI: [
      'Living and non-living things classification',
      'Plant parts and their functions',
      'Animal adaptation to environment',
      'Food and nutrition: nutrients and balanced diet',
      'States of matter: solid, liquid and gas',
      'Basic physical and chemical changes',
      'Motion and measurement of distances',
      'Light, shadow and reflection basics',
      'Electricity: simple circuits',
      'Environment and its conservation',
    ],
    SST: [
      'Understanding maps: directions and symbols',
      'India: physical features and climate',
      'Chhattisgarh: geography and rivers',
      'Ancient civilizations of India',
      'Maurya and Gupta empires',
      'Medieval history: Delhi Sultanate',
      'Democratic institutions and governance',
      'Fundamental rights and duties',
      'Indian economy: agriculture and industries',
      'Global environmental issues',
    ],
  };

  for (const subj of subjects) {
    const descs = loDescriptions[subj.code] || [];
    for (let i = 0; i < 10; i++) {
      const loCode = `LO-${subj.code}-06-${String(i+1).padStart(2,'0')}`;
      await targetPool.query(
        `INSERT INTO sd_learning_outcomes (lo_code, description, class_id, subject_id)
         VALUES ($1, $2, $3, $4) ON CONFLICT (lo_code) DO NOTHING`,
        [loCode, descs[i] || `Learning Outcome ${i+1} for ${subj.code} Class 6`, class6Id, subj.id]
      );
    }
  }
  console.log('    ✅ 50 Learning Outcomes seeded (5 subjects × 10 LOs for Class 6)');

  // -----------------------------------------------------------------------
  // 6. Question Bank (10 questions per subject for Class 6, 2026-27)
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding Question Bank...');
  const activeYearId = yearRes.rows[0]?.id;

  for (const subj of subjects) {
    for (let q = 1; q <= 10; q++) {
      const loCode = `LO-${subj.code}-06-${String(q).padStart(2,'0')}`;
      const loRow = await targetPool.query(`SELECT id FROM sd_learning_outcomes WHERE lo_code = $1`, [loCode]);
      const loId = loRow.rows[0]?.id || null;
      await targetPool.query(
        `INSERT INTO sd_questions
           (academic_year_id, class_id, subject_id, question_number, max_marks, lo_id, sort_order)
         VALUES ($1, $2, $3, $4, 10, $5, $6)
         ON CONFLICT (academic_year_id, class_id, subject_id, question_number) DO NOTHING`,
        [activeYearId, class6Id, subj.id, `Q${String(q).padStart(2,'0')}`, loId, q]
      );
    }
  }
  console.log('    ✅ 50 questions seeded (5 subjects × 10 questions for Class 6)');

  // -----------------------------------------------------------------------
  // 7. Demo Teacher Users + Assignments
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding demo teacher accounts...');
  const passwordHash = await bcrypt.hash('teacher@123', 10);
  const adminHash    = await bcrypt.hash('admin@shiksha2026', 10);

  // Get a sample UDISE to attach teacher to
  const sampleSchool = await targetPool.query(`SELECT udise_code FROM sd_schools LIMIT 1`);
  const udise = sampleSchool.rows[0]?.udise_code;

  // State Admin
  await targetPool.query(
    `INSERT INTO sd_users (username, password_hash, full_name, email, role, scope_type, primary_udise)
     VALUES ('admin', $1, 'State Administrator', 'admin@shiksha.cg.gov.in', 'STATE_ADMIN', 'state', NULL)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()`,
    [adminHash]
  );

  // Demo Teacher 1
  const t1 = await targetPool.query(
    `INSERT INTO sd_users (username, password_hash, full_name, mobile, role, scope_type, primary_udise)
     VALUES ('teacher.raipur', $1, 'Ramesh Kumar Sahu', '9876543210', 'TEACHER', 'school', $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
     RETURNING id`,
    [passwordHash, udise]
  );

  // Demo Teacher 2
  const t2 = await targetPool.query(
    `INSERT INTO sd_users (username, password_hash, full_name, mobile, role, scope_type, primary_udise)
     VALUES ('teacher.ananya', $1, 'Ananya Devi Sharma', '9876543211', 'TEACHER', 'school', $2)
     ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = now()
     RETURNING id`,
    [passwordHash, udise]
  );

  // Assign teachers to Class 6 + 7
  const activeYear = await targetPool.query(`SELECT id FROM sd_academic_years WHERE is_active = true`);
  const ayId = activeYear.rows[0]?.id;
  const class6 = await targetPool.query(`SELECT id FROM sd_classes WHERE class_num = 6`);
  const class7 = await targetPool.query(`SELECT id FROM sd_classes WHERE class_num = 7`);

  if (t1.rows[0] && udise && ayId) {
    await targetPool.query(
      `INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id)
       VALUES ($1, $2, $3, $4), ($1, $2, $5, $4)
       ON CONFLICT DO NOTHING`,
      [t1.rows[0].id, udise, class6.rows[0]?.id, ayId, class7.rows[0]?.id]
    );
  }
  if (t2.rows[0] && udise && ayId) {
    await targetPool.query(
      `INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [t2.rows[0].id, udise, class6.rows[0]?.id, ayId]
    );
  }
  console.log('    ✅ Demo users seeded');
  console.log('       admin / admin@shiksha2026 (STATE_ADMIN)');
  console.log('       teacher.raipur / teacher@123 (TEACHER — Class 6, 7)');
  console.log('       teacher.ananya / teacher@123 (TEACHER — Class 6)');

  // -----------------------------------------------------------------------
  // 8. Sample Students for Class 6
  // -----------------------------------------------------------------------
  console.log('  ➤ Seeding 10 sample students for Class 6...');
  const sampleStudents = [
    { roll: 1, name: 'Aarav Kumar Sahu',    gender: 'M' },
    { roll: 2, name: 'Ananya Devi Verma',   gender: 'F' },
    { roll: 3, name: 'Rohit Kumar Yadav',   gender: 'M' },
    { roll: 4, name: 'Priya Kumari Patel',  gender: 'F' },
    { roll: 5, name: 'Vikram Singh Thakur', gender: 'M' },
    { roll: 6, name: 'Sneha Bai Netam',     gender: 'F' },
    { roll: 7, name: 'Arjun Kashyap',       gender: 'M' },
    { roll: 8, name: 'Kavita Nishad',       gender: 'F' },
    { roll: 9, name: 'Rahul Kumar Dewangan',gender: 'M' },
    { roll: 10, name: 'Pooja Chandrakar',   gender: 'F' },
  ];

  if (udise && class6Id && ayId) {
    for (const st of sampleStudents) {
      await targetPool.query(
        `INSERT INTO sd_students (school_udise, class_id, academic_year_id, roll_number, student_name, gender)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (school_udise, class_id, academic_year_id, roll_number) DO NOTHING`,
        [udise, class6Id, ayId, st.roll, st.name, st.gender]
      );
    }
  }
  console.log('    ✅ 10 sample students seeded for Class 6');

  console.log('\n✅ Seed complete!\n');
  await targetPool.end();
  await sourcePool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
