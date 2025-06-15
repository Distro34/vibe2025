const Task = require('../models/taskModel');
const User = require('../models/userModel');
const telegram = require('./telegramController');

exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.getAll(req.user.id);
    return res.json(tasks);
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.createTask = async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Текст задачи обязателен' });
  }

  try {
    const taskId = await Task.create(req.user.id, text);
    
    // Отправляем ответ клиенту
    res.status(201).json({ 
      id: taskId, 
      text, 
      completed: false,
      created_at: new Date().toISOString()
    });
    
    // Отправляем уведомление в Telegram асинхронно
    setTimeout(async () => {
      try {
        const user = await User.findById(req.user.id);
        if (user && user.telegram_chat_id) {
          await telegram.sendNotification(user.telegram_chat_id, `Новая задача: ${text}`);
        }
      } catch (telegramError) {
        console.error('Ошибка при отправке в Telegram:', telegramError);
      }
    }, 100);
    
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: 'Текст задачи обязателен' });
  }

  try {
    await Task.update(id, text);
    return res.json({ id, text });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  try {
    await Task.delete(id);
    return res.json({ message: 'Задача удалена' });
  } catch (error) {
    return res.status(500).json({ message: 'Ошибка сервера' });
  }
};