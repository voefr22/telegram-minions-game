// bot.js - Telegram бот для интеграции с рейтингом Minions Game
const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Загрузка конфигурации
const config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '7977313799:AAGsf-RCrDZTDZtkdQiVLbLPGWmCG-cgYrU',
  apiUrl: process.env.API_URL || 'http://localhost:3000/api',
  adminIds: (process.env.ADMIN_IDS || '').split(',')
};

// Инициализация бота
const bot = new Telegraf(config.botToken);

// Пути к файлам с данными
const USERS_FILE = path.join(__dirname, 'data', 'users.json');
const STATS_FILE = path.join(__dirname, 'data', 'stats.json');

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

// Форматирование сообщения с рейтингом
function formatLeaderboardMessage(leaderboard, title = 'Глобальный рейтинг Minions Game') {
  let message = `🏆 *${title}* 🏆\n\n`;
  
  leaderboard.slice(0, 10).forEach((player, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    message += `${medal} *${player.username}* - ${player.score.toLocaleString()} 🍌 (Уровень ${player.level})\n`;
  });
  
  message += '\n🕒 Обновлено: ' + new Date().toLocaleString();
  
  return message;
}

// Регистрация пользователя
async function registerUser(ctx) {
  const userId = ctx.from.id.toString();
  const username = ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim();
  
  try {
    const users = await loadData(USERS_FILE, {});
    
    // Если пользователь уже зарегистрирован, обновляем данные
    if (users[userId]) {
      users[userId] = {
        ...users[userId],
        username: username,
        lastActivity: Date.now()
      };
    } else {
      // Регистрируем нового пользователя
      users[userId] = {
        id: userId,
        username: username,
        registered: Date.now(),
        lastActivity: Date.now(),
        hasPlayed: false
      };
    }
    
    await saveData(USERS_FILE, users);
    
    // Обновляем статистику
    const stats = await loadData(STATS_FILE, { totalUsers: 0, activeUsers: 0, totalGames: 0 });
    stats.totalUsers = Object.keys(users).length;
    await saveData(STATS_FILE, stats);
    
    return true;
  } catch (err) {
    console.error('Ошибка при регистрации пользователя:', err);
    return false;
  }
}

// Обработчики команд

// Команда /start
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Регистрируем пользователя
    await registerUser(ctx);
    
    // Проверяем наличие реферального кода
    const startParam = ctx.startPayload;
    if (startParam && startParam.startsWith('ref_')) {
      const referrerId = startParam.replace('ref_', '');
      console.log(`Пользователь ${userId} пришел по реферальной ссылке от ${referrerId}`);
      
      // Отправляем запрос на сервер для добавления друга
      try {
        await axios.post(`${config.apiUrl}/friends/add`, {
          userId: referrerId,
          friendId: userId
        });
        
        // Также добавляем обратную связь
        await axios.post(`${config.apiUrl}/friends/add`, {
          userId: userId,
          friendId: referrerId
        });
      } catch (err) {
        console.error('Ошибка при добавлении друга:', err);
      }
    }
    
    // Отправляем приветственное сообщение
    ctx.reply(`Привет, ${ctx.from.first_name || 'друг'}! 👋\n\nДобро пожаловать в Minions Game! Собирай бананы, открывай боксы и соревнуйся с друзьями.\n\nНажми кнопку ниже, чтобы начать игру.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
          [{ text: '🏆 Рейтинг лидеров', callback_data: 'leaderboard' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при обработке команды /start:', err);
    ctx.reply('Произошла ошибка при запуске бота. Пожалуйста, попробуйте позже.');
  }
});

// Команда /leaderboard - Получение рейтинга
bot.command('leaderboard', async (ctx) => {
  try {
    // Получаем глобальный рейтинг с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard`);
    const leaderboard = response.data.global;
    
    if (!leaderboard || leaderboard.length === 0) {
      return ctx.answerCbQuery('Рейтинг пока пуст. Будьте первым!');
    }
    
    // Форматируем и отправляем сообщение с рейтингом
    const message = formatLeaderboardMessage(leaderboard);
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '👨‍👩‍👧‍👦 Рейтинг друзей', callback_data: 'friends_leaderboard' }],
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении рейтинга:', err);
    ctx.answerCbQuery('Ошибка при получении рейтинга');
  }
});

