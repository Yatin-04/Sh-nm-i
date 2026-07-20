
import { insertSubject, getSubjectsByUserId, deleteSubjectById } from '../models/subject.js';

export const createSubject = async (req, res) => {
  try {
    const { subject_name } = req.body;
    const user_id = req.user.id;

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
    const user_id = req.user.id; 

    const subjects = await getSubjectsByUserId(user_id);

    res.status(200).json({ subjects });

  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await deleteSubjectById(id, userId);
    if (!deleted) {
      return res.status(404).json({ error: 'Subject not found or unauthorized' });
    }

    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};