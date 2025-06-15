const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  const { username, password } = req.body;

  try {
    const userExists = await User.findByUsername(username);
    if (userExists) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }

    const userId = await User.create(username, password);
    
    res.status(201).json({
      id: userId,
      username,
      token: generateToken(userId)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }

    res.json({
      id: user.id,
      username: user.username,
      token: generateToken(user.id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};