// Обработка callback 'friends_leaderboard'
bot.action('friends_leaderboard', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Получаем рейтинг друзей с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard/friends/${userId}`);
    const friendsLeaderboard = response.data.friends;
    
    if (!friendsLeaderboard || friendsLeaderboard.length <= 1) {
      await ctx.answerCbQuery('У вас пока нет друзей в игре');
      return ctx.editMessageText('У вас пока нет друзей в игре. Пригласите их с помощью команды /invite.', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📲 Пригласить друзей', callback_data: 'invite' }],
            [{ text: '🌎 Глобальный рейтинг', callback_data: 'leaderboard' }]
          ]
        }
      });
    }
    
    // Форматируем и отправляем сообщение с рейтингом друзей
    const message = formatLeaderboardMessage(friendsLeaderboard, 'Рейтинг ваших друзей');
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌎 Глобальный рейтинг', callback_data: 'leaderboard' }],
          [{ text: '📲 Пригласить друзей', callback_data: 'invite' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении рейтинга друзей:', err);
    ctx.answerCbQuery('Ошибка при получении рейтинга друзей');
  }
});

// Обработка callback 'invite'
bot.action('invite', async (ctx) => {
  const userId = ctx.from.id.toString();
  const inviteLink = `https://t.me/minions_game_bot?start=ref_${userId}`;
  
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText(`🎮 *Пригласите друзей в Minions Game!* 🎮\n\nОтправьте эту ссылку друзьям, чтобы пригласить их в игру. За каждого приглашенного друга вы получите бонусные бананы!\n\n${inviteLink}`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔙 Вернуться к рейтингу', callback_data: 'leaderboard' }],
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при создании приглашения:', err);
    ctx.answerCbQuery('Ошибка при создании приглашения');
  }
});

