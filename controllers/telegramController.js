const TelegramBot = require('node-telegram-bot-api');
const User = require('../models/userModel');
const Task = require('../models/taskModel');
require('dotenv').config();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Функция для отправки справки
function sendHelp(chatId) {
    bot.sendMessage(
        chatId,
        '📚 *Справка по командам To-Do бота*\n\n' +
        '*/start* - Начать работу с ботом\n' +
        '*/link <логин>* - Привязать ваш аккаунт\n' +
        '*/tasks* - Показать все ваши задачи\n' +
        '*/add <текст>* - Добавить новую задачу\n' +
        '*/help* - Показать эту справку\n\n' +
        'Примеры:\n' +
        '`/link alex123` - Привязать аккаунт\n' +
        '`/add Купить молоко` - Добавить задачу\n' +
        '`/tasks` - Посмотреть все задачи',
        { parse_mode: 'Markdown' }
    );
}

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    sendHelp(chatId);
});

// Обработка команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    sendHelp(chatId);
});

// Привязка Telegram аккаунта
bot.onText(/\/link (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const username = match[1];

    try {
        const user = await User.findByUsername(username);
        if (!user) {
            return bot.sendMessage(
                chatId,
                '❌ Пользователь не найден. Зарегистрируйся сначала в приложении.'
            );
        }

        await User.setTelegramChatId(user.id, chatId);
        bot.sendMessage(
            chatId,
            '✅ Отлично! Твой аккаунт привязан!\n' +
            'Теперь ты будешь получать уведомления о новых задачах.'
        );
    } catch (error) {
        console.error('Ошибка при привязке Telegram:', error);
        bot.sendMessage(chatId, '❌ Ошибка при привязке. Попробуй позже.');
    }
});

// Команда для просмотра задач
bot.onText(/\/tasks/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Находим пользователя по chat_id
        const user = await User.findByTelegramChatId(chatId);
        if (!user) {
            return bot.sendMessage(chatId, '❌ Ваш аккаунт не привязан. Используйте /link <логин>');
        }
        
        // Получаем задачи пользователя
        const tasks = await Task.getAll(user.id);

        if (tasks.length === 0) {
            return bot.sendMessage(chatId, '✅ У вас нет активных задач!');
        }

        // Формируем сообщение с задачами
        let message = '📝 Ваши задачи:\n\n';
        tasks.forEach((task, index) => {
            message += `${index + 1}. ${task.text}\n`;
            message += `   🕒 Создано: ${new Date(task.created_at).toLocaleString()}\n`;
            message += `   ✅ Статус: ${task.completed ? 'Выполнено' : 'Активно'}\n\n`;
        });

        // Добавляем кнопки управления
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: 'Добавить задачу', callback_data: 'add_task' },
                        { text: 'Обновить список', callback_data: 'refresh_tasks' }
                    ]
                ]
            }
        };

        bot.sendMessage(chatId, message, options);
    } catch (error) {
        console.error('Ошибка при получении задач:', error);
        bot.sendMessage(chatId, '❌ Ошибка при загрузке задач. Попробуйте позже.');
    }
});

// Команда для добавления задач через бота
bot.onText(/\/add (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    try {
        const user = await User.findByTelegramChatId(chatId);
        if (!user) {
            return bot.sendMessage(
                chatId, 
                '❌ Ваш аккаунт не привязан. Используйте /link <логин>'
            );
        }

        // Добавляем задачу
        await Task.create(user.id, text);
        bot.sendMessage(chatId, `✅ Задача добавлена: "${text}"`);
    } catch (error) {
        console.error('Ошибка добавления задачи:', error);
        bot.sendMessage(chatId, '❌ Ошибка при добавлении задачи');
    }
});

// Обработка callback-кнопок
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;

    try {
        if (data === 'refresh_tasks') {
            // Удаляем старое сообщение
            await bot.deleteMessage(chatId, messageId);
            
            // Отправляем обновленный список задач
            await bot.sendMessage(chatId, '🔄 Обновление списка задач...');
            
            // Имитируем команду /tasks
            const fakeMessage = { 
                chat: { id: chatId },
                text: '/tasks'
            };
            bot.processUpdate({ message: fakeMessage });
        }
        else if (data === 'add_task') {
            // Запрос на добавление новой задачи
            await bot.sendMessage(chatId, 'Введите текст новой задачи:');
            bot.once('message', async (msg) => {
                if (msg.text && !msg.text.startsWith('/')) {
                    try {
                        // Находим пользователя
                        const user = await User.findByTelegramChatId(chatId);
                        if (!user) {
                            return bot.sendMessage(chatId, '❌ Ваш аккаунт не привязан. Используйте /link <логин>');
                        }
                        
                        // Добавляем задачу
                        await Task.create(user.id, msg.text);
                        
                        bot.sendMessage(chatId, `✅ Задача добавлена: "${msg.text}"`);
                    } catch (error) {
                        console.error('Ошибка добавления задачи:', error);
                        bot.sendMessage(chatId, '❌ Ошибка при добавлении задачи');
                    }
                }
            });
        }
    } catch (error) {
        console.error('Ошибка обработки callback:', error);
        bot.sendMessage(chatId, '❌ Произошла ошибка при обработке запроса');
    }
});

// Функция для отправки уведомлений
exports.sendNotification = (chatId, message) => {
    return bot.sendMessage(chatId, message);
};