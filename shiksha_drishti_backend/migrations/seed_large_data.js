/**
 * SHIKSHA DRISHTI — Massive Realistic Dummy Data Seeder v2
 * Seeds: 100+ schools, 5000+ students, 50+ teachers, 500+ assessments,
 *        50,000+ subject marks, 20,000+ question marks across 4 districts
 *
 * Run: node migrations/seed_large_data.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'shiksha_drishti',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '12345',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min, max, dp = 6) => parseFloat((Math.random() * (max - min) + min).toFixed(dp));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => arr.slice().sort(() => 0.5 - Math.random()).slice(0, Math.min(n, arr.length));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Geography ────────────────────────────────────────────────────────────────
const GEO = [
  {
    district_cd: '2205', district_name: 'RAIPUR',
    blocks: [
      { block_cd: '220510', block_name: 'ABHANPUR', clusters: [
          { cd: '22051001', name: 'Abhanpur Central' }, { cd: '22051002', name: 'Abhanpur East' },
          { cd: '22051003', name: 'Charoda' }, { cd: '22051004', name: 'Naya Raipur' }, { cd: '22051005', name: 'Abhanpur West' }
        ]},
      { block_cd: '220502', block_name: 'RAIPUR URBAN', clusters: [
          { cd: '22050201', name: 'Civil Lines' }, { cd: '22050202', name: 'Tatibandh' },
          { cd: '22050203', name: 'Pandri' }, { cd: '22050204', name: 'Amanaka' }, { cd: '22050205', name: 'Shankar Nagar' }
        ]},
      { block_cd: '220503', block_name: 'ARANG', clusters: [
          { cd: '22050301', name: 'Arang Mandi' }, { cd: '22050302', name: 'Arang Rural' },
          { cd: '22050303', name: 'Khargaon' }, { cd: '22050304', name: 'Palora' }
        ]},
      { block_cd: '220504', block_name: 'TILDA', clusters: [
          { cd: '22050401', name: 'Tilda Newra' }, { cd: '22050402', name: 'Tilda Bazar' },
          { cd: '22050403', name: 'Kumhari' }, { cd: '22050404', name: 'Mandir Hasaud' }
        ]},
    ],
  },
  {
    district_cd: '2207', district_name: 'DURG',
    blocks: [
      { block_cd: '220703', block_name: 'DURG URBAN', clusters: [
          { cd: '22070301', name: 'Durg City' }, { cd: '22070302', name: 'Bhilai Nagar' },
          { cd: '22070303', name: 'Nehru Nagar' }, { cd: '22070304', name: 'Supela' }
        ]},
      { block_cd: '220704', block_name: 'BHILAI', clusters: [
          { cd: '22070401', name: 'Sector 1-5' }, { cd: '22070402', name: 'Sector 6-10' },
          { cd: '22070403', name: 'Charoda Industrial' }, { cd: '22070404', name: 'Risali' }
        ]},
      { block_cd: '220705', block_name: 'PATAN', clusters: [
          { cd: '22070501', name: 'Patan Bazar' }, { cd: '22070502', name: 'Siltara' },
          { cd: '22070503', name: 'Khamhardih' }
        ]},
    ],
  },
  {
    district_cd: '2208', district_name: 'BILASPUR',
    blocks: [
      { block_cd: '220804', block_name: 'BILASPUR URBAN', clusters: [
          { cd: '22080401', name: 'City Centre' }, { cd: '22080402', name: 'Gol Bazar' },
          { cd: '22080403', name: 'Sadar Bazar' }, { cd: '22080404', name: 'Vyapar Vihar' }
        ]},
      { block_cd: '220805', block_name: 'MASTURI', clusters: [
          { cd: '22080501', name: 'Masturi Bazar' }, { cd: '22080502', name: 'Ratanpur' },
          { cd: '22080503', name: 'Belha' }
        ]},
      { block_cd: '220806', block_name: 'TAKHATPUR', clusters: [
          { cd: '22080601', name: 'Takhatpur Town' }, { cd: '22080602', name: 'Kota' }
        ]},
    ],
  },
  {
    district_cd: '2214', district_name: 'BASTAR',
    blocks: [
      { block_cd: '221401', block_name: 'JAGDALPUR', clusters: [
          { cd: '22140101', name: 'Jagdalpur City' }, { cd: '22140102', name: 'Jagdalpur Rural' },
          { cd: '22140103', name: 'Chitrakote' }
        ]},
      { block_cd: '221402', block_name: 'TOKAPAL', clusters: [
          { cd: '22140201', name: 'Tokapal Block' }, { cd: '22140202', name: 'Kodenar' }
        ]},
      { block_cd: '221403', block_name: 'BASTAR BLOCK', clusters: [
          { cd: '22140301', name: 'Bastar Town' }, { cd: '22140302', name: 'Lohandiguda' }
        ]},
    ],
  },
  {
    district_cd: '2201', district_name: 'SURGUJA',
    blocks: [
      { block_cd: '220101', block_name: 'AMBIKAPUR', clusters: [
          { cd: '22010101', name: 'Ambikapur City' }, { cd: '22010102', name: 'Ambikapur Rural' },
          { cd: '22010103', name: 'Darima' }
        ]},
      { block_cd: '220102', block_name: 'LUNDRA', clusters: [
          { cd: '22010201', name: 'Lundra Block' }, { cd: '22010202', name: 'Premnagar' }
        ]},
    ],
  },
  {
    district_cd: '2213', district_name: 'RAJNANDGAON',
    blocks: [
      { block_cd: '221301', block_name: 'RAJNANDGAON URBAN', clusters: [
          { cd: '22130101', name: 'Rajnandgaon City' }, { cd: '22130102', name: 'Borsi' }
        ]},
      { block_cd: '221302', block_name: 'DONGARGARH', clusters: [
          { cd: '22130201', name: 'Dongargarh Town' }, { cd: '22130202', name: 'Chhuriya' }
        ]},
    ],
  },
];

const SCHOOL_PREFIXES = [
  'GOVT HIGHER SECONDARY SCHOOL', 'GOVT HIGH SCHOOL', 'GOVT MIDDLE SCHOOL',
  'GOVT BOYS HIGHER SECONDARY SCHOOL', 'GOVT GIRLS HIGHER SECONDARY SCHOOL',
  'GOVT EXCELLENCE SCHOOL', 'GOVT ASHRAM SCHOOL', 'MODEL SCHOOL',
  'GOVT COMPOSITE SCHOOL', 'GOVT ELEMENTARY SCHOOL',
];

const LOCALITIES = ['MAIN', 'WARD NO 1', 'WARD NO 2', 'WARD NO 3', 'COLONY',
  'NORTH', 'SOUTH', 'EAST', 'WEST', 'CENTRAL', 'NEW', 'OLD', 'BAZAR', 'CHOWK', 'ROAD'];

const FIRST_M = ['Ramesh','Suresh','Mahesh','Dinesh','Rajesh','Vikram','Anil','Santosh','Pramod','Dilip',
  'Lokesh','Girish','Harish','Naresh','Devesh','Kamlesh','Umesh','Yogesh','Mukesh','Deepak',
  'Rakesh','Ajay','Vijay','Sanjay','Ranjit','Surendra','Narendra','Shailendra','Himanshu','Arvind',
  'Pradeep','Manoj','Arvind','Rohit','Amit','Pankaj','Vivek','Abhishek','Rahul','Gaurav'];
const FIRST_F = ['Sunita','Kavita','Rekha','Anita','Pushpa','Geeta','Seema','Nisha','Meena','Laxmi',
  'Priya','Pooja','Suman','Usha','Mamta','Deepa','Varsha','Neha','Anjali','Shobha',
  'Asha','Jyoti','Rita','Sarita','Poonam','Kiran','Radha','Savita','Madhuri','Lalita',
  'Komal','Ritu','Sweta','Divya','Manisha','Sandhya','Preeti','Rina','Khushboo','Archana'];
const SURNAMES = ['Sharma','Verma','Gupta','Singh','Patel','Kumar','Yadav','Tiwari','Pandey','Joshi',
  'Mishra','Sahu','Dewangan','Kosare','Chandrakar','Dhruv','Nishad','Kashyap','Banjare','Markam',
  'Netam','Mandavi','Thakur','Soni','Agrawal','Baghel','Porte','Usendi','Poyam','Kuldeep',
  'Shrivastava','Dubey','Rai','Tripathi','Sukla','Dwivedi','Chouhan','Rajput','Lodhi','Kurre'];

const genName = (isFemale = false) => `${pick(isFemale ? FIRST_F : FIRST_M)} ${pick(SURNAMES)}`;
const genMobile = () => `9${randInt(100000000, 999999999)}`;

const ASSESSMENT_TYPES = ['TERM', 'UNIT', 'FINAL', 'CUSTOM', 'MONTHLY'];
const ASSESSMENT_NAMES = [
  'Monthly Test April', 'Monthly Test May', 'Monthly Test June', 'Monthly Test July',
  'Unit Test 1', 'Unit Test 2', 'Unit Test 3', 'Unit Test 4',
  'Mid Term Examination', 'Pre-Board Examination', 'Annual Examination 2026-27',
  'Diagnostic Assessment Q1', 'Diagnostic Assessment Q2', 'Remedial Test',
  'Subject Mastery Test - Hindi', 'Subject Mastery Test - Math', 'Subject Mastery Test - Science',
];

// ─── Main Seeder ───────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    console.log('\n📚 SHIKSHA DRISHTI — Large Data Seeder v2\n');
    await client.query('BEGIN');

    // ── Master data ───────────────────────────────────────────────────────────
    const { rows: subjects } = await client.query('SELECT id, name, code FROM sd_subjects ORDER BY id');
    const { rows: classes }  = await client.query('SELECT id, class_name, class_num FROM sd_classes ORDER BY class_num');
    const { rows: questions } = await client.query('SELECT id, question_number, max_marks, subject_id FROM sd_questions ORDER BY id');
    const { rows: [{ id: acYearId }] } = await client.query('SELECT id FROM sd_academic_years ORDER BY id DESC LIMIT 1');

    console.log(`Subjects: ${subjects.length}, Classes: ${classes.length}, Questions: ${questions.length}, AcYear: ${acYearId}`);

    // ── Check existing schools ────────────────────────────────────────────────
    const { rows: existingSchoolRows } = await client.query('SELECT udise_code FROM sd_schools');
    const existingUDISE = new Set(existingSchoolRows.map(r => String(r.udise_code)));
    console.log(`Existing schools: ${existingUDISE.size}`);

    // ── 1. INSERT NEW SCHOOLS ─────────────────────────────────────────────────
    let udiseBase = 22059900000;
    const newSchools = [];

    for (const dist of GEO) {
      for (const block of dist.blocks) {
        for (const cluster of block.clusters) {
          const count = randInt(6, 10);
          for (let i = 0; i < count; i++) {
            udiseBase++;
            const udise = String(udiseBase);
            if (existingUDISE.has(udise)) continue;
            const isFemale = Math.random() > 0.55;
            newSchools.push({
              udise,
              school_name: `${pick(SCHOOL_PREFIXES)} ${block.block_name} ${pick(LOCALITIES)} ${i + 1}`,
              school_type: pick(['Government Higher Secondary', 'Government High School', 'Government Middle School', 'Government Primary']),
              cluster_cd: cluster.cd,
              cluster_name: cluster.name,
              block_cd: block.block_cd,
              block_name: block.block_name,
              district_cd: dist.district_cd,
              district_name: dist.district_name,
              hos_name: genName(isFemale),
              hos_mobile: genMobile(),
              lat: randFloat(19.5, 23.5),
              lng: randFloat(80.0, 84.5),
            });
          }
        }
      }
    }

    console.log(`\n→ Inserting ${newSchools.length} new schools...`);
    for (const sc of newSchools) {
      await client.query(
        `INSERT INTO sd_schools
           (udise_code, school_name, school_type, cluster_cd, cluster_name, block_cd, block_name,
            district_cd, district_name, state_cd, hos_name, hos_mobile, latitude, longitude, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'22',$10,$11,$12,$13,true)
         ON CONFLICT (udise_code) DO NOTHING`,
        [sc.udise, sc.school_name, sc.school_type, sc.cluster_cd, sc.cluster_name, sc.block_cd,
         sc.block_name, sc.district_cd, sc.district_name, sc.hos_name, sc.hos_mobile, sc.lat, sc.lng]
      );
    }
    await client.query('COMMIT');
    await client.query('BEGIN');
    console.log('✓ Schools done');

    // ── 2. INSERT TEACHERS ────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('teacher123', 10);
    const { rows: allSchoolRows } = await client.query('SELECT udise_code, block_cd, district_cd, cluster_cd FROM sd_schools');
    console.log(`Total schools: ${allSchoolRows.length}`);

    const { rows: existingTeacherRows } = await client.query("SELECT username FROM sd_users WHERE role = 'TEACHER'");
    const existingUsernames = new Set(existingTeacherRows.map(r => r.username));

    const teacherSchoolMap = {}; // udise -> [userId]
    let teacherCount = 0;

    for (const sc of newSchools) {
      teacherSchoolMap[sc.udise] = [];
      const num = randInt(4, 7);
      for (let t = 0; t < num; t++) {
        const isFemale = Math.random() > 0.45;
        const name = genName(isFemale);
        let uname = `t.${sc.block_cd.slice(-3)}.${name.split(' ')[0].toLowerCase()}${randInt(10,999)}`;
        while (existingUsernames.has(uname)) uname += randInt(1, 9);
        existingUsernames.add(uname);

        const classForTeacher = pick(classes);
        const { rows: [{ id: uid }] } = await client.query(
          `INSERT INTO sd_users (username, password_hash, full_name, email, mobile, role, scope_type, scope_value, primary_udise, is_active)
           VALUES ($1,$2,$3,$4,$5,'TEACHER','school',$6,$7,true)
           ON CONFLICT (username) DO UPDATE SET updated_at = NOW()
           RETURNING id`,
          [uname, passwordHash, name, `${uname}@cg.gov.in`, genMobile(), sc.udise, sc.udise]
        );
        teacherSchoolMap[sc.udise].push(uid);

        await client.query(
          `INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
           VALUES ($1,$2,$3,$4,true) ON CONFLICT DO NOTHING`,
          [uid, sc.udise, classForTeacher.id, acYearId]
        );
        teacherCount++;
      }
    }
    // Also get existing teachers
    const { rows: existingTeacherFull } = await client.query(
      `SELECT u.id, COALESCE(ta.school_udise, u.primary_udise) as school_udise
       FROM sd_users u
       LEFT JOIN sd_teacher_assignments ta ON ta.user_id = u.id AND ta.is_active = true
       WHERE u.role = 'TEACHER' AND u.is_active = true`
    );
    for (const t of existingTeacherFull) {
      const udise = String(t.school_udise);
      if (!teacherSchoolMap[udise]) teacherSchoolMap[udise] = [];
      if (!teacherSchoolMap[udise].includes(t.id)) teacherSchoolMap[udise].push(t.id);
    }

    await client.query('COMMIT');
    await client.query('BEGIN');
    console.log(`✓ ${teacherCount} new teachers inserted. Total teacher map size: ${Object.keys(teacherSchoolMap).length} schools`);

    // ── 3. INSERT STUDENTS ────────────────────────────────────────────────────
    console.log('\n→ Inserting students...');
    let studentCount = 0;
    const studentsBySchool = {}; // udise -> [{id, class_id}]

    // Pre-load existing students
    const { rows: existingStudents } = await client.query(
      'SELECT id, school_udise, class_id FROM sd_students WHERE is_active = true'
    );
    for (const st of existingStudents) {
      const udise = String(st.school_udise);
      if (!studentsBySchool[udise]) studentsBySchool[udise] = [];
      studentsBySchool[udise].push({ id: st.id, class_id: st.class_id });
    }

    for (const sc of newSchools) {
      studentsBySchool[sc.udise] = studentsBySchool[sc.udise] || [];
      // Skip if already seeded
      if (studentsBySchool[sc.udise].length > 0) continue;

      const numStudents = randInt(40, 90);
      for (let s = 0; s < numStudents; s++) {
        const isFemale = Math.random() > 0.48;
        const sName = genName(isFemale);
        const cls = pick(classes);
        const gender = isFemale ? 'F' : 'M';
        const rollNum = s + 1;

        const { rows: [st] } = await client.query(
          `INSERT INTO sd_students (school_udise, class_id, academic_year_id, roll_number, student_name, gender, is_active)
           VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id, class_id`,
          [sc.udise, cls.id, acYearId, rollNum, sName, gender]
        );
        studentsBySchool[sc.udise].push({ id: st.id, class_id: st.class_id });
        studentCount++;
      }

      if (studentCount % 500 === 0) process.stdout.write(`  Students: ${studentCount}\r`);
    }
    await client.query('COMMIT');
    await client.query('BEGIN');
    console.log(`\n✓ ${studentCount} new students inserted (total in map: ${Object.values(studentsBySchool).reduce((a, b) => a + b.length, 0)})`);


    // ── 4. INSERT ASSESSMENTS + MARKS ─────────────────────────────────────────
    console.log('\n→ Inserting assessments and marks (takes ~2-3 minutes)...');

    // Questions by subject_id
    const questionsBySubject = {};
    for (const q of questions) {
      const sid = String(q.subject_id);
      if (!questionsBySubject[sid]) questionsBySubject[sid] = [];
      questionsBySubject[sid].push(q);
    }

    // School performance profile: gives each school a "base score" 40-92%
    const profileMap = {};
    for (const sc of allSchoolRows) {
      // Bastar schools slightly lower (equity gap simulation), Raipur Urban higher
      let base = randInt(48, 85);
      if (sc.district_cd === '2214') base = randInt(42, 72); // Bastar lower baseline
      if (sc.district_cd === '2205' && sc.block_cd === '220502') base = randInt(65, 90); // Raipur Urban higher
      profileMap[String(sc.udise_code)] = base;
    }

    let assessmentCount = 0;
    let subjectMarksCount = 0;
    let questionMarksCount = 0;
    let schoolsDone = 0;

    for (const sc of allSchoolRows) {
      const udise = String(sc.udise_code);
      const teachers = teacherSchoolMap[udise] || [];
      const students = studentsBySchool[udise] || [];
      const base = profileMap[udise] || 65;

      if (teachers.length === 0 || students.length === 0) { schoolsDone++; continue; }

      // 4-8 assessments per school
      const numAssessments = randInt(4, 8);
      const chosenNames = pickN(ASSESSMENT_NAMES, numAssessments);

      for (const aName of chosenNames) {
        const teacher = pick(teachers);
        const aType = pick(ASSESSMENT_TYPES);
        const status = Math.random() > 0.12 ? 'SUBMITTED' : 'DRAFT';
        const daysAgo = randInt(1, 200);

        // Pick a class that has students in this school
        const classIds = [...new Set(students.map(s => String(s.class_id)))];
        if (classIds.length === 0) continue;
        const classId = pick(classIds);

        const { rows: [{ id: assessId }] } = await client.query(
          `INSERT INTO sd_assessments
             (academic_year_id, school_udise, class_id, assessment_name, assessment_type, status, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7, NOW()-INTERVAL '${daysAgo} days', NOW()-INTERVAL '${daysAgo} days')
           RETURNING id`,
          [acYearId, udise, classId, aName, aType, status, teacher]
        );
        assessmentCount++;

        // Students in this class
        const classStudents = students.filter(s => String(s.class_id) === classId);
        if (classStudents.length === 0) continue;

        // 3-6 subjects per assessment
        const subjectsForAssess = pickN(subjects, randInt(3, Math.min(subjects.length, 6)));

        // Subject marks for all students
        const smBatch = [];
        for (const subj of subjectsForAssess) {
          for (const stu of classStudents) {
            const isAbsent = Math.random() < 0.06;
            const variance = randInt(-22, 18);
            const rawPct = Math.max(0, Math.min(100, base + variance));
            const marksObtained = isAbsent ? null : rawPct;
            smBatch.push([assessId, stu.id, subj.id, marksObtained, 100, isAbsent, 'MANUAL', teacher]);
          }
        }
        // Batch insert subject marks (50 at a time)
        for (let i = 0; i < smBatch.length; i += 50) {
          const chunk = smBatch.slice(i, i + 50);
          const vals = chunk.map((_, j) => {
            const o = j * 8;
            return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8})`;
          }).join(',');
          await client.query(
            `INSERT INTO sd_subject_marks (assessment_id,student_id,subject_id,marks_obtained,max_marks,is_absent,data_source,created_by)
             VALUES ${vals} ON CONFLICT DO NOTHING`,
            chunk.flat()
          );
          subjectMarksCount += chunk.length;
        }

        // Question marks (for first subject only, for up to 25 students)
        const firstSubj = subjectsForAssess[0];
        const subjectQs = questionsBySubject[String(firstSubj.id)] || [];
        if (subjectQs.length > 0) {
          const sampleStudents = classStudents.slice(0, Math.min(25, classStudents.length));
          const qmBatch = [];
          for (const stu of sampleStudents) {
            const isAbsent = Math.random() < 0.06;
            for (const q of subjectQs.slice(0, 5)) {
              const maxQ = Number(q.max_marks);
              const pct = isAbsent ? 0 : Math.max(0, Math.min(1, (base + randInt(-28, 20)) / 100));
              const qMarks = Math.round(pct * maxQ);
              qmBatch.push([assessId, stu.id, q.id, firstSubj.id, qMarks, maxQ, isAbsent, teacher]);
            }
          }
          for (let i = 0; i < qmBatch.length; i += 50) {
            const chunk = qmBatch.slice(i, i + 50);
            const vals = chunk.map((_, j) => {
              const o = j * 8;
              return `($${o+1},$${o+2},$${o+3},$${o+4},$${o+5},$${o+6},$${o+7},$${o+8})`;
            }).join(',');
            await client.query(
              `INSERT INTO sd_question_marks (assessment_id,student_id,question_id,subject_id,marks_obtained,max_marks,is_absent,created_by)
               VALUES ${vals} ON CONFLICT DO NOTHING`,
              chunk.flat()
            );
            questionMarksCount += chunk.length;
          }
        }
      }

      schoolsDone++;
      if (schoolsDone % 5 === 0) {
        await client.query('COMMIT');
        await client.query('BEGIN');
        process.stdout.write(`  Schools: ${schoolsDone}/${allSchoolRows.length} | Assess: ${assessmentCount} | SubjMarks: ${subjectMarksCount} | QMarks: ${questionMarksCount}     \r`);
      }
    }

    await client.query('COMMIT');

    // ── Final summary ─────────────────────────────────────────────────────────
    const finalC = await Promise.all([
      pool.query('SELECT COUNT(*) FROM sd_schools'),
      pool.query('SELECT COUNT(*) FROM sd_students'),
      pool.query("SELECT COUNT(*) FROM sd_users WHERE role = 'TEACHER'"),
      pool.query('SELECT COUNT(*) FROM sd_assessments'),
      pool.query('SELECT COUNT(*) FROM sd_subject_marks'),
      pool.query('SELECT COUNT(*) FROM sd_question_marks'),
      pool.query('SELECT DISTINCT district_name FROM sd_schools ORDER BY 1'),
    ]);

    console.log('\n\n═══════════════════════════════════════════');
    console.log('   ✅  SEED COMPLETE — FINAL COUNTS');
    console.log('═══════════════════════════════════════════');
    console.log(`   Schools:        ${finalC[0].rows[0].count}`);
    console.log(`   Students:       ${finalC[1].rows[0].count}`);
    console.log(`   Teachers:       ${finalC[2].rows[0].count}`);
    console.log(`   Assessments:    ${finalC[3].rows[0].count}`);
    console.log(`   Subject Marks:  ${finalC[4].rows[0].count}`);
    console.log(`   Question Marks: ${finalC[5].rows[0].count}`);
    console.log(`   Districts:      ${finalC[6].rows.map(r => r.district_name).join(', ')}`);
    console.log('═══════════════════════════════════════════\n');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('\n\n❌ ERROR:', err.message);
    console.error(err.stack);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(() => process.exit(1));
