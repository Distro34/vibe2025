require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const todoRoutes = require('./routes/todoRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);

// Запуск Telegram бота
require('./controllers/telegramController');

// Обработка 404
app.use((req, res) => {
    res.status(404).send('Страница не найдена');
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});