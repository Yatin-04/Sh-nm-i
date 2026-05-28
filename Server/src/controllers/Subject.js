
import { insertSubject, getSubjectsByUserId } from '../models/Subject.js';

export const createSubject = async (req, res) => {
  try {
    const { subject_name, user_id } = req.body;

    // Basic validation
    if (!subject_name || !user_id) {
      return res.status(400).json({ error: 'Subject name and user ID are required.' });
    }

    // Call the model function
    const newSubject = await insertSubject(subject_name, user_id);

    res.status(201).json({
      message: 'Subject created successfully',
      subject: newSubject
    });

  } catch (error) {
    // PostgreSQL Error Code 23503: Foreign Key Violation
    if (error.code === '23503') {
      return res.status(404).json({ error: 'The provided user_id does not exist.' });
    }
    
    console.error('Error creating subject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserSubjects = async (req, res) => {
  try {
    // Usually, this comes from the URL (e.g., /api/users/:user_id/subjects)
    const { user_id } = req.params; 

    const subjects = await getSubjectsByUserId(user_id);

    res.status(200).json({ subjects });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};