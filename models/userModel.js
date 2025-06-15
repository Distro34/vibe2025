const pool = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByUsername(username) {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }
  
  static async findByTelegramChatId(chatId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE telegram_chat_id = ?', [chatId]);
    return rows[0];
  }

  static async create(username, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );
    
    return result.insertId;
  }

  static async setTelegramChatId(userId, chatId) {
    await pool.query(
      'UPDATE users SET telegram_chat_id = ? WHERE id = ?',
      [chatId, userId]
    );
  }
}

module.exports = User;