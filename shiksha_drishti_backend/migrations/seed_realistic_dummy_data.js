/**
 * seed_realistic_dummy_data.js
 * Comprehensive Seeding Script for Shiksha Drishti
 * Seeds schools, academic years, classes, subjects, Chapter LOs, Question Bank,
 * Cluster Coordinator (CAC), Principals (SCHOOL_ADMIN), Teachers (TEACHER),
 * Multi-School Cluster Data (Raipur Cluster 1), Students, Assessments,
 * Subject Marks, and Question-Wise Marks (sd_question_marks) for Chapter Revision Analytics.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function seed() {
  console.log('🌱 Starting Shiksha Drishti Realistic Dummy Data Seeding with Question & Chapter Analytics...');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 0. Fix Role & Scope Constraints ────────────────────────────────────
    console.log('0. Applying Schema Adjustments & Constraints...');
    await client.query(`
      DO $$
      BEGIN
        ALTER TABLE sd_users DROP CONSTRAINT IF EXISTS sd_users_role_check;
        ALTER TABLE sd_users ADD CONSTRAINT sd_users_role_check CHECK (role IN (
          'TEACHER',
          'SCHOOL_ADMIN',
          'CAC',
          'CLUSTER_COORDINATOR',
          'BLOCK_OFFICER',
          'DISTRICT_OFFICER',
          'STATE_ADMIN',
          'DATA_ANALYST',
          'SUPER_ADMIN'
        ));

        ALTER TABLE sd_users DROP CONSTRAINT IF EXISTS sd_users_scope_type_check;
        ALTER TABLE sd_users ADD CONSTRAINT sd_users_scope_type_check CHECK (
          scope_type IN ('school', 'cluster', 'block', 'district', 'state')
        );
      EXCEPTION
        WHEN OTHERS THEN NULL;
      END $$;
    `);

    // ── 1. Academic Years ──────────────────────────────────────────────────
    console.log('1. Seeding Academic Years...');
    await client.query(`
      INSERT INTO sd_academic_years (year_label, start_date, end_date, is_active)
      VALUES 
        ('2025-26', '2025-06-15', '2026-04-30', false),
        ('2026-27', '2026-06-15', '2027-04-30', true),
        ('2027-28', '2027-06-15', '2028-04-30', false)
      ON CONFLICT (year_label) DO UPDATE SET is_active = EXCLUDED.is_active;
    `);
    const yearRes = await client.query(`SELECT id FROM sd_academic_years WHERE year_label = '2026-27'`);
    const activeYearId = yearRes.rows[0].id;

    // ── 2. Classes (1 to 12) ───────────────────────────────────────────────
    console.log('2. Seeding Classes...');
    for (let i = 1; i <= 12; i++) {
      await client.query(`
        INSERT INTO sd_classes (class_name, class_num, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (class_num) DO NOTHING;
      `, [`Class ${i}`, i]);
    }
    const classRows = (await client.query('SELECT id, class_num FROM sd_classes ORDER BY class_num')).rows;
    const classMap = Object.fromEntries(classRows.map(r => [r.class_num, r.id]));

    // ── 3. Subjects ────────────────────────────────────────────────────────
    console.log('3. Seeding Subjects...');
    const subjects = [
      { name: 'Hindi', code: 'HINDI', sort: 1 },
      { name: 'English', code: 'ENG', sort: 2 },
      { name: 'Mathematics', code: 'MATH', sort: 3 },
      { name: 'Science', code: 'SCI', sort: 4 },
      { name: 'Social Science', code: 'SST', sort: 5 },
      { name: 'Sanskrit', code: 'SANSKRIT', sort: 6 },
    ];
    for (const s of subjects) {
      await client.query(`
        INSERT INTO sd_subjects (name, code, default_max_marks, sort_order, is_active)
        VALUES ($1, $2, 100, $3, true)
        ON CONFLICT (code) DO NOTHING;
      `, [s.name, s.code, s.sort]);
    }
    const subjectRows = (await client.query('SELECT id, code FROM sd_subjects')).rows;
    const subjectMap = Object.fromEntries(subjectRows.map(r => [r.code, r.id]));

    // ── 4. Schools (Raipur Cluster 1 + Durg + Bilaspur + Bastar) ───────────
    console.log('4. Seeding Schools across Clusters...');
    const schools = [
      // RAIPUR CLUSTER 1 (Cluster CD: 220509001) - 5 Diverse Schools
      {
        udise: 22050904705,
        name: 'GOVT MODEL HIGHER SECONDARY SCHOOL RAIPUR',
        cluster_cd: '220509001',
        cluster_name: 'RAIPUR CLUSTER 1',
        block_cd: '220509',
        block_name: 'RAIPUR URBAN',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Dr. Rajesh Verma',
        hos_mobile: '9826112233',
        school_type: 'Government Higher Secondary',
        lat: 21.2514,
        lng: 81.6296,
      },
      {
        udise: 22050904706,
        name: 'GOVT MIDDLE SCHOOL TELIBANDHA RAIPUR',
        cluster_cd: '220509001',
        cluster_name: 'RAIPUR CLUSTER 1',
        block_cd: '220509',
        block_name: 'RAIPUR URBAN',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Shri Devendra Sahu',
        hos_mobile: '9826112244',
        school_type: 'Government Middle School',
        lat: 21.2384,
        lng: 81.6625,
      },
      {
        udise: 22050904707,
        name: 'GOVT PRIMARY SCHOOL PANDRI RAIPUR',
        cluster_cd: '220509001',
        cluster_name: 'RAIPUR CLUSTER 1',
        block_cd: '220509',
        block_name: 'RAIPUR URBAN',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Smt. Geeta Dewangan',
        hos_mobile: '9826112255',
        school_type: 'Government Primary School',
        lat: 21.2612,
        lng: 81.6510,
      },
      {
        udise: 22050904708,
        name: 'GOVT NAVEEN BOYS HIGH SCHOOL RAIPUR',
        cluster_cd: '220509001',
        cluster_name: 'RAIPUR CLUSTER 1',
        block_cd: '220509',
        block_name: 'RAIPUR URBAN',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Shri Rameshwar Patel',
        hos_mobile: '9826112266',
        school_type: 'Government High School',
        lat: 21.2450,
        lng: 81.6380,
      },
      {
        udise: 22050904709,
        name: 'GOVT GIRLS HIGHER SECONDARY SCHOOL BYRON BAZAR',
        cluster_cd: '220509001',
        cluster_name: 'RAIPUR CLUSTER 1',
        block_cd: '220509',
        block_name: 'RAIPUR URBAN',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Smt. Sarita Agrawal',
        hos_mobile: '9826112277',
        school_type: 'Government Higher Secondary',
        lat: 21.2320,
        lng: 81.6420,
      },

      // RAIPUR BLOCK 2: ABHANPUR (Cluster CD: 220510001)
      {
        udise: 22051001201,
        name: 'GOVT HIGHER SECONDARY SCHOOL ABHANPUR',
        cluster_cd: '220510001',
        cluster_name: 'ABHANPUR CLUSTER 1',
        block_cd: '220510',
        block_name: 'ABHANPUR',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Shri B. R. Sahu',
        hos_mobile: '9826113301',
        school_type: 'Government Higher Secondary',
        lat: 21.0543,
        lng: 81.7582,
      },
      {
        udise: 22051001202,
        name: 'GOVT MIDDLE SCHOOL MANA CAMP ABHANPUR',
        cluster_cd: '220510001',
        cluster_name: 'ABHANPUR CLUSTER 1',
        block_cd: '220510',
        block_name: 'ABHANPUR',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Smt. Pratibha Mishra',
        hos_mobile: '9826113302',
        school_type: 'Government Middle School',
        lat: 21.1821,
        lng: 81.7123,
      },

      // RAIPUR BLOCK 3: ARANG (Cluster CD: 220511001)
      {
        udise: 22051102301,
        name: 'GOVT MODEL HIGHER SECONDARY SCHOOL ARANG',
        cluster_cd: '220511001',
        cluster_name: 'ARANG CLUSTER 1',
        block_cd: '220511',
        block_name: 'ARANG',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Dr. Hemlata Sharma',
        hos_mobile: '9826114401',
        school_type: 'Government Higher Secondary',
        lat: 21.1945,
        lng: 81.9687,
      },
      {
        udise: 22051102302,
        name: 'GOVT BOYS MIDDLE SCHOOL CHANDKHURI ARANG',
        cluster_cd: '220511001',
        cluster_name: 'ARANG CLUSTER 1',
        block_cd: '220511',
        block_name: 'ARANG',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Shri K. K. Chandrakar',
        hos_mobile: '9826114402',
        school_type: 'Government Middle School',
        lat: 21.2518,
        lng: 81.8621,
      },

      // RAIPUR BLOCK 4: TILDA (Cluster CD: 220512001)
      {
        udise: 22051203401,
        name: 'GOVT HIGHER SECONDARY SCHOOL TILDA NEORA',
        cluster_cd: '220512001',
        cluster_name: 'TILDA CLUSTER 1',
        block_cd: '220512',
        block_name: 'TILDA',
        district_cd: '2205',
        district_name: 'RAIPUR',
        hos: 'Shri Anand Murthy',
        hos_mobile: '9826115501',
        school_type: 'Government Higher Secondary',
        lat: 21.5621,
        lng: 81.7941,
      },

      // Other District Schools
      {
        udise: 22070301201,
        name: 'GOVT BOYS HIGHER SECONDARY SCHOOL DURG',
        cluster_cd: '220703002',
        cluster_name: 'DURG CENTRAL',
        block_cd: '220703',
        block_name: 'DURG',
        district_cd: '2207',
        district_name: 'DURG',
        hos: 'Smt. Meenakshi Sahu',
        hos_mobile: '9826223344',
        school_type: 'Government Higher Secondary',
        lat: 21.1904,
        lng: 81.2849,
      },
      {
        udise: 22080405102,
        name: 'GOVT GIRLS HIGHER SECONDARY SCHOOL BILASPUR',
        cluster_cd: '220804003',
        cluster_name: 'BILASPUR NORTH',
        block_cd: '220804',
        block_name: 'BILASPUR',
        district_cd: '2208',
        district_name: 'BILASPUR',
        hos: 'Dr. Alok Tiwari',
        hos_mobile: '9826334455',
        school_type: 'Government Higher Secondary',
        lat: 22.0797,
        lng: 82.1409,
      },
      {
        udise: 22140102304,
        name: 'GOVT HIGHER SECONDARY SCHOOL JAGDALPUR BASTAR',
        cluster_cd: '221401004',
        cluster_name: 'JAGDALPUR CLUSTER',
        block_cd: '221401',
        block_name: 'JAGDALPUR',
        district_cd: '2214',
        district_name: 'BASTAR',
        hos: 'Shri Manoj Kashyap',
        hos_mobile: '9826445566',
        school_type: 'Government Higher Secondary',
        lat: 19.0732,
        lng: 82.0227,
      },
    ];

    for (const sc of schools) {
      await client.query(`
        INSERT INTO sd_schools (
          udise_code, school_name, cluster_cd, cluster_name,
          block_cd, block_name, district_cd, district_name,
          state_cd, latitude, longitude, school_type, hos_name, hos_mobile, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CG', $9, $10, $11, $12, $13, true)
        ON CONFLICT (udise_code) DO UPDATE SET
          school_name = EXCLUDED.school_name,
          cluster_cd = EXCLUDED.cluster_cd,
          cluster_name = EXCLUDED.cluster_name,
          school_type = EXCLUDED.school_type,
          hos_name = EXCLUDED.hos_name,
          hos_mobile = EXCLUDED.hos_mobile;
      `, [
        sc.udise, sc.name, sc.cluster_cd, sc.cluster_name,
        sc.block_cd, sc.block_name, sc.district_cd, sc.district_name,
        sc.lat, sc.lng, sc.school_type, sc.hos, sc.hos_mobile,
      ]);
    }

    // ── 5. Users (CAC, Principals, Teachers, State Admin) ──────────────────
    console.log('5. Seeding Users (CAC, Principals, Teachers)...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123', salt);

    const usersToSeed = [
      // CAC (Cluster Academic Coordinator)
      {
        username: 'cac.raipur',
        full_name: 'Shri Sunil Sharma (संकुल समन्वयक)',
        email: 'cac.raipur@cg.gov.in',
        mobile: '9826998877',
        role: 'CAC',
        udise: 22050904705,
        scope_type: 'cluster',
        scope_val: '220509001',
      },
      {
        username: 'cac',
        full_name: 'Shri Sunil Sharma (संकुल समन्वयक)',
        email: 'cac@cg.gov.in',
        mobile: '9826998877',
        role: 'CAC',
        udise: 22050904705,
        scope_type: 'cluster',
        scope_val: '220509001',
      },

      // Principals (SCHOOL_ADMIN)
      {
        username: 'principal.raipur',
        full_name: 'Dr. Rajesh Verma',
        email: 'principal.raipur@cg.gov.in',
        mobile: '9826112233',
        role: 'SCHOOL_ADMIN',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'principal.telibandha',
        full_name: 'Shri Devendra Sahu',
        email: 'ms.telibandha@cg.gov.in',
        mobile: '9826112244',
        role: 'SCHOOL_ADMIN',
        udise: 22050904706,
        scope_type: 'school',
        scope_val: '22050904706',
      },
      {
        username: 'principal.pandri',
        full_name: 'Smt. Geeta Dewangan',
        email: 'ps.pandri@cg.gov.in',
        mobile: '9826112255',
        role: 'SCHOOL_ADMIN',
        udise: 22050904707,
        scope_type: 'school',
        scope_val: '22050904707',
      },
      {
        username: 'principal.durg',
        full_name: 'Smt. Meenakshi Sahu',
        email: 'principal.durg@cg.gov.in',
        mobile: '9826223344',
        role: 'SCHOOL_ADMIN',
        udise: 22070301201,
        scope_type: 'school',
        scope_val: '22070301201',
      },
      {
        username: 'principal.bilaspur',
        full_name: 'Dr. Alok Tiwari',
        email: 'principal.bilaspur@cg.gov.in',
        mobile: '9826334455',
        role: 'SCHOOL_ADMIN',
        udise: 22080405102,
        scope_type: 'school',
        scope_val: '22080405102',
      },

      // State Admin
      {
        username: 'admin',
        full_name: 'State Administrator VSK',
        email: 'admin.vsk@cg.gov.in',
        mobile: '9826000000',
        role: 'STATE_ADMIN',
        udise: null,
        scope_type: 'state',
        scope_val: null,
      },

      // District Education Officers (DEO / DISTRICT_OFFICER)
      {
        username: 'district.raipur',
        full_name: 'Dr. Surendra Kumar Pandey (District Education Officer - DEO)',
        email: 'deo.raipur@cg.gov.in',
        mobile: '9826001122',
        role: 'DISTRICT_OFFICER',
        udise: 22050904705,
        scope_type: 'district',
        scope_val: '2205',
      },
      {
        username: 'deo.raipur',
        full_name: 'Dr. Surendra Kumar Pandey (District Education Officer - DEO)',
        email: 'deo@cg.gov.in',
        mobile: '9826001122',
        role: 'DISTRICT_OFFICER',
        udise: 22050904705,
        scope_type: 'district',
        scope_val: '2205',
      },

      // Teachers
      {
        username: 'teacher.ananya',
        full_name: 'Ananya Devi Sharma',
        email: 'ananya.sharma@cg.gov.in',
        mobile: '9826100001',
        role: 'TEACHER',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'teacher.raipur',
        full_name: 'Ramesh Kumar Sahu',
        email: 'ramesh.sahu@cg.gov.in',
        mobile: '9826100002',
        role: 'TEACHER',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'teacher.priya',
        full_name: 'Priya Dewangan',
        email: 'priya.dewangan@cg.gov.in',
        mobile: '9826100003',
        role: 'TEACHER',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'teacher.vikram',
        full_name: 'Vikram Patel',
        email: 'vikram.patel@cg.gov.in',
        mobile: '9826100004',
        role: 'TEACHER',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'teacher.sunita',
        full_name: 'Sunita Netam',
        email: 'sunita.netam@cg.gov.in',
        mobile: '9826100005',
        role: 'TEACHER',
        udise: 22050904705,
        scope_type: 'school',
        scope_val: '22050904705',
      },
      {
        username: 'teacher.telibandha1',
        full_name: 'Mukesh Chandra Sen',
        email: 'mukesh.sen@cg.gov.in',
        mobile: '9826100011',
        role: 'TEACHER',
        udise: 22050904706,
        scope_type: 'school',
        scope_val: '22050904706',
      },
      {
        username: 'teacher.pandri1',
        full_name: 'Chitralekha Nishad',
        email: 'chitra.nishad@cg.gov.in',
        mobile: '9826100021',
        role: 'TEACHER',
        udise: 22050904707,
        scope_type: 'school',
        scope_val: '22050904707',
      },
      {
        username: 'teacher.byron1',
        full_name: 'Pooja Kashyap',
        email: 'pooja.kashyap@cg.gov.in',
        mobile: '9826100031',
        role: 'TEACHER',
        udise: 22050904709,
        scope_type: 'school',
        scope_val: '22050904709',
      },
    ];

    for (const u of usersToSeed) {
      await client.query(`
        INSERT INTO sd_users (
          username, password_hash, full_name, email, mobile,
          role, primary_udise, scope_type, scope_value, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          primary_udise = EXCLUDED.primary_udise,
          scope_type = EXCLUDED.scope_type,
          scope_value = EXCLUDED.scope_value,
          is_active = true;
      `, [
        u.username, passwordHash, u.full_name, u.email, u.mobile,
        u.role, u.udise, u.scope_type, u.scope_val
      ]);
    }

    const allUsers = (await client.query('SELECT id, username, primary_udise, role FROM sd_users')).rows;
    const userMap = Object.fromEntries(allUsers.map(u => [u.username, u.id]));

    // ── 6. Teacher Class Assignments ──────────────────────────────────────
    console.log('6. Seeding Teacher Assignments...');
    const assignments = [
      { user: 'teacher.ananya', udise: 22050904705, classNum: 6 },
      { user: 'teacher.ananya', udise: 22050904705, classNum: 7 },
      { user: 'teacher.ananya', udise: 22050904705, classNum: 8 },
      { user: 'teacher.raipur', udise: 22050904705, classNum: 6 },
      { user: 'teacher.raipur', udise: 22050904705, classNum: 7 },
      { user: 'teacher.priya', udise: 22050904705, classNum: 8 },
      { user: 'teacher.vikram', udise: 22050904705, classNum: 9 },
      { user: 'teacher.vikram', udise: 22050904705, classNum: 10 },
      { user: 'teacher.sunita', udise: 22050904705, classNum: 9 },
      { user: 'teacher.sunita', udise: 22050904705, classNum: 10 },
      { user: 'teacher.telibandha1', udise: 22050904706, classNum: 6 },
      { user: 'teacher.telibandha1', udise: 22050904706, classNum: 7 },
      { user: 'teacher.pandri1', udise: 22050904707, classNum: 3 },
      { user: 'teacher.pandri1', udise: 22050904707, classNum: 4 },
      { user: 'teacher.byron1', udise: 22050904709, classNum: 9 },
      { user: 'teacher.byron1', udise: 22050904709, classNum: 10 },
    ];

    for (const a of assignments) {
      const uId = userMap[a.user];
      const cId = classMap[a.classNum];
      if (uId && cId) {
        await client.query(`
          INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (user_id, school_udise, class_id, academic_year_id) DO NOTHING;
        `, [uId, a.udise, cId, activeYearId]);
      }
    }

    // ── 7. Chapter Learning Outcomes & Rich Question Bank ─────────────────
    console.log('7. Seeding Chapter Learning Outcomes & Question Bank...');
    const learningOutcomes = [
      // Class 3 FLN
      { code: 'LO-MATH-03-01', desc: 'Chapter 2: Single & Double Digit Addition & Word Problems (FLN)', classNum: 3, subCode: 'MATH' },
      { code: 'LO-HIN-03-01', desc: 'Chapter 1: Reading Fluency, Word Recognition & Comprehension (NIPUN)', classNum: 3, subCode: 'HINDI' },
      // Class 4 FLN
      { code: 'LO-MATH-04-01', desc: 'Chapter 3: Multiplication Tables & Division Concept (FLN)', classNum: 4, subCode: 'MATH' },
      // Class 5
      { code: 'LO-MATH-05-01', desc: 'Chapter 4: Fractions, Decimals & Spatial Measurements', classNum: 5, subCode: 'MATH' },
      { code: 'LO-SCI-05-01', desc: 'Chapter 1: Environment, Plants and Animal Habitats', classNum: 5, subCode: 'SCI' },
      // Class 6
      { code: 'LO-MATH-06-01', desc: 'Chapter 1: Fractions and Decimals (भिन्न एवं दशमलव)', classNum: 6, subCode: 'MATH' },
      { code: 'LO-MATH-06-02', desc: 'Chapter 4: Basic Geometrical Ideas & Angles (आधारभूत ज्यामिति)', classNum: 6, subCode: 'MATH' },
      { code: 'LO-SCI-06-01', desc: 'Chapter 2: Components of Food and Balanced Diet (भोजन के घटक)', classNum: 6, subCode: 'SCI' },
      { code: 'LO-SCI-06-02', desc: 'Chapter 4: Sorting Materials into Groups (पदार्थों का पृथक्करण)', classNum: 6, subCode: 'SCI' },
      { code: 'LO-HIN-06-01', desc: 'Chapter 1: Comprehension of Narrative Prose and Poetry (पद्य अभिव्यक्ति)', classNum: 6, subCode: 'HINDI' },
      { code: 'LO-ENG-06-01', desc: 'Chapter 1: Reading Passages and Factual Answering', classNum: 6, subCode: 'ENG' },
      // Class 7
      { code: 'LO-MATH-07-01', desc: 'Chapter 1: Integers & Rational Number Operations (पूर्णांक संख्याएं)', classNum: 7, subCode: 'MATH' },
      { code: 'LO-SCI-07-01', desc: 'Chapter 1: Nutrition in Plants & Photosynthesis (पादपों में पोषण)', classNum: 7, subCode: 'SCI' },
      // Class 8
      { code: 'LO-MATH-08-01', desc: 'Chapter 2: Linear Equations in One Variable (एक चर वाले रैखिक समीकरण)', classNum: 8, subCode: 'MATH' },
      { code: 'LO-MATH-08-02', desc: 'Chapter 3: Quadrilaterals & Mensuration (चतुर्भुज एवं क्षेत्रमिति)', classNum: 8, subCode: 'MATH' },
      { code: 'LO-SCI-08-01', desc: 'Chapter 11: Force, Pressure and Friction (बल, दाब तथा घर्षण)', classNum: 8, subCode: 'SCI' },
      { code: 'LO-SCI-08-02', desc: 'Chapter 8: Cell Structure & Microorganisms (कोशिका एवं सूक्ष्मजीव)', classNum: 8, subCode: 'SCI' },
      // Class 9
      { code: 'LO-MATH-09-01', desc: 'Chapter 2: Polynomials & Coordinate Geometry (बहुपद एवं निर्देशांक ज्यामिति)', classNum: 9, subCode: 'MATH' },
      { code: 'LO-SCI-09-01', desc: 'Chapter 9: Laws of Motion & Gravitation (गति के नियम एवं गुरुत्वाकर्षण)', classNum: 9, subCode: 'SCI' },
      // Class 10
      { code: 'LO-MATH-10-01', desc: 'Chapter 4: Quadratic Equations & Trigonometric Ratios (द्विघात समीकरण)', classNum: 10, subCode: 'MATH' },
      { code: 'LO-SCI-10-01', desc: 'Chapter 1: Chemical Reactions & Electricity Basics (रासायनिक अभिक्रियाएं)', classNum: 10, subCode: 'SCI' },
    ];

    const loMap = {};
    for (const lo of learningOutcomes) {
      const cId = classMap[lo.classNum];
      const sId = subjectMap[lo.subCode];
      const res = await client.query(`
        INSERT INTO sd_learning_outcomes (lo_code, description, class_id, subject_id, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (lo_code) DO UPDATE SET description = EXCLUDED.description
        RETURNING id;
      `, [lo.code, lo.desc, cId, sId]);
      loMap[lo.code] = res.rows[0].id;
    }

    // Seed Chapter Question Bank in sd_questions
    console.log('7.1 Seeding Questions mapped to Chapters...');
    const questionsToSeed = [
      // Class 6 Math Questions
      { classNum: 6, subCode: 'MATH', qNum: 'Q01', text: 'Solve addition of unlike fractions: 3/4 + 5/6', maxMarks: 10, loCode: 'LO-MATH-06-01' },
      { classNum: 6, subCode: 'MATH', qNum: 'Q02', text: 'Express 0.375 as a fraction in simplest reduced form', maxMarks: 10, loCode: 'LO-MATH-06-01' },
      { classNum: 6, subCode: 'MATH', qNum: 'Q03', text: 'Construct an angle of 60 degrees using ruler and compass', maxMarks: 10, loCode: 'LO-MATH-06-02' },

      // Class 6 Science Questions
      { classNum: 6, subCode: 'SCI', qNum: 'Q01', text: 'List three food sources of Vitamin A, C and D', maxMarks: 10, loCode: 'LO-SCI-06-01' },
      { classNum: 6, subCode: 'SCI', qNum: 'Q02', text: 'Differentiate between transparent, translucent and opaque objects', maxMarks: 10, loCode: 'LO-SCI-06-02' },

      // Class 6 Hindi & English
      { classNum: 6, subCode: 'HINDI', qNum: 'Q01', text: 'निम्नलिखित गद्यांश को पढ़कर पूछे गए प्रश्नों के उत्तर लिखिए', maxMarks: 10, loCode: 'LO-HIN-06-01' },
      { classNum: 6, subCode: 'ENG', qNum: 'Q01', text: 'Read the comprehension passage and answer the factual questions', maxMarks: 10, loCode: 'LO-ENG-06-01' },

      // Class 10 Math Questions
      { classNum: 10, subCode: 'MATH', qNum: 'Q01', text: 'Solve quadratic equation 2x^2 - 7x + 3 = 0 by factorization and quadratic formula', maxMarks: 10, loCode: 'LO-MATH-10-01' },
      { classNum: 10, subCode: 'MATH', qNum: 'Q02', text: 'Evaluate: (sin 30 + tan 45 - cosec 60) / (sec 30 + cos 60 + cot 45)', maxMarks: 10, loCode: 'LO-MATH-10-01' },

      // Class 10 Science Questions
      { classNum: 10, subCode: 'SCI', qNum: 'Q01', text: 'Balance chemical equation: Fe + H2O -> Fe3O4 + H2 and state reaction type', maxMarks: 10, loCode: 'LO-SCI-10-01' },
      { classNum: 10, subCode: 'SCI', qNum: 'Q02', text: 'Calculate total resistance of three resistors 2, 3 and 6 ohms connected in parallel', maxMarks: 10, loCode: 'LO-SCI-10-01' },

      // Class 3 Math FLN Questions
      { classNum: 3, subCode: 'MATH', qNum: 'Q01', text: 'Ramesh has 36 pencils and Priya gives him 27 more. How many total pencils?', maxMarks: 10, loCode: 'LO-MATH-03-01' },
      { classNum: 3, subCode: 'MATH', qNum: 'Q02', text: 'Subtract 48 from 85 with borrowing', maxMarks: 10, loCode: 'LO-MATH-03-01' },

      // Class 8 Math & Science
      { classNum: 8, subCode: 'MATH', qNum: 'Q01', text: 'Solve the linear equation: 5x + 9 = 5 + 3x', maxMarks: 10, loCode: 'LO-MATH-08-01' },
      { classNum: 8, subCode: 'SCI', qNum: 'Q01', text: 'Explain how friction can be both useful and a nuisance with examples', maxMarks: 10, loCode: 'LO-SCI-08-01' },
    ];

    const questionMap = {};
    for (const q of questionsToSeed) {
      const cId = classMap[q.classNum];
      const sId = subjectMap[q.subCode];
      const loId = loMap[q.loCode];

      const qRes = await client.query(`
        INSERT INTO sd_questions (
          academic_year_id, class_id, subject_id, question_number,
          question_text, max_marks, lo_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT (academic_year_id, class_id, subject_id, question_number)
        DO UPDATE SET question_text = EXCLUDED.question_text, lo_id = EXCLUDED.lo_id
        RETURNING id;
      `, [activeYearId, cId, sId, q.qNum, q.text, q.maxMarks, loId]);

      const key = `${q.classNum}_${q.subCode}_${q.qNum}`;
      questionMap[key] = { id: qRes.rows[0].id, loId, maxMarks: q.maxMarks, loCode: q.loCode };
    }

    // ── 8. Multi-School Students Seeding ──────────────────────────────────
    console.log('8. Seeding Students across Cluster 1 Schools...');
    const studentNames = [
      { name: 'Aarav Sharma', gender: 'M', g: 'Rajesh Sharma' },
      { name: 'Diya Patel', gender: 'F', g: 'Manish Patel' },
      { name: 'Ishaan Verma', gender: 'M', g: 'Sanjay Verma' },
      { name: 'Ananya Sahu', gender: 'F', g: 'Kishore Sahu' },
      { name: 'Rohan Dewangan', gender: 'M', g: 'Prakash Dewangan' },
      { name: 'Sneha Netam', gender: 'F', g: 'Santosh Netam' },
      { name: 'Aditya Baghel', gender: 'M', g: 'Manoj Baghel' },
      { name: 'Kavya Agrawal', gender: 'F', g: 'Anil Agrawal' },
      { name: 'Harsh Yadav', gender: 'M', g: 'Dinesh Yadav' },
      { name: 'Pooja Sonkar', gender: 'F', g: 'Ramesh Sonkar' },
      { name: 'Vikas Tandon', gender: 'M', g: 'Sunil Tandon' },
      { name: 'Priya Sen', gender: 'F', g: 'Devendra Sen' },
      { name: 'Rahul Kashyap', gender: 'M', g: 'Mahesh Kashyap' },
      { name: 'Tanvi Jha', gender: 'F', g: 'Alok Jha' },
      { name: 'Deepak Nishad', gender: 'M', g: 'Bhagwat Nishad' },
      { name: 'Khushi Thakur', gender: 'F', g: 'Hemant Thakur' },
      { name: 'Naveen Kurre', gender: 'M', g: 'Rajkumar Kurre' },
      { name: 'Shreya Sinha', gender: 'F', g: 'Pradeep Sinha' },
      { name: 'Ajay Maravi', gender: 'M', g: 'Laxman Maravi' },
      { name: 'Riya Banjare', gender: 'F', g: 'Gopal Banjare' },
      { name: 'Kunal Mandavi', gender: 'M', g: 'Mohan Mandavi' },
      { name: 'Bhumika Dhruw', gender: 'F', g: 'Ramnath Dhruw' },
      { name: 'Abhishek Markam', gender: 'M', g: 'Shyamlal Markam' },
      { name: 'Payal Kunjam', gender: 'F', g: 'Budhram Kunjam' },
      { name: 'Suraj Korram', gender: 'M', g: 'Ghanshyam Korram' },
    ];

    const clusterSchoolsToSeedStudents = [
      // Raipur Urban Block
      { udise: 22050904705, classes: [6, 7, 8, 9, 10], basePerClass: 25 }, // Model HSS
      { udise: 22050904706, classes: [6, 7, 8], basePerClass: 20 },         // Telibandha MS
      { udise: 22050904707, classes: [3, 4, 5], basePerClass: 15 },         // Pandri PS
      { udise: 22050904708, classes: [9, 10], basePerClass: 20 },           // Naveen Boys HS
      { udise: 22050904709, classes: [9, 10], basePerClass: 22 },           // Byron Bazar Girls HSS

      // Abhanpur Block
      { udise: 22051001201, classes: [6, 7, 8, 9, 10], basePerClass: 22 }, // Abhanpur HSS
      { udise: 22051001202, classes: [6, 7, 8], basePerClass: 18 },         // Mana Camp MS

      // Arang Block
      { udise: 22051102301, classes: [6, 7, 8, 9, 10], basePerClass: 24 }, // Arang Model HSS
      { udise: 22051102302, classes: [6, 7, 8], basePerClass: 20 },         // Chandkhuri MS

      // Tilda Block
      { udise: 22051203401, classes: [6, 7, 8, 9, 10], basePerClass: 21 }, // Tilda Neora HSS
    ];

    const studentMapBySchool = {};

    for (const sc of clusterSchoolsToSeedStudents) {
      studentMapBySchool[sc.udise] = {};
      for (const cNum of sc.classes) {
        const cId = classMap[cNum];
        studentMapBySchool[sc.udise][cNum] = [];

        for (let i = 0; i < sc.basePerClass; i++) {
          const sTemplate = studentNames[i % studentNames.length];
          const roll = i + 1;
          const sName = `${sTemplate.name} ${roll > 25 ? '(II)' : ''}`;

          const sRes = await client.query(`
            INSERT INTO sd_students (
              school_udise, class_id, academic_year_id, roll_number,
              student_name, gender, dob, guardian_name, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
            ON CONFLICT (school_udise, class_id, academic_year_id, roll_number)
            DO UPDATE SET student_name = EXCLUDED.student_name
            RETURNING id, roll_number;
          `, [
            sc.udise, cId, activeYearId, roll,
            sName, sTemplate.gender,
            `201${12 - Math.min(cNum, 10)}-05-15`, sTemplate.g
          ]);

          studentMapBySchool[sc.udise][cNum].push({
            id: sRes.rows[0].id,
            roll: roll,
            name: sName
          });
        }
      }
    }

    // ── 9. Assessments, Subject Marks & Question Marks ─────────────────────
    console.log('9. Seeding Assessments, Subject Marks & Question-Wise Marks...');
    const subCodes = ['HINDI', 'ENG', 'MATH', 'SCI', 'SST'];

    const schoolPerformanceFactors = {
      // Raipur Urban Block
      22050904709: { base: 82, creator: 'teacher.byron1' },
      22050904705: { base: 79, creator: 'teacher.ananya' },
      22050904708: { base: 71, creator: 'teacher.vikram' },
      22050904706: { base: 64, creator: 'teacher.telibandha1' },
      22050904707: { base: 49, creator: 'teacher.pandri1' },

      // Abhanpur Block
      22051001201: { base: 74, creator: 'teacher.ananya' },
      22051001202: { base: 62, creator: 'teacher.telibandha1' },

      // Arang Block
      22051102301: { base: 78, creator: 'teacher.vikram' },
      22051102302: { base: 67, creator: 'teacher.ananya' },

      // Tilda Block
      22051203401: { base: 72, creator: 'teacher.vikram' },
    };

    for (const [udiseStr, scPerf] of Object.entries(schoolPerformanceFactors)) {
      const udise = parseInt(udiseStr, 10);
      const classesForSchool = studentMapBySchool[udise] ? Object.keys(studentMapBySchool[udise]).map(Number) : [];
      const creatorId = userMap[scPerf.creator] || userMap['teacher.ananya'];

      for (const cNum of classesForSchool) {
        const cId = classMap[cNum];
        const students = studentMapBySchool[udise][cNum] || [];
        const studentCount = students.length;

        const examConfigs = [
          { name: `Class ${cNum} - Periodic Test 1 (PT-1)`, type: 'UNIT', status: 'SUBMITTED', mult: 1.0 },
          { name: `Class ${cNum} - Mid-Term Examination`, type: 'TERM', status: 'SUBMITTED', mult: 1.03 },
          { name: `Class ${cNum} - Periodic Test 2 (PT-2)`, type: 'UNIT', status: 'SUBMITTED', mult: 1.06 },
        ];

        for (const ex of examConfigs) {
          const aRes = await client.query(`
            INSERT INTO sd_assessments (
              academic_year_id, school_udise, class_id, assessment_name,
              assessment_type, status, total_students, students_entered,
              created_by, submitted_at, submitted_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), $9)
            ON CONFLICT (academic_year_id, school_udise, class_id, assessment_name)
            DO UPDATE SET status = EXCLUDED.status, total_students = EXCLUDED.total_students, students_entered = EXCLUDED.students_entered
            RETURNING id;
          `, [
            activeYearId, udise, cId, ex.name,
            ex.type, ex.status, studentCount, studentCount,
            creatorId
          ]);

          const asmtId = aRes.rows[0].id;

          // Link subjects
          const activeSubs = cNum <= 5 ? ['HINDI', 'ENG', 'MATH', 'SCI'] : subCodes;
          for (let idx = 0; idx < activeSubs.length; idx++) {
            const subCode = activeSubs[idx];
            const subId = subjectMap[subCode];

            await client.query(`
              INSERT INTO sd_assessment_subjects (assessment_id, subject_id, max_marks, sort_order)
              VALUES ($1, $2, 100, $3)
              ON CONFLICT (assessment_id, subject_id) DO NOTHING;
            `, [asmtId, subId, idx + 1]);

            // Seed student subject marks & question-level marks
            for (const st of students) {
              let score = Math.round(scPerf.base * ex.mult);
              if (st.roll <= 4) score += 14;
              else if (st.roll <= 12) score += 4;
              else if (st.roll <= 18) score -= 8;
              else score -= 26; // Remedial

              if (subCode === 'MATH' && udise === 22050904707) score -= 12;
              if (subCode === 'HINDI') score += 5;

              let finalMark = Math.min(Math.max(score + ((st.roll + subId) % 5) - 2, 14), 98);
              const isAbsent = st.roll === 19 && subCode === 'SCI';
              if (isAbsent) finalMark = null;

              // Subject Mark
              await client.query(`
                INSERT INTO sd_subject_marks (
                  assessment_id, student_id, subject_id,
                  marks_obtained, max_marks, is_absent, data_source
                ) VALUES ($1, $2, $3, $4, 100, $5, 'MANUAL')
                ON CONFLICT (assessment_id, student_id, subject_id)
                DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained;
              `, [asmtId, st.id, subId, finalMark, isAbsent]);

              // Seed Question Marks for Questions belonging to this class & subject
              const questionsForSubject = Object.entries(questionMap)
                .filter(([k]) => k.startsWith(`${cNum}_${subCode}_`))
                .map(([, v]) => v);

              for (const qItem of questionsForSubject) {
                let qMark = Math.round((finalMark ? finalMark / 10 : 6));
                // Add specific chapter weaknesses
                // Fractions (LO-MATH-06-01) Q01/Q02 has higher error rate
                if (qItem.loCode === 'LO-MATH-06-01' && st.roll > 10) qMark = Math.max(qMark - 3, 2);
                // Quadratic Equations (LO-MATH-10-01) has higher error rate
                if (qItem.loCode === 'LO-MATH-10-01' && st.roll > 12) qMark = Math.max(qMark - 3, 3);
                // FLN addition in Class 3 has error rate in word problems
                if (qItem.loCode === 'LO-MATH-03-01' && st.roll > 8) qMark = Math.max(qMark - 4, 2);

                qMark = Math.min(Math.max(qMark, isAbsent ? 0 : 1), 10);

                await client.query(`
                  INSERT INTO sd_question_marks (
                    assessment_id, student_id, subject_id, question_id, lo_id,
                    marks_obtained, max_marks, is_absent
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                  ON CONFLICT (assessment_id, student_id, question_id)
                  DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained;
                `, [asmtId, st.id, subId, qItem.id, qItem.loId, isAbsent ? 0 : qMark, qItem.maxMarks, isAbsent]);
              }
            }
          }
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seeding with Question & Chapter Analytics completed successfully!');
    console.log('----------------------------------------------------');
    console.log('🔑 Demo Logins (Password for all: Admin@123):');
    console.log('  🎯 Cluster Coordinator (CAC): cac.raipur (or cac)');
    console.log('  👑 Principal Raipur HSS:      principal.raipur');
    console.log('  👑 Principal Durg HSS:        principal.durg');
    console.log('  👨‍🏫 Teacher Ananya:            teacher.ananya');
    console.log('  👨‍🏫 Teacher Vikram:            teacher.vikram');
    console.log('----------------------------------------------------');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
