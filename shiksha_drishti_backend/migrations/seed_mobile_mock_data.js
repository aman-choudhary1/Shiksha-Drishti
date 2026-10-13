require('dotenv').config();
const pool = require('../src/config/db');

async function seedMobileMockData() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Mobile Mock Test Data Seeding...');
    await client.query('BEGIN');

    // ── 1. Seed Students for School 22050904705 (Classes 1 to 5) ─────────────
    const targetUdise = 22050904705;
    const academicYearId = 3; // 2026-27

    const studentNames = [
      { name: 'आरव साहू (Aarav Sahu)', gender: 'M', guardian: 'संतोष साहू' },
      { name: 'दिया वर्मा (Diya Verma)', gender: 'F', guardian: 'राजेश वर्मा' },
      { name: 'रेयांश पटेल (Reyansh Patel)', gender: 'M', guardian: 'विक्रम पटेल' },
      { name: 'अनन्या देवांगन (Ananya Dewangan)', gender: 'F', guardian: 'कमलेश देवांगन' },
      { name: 'आदित्य कुमार (Aditya Kumar)', gender: 'M', guardian: 'राकेश कुमार' },
      { name: 'साक्षी नेताम (Sakshi Netam)', gender: 'F', guardian: 'सुनील नेताम' },
      { name: 'विवेक बघेल (Vivek Baghel)', gender: 'M', guardian: 'दिनेश बघेल' },
      { name: 'प्रिया सोनी (Priya Soni)', gender: 'F', guardian: 'मनोज सोनी' },
      { name: 'मयंक यादव (Mayank Yadav)', gender: 'M', guardian: 'अशोक यादव' },
      { name: 'पूजा कश्यप (Pooja Kashyap)', gender: 'F', guardian: 'महेश कश्यप' },
      { name: 'हर्षित मरकाम (Harshit Markam)', gender: 'M', guardian: 'सुरेंद्र मरकाम' },
      { name: 'तान्या शर्मा (Tanya Sharma)', gender: 'F', guardian: 'दीपक शर्मा' },
      { name: 'कृष्णा दुबे (Krishna Dubey)', gender: 'M', guardian: 'संजय दुबे' },
      { name: 'नेहा कुर्रे (Neha Kurre)', gender: 'F', guardian: 'प्रकाश कुर्रे' },
      { name: 'आयुष निषाद (Ayush Nishad)', gender: 'M', guardian: 'गौरीशंकर निषाद' },
      { name: 'अदिति राजपूत (Aditi Rajput)', gender: 'F', guardian: 'भूपेंद्र राजपूत' },
      { name: 'शिवम ध्रुव (Shivam Dhruw)', gender: 'M', guardian: 'बलराम ध्रुव' },
      { name: 'खुशी चंद्राकर (Khushi Chandrakar)', gender: 'F', guardian: 'हेमंत चंद्राकर' },
      { name: 'गौरव साहू (Gaurav Sahu)', gender: 'M', guardian: 'लखन साहू' },
      { name: 'सोनम पैंकरा (Sonam Paikra)', gender: 'F', guardian: 'अमर पैंकरा' },
    ];

    // For Class 1 through 5
    for (let c = 1; c <= 5; c++) {
      const birthYear = 2021 - c; // Class 1 born in 2020, Class 2 in 2019, etc.
      for (let r = 0; r < studentNames.length; r++) {
        const s = studentNames[r];
        const rollNo = r + 1;
        const month = String((r % 12) + 1).padStart(2, '0');
        const day = String((r % 28) + 1).padStart(2, '0');
        const dob = `${birthYear}-${month}-${day}`;

        await client.query(`
          INSERT INTO sd_students (
            school_udise, class_id, academic_year_id, roll_number, student_name, gender, dob, guardian_name, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          ON CONFLICT (school_udise, class_id, academic_year_id, roll_number) 
          DO UPDATE SET student_name = EXCLUDED.student_name, guardian_name = EXCLUDED.guardian_name, is_active = true
        `, [targetUdise, c, academicYearId, rollNo, s.name, s.gender, dob, s.guardian]);
      }
    }
    console.log('✅ Seeded 100 students for Classes 1 to 5 in school 22050904705');

    // ── 2. Seed Teacher Assignments (Classes 1 to 5 for teacher.raipur and teacher.ananya) ──
    const teacherIds = [2, 3]; // teacher.raipur (2), teacher.ananya (3)
    for (const tId of teacherIds) {
      for (let c = 1; c <= 5; c++) {
        await client.query(`
          INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (user_id, school_udise, class_id, academic_year_id) DO NOTHING
        `, [tId, targetUdise, c, academicYearId]);
      }
    }
    console.log('✅ Assigned teacher.raipur & teacher.ananya to Classes 1-5');

    // ── 3. Seed Assessment Papers & Questions for Multiple Classes & Subjects ──
    const papersData = [
      // ── Class 1 Mathematics (Paper 1031) ──────────────────────────────────
      {
        paper_code: '1031',
        title: 'Class 1 Mathematics Mock Test - Numbers & Shapes',
        title_hi: 'कक्षा 1 गणित मॉक टेस्ट - संख्या ज्ञान और आकृतियां',
        class_no: 1,
        subject: 'Mathematics',
        total_questions: 10,
        total_marks: 20,
        duration_minutes: 30,
        academic_year: '2026-27',
        instructions_en: 'Answer all 10 questions. Choose the best option.',
        instructions_hi: 'सभी 10 प्रश्नों के उत्तर दें। सही विकल्प चुनें।',
        questions: [
          {
            no: 1, type: 'text_mcq', marks: 2,
            q_en: 'Which number comes after 4?',
            q_hi: 'संख्या 4 के ठीक बाद कौन सी संख्या आती है?',
            hint: 'Count: 1, 2, 3, 4, ...',
            ans: 'b',
            options: [
              { key: 'A', en: '3', hi: '3', correct: false },
              { key: 'B', en: '5', hi: '5', correct: true },
              { key: 'C', en: '6', hi: '6', correct: false },
              { key: 'D', en: '2', hi: '2', correct: false },
            ]
          },
          {
            no: 2, type: 'text_mcq', marks: 2,
            q_en: 'What is 2 + 3 = ?',
            q_hi: '2 + 3 बराबर क्या होगा?',
            hint: 'Use your fingers to add.',
            ans: 'c',
            options: [
              { key: 'A', en: '4', hi: '4', correct: false },
              { key: 'B', en: '6', hi: '6', correct: false },
              { key: 'C', en: '5', hi: '5', correct: true },
              { key: 'D', en: '7', hi: '7', correct: false },
            ]
          },
          {
            no: 3, type: 'text_mcq', marks: 2,
            q_en: 'Which shape looks like a football or the sun?',
            q_hi: 'फुटबॉल या सूरज की आकृति कैसी होती है?',
            hint: 'Round shape without corners.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Circle (गोला)', hi: 'गोला (वृत्त)', correct: true },
              { key: 'B', en: 'Square (चौकोर)', hi: 'चौकोर (वर्ग)', correct: false },
              { key: 'C', en: 'Triangle (त्रिकोण)', hi: 'त्रिकोण (त्रिभुज)', correct: false },
              { key: 'D', en: 'Star (तारा)', hi: 'तारा', correct: false },
            ]
          },
          {
            no: 4, type: 'text_mcq', marks: 2,
            q_en: 'How many legs does a cow have?',
            q_hi: 'एक गाय के कितने पैर होते हैं?',
            hint: 'Counting animal legs.',
            ans: 'b',
            options: [
              { key: 'A', en: '2', hi: '2', correct: false },
              { key: 'B', en: '4', hi: '4', correct: true },
              { key: 'C', en: '6', hi: '6', correct: false },
              { key: 'D', en: '3', hi: '3', correct: false },
            ]
          },
          {
            no: 5, type: 'text_mcq', marks: 2,
            q_en: 'Which is bigger: 7 or 3?',
            q_hi: '7 और 3 में से कौन सी संख्या बड़ी है?',
            hint: 'Number that comes later while counting.',
            ans: 'a',
            options: [
              { key: 'A', en: '7', hi: '7', correct: true },
              { key: 'B', en: '3', hi: '3', correct: false },
              { key: 'C', en: 'Both are equal', hi: 'दोनों बराबर हैं', correct: false },
              { key: 'D', en: 'None', hi: 'कोई नहीं', correct: false },
            ]
          },
          {
            no: 6, type: 'text_mcq', marks: 2,
            q_en: '5 - 2 = ?',
            q_hi: '5 में से 2 घटाने पर क्या बचेगा?',
            hint: 'Take away 2 from 5.',
            ans: 'c',
            options: [
              { key: 'A', en: '2', hi: '2', correct: false },
              { key: 'B', en: '4', hi: '4', correct: false },
              { key: 'C', en: '3', hi: '3', correct: true },
              { key: 'D', en: '1', hi: '1', correct: false },
            ]
          },
          {
            no: 7, type: 'text_mcq', marks: 2,
            q_en: 'How many wheels does a bicycle have?',
            q_hi: 'एक साइकिल में कितने पहिए होते हैं?',
            hint: 'Two wheels.',
            ans: 'b',
            options: [
              { key: 'A', en: '1', hi: '1', correct: false },
              { key: 'B', en: '2', hi: '2', correct: true },
              { key: 'C', en: '3', hi: '3', correct: false },
              { key: 'D', en: '4', hi: '4', correct: false },
            ]
          },
          {
            no: 8, type: 'text_mcq', marks: 2,
            q_en: 'Which number is smallest: 8, 2, 5, 9?',
            q_hi: '8, 2, 5, 9 में सबसे छोटी संख्या कौन सी है?',
            hint: 'Number that comes first.',
            ans: 'b',
            options: [
              { key: 'A', en: '8', hi: '8', correct: false },
              { key: 'B', en: '2', hi: '2', correct: true },
              { key: 'C', en: '5', hi: '5', correct: false },
              { key: 'D', en: '9', hi: '9', correct: false },
            ]
          },
          {
            no: 9, type: 'text_mcq', marks: 2,
            q_en: '10 + 0 = ?',
            q_hi: '10 में 0 जोड़ने पर क्या मिलेगा?',
            hint: 'Adding zero leaves number unchanged.',
            ans: 'a',
            options: [
              { key: 'A', en: '10', hi: '10', correct: true },
              { key: 'B', en: '0', hi: '0', correct: false },
              { key: 'C', en: '1', hi: '1', correct: false },
              { key: 'D', en: '100', hi: '100', correct: false },
            ]
          },
          {
            no: 10, type: 'text_mcq', marks: 2,
            q_en: 'How many sides does a triangle have?',
            q_hi: 'एक त्रिभुज की कितनी भुजाएं (कोने) होती हैं?',
            hint: 'Tri means three.',
            ans: 'c',
            options: [
              { key: 'A', en: '2', hi: '2', correct: false },
              { key: 'B', en: '4', hi: '4', correct: false },
              { key: 'C', en: '3', hi: '3', correct: true },
              { key: 'D', en: '5', hi: '5', correct: false },
            ]
          },
        ]
      },

      // ── Class 2 Hindi (Paper 2011) ────────────────────────────────────────
      {
        paper_code: '2011',
        title: 'Class 2 Hindi Mock Test - Shabda & Vyakaran',
        title_hi: 'कक्षा 2 हिन्दी मॉक टेस्ट - शब्द ज्ञान और व्याकरण',
        class_no: 2,
        subject: 'Hindi',
        total_questions: 10,
        total_marks: 20,
        duration_minutes: 30,
        academic_year: '2026-27',
        instructions_en: 'Choose the correct answer for each question.',
        instructions_hi: 'प्रत्येक प्रश्न का सही विकल्प चुनिए।',
        questions: [
          {
            no: 1, type: 'text_mcq', marks: 2,
            q_en: 'Which is the rhyming word for "पानी" (Paani)?',
            q_hi: '"पानी" शब्द से मिलता-जुलता (तुकबंदी) शब्द कौन सा है?',
            hint: 'Same ending sound.',
            ans: 'a',
            options: [
              { key: 'A', en: 'रानी (Raani)', hi: 'रानी', correct: true },
              { key: 'B', en: 'किताब (Kitaab)', hi: 'किताब', correct: false },
              { key: 'C', en: 'पेड़ (Ped)', hi: 'पेड़', correct: false },
              { key: 'D', en: 'सूरज (Sooraj)', hi: 'सूरज', correct: false },
            ]
          },
          {
            no: 2, type: 'text_mcq', marks: 2,
            q_en: 'What is the opposite word for "दिन" (Day)?',
            q_hi: '"दिन" का विलोम (उल्टा) शब्द क्या है?',
            hint: 'When the moon comes out.',
            ans: 'b',
            options: [
              { key: 'A', en: 'सुबह (Morning)', hi: 'सुबह', correct: false },
              { key: 'B', en: 'रात (Night)', hi: 'रात', correct: true },
              { key: 'C', en: 'शाम (Evening)', hi: 'शाम', correct: false },
              { key: 'D', en: 'दोपहर (Afternoon)', hi: 'दोपहर', correct: false },
            ]
          },
          {
            no: 3, type: 'text_mcq', marks: 2,
            q_en: 'Which of these is our National Bird of India?',
            q_hi: 'भारत का राष्ट्रीय पक्षी कौन सा है?',
            hint: 'Has beautiful colorful feathers.',
            ans: 'c',
            options: [
              { key: 'A', en: 'तोता (Parrot)', hi: 'तोता', correct: false },
              { key: 'B', en: 'कबूतर (Pigeon)', hi: 'कबूतर', correct: false },
              { key: 'C', en: 'मोर (Peacock)', hi: 'मोर', correct: true },
              { key: 'D', en: 'कौआ (Crow)', hi: 'कौआ', correct: false },
            ]
          },
          {
            no: 4, type: 'text_mcq', marks: 2,
            q_en: 'Select the correct spelling for "School":',
            q_hi: 'सही वर्तनी वाला शब्द चुनिए:',
            hint: 'Where we go to study.',
            ans: 'a',
            options: [
              { key: 'A', en: 'विद्यालय', hi: 'विद्यालय', correct: true },
              { key: 'B', en: 'विदालय', hi: 'विदालय', correct: false },
              { key: 'C', en: 'विधालय', hi: 'विधालय', correct: false },
              { key: 'D', en: 'विदयालय', hi: 'विदयालय', correct: false },
            ]
          },
          {
            no: 5, type: 'text_mcq', marks: 2,
            q_en: 'What is the plural of "लड़का" (Boy)?',
            q_hi: '"लड़का" का बहुवचन क्या होगा?',
            hint: 'More than one boy.',
            ans: 'b',
            options: [
              { key: 'A', en: 'लड़की', hi: 'लड़की', correct: false },
              { key: 'B', en: 'लड़के', hi: 'लड़के', correct: true },
              { key: 'C', en: 'लड़कों', hi: 'लड़कों', correct: false },
              { key: 'D', en: 'लड़कियां', hi: 'लड़कियां', correct: false },
            ]
          },
          {
            no: 6, type: 'text_mcq', marks: 2,
            q_en: 'Which animal is called the King of the Jungle?',
            q_hi: 'जंगल का राजा किसे कहा जाता है?',
            hint: 'Roaring big cat.',
            ans: 'a',
            options: [
              { key: 'A', en: 'शेर (Lion)', hi: 'शेर', correct: true },
              { key: 'B', en: 'हाथी (Elephant)', hi: 'हाथी', correct: false },
              { key: 'C', en: 'भालू (Bear)', hi: 'भालू', correct: false },
              { key: 'D', en: 'हिरण (Deer)', hi: 'हिरण', correct: false },
            ]
          },
          {
            no: 7, type: 'text_mcq', marks: 2,
            q_en: 'What gives us milk?',
            q_hi: 'हमें दूध किससे मिलता है?',
            hint: 'Domestic pet animal.',
            ans: 'b',
            options: [
              { key: 'A', en: 'कुत्ता (Dog)', hi: 'कुत्ता', correct: false },
              { key: 'B', en: 'गाय (Cow)', hi: 'गाय', correct: true },
              { key: 'C', en: 'बिल्ली (Cat)', hi: 'बिल्ली', correct: false },
              { key: 'D', en: 'घोड़ा (Horse)', hi: 'घोड़ा', correct: false },
            ]
          },
          {
            no: 8, type: 'text_mcq', marks: 2,
            q_en: 'Which fruit is known as King of Fruits?',
            q_hi: 'फलों का राजा किसे कहा जाता है?',
            hint: 'Sweet yellow summer fruit.',
            ans: 'c',
            options: [
              { key: 'A', en: 'सेब (Apple)', hi: 'सेब', correct: false },
              { key: 'B', en: 'केला (Banana)', hi: 'केला', correct: false },
              { key: 'C', en: 'आम (Mango)', hi: 'आम', correct: true },
              { key: 'D', en: 'अंगूर (Grapes)', hi: 'अंगूर', correct: false },
            ]
          },
          {
            no: 9, type: 'text_mcq', marks: 2,
            q_en: 'Opposite of "छोटा" (Small):',
            q_hi: '"छोटा" का विलोम शब्द है:',
            hint: 'Big / Large.',
            ans: 'a',
            options: [
              { key: 'A', en: 'बड़ा (Big)', hi: 'बड़ा', correct: true },
              { key: 'B', en: 'मोटा (Fat)', hi: 'मोटा', correct: false },
              { key: 'C', en: 'पतला (Thin)', hi: 'पतला', correct: false },
              { key: 'D', en: 'गर्म (Hot)', hi: 'गर्म', correct: false },
            ]
          },
          {
            no: 10, type: 'text_mcq', marks: 2,
            q_en: 'Where do birds live?',
            q_hi: 'पक्षी कहाँ रहते हैं?',
            hint: 'Built with twigs.',
            ans: 'b',
            options: [
              { key: 'A', en: 'गुफा में', hi: 'गुफा में', correct: false },
              { key: 'B', en: 'घोंसले में (Nest)', hi: 'घोंसले में', correct: true },
              { key: 'C', en: 'पानी में', hi: 'पानी में', correct: false },
              { key: 'D', en: 'बिल में', hi: 'बिल में', correct: false },
            ]
          },
        ]
      },

      // ── Class 2 Mathematics (Paper 2031) ──────────────────────────────────
      {
        paper_code: '2031',
        title: 'Class 2 Mathematics Mock Test - Addition & Place Value',
        title_hi: 'कक्षा 2 गणित मॉक टेस्ट - जोड़, घटाव एवं स्थानीय मान',
        class_no: 2,
        subject: 'Mathematics',
        total_questions: 10,
        total_marks: 20,
        duration_minutes: 30,
        academic_year: '2026-27',
        instructions_en: 'Solve the basic arithmetic questions.',
        instructions_hi: 'गणितीय प्रश्नों को हल करें।',
        questions: [
          {
            no: 1, type: 'text_mcq', marks: 2,
            q_en: '15 + 10 = ?',
            q_hi: '15 में 10 जोड़ने पर कितना होगा?',
            hint: 'Add tens and ones.',
            ans: 'b',
            options: [
              { key: 'A', en: '20', hi: '20', correct: false },
              { key: 'B', en: '25', hi: '25', correct: true },
              { key: 'C', en: '30', hi: '30', correct: false },
              { key: 'D', en: '15', hi: '15', correct: false },
            ]
          },
          {
            no: 2, type: 'text_mcq', marks: 2,
            q_en: 'What is the place value of 5 in 54?',
            q_hi: 'संख्या 54 में 5 का स्थानीय मान क्या है?',
            hint: '5 is in the tens place.',
            ans: 'a',
            options: [
              { key: 'A', en: '50 (पचास)', hi: '50 (दहाई)', correct: true },
              { key: 'B', en: '5 (इकाई)', hi: '5 (इकाई)', correct: false },
              { key: 'C', en: '500', hi: '500', correct: false },
              { key: 'D', en: '4', hi: '4', correct: false },
            ]
          },
          {
            no: 3, type: 'text_mcq', marks: 2,
            q_en: '30 - 10 = ?',
            q_hi: '30 में से 10 घटाने पर क्या बचेगा?',
            hint: 'Subtract 10 from 30.',
            ans: 'c',
            options: [
              { key: 'A', en: '15', hi: '15', correct: false },
              { key: 'B', en: '25', hi: '25', correct: false },
              { key: 'C', en: '20', hi: '20', correct: true },
              { key: 'D', en: '10', hi: '10', correct: false },
            ]
          },
          {
            no: 4, type: 'text_mcq', marks: 2,
            q_en: 'Which is an even number (सम संख्या)?',
            q_hi: 'इनमें से कौन सी एक सम संख्या है?',
            hint: 'Divisible by 2.',
            ans: 'b',
            options: [
              { key: 'A', en: '7', hi: '7', correct: false },
              { key: 'B', en: '8', hi: '8', correct: true },
              { key: 'C', en: '9', hi: '9', correct: false },
              { key: 'D', en: '11', hi: '11', correct: false },
            ]
          },
          {
            no: 5, type: 'text_mcq', marks: 2,
            q_en: 'How many days are in a week?',
            q_hi: 'एक सप्ताह में कितने दिन होते हैं?',
            hint: 'Monday to Sunday.',
            ans: 'a',
            options: [
              { key: 'A', en: '7', hi: '7', correct: true },
              { key: 'B', en: '5', hi: '5', correct: false },
              { key: 'C', en: '6', hi: '6', correct: false },
              { key: 'D', en: '8', hi: '8', correct: false },
            ]
          },
          {
            no: 6, type: 'text_mcq', marks: 2,
            q_en: '4 x 2 = ?',
            q_hi: '4 का पहाड़ा 2 बार पढ़ने पर क्या आएगा? (4 × 2)',
            hint: '4 times 2.',
            ans: 'b',
            options: [
              { key: 'A', en: '6', hi: '6', correct: false },
              { key: 'B', en: '8', hi: '8', correct: true },
              { key: 'C', en: '10', hi: '10', correct: false },
              { key: 'D', en: '12', hi: '12', correct: false },
            ]
          },
          {
            no: 7, type: 'text_mcq', marks: 2,
            q_en: 'Which is greater: 45 or 54?',
            q_hi: '45 और 54 में कौन बड़ा है?',
            hint: 'Check the tens digit.',
            ans: 'b',
            options: [
              { key: 'A', en: '45', hi: '45', correct: false },
              { key: 'B', en: '54', hi: '54', correct: true },
              { key: 'C', en: 'Both equal', hi: 'दोनों बराबर', correct: false },
              { key: 'D', en: 'None', hi: 'कोई नहीं', correct: false },
            ]
          },
          {
            no: 8, type: 'text_mcq', marks: 2,
            q_en: 'How many paise in 1 Rupee?',
            q_hi: '1 रुपये में कितने पैसे होते हैं?',
            hint: 'Indian currency standard.',
            ans: 'c',
            options: [
              { key: 'A', en: '50 पैसे', hi: '50 पैसे', correct: false },
              { key: 'B', en: '10 पैसे', hi: '10 पैसे', correct: false },
              { key: 'C', en: '100 पैसे', hi: '100 पैसे', correct: true },
              { key: 'D', en: '20 पैसे', hi: '20 पैसे', correct: false },
            ]
          },
          {
            no: 9, type: 'text_mcq', marks: 2,
            q_en: '50 + 50 = ?',
            q_hi: '50 + 50 बराबर क्या होगा?',
            hint: 'Half century plus half century.',
            ans: 'a',
            options: [
              { key: 'A', en: '100', hi: '100', correct: true },
              { key: 'B', en: '90', hi: '90', correct: false },
              { key: 'C', en: '80', hi: '80', correct: false },
              { key: 'D', en: '110', hi: '110', correct: false },
            ]
          },
          {
            no: 10, type: 'text_mcq', marks: 2,
            q_en: 'What time does the clock show when both hands are on 12?',
            q_hi: 'जब घड़ी की दोनों सुइयां 12 पर हों, तो कितना बजता है?',
            hint: 'Midday or Midnight.',
            ans: 'b',
            options: [
              { key: 'A', en: '6 o\'clock', hi: '6 बजे', correct: false },
              { key: 'B', en: '12 o\'clock', hi: '12 बजे', correct: true },
              { key: 'C', en: '1 o\'clock', hi: '1 बजे', correct: false },
              { key: 'D', en: '9 o\'clock', hi: '9 बजे', correct: false },
            ]
          },
        ]
      },

      // ── Class 3 Science / EVS (Paper 3031) ────────────────────────────────
      {
        paper_code: '3031',
        title: 'Class 3 Environmental Studies Mock Test - Nature & Animals',
        title_hi: 'कक्षा 3 पर्यावरण अध्ययन मॉक टेस्ट - प्रकृति और सजीव',
        class_no: 3,
        subject: 'Science',
        total_questions: 10,
        total_marks: 20,
        duration_minutes: 30,
        academic_year: '2026-27',
        instructions_en: 'Answer all 10 environmental questions.',
        instructions_hi: 'सभी 10 पर्यावरण प्रश्नों के उत्तर दें।',
        questions: [
          {
            no: 1, type: 'text_mcq', marks: 2,
            q_en: 'Which part of the plant prepares food using sunlight?',
            q_hi: 'पौधे का कौन सा भाग सूर्य के प्रकाश से भोजन बनाता है?',
            hint: 'Green kitchen of plant.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Leaves (पत्तियां)', hi: 'पत्तियां', correct: true },
              { key: 'B', en: 'Roots (जड़)', hi: 'जड़', correct: false },
              { key: 'C', en: 'Flowers (फूल)', hi: 'फूल', correct: false },
              { key: 'D', en: 'Stem (तना)', hi: 'तना', correct: false },
            ]
          },
          {
            no: 2, type: 'text_mcq', marks: 2,
            q_en: 'Which animal is called Ship of the Desert?',
            q_hi: 'रेगिस्तान का जहाज किस पशु को कहा जाता है?',
            hint: 'Can live without water for days.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Horse (घोड़ा)', hi: 'घोड़ा', correct: false },
              { key: 'B', en: 'Camel (ऊंट)', hi: 'ऊंट', correct: true },
              { key: 'C', en: 'Elephant (हाथी)', hi: 'हाथी', correct: false },
              { key: 'D', en: 'Donkey (गधा)', hi: 'गधा', correct: false },
            ]
          },
          {
            no: 3, type: 'text_mcq', marks: 2,
            q_en: 'How many sense organs do humans have?',
            q_hi: 'मनुष्य के शरीर में कितनी ज्ञानेंद्रियाँ (Sense Organs) होती हैं?',
            hint: 'Eyes, ears, nose, tongue, skin.',
            ans: 'c',
            options: [
              { key: 'A', en: '3', hi: '3', correct: false },
              { key: 'B', en: '4', hi: '4', correct: false },
              { key: 'C', en: '5', hi: '5', correct: true },
              { key: 'D', en: '6', hi: '6', correct: false },
            ]
          },
          {
            no: 4, type: 'text_mcq', marks: 2,
            q_en: 'What do we breathe in for living?',
            q_hi: 'जीवित रहने के लिए हम सांस में कौन सी गैस लेते हैं?',
            hint: 'Life giving gas.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Oxygen (ऑक्सीजन)', hi: 'ऑक्सीजन', correct: true },
              { key: 'B', en: 'Carbon dioxide', hi: 'कार्बन डाइऑक्साइड', correct: false },
              { key: 'C', en: 'Nitrogen', hi: 'नाइट्रोजन', correct: false },
              { key: 'D', en: 'Helium', hi: 'हीलियम', correct: false },
            ]
          },
          {
            no: 5, type: 'text_mcq', marks: 2,
            q_en: 'Which is the main source of water on Earth?',
            q_hi: 'पृथ्वी पर पानी का मुख्य प्राकृतिक स्रोत क्या है?',
            hint: 'Falling from clouds.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Well (कुआं)', hi: 'कुआं', correct: false },
              { key: 'B', en: 'Rain (वर्षा / बारिश)', hi: 'वर्षा (बारिश)', correct: true },
              { key: 'C', en: 'Tap (नल)', hi: 'नल', correct: false },
              { key: 'D', en: 'Pond (तालाब)', hi: 'तालाब', correct: false },
            ]
          },
          {
            no: 6, type: 'text_mcq', marks: 2,
            q_en: 'What kind of animal is a frog?',
            q_hi: 'मेंढक किस प्रकार का जीव है?',
            hint: 'Lives both on land and in water.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Only land animal', hi: 'केवल थलचर', correct: false },
              { key: 'B', en: 'Amphibian (उभयचर - जल और थल दोनों)', hi: 'उभयचर (जल व थल दोनों)', correct: true },
              { key: 'C', en: 'Bird (पक्षी)', hi: 'पक्षी', correct: false },
              { key: 'D', en: 'Fish (मछली)', hi: 'मछली', correct: false },
            ]
          },
          {
            no: 7, type: 'text_mcq', marks: 2,
            q_en: 'Which gas is released by green plants during photosynthesis?',
            q_hi: 'हरे पौधे दिन में कौन सी गैस छोड़ते हैं?',
            hint: 'Gas that animals breathe in.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Oxygen (ऑक्सीजन)', hi: 'ऑक्सीजन', correct: true },
              { key: 'B', en: 'Carbon monoxide', hi: 'कार्बन मोनोऑक्साइड', correct: false },
              { key: 'C', en: 'Methane', hi: 'मीथेन', correct: false },
              { key: 'D', en: 'Argon', hi: 'आर्गन', correct: false },
            ]
          },
          {
            no: 8, type: 'text_mcq', marks: 2,
            q_en: 'Which direction does the Sun rise from?',
            q_hi: 'सूर्य किस दिशा से उगता है?',
            hint: 'Opposite of West.',
            ans: 'c',
            options: [
              { key: 'A', en: 'North (उत्तर)', hi: 'उत्तर', correct: false },
              { key: 'B', en: 'West (पश्चिम)', hi: 'पश्चिम', correct: false },
              { key: 'C', en: 'East (पूर्व)', hi: 'पूर्व', correct: true },
              { key: 'D', en: 'South (दक्षिण)', hi: 'दक्षिण', correct: false },
            ]
          },
          {
            no: 9, type: 'text_mcq', marks: 2,
            q_en: 'Which house is made of snow/ice blocks?',
            q_hi: 'बर्फ की सिल्लियों से बने घर को क्या कहते हैं?',
            hint: 'Built by Eskimos.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Hut (झोपड़ी)', hi: 'झोपड़ी', correct: false },
              { key: 'B', en: 'Igloo (इग्लू)', hi: 'इग्लू', correct: true },
              { key: 'C', en: 'Tent (तम्बू)', hi: 'तम्बू', correct: false },
              { key: 'D', en: 'Caravan', hi: 'कारवां', correct: false },
            ]
          },
          {
            no: 10, type: 'text_mcq', marks: 2,
            q_en: 'Which festival is known as Festival of Lights in India?',
            q_hi: 'भारत में दीपों का त्योहार किसे कहा जाता है?',
            hint: 'Celebrated with diyas.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Diwali (दीपावली)', hi: 'दीपावली (दिवाली)', correct: true },
              { key: 'B', en: 'Holi (होली)', hi: 'होली', correct: false },
              { key: 'C', en: 'Eid (ईद)', hi: 'ईद', correct: false },
              { key: 'D', en: 'Christmas (क्रिसमस)', hi: 'क्रिसमस', correct: false },
            ]
          },
        ]
      },

      // ── Class 6 Science (Paper 6031) ──────────────────────────────────────
      {
        paper_code: '6031',
        title: 'Class 6 Science Mock Test - Living Organisms & Food',
        title_hi: 'कक्षा 6 विज्ञान मॉक टेस्ट - सजीव और भोजन के घटक',
        class_no: 6,
        subject: 'Science',
        total_questions: 10,
        total_marks: 20,
        duration_minutes: 30,
        academic_year: '2026-27',
        instructions_en: 'Comprehensive science test for class 6 students.',
        instructions_hi: 'कक्षा 6 के छात्रों के लिए व्यापक विज्ञान परीक्षा।',
        questions: [
          {
            no: 1, type: 'text_mcq', marks: 2,
            q_en: 'Which vitamin deficiency causes Scurvy disease?',
            q_hi: 'स्कर्वी रोग किस विटामिन की कमी से होता है?',
            hint: 'Found in citrus fruits like lemon and amla.',
            ans: 'c',
            options: [
              { key: 'A', en: 'Vitamin A', hi: 'विटामिन A', correct: false },
              { key: 'B', en: 'Vitamin B', hi: 'विटामिन B', correct: false },
              { key: 'C', en: 'Vitamin C', hi: 'विटामिन C', correct: true },
              { key: 'D', en: 'Vitamin D', hi: 'विटामिन D', correct: false },
            ]
          },
          {
            no: 2, type: 'text_mcq', marks: 2,
            q_en: 'Which component of food provides quick energy to the body?',
            q_hi: 'भोजन का कौन सा घटक शरीर को तुरंत ऊर्जा प्रदान करता है?',
            hint: 'Carbs.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Carbohydrates (कार्बोहाइड्रेट)', hi: 'कार्बोहाइड्रेट', correct: true },
              { key: 'B', en: 'Proteins (प्रोटीन)', hi: 'प्रोटीन', correct: false },
              { key: 'C', en: 'Vitamins (विटामिन)', hi: 'विटामिन', correct: false },
              { key: 'D', en: 'Minerals (खनिज)', hi: 'खनिज', correct: false },
            ]
          },
          {
            no: 3, type: 'text_mcq', marks: 2,
            q_en: 'What is the boiling point of pure water at sea level?',
            q_hi: 'शुद्ध जल का क्वथनांक (Boiling point) कितना होता है?',
            hint: 'Water boils at this Celsius temperature.',
            ans: 'b',
            options: [
              { key: 'A', en: '0°C', hi: '0°C', correct: false },
              { key: 'B', en: '100°C', hi: '100°C', correct: true },
              { key: 'C', en: '50°C', hi: '50°C', correct: false },
              { key: 'D', en: '212°C', hi: '212°C', correct: false },
            ]
          },
          {
            no: 4, type: 'text_mcq', marks: 2,
            q_en: 'Which part of the skeleton protects the human brain?',
            q_hi: 'मानव मस्तिष्क की रक्षा कंकाल का कौन सा भाग करता है?',
            hint: 'Head bone structure.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Skull / Cranium (खोपड़ी)', hi: 'खोपड़ी (कपाल)', correct: true },
              { key: 'B', en: 'Ribcage (पसली पिंजर)', hi: 'पसली पिंजर', correct: false },
              { key: 'C', en: 'Spine (रीढ़ की हड्डी)', hi: 'रीढ़ की हड्डी', correct: false },
              { key: 'D', en: 'Pelvis (श्रोणि)', hi: 'श्रोणि', correct: false },
            ]
          },
          {
            no: 5, type: 'text_mcq', marks: 2,
            q_en: 'Which of the following is a non-magnetic material?',
            q_hi: 'निम्नलिखित में से कौन सा अचुंबकीय (non-magnetic) पदार्थ है?',
            hint: 'Magnets will not attract this.',
            ans: 'd',
            options: [
              { key: 'A', en: 'Iron (लोहा)', hi: 'लोहा', correct: false },
              { key: 'B', en: 'Nickel (निकल)', hi: 'निकल', correct: false },
              { key: 'C', en: 'Cobalt (कोबाल्ट)', hi: 'कोबाल्ट', correct: false },
              { key: 'D', en: 'Wood (लकड़ी)', hi: 'लकड़ी', correct: true },
            ]
          },
          {
            no: 6, type: 'text_mcq', marks: 2,
            q_en: 'The process of turning water into vapor is called:',
            q_hi: 'जल का वाष्प में बदलने की प्रक्रिया क्या कहलाती है?',
            hint: 'Drying clothes under sunlight.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Condensation (संघनन)', hi: 'संघनन', correct: false },
              { key: 'B', en: 'Evaporation (वाष्पीकरण)', hi: 'वाष्पीकरण', correct: true },
              { key: 'C', en: 'Precipitation (वर्षण)', hi: 'वर्षण', correct: false },
              { key: 'D', en: 'Transpiration (वाष्पोत्सर्जन)', hi: 'वाष्पोत्सर्जन', correct: false },
            ]
          },
          {
            no: 7, type: 'text_mcq', marks: 2,
            q_en: 'Which gas is highest in Earth\'s atmosphere (approx 78%)?',
            q_hi: 'वायुमंडल में सबसे अधिक मात्रा (लगभग 78%) में कौन सी गैस होती है?',
            hint: 'Major atmospheric gas.',
            ans: 'c',
            options: [
              { key: 'A', en: 'Oxygen (ऑक्सीजन)', hi: 'ऑक्सीजन', correct: false },
              { key: 'B', en: 'Carbon dioxide', hi: 'कार्बन डाइऑक्साइड', correct: false },
              { key: 'C', en: 'Nitrogen (नाइट्रोजन)', hi: 'नाइट्रोजन', correct: true },
              { key: 'D', en: 'Hydrogen', hi: 'हाइड्रोजन', correct: false },
            ]
          },
          {
            no: 8, type: 'text_mcq', marks: 2,
            q_en: 'Which nutrient is necessary for muscle building and body repair?',
            q_hi: 'मांसपेशियों के निर्माण और शरीर की मरम्मत के लिए क्या आवश्यक है?',
            hint: 'Found in eggs, pulses, milk.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Fat (वसा)', hi: 'वसा', correct: false },
              { key: 'B', en: 'Protein (प्रोटीन)', hi: 'प्रोटीन', correct: true },
              { key: 'C', en: 'Sugar (शर्करा)', hi: 'शर्करा', correct: false },
              { key: 'D', en: 'Roughage (रूक्षांश)', hi: 'रूक्षांश', correct: false },
            ]
          },
          {
            no: 9, type: 'text_mcq', marks: 2,
            q_en: 'Which of the following is a nocturnal animal (सक्रिय रात में)?',
            q_hi: 'इनमें से कौन सा निशाचर (रात में जागने वाला) जीव है?',
            hint: 'Hoo-hoo sounds at night.',
            ans: 'a',
            options: [
              { key: 'A', en: 'Owl (उल्लू)', hi: 'उल्लू', correct: true },
              { key: 'B', en: 'Eagle (चील)', hi: 'चील', correct: false },
              { key: 'C', en: 'Crow (कौआ)', hi: 'कौआ', correct: false },
              { key: 'D', en: 'Pigeon (कबूतर)', hi: 'कबूतर', correct: false },
            ]
          },
          {
            no: 10, type: 'text_mcq', marks: 2,
            q_en: 'Which plant grows in desert areas with thorns instead of leaves?',
            q_hi: 'रेगिस्तान में पत्तियों की जगह कांटों वाला कौन सा पौधा उगता है?',
            hint: 'Cactus.',
            ans: 'b',
            options: [
              { key: 'A', en: 'Rose (गुलाब)', hi: 'गुलाब', correct: false },
              { key: 'B', en: 'Cactus (नागफनी/कैक्टस)', hi: 'नागफनी (कैक्टस)', correct: true },
              { key: 'C', en: 'Tulsi (तुलसी)', hi: 'तुलसी', correct: false },
              { key: 'D', en: 'Neem (नीम)', hi: 'नीम', correct: false },
            ]
          },
        ]
      }
    ];

    for (const p of papersData) {
      // 1. Insert or update paper
      const pRes = await client.query(`
        INSERT INTO sd_assessment_papers (
          paper_code, title, title_hi, class_no, subject, total_questions, total_marks, duration_minutes, academic_year, instructions_en, instructions_hi, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (paper_code) DO UPDATE SET 
          title = EXCLUDED.title,
          title_hi = EXCLUDED.title_hi,
          class_no = EXCLUDED.class_no,
          subject = EXCLUDED.subject,
          total_questions = EXCLUDED.total_questions,
          total_marks = EXCLUDED.total_marks,
          duration_minutes = EXCLUDED.duration_minutes,
          is_active = true
        RETURNING id
      `, [p.paper_code, p.title, p.title_hi, p.class_no, p.subject, p.total_questions, p.total_marks, p.duration_minutes, p.academic_year, p.instructions_en, p.instructions_hi]);

      const paperId = pRes.rows[0].id;

      // 2. Insert questions
      for (const q of p.questions) {
        const qRes = await client.query(`
          INSERT INTO sd_mobile_questions (
            paper_id, question_number, question_text_en, question_text_hi, question_type, marks, hint, answer_text
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (paper_id, question_number) DO UPDATE SET
            question_text_en = EXCLUDED.question_text_en,
            question_text_hi = EXCLUDED.question_text_hi,
            question_type = EXCLUDED.question_type,
            marks = EXCLUDED.marks,
            hint = EXCLUDED.hint,
            answer_text = EXCLUDED.answer_text
          RETURNING id
        `, [paperId, q.no, q.q_en, q.q_hi, q.type, q.marks, q.hint, q.ans]);

        const questionId = qRes.rows[0].id;

        // 3. Insert options
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
      console.log(`✅ Seeded Paper ${p.paper_code} (${p.subject} Class ${p.class_no}) with ${p.questions.length} questions`);
    }

    await client.query('COMMIT');
    console.log('🎉 All mobile mock test dummy data successfully seeded!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding mobile mock data:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedMobileMockData().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = seedMobileMockData;
