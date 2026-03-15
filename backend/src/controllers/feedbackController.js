import Feedback from '../models/Feedback.js';

export const submitFeedback = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      text: text.trim()
    });

    await feedback.populate('user', 'name email role');

    res.status(201).json({
      message: 'Thank you for your feedback.',
      feedback
    });
  } catch (error) {
    next(error);
  }
};

/** Managers and admins can see all team feedback. Only feedback from the last 7 days is shown; older feedback expires. */
export const getAllFeedback = async (req, res, next) => {
  try {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const list = await Feedback.find({ createdAt: { $gte: oneWeekAgo } })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(list);
  } catch (error) {
    next(error);
  }
};
