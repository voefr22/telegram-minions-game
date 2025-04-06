// server.js - основной файл сервера для рейтинга Minions Game
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Инициализация Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Пути к файлам с данными
const LEADERBOARD_FILE = path.join(__dirname, 'data', 'leaderboard.json');
const ACHIEVEMENTS_FILE = path.join(__dirname, 'data', 'achievements.json');
const FRIENDS_FILE = path.join(__dirname, 'data', 'friends.json');

// Обеспечиваем наличие директории для данных
async function ensureDataDir() {
  try {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
  } catch (err) {
    console.error('Ошибка при создании директории данных:', err);
  }
}

// Загрузка данных из файла
async function loadData(filePath, defaultData = {}) {
  try {
    await ensureDataDir();
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log(`Файл ${filePath} не найден, создаем новый...`);
      await fs.writeFile(filePath, JSON.stringify(defaultData));
      return defaultData;
    } else {
      console.error(`Ошибка при чтении файла ${filePath}:`, err);
      throw err;
    }
  }
}

// Сохранение данных в файл
async function saveData(filePath, data) {
  try {
    await ensureDataDir();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Ошибка при сохранении данных в файл ${filePath}:`, err);
    throw err;
  }
}

// Проверка Telegram авторизации
function verifyTelegramAuth(initData) {
  // В реальном проекте здесь должна быть проверка подписи данных
  // Для упрощения примера пропускаем проверку
  return true;
}

// API Endpoints

// Получение рейтинга лидеров
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboardData = await loadData(LEADERBOARD_FILE, { global: [], friends: {} });
    
    // Сортируем глобальный рейтинг по убыванию счета
    leaderboardData.global.sort((a, b) => b.score - a.score);
    
    // Подготавливаем ответ
    const response = {
      global: leaderboardData.global,
      timestamp: Date.now()
    };
    
    res.json(response);
  } catch (err) {
    console.error('Ошибка при получении данных рейтинга:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении данных рейтинга' });
  }
});

// Получение рейтинга друзей
app.get('/api/leaderboard/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const leaderboardData = await loadData(LEADERBOARD_FILE, { global: [], friends: {} });
    const friendsData = await loadData(FRIENDS_FILE, {});
    
    // Получаем список друзей пользователя
    const userFriends = friendsData[userId] || [];
    
    // Находим данные друзей в глобальном рейтинге
    const friendsLeaderboard = leaderboardData.global.filter(player => 
      userFriends.includes(player.id.toString()) || player.id.toString() === userId
    );
    
    // Сортируем по убыванию счета
    friendsLeaderboard.sort((a, b) => b.score - a.score);
    
    // Отмечаем текущего пользователя
    friendsLeaderboard.forEach(player => {
      player.isMe = player.id.toString() === userId;
    });
    
    res.json({
      friends: friendsLeaderboard,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Ошибка при получении данных рейтинга друзей:', err);
    res.status(500).json({ error: 'Ошибка сервера при получении данных рейтинга друзей' });
  }
});

// Обновление данных пользователя в рейтинге
app.post('/api/leaderboard/update', async (req, res) => {
  try {
    const { initData, userData } = req.body;
    
    // Проверяем данные аутентификации
    if (!initData || !userData) {
      return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
    }
    
    // Проверяем Telegram подпись
    if (!verifyTelegramAuth(initData)) {
      return res.status(401).json({ error: 'Ошибка аутентификации' });
    }
    
    const userId = userData.id.toString();
    const username = userData.username || userData.first_name || 'Player';
    const level = userData.level || 1;
    const score = userData.score || 0;
    const avatar = userData.avatar || null;
    
    // Загружаем текущие данные рейтинга
    const leaderboardData = await loadData(LEADERBOARD_FILE, { global: [], friends: {} });
    
    // Обновляем или добавляем данные пользователя
    const existingUserIndex = leaderboardData.global.findIndex(player => player.id.toString() === userId);
    
    if (existingUserIndex !== -1) {
      // Обновляем существующего пользователя
      leaderboardData.global[existingUserIndex] = {
        ...leaderboardData.global[existingUserIndex],
        username,
        level,
        score,
        avatar,
        lastUpdate: Date.now()
      };
    } else {
      // Добавляем нового пользователя
      leaderboardData.global.push({
        id: userId,
        username,
        level,
        score,
        avatar,
        joinDate: Date.now(),
        lastUpdate: Date.now()
      });
    }
    
    // Сортируем глобальный рейтинг по убыванию счета
    leaderboardData.global.sort((a, b) => b.score - a.score);
    
    // Сохраняем обновленные данные
    await saveData(LEADERBOARD_FILE, leaderboardData);
    
    // Возвращаем текущую позицию пользователя в рейтинге
    const userPosition = leaderboardData.global.findIndex(player => player.id.toString() === userId) + 1;
    
    res.json({
      success: true,
      position: userPosition,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Ошибка при обновлении данных пользователя:', err);
    res.status(500).json({ error: 'Ошибка сервера при обновлении данных пользователя' });
  }
});

// Добавление друга
app.post('/api/friends/add', async (req, res) => {
  try {
    const { initData, userId, friendId } = req.body;
    
    // Проверяем данные
    if (!initData || !userId || !friendId) {
      return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
    }
    
    // Проверяем Telegram подпись
    if (!verifyTelegramAuth(initData)) {
      return res.status(401).json({ error: 'Ошибка аутентификации' });
    }
    
    // Загружаем список друзей
    const friendsData = await loadData(FRIENDS_FILE, {});
    
    // Инициализируем список друзей пользователя, если его нет
    if (!friendsData[userId]) {
      friendsData[userId] = [];
    }
    
    // Добавляем друга, если его еще нет в списке
    if (!friendsData[userId].includes(friendId)) {
      friendsData[userId].push(friendId);
    }
    
    // Сохраняем обновленные данные
    await saveData(FRIENDS_FILE, friendsData);
    
    res.json({
      success: true,
      friendCount: friendsData[userId].length,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Ошибка при добавлении друга:', err);
    res.status(500).json({ error: 'Ошибка сервера при добавлении друга' });
  }
});

// Регистрация достижения
app.post('/api/achievements/register', async (req, res) => {
  try {
    const { initData, userId, achievement } = req.body;
    
    // Проверяем данные
    if (!initData || !userId || !achievement || !achievement.type) {
      return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
    }
    
    // Проверяем Telegram подпись
    if (!verifyTelegramAuth(initData)) {
      return res.status(401).json({ error: 'Ошибка аутентификации' });
    }
    
    // Загружаем достижения
    const achievementsData = await loadData(ACHIEVEMENTS_FILE, {});
    
    // Инициализируем список достижений пользователя, если его нет
    if (!achievementsData[userId]) {
      achievementsData[userId] = [];
    }
    
    // Добавляем достижение
    achievementsData[userId].push({
      ...achievement,
      timestamp: Date.now()
    });
    
    // Сохраняем обновленные данные
    await saveData(ACHIEVEMENTS_FILE, achievementsData);
    
    res.json({
      success: true,
      achievementCount: achievementsData[userId].length,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Ошибка при регистрации достижения:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации достижения' });
  }
});

// Регистрация нового рекорда
app.post('/api/leaderboard/record', async (req, res) => {
  try {
    const { initData, userId, score, level, totalBananas } = req.body;
    
    // Проверяем данные
    if (!initData || !userId || score === undefined) {
      return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
    }
    
    // Проверяем Telegram подпись
    if (!verifyTelegramAuth(initData)) {
      return res.status(401).json({ error: 'Ошибка аутентификации' });
    }
    
    // Загружаем данные рейтинга
    const leaderboardData = await loadData(LEADERBOARD_FILE, { global: [], friends: {} });
    
    // Находим пользователя в рейтинге
    const userIndex = leaderboardData.global.findIndex(player => player.id.toString() === userId);
    
    // Обновляем только если новый счет больше предыдущего
    if (userIndex !== -1) {
      const currentPlayer = leaderboardData.global[userIndex];
      if (score > currentPlayer.score) {
        currentPlayer.score = score;
        if (level) currentPlayer.level = level;
        if (totalBananas) currentPlayer.totalBananas = totalBananas;
        currentPlayer.lastUpdate = Date.now();
      }
    } else {
      // Пользователя нет в рейтинге, добавляем
      leaderboardData.global.push({
        id: userId,
        username: 'Player',  // В реальном приложении здесь будет имя из Telegram
        level: level || 1,
        score: score,
        totalBananas: totalBananas || score,
        joinDate: Date.now(),
        lastUpdate: Date.now()
      });
    }
    
    // Сортируем глобальный рейтинг
    leaderboardData.global.sort((a, b) => b.score - a.score);
    
    // Сохраняем обновленные данные
    await saveData(LEADERBOARD_FILE, leaderboardData);
    
    // Определяем позицию пользователя в рейтинге
    const position = leaderboardData.global.findIndex(player => player.id.toString() === userId) + 1;
    
    res.json({
      success: true,
      position: position,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Ошибка при регистрации рекорда:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации рекорда' });
  }
});

// Обработка обратного вызова от бота Telegram
app.post('/api/telegram/callback', (req, res) => {
  try {
    const { update } = req.body;
    
    // Проверяем данные
    if (!update) {
      return res.status(400).json({ error: 'Отсутствуют необходимые данные' });
    }
    
    // Обрабатываем различные типы обновлений от бота
    if (update.message) {
      // Обработка обычных сообщений
      console.log('Получено сообщение от пользователя:', update.message.from.id);
    } else if (update.callback_query) {
      // Обработка callback query (нажатия на кнопки)
      console.log('Получен callback_query от пользователя:', update.callback_query.from.id);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка при обработке запроса от Telegram:', err);
    res.status(500).json({ error: 'Ошибка сервера при обработке запроса от Telegram' });
  }
});

// Запуск сервера
app.listen(PORT, async () => {
  try {
    await ensureDataDir();
    console.log(`Сервер запущен на порту ${PORT}`);
  } catch (err) {
    console.error('Ошибка при запуске сервера:', err);
  }
});
