const pool = require('../config/db');

class Task {
  static async getAll(userId) {
    const [rows] = await pool.query(
      'SELECT id, user_id, text, completed, created_at FROM tasks WHERE user_id = ?', 
      [userId]
    );
    return rows;
  }

  static async create(userId, text) {
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, text) VALUES (?, ?)',
      [userId, text]
    );
    return result.insertId;
  }

  static async update(id, text) {
    await pool.query(
      'UPDATE tasks SET text = ? WHERE id = ?',
      [text, id]
    );
  }

  static async delete(id) {
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
  }
}

module.exports = Task;