// Обработка WebApp данных
bot.on('web_app_data', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Обрабатываем полученные данные от WebApp
    const data = JSON.parse(ctx.webAppData.data);
    console.log(`Получены данные от WebApp от пользователя ${userId}:`, data);
    
    // Проверяем тип запроса
    if (data.action === 'get_leaderboard') {
      // Запрос на получение рейтинга
      const leaderboardResponse = await axios.get(`${config.apiUrl}/leaderboard`);
      const friendsResponse = await axios.get(`${config.apiUrl}/leaderboard/friends/${userId}`);
      
      // Отправляем данные о рейтинге через MainButton
      // (в реальном сценарии здесь будет другой механизм передачи данных)
      ctx.reply('Данные рейтинга обновлены в игре');
    } else if (data.action === 'update_score') {
      // Обновление счета пользователя
      await axios.post(`${config.apiUrl}/leaderboard/update`, {
        initData: {
          user: {
            id: userId
          }
        },
        userData: {
          id: userId,
          username: ctx.from.username || `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim(),
          level: data.level,
          score: data.score,
          totalBananas: data.totalBananas
        }
      });
      
      // Получаем обновленные данные о рейтинге
      const response = await axios.get(`${config.apiUrl}/leaderboard`);
      const leaderboard = response.data.global;
      
      // Определяем позицию игрока в рейтинге
      const position = leaderboard.findIndex(player => player.id.toString() === userId) + 1;
      
      ctx.reply(`🏆 Ваш счет обновлен!\n\nПозиция в рейтинге: ${position}\nБананов: ${data.score.toLocaleString()}\nУровень: ${data.level}`);
    } else if (data.action === 'register_achievement') {
      // Регистрация достижения
      await axios.post(`${config.apiUrl}/achievements/register`, {
        initData: {
          user: {
            id: userId
          }
        },
        userId: userId,
        achievement: data.achievement
      });
      
      ctx.reply(`🎖 Достижение получено: ${data.achievement.title}`);
    }
  } catch (err) {
    console.error('Ошибка при обработке данных WebApp:', err);
    ctx.reply('Произошла ошибка при обработке данных. Пожалуйста, попробуйте еще раз.');
  }
});

// Команда /admin - Административные функции (только для администраторов)
bot.command('admin', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  // Проверяем, является ли пользователь администратором
  if (!config.adminIds.includes(userId)) {
    return ctx.reply('У вас нет доступа к административным функциям.');
  }
  
  try {
    // Загружаем статистику
    const stats = await loadData(STATS_FILE, { totalUsers: 0, activeUsers: 0, totalGames: 0 });
    const users = await loadData(USERS_FILE, {});
    
    // Считаем активных пользователей (активность за последние 7 дней)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const activeUsers = Object.values(users).filter(user => user.lastActivity > sevenDaysAgo).length;
    
    // Обновляем статистику
    stats.activeUsers = activeUsers;
    await saveData(STATS_FILE, stats);
    
    // Формируем сообщение со статистикой
    const message = `📊 *Статистика Minions Game* 📊\n\n` +
      `👥 *Всего пользователей:* ${stats.totalUsers}\n` +
      `👤 *Активных пользователей (7 дней):* ${stats.activeUsers}\n` +
      `🎮 *Всего игр:* ${stats.totalGames}\n` +
      `🕒 *Обновлено:* ${new Date().toLocaleString()}`;
    
    ctx.replyWithMarkdown(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔄 Обновить рейтинг', callback_data: 'admin_refresh_leaderboard' }],
          [{ text: '📤 Экспорт данных', callback_data: 'admin_export_data' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении статистики:', err);
    ctx.reply('Произошла ошибка при получении статистики. Пожалуйста, попробуйте позже.');
  }
});

// Обработка callback 'admin_refresh_leaderboard'
bot.action('admin_refresh_leaderboard', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  // Проверяем, является ли пользователь администратором
  if (!config.adminIds.includes(userId)) {
    return ctx.answerCbQuery('У вас нет доступа к административным функциям');
  }
  
  try {
    await ctx.answerCbQuery('Обновление рейтинга...');
    
    // Здесь можно добавить код для принудительного обновления кеша рейтинга на сервере
    
    ctx.reply('Рейтинг успешно обновлен!');
  } catch (err) {
    console.error('Ошибка при обновлении рейтинга:', err);
    ctx.answerCbQuery('Ошибка при обновлении рейтинга');
  }
});

// Обработка callback 'admin_export_data'
bot.action('admin_export_data', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  // Проверяем, является ли пользователь администратором
  if (!config.adminIds.includes(userId)) {
    return ctx.answerCbQuery('У вас нет доступа к административным функциям');
  }
  
  try {
    await ctx.answerCbQuery('Подготовка данных...');
    
    // Загружаем данные
    const users = await loadData(USERS_FILE, {});
    const stats = await loadData(STATS_FILE, { totalUsers: 0, activeUsers: 0, totalGames: 0 });
    
    // Создаем временный файл с данными
    const tempFileName = `export_${Date.now()}.json`;
    const tempFilePath = path.join(__dirname, 'data', tempFileName);
    
    const exportData = {
      users: users,
      stats: stats,
      exportDate: new Date().toISOString()
    };
    
    await fs.writeFile(tempFilePath, JSON.stringify(exportData, null, 2));
    
    // Отправляем файл
    await ctx.replyWithDocument({ source: tempFilePath });
    
    // Удаляем временный файл
    await fs.unlink(tempFilePath);
  } catch (err) {
    console.error('Ошибка при экспорте данных:', err);
    ctx.reply('Произошла ошибка при экспорте данных. Пожалуйста, попробуйте позже.');
  }
});

// Обработка всех остальных сообщений
bot.on('message', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Регистрируем активность пользователя
    const users = await loadData(USERS_FILE, {});
    
    if (users[userId]) {
      users[userId].lastActivity = Date.now();
      await saveData(USERS_FILE, users);
    } else {
      // Пользователь еще не зарегистрирован, регистрируем его
      await registerUser(ctx);
    }
    
    // Отправляем меню
    ctx.reply('🎮 Minions Game - Собирай бананы и соревнуйся с друзьями!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
          [{ text: '🏆 Рейтинг лидеров', callback_data: 'leaderboard' }],
          [{ text: '📲 Пригласить друзей', callback_data: 'invite' }],
          [{ text: '📊 Моя статистика', callback_data: 'mystats' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при обработке сообщения:', err);
  }
});

// Обработка callback 'mystats'
bot.action('mystats', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Получаем глобальный рейтинг с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard`);
    const leaderboard = response.data.global;
    
    // Ищем данные пользователя в рейтинге
    const playerData = leaderboard.find(player => player.id.toString() === userId);
    
    if (!playerData) {
      await ctx.answerCbQuery('Вы еще не играли в игру');
      return ctx.editMessageText('Вы еще не играли в игру. Нажмите кнопку "Играть сейчас", чтобы начать!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
            [{ text: '🔙 Вернуться к меню', callback_data: 'back_to_menu' }]
          ]
        }
      });
    }
    
    // Определяем позицию игрока в рейтинге
    const position = leaderboard.findIndex(player => player.id.toString() === userId) + 1;
    
    // Форматируем и отправляем сообщение со статистикой
    const message = `📊 *Ваша статистика в Minions Game* 📊\n\n` +
      `👤 *Игрок:* ${ctx.from.first_name}\n` +
      `🏆 *Позиция в рейтинге:* ${position} из ${leaderboard.length}\n` +
      `🍌 *Бананов собрано:* ${playerData.score.toLocaleString()}\n` +
      `📈 *Уровень:* ${playerData.level}\n` +
      `🕒 *Последнее обновление:* ${new Date(playerData.lastUpdate).toLocaleString()}`;
    
    await ctx.answerCbQuery();
    await ctx.editMessageText(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
          [{ text: '🏆 Рейтинг лидеров', callback_data: 'leaderboard' }],
          [{ text: '🔙 Вернуться к меню', callback_data: 'back_to_menu' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении статистики игрока:', err);
    ctx.answerCbQuery('Ошибка при получении статистики');
  }
});

// Обработка callback 'back_to_menu'
bot.action('back_to_menu', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.editMessageText('🎮 Minions Game - Собирай бананы и соревнуйся с друзьями!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
          [{ text: '🏆 Рейтинг лидеров', callback_data: 'leaderboard' }],
          [{ text: '📲 Пригласить друзей', callback_data: 'invite' }],
          [{ text: '📊 Моя статистика', callback_data: 'mystats' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при возврате к меню:', err);
    ctx.answerCbQuery('Ошибка при возврате к меню');
  }
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен');
}).catch((err) => {
  console.error('Ошибка при запуске бота:', err);
});

// Обработка остановки
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

    
    if (!leaderboard || leaderboard.length === 0) {
      return ctx.reply('Рейтинг пока пуст. Будьте первым!');
    }
    
    // Форматируем и отправляем сообщение с рейтингом
    const message = formatLeaderboardMessage(leaderboard);
    
    ctx.replyWithMarkdown(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👨‍👩‍👧‍👦 Рейтинг друзей', callback_data: 'friends_leaderboard' }],
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении рейтинга:', err);
    ctx.reply('Произошла ошибка при получении рейтинга. Пожалуйста, попробуйте позже.');
  }
});

