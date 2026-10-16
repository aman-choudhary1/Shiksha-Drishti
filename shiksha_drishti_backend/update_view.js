require('dotenv').config();
const pool = require('./src/config/db');

async function updateView() {
  try {
    await pool.query(`
      CREATE OR REPLACE VIEW vw_sd_assessment_status AS
      SELECT 
          a.id AS assessment_id,
          a.school_udise,
          a.class_id,
          a.academic_year_id,
          a.assessment_name,
          a.status,
          a.created_by,
          COALESCE((
            SELECT COUNT(DISTINCT sm.student_id) 
            FROM sd_subject_marks sm 
            WHERE sm.assessment_id = a.id AND sm.marks_obtained IS NOT NULL
          ), 0) AS students_with_subject_marks,
          COALESCE((
            SELECT COUNT(DISTINCT qm.student_id) 
            FROM sd_question_marks qm 
            WHERE qm.assessment_id = a.id
          ), 0) AS students_with_question_marks,
          COALESCE(
            NULLIF((SELECT COUNT(*) FROM sd_students st 
                    WHERE st.school_udise = a.school_udise 
                      AND st.class_id = a.class_id 
                      AND st.academic_year_id = a.academic_year_id 
                      AND st.is_active = true), 0),
            (SELECT COUNT(*) FROM sd_students st 
             WHERE st.school_udise = a.school_udise 
               AND st.class_id = a.class_id 
               AND st.is_active = true)
          ) AS total_students
      FROM sd_assessments a;
    `);
    console.log('View updated successfully!');

    const check = await pool.query('SELECT * FROM vw_sd_assessment_status WHERE assessment_id IN (290, 291, 1, 2) ORDER BY assessment_id');
    console.log('Sample rows:', check.rows);

    // Also let's assign Class 9 and Class 10 to teacher.ananya if not assigned
    const ananyaUser = (await pool.query("SELECT id, primary_udise FROM sd_users WHERE username = 'teacher.ananya'")).rows[0];
    if (ananyaUser) {
      await pool.query(`
        INSERT INTO sd_teacher_assignments (user_id, school_udise, class_id, academic_year_id, is_active)
        VALUES 
          ($1, $2, '9', '3', true),
          ($1, $2, '10', '3', true)
        ON CONFLICT DO NOTHING
      `, [ananyaUser.id, ananyaUser.primary_udise]);
      console.log('Class 9 and 10 assigned to teacher.ananya!');
    }

  } catch (err) {
    console.error('Error updating view:', err);
  } finally {
    await pool.end();
  }
}

updateView();
