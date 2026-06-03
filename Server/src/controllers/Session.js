
import { insertSession, completeSession, getSessionsBySubjectId } from '../models/Session.js';

export const startSession = async (req, res) => {
  try {
    // Extract the new fields from req.body
    const { 
      subject_id, 
      session_type, 
      date,              // Expected format: 'YYYY-MM-DD'
      planned_duration   // Expected format: integer
    } = req.body;
    
    // Extract the user_id from the decoded JWT
    const user_id = req.user.id; 

    if (!subject_id || !session_type) {
      return res.status(400).json({ error: 'subject_id and session_type are required.' });
    }

    if (session_type !== 'focus' && session_type !== 'break') {
      return res.status(400).json({ error: 'session_type must be either "focus" or "break".' });
    }

    // Pass the new variables into the model function including user_id
    const newSession = await insertSession(subject_id, session_type, date, planned_duration, user_id);

    res.status(201).json({
      message: 'Session started successfully',
      session: newSession
    });

  } catch (error) {
    if (error.code === '23503') {
      return res.status(404).json({ error: 'The provided subject_id does not exist.' });
    }
    console.error('Error starting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const endSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    const { actual_duration } = req.body; // Expecting the client to send the calculated duration in seconds

    if (actual_duration === undefined) {
      return res.status(400).json({ error: 'actual_duration (in seconds) is required to complete the session.' });
    }

    const updatedSession = await completeSession(session_id, actual_duration);

    if (!updatedSession) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    res.status(200).json({
      message: 'Session completed successfully',
      session: updatedSession
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSubjectSessions = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const sessions = await getSessionsBySubjectId(subject_id);
    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};