// Команда /myfriends - Получение списка друзей
bot.command('myfriends', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Получаем рейтинг друзей с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard/friends/${userId}`);
    const friendsLeaderboard = response.data.friends;
    
    if (!friendsLeaderboard || friendsLeaderboard.length <= 1) {
      return ctx.reply('У вас пока нет друзей в игре. Пригласите их с помощью команды /invite.');
    }
    
    // Форматируем и отправляем сообщение с рейтингом друзей
    const message = formatLeaderboardMessage(friendsLeaderboard, 'Рейтинг ваших друзей');
    
    ctx.replyWithMarkdown(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌎 Глобальный рейтинг', callback_data: 'leaderboard' }],
          [{ text: '📲 Пригласить друзей', callback_data: 'invite' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении рейтинга друзей:', err);
    ctx.reply('Произошла ошибка при получении рейтинга друзей. Пожалуйста, попробуйте позже.');
  }
});

// Команда /invite - Создание реферальной ссылки
bot.command('invite', (ctx) => {
  const userId = ctx.from.id.toString();
  const inviteLink = `https://t.me/minions_game_bot?start=ref_${userId}`;
  
  ctx.replyWithMarkdown(`🎮 *Пригласите друзей в Minions Game!* 🎮\n\nОтправьте эту ссылку друзьям, чтобы пригласить их в игру. За каждого приглашенного друга вы получите бонусные бананы!\n\n${inviteLink}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }]
      ]
    }
  });
});

// Команда /mystats - Статистика игрока
bot.command('mystats', async (ctx) => {
  const userId = ctx.from.id.toString();
  
  try {
    // Получаем глобальный рейтинг с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard`);
    const leaderboard = response.data.global;
    
    // Ищем данные пользователя в рейтинге
    const playerData = leaderboard.find(player => player.id.toString() === userId);
    
    if (!playerData) {
      return ctx.reply('Вы еще не играли в игру. Нажмите кнопку "Играть сейчас", чтобы начать!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }]
          ]
        }
      });
    }
    
    // Определяем позицию игрока в рейтинге
    const position = leaderboard.findIndex(player => player.id.toString() === userId) + 1;
    
    // Форматируем и отправляем сообщение со статистикой
    const message = `📊 *Ваша статистика в Minions Game* 📊\n\n` +
      `👤 *Игрок:* ${ctx.from.first_name}\n` +
      `🏆 *Позиция в рейтинге:* ${position} из ${leaderboard.length}\n` +
      `🍌 *Бананов собрано:* ${playerData.score.toLocaleString()}\n` +
      `📈 *Уровень:* ${playerData.level}\n` +
      `🕒 *Последнее обновление:* ${new Date(playerData.lastUpdate).toLocaleString()}`;
    
    ctx.replyWithMarkdown(message, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Играть сейчас', web_app: { url: 'https://t.me/minions_game_bot/app' } }],
          [{ text: '🏆 Рейтинг лидеров', callback_data: 'leaderboard' }]
        ]
      }
    });
  } catch (err) {
    console.error('Ошибка при получении статистики игрока:', err);
    ctx.reply('Произошла ошибка при получении статистики. Пожалуйста, попробуйте позже.');
  }
});

// Обработчики callback-запросов

// Обработка callback 'leaderboard'
bot.action('leaderboard', async (ctx) => {
  try {
    // Получаем глобальный рейтинг с сервера
    const response = await axios.get(`${config.apiUrl}/leaderboard`);
    const leaderboard = response.data.global;
