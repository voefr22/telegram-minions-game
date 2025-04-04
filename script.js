// Инициализация Telegram WebApp
let tg = null;
try {
    // Проверяем, запущено ли приложение внутри Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        // Сообщаем Telegram, что приложение готово к отображению
        tg.ready();
        // Расширяем на весь экран
        tg.expand();
        
        console.log("Telegram WebApp инициализирован успешно");
        
        // Настраиваем цвета WebApp в соответствии с темой Telegram
        if (tg.colorScheme === 'dark') {
            document.documentElement.classList.add('dark-theme');
        }
    } else {
        console.warn('Приложение запущено вне среды Telegram WebApp');
    }
} catch (e) {
    console.error('Ошибка при инициализации Telegram WebApp:', e);
}

// Пути к изображениям
const IMAGES = {
    minion: 'images/minion.png',
    banana: 'images/banana.png',
    star: 'images/star.png',
    level: 'images/level.png',
    box_simple: 'images/box_simple.png',
    box_standard: 'images/box_standard.png',
    box_premium: 'images/box_premium.png',
    box_mega: 'images/box_mega.png',
    box_special: 'images/box_special.png',
    box_epic: 'images/box_epic.png',
    avatar: 'images/avatar.png',
    gift: 'images/gift.png',
    wheel: 'images/wheel.png'
};

// Предзагрузка изображений
const preloadedImages = {};

function preloadImages() {
    console.log('Начинаем предзагрузку изображений...');
    
    for (const [key, src] of Object.entries(IMAGES)) {
        preloadedImages[key] = new Image();
        preloadedImages[key].src = src;
        preloadedImages[key].onload = () => console.log(`Изображение ${key} загружено`);
        preloadedImages[key].onerror = () => {
            console.warn(`Ошибка загрузки изображения ${key}. Использую fallback`);
            preloadedImages[key].src = 'https://i.imgur.com/ZcukEsb.png'; // Fallback изображение
        };
    }
}

// Получение изображения (с fallback на случай ошибки)
function getImage(key) {
    if (preloadedImages[key] && preloadedImages[key].complete && preloadedImages[key].naturalWidth !== 0) {
        return preloadedImages[key].src;
    }
    // Возвращаем URL изображения или fallback
    return IMAGES[key] || 'https://i.imgur.com/ZcukEsb.png';
}

// Аудио эффекты
const sounds = {
    click: new Audio('https://cdn.freesound.org/previews/220/220206_4100637-lq.mp3'),
    reward: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'),
    task: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
    box: new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'),
    achievement: new Audio('https://cdn.freesound.org/previews/320/320775_1661766-lq.mp3'),
    levelUp: new Audio('https://cdn.freesound.org/previews/522/522616_2336793-lq.mp3'),
    minionHappy: new Audio('https://cdn.freesound.org/previews/539/539050_12274768-lq.mp3'),
    minionJump: new Audio('https://cdn.freesound.org/previews/444/444921_9159316-lq.mp3'),
    minionShocked: new Audio('https://cdn.freesound.org/previews/554/554056_8164871-lq.mp3')
};

// Настройки
let settings = {
    soundEnabled: true,
    vibrationEnabled: true,
    userId: null, // Будет установлен при инициализации
    serverSync: false // По умолчанию синхронизация отключена
};

// Загрузка настроек
function loadSettings() {
    const savedSettings = localStorage.getItem('minionsGameSettings');
    if (savedSettings) {
        try {
            settings = {...settings, ...JSON.parse(savedSettings)};
            console.log("Настройки загружены", settings);
        } catch (e) {
            console.error('Ошибка при загрузке настроек:', e);
        }
    }
}

// Сохранение настроек
function saveSettings() {
    localStorage.setItem('minionsGameSettings', JSON.stringify(settings));
    console.log("Настройки сохранены", settings);
}

// Воспроизведение звука
function playSound(sound) {
    if (settings.soundEnabled && sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play().catch(err => console.warn('Ошибка воспроизведения звука:', err));
    }
}

// Вибрация устройства
function vibrate(pattern) {
    if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Игровое состояние
let gameState = {
    bananas: 0,
    stars: 0,
    level: 1,
    completedTasks: 0,
    openedBoxes: 0,
    totalBananas: 0,
    totalStars: 0,
    activeDays: 1,
    streak: 0,
    lastReward: null,
    invitedFriends: 0,
    lastSaveTime: Date.now(),
    petCount: 0, // Счетчик поглаживаний миньона
    achievements: ['Начинающий миньоновод'],
    taskProgress: {
        task1: 0, // Приглашение друзей
        task2: 0, // Открытие премиум-кейса
        task3: 0, // Кормление миньонов
        task4: 0, // Сбор 30 бананов
        task5: 0, // Открытие 5 боксов
        task6: 0, // Достижение 3 уровня
        task7: 0, // Получение 5 достижений
        task8: 0, // Серия входов 5 дней подряд
        task9: 0, // Собрать 100 бананов
        task10: 0 // Накопить 20 звезд
    }
};

// Серверный URL для синхронизации прогресса
const SERVER_URL = 'https://minions-game-server.glitch.me/api';

// Функция для синхронизации с сервером
async function syncWithServer() {
    if (!settings.serverSync || !settings.userId) return;
    
    try {
        const response = await fetch(`${SERVER_URL}/save-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: settings.userId,
                gameState: gameState
            })
        });
        
        if (response.ok) {
            console.log("Прогресс успешно синхронизирован с сервером");
            gameState.lastSaveTime = Date.now();
        } else {
            console.error("Ошибка при синхронизации с сервером:", await response.text());
        }
    } catch (error) {
        console.error("Ошибка сети при синхронизации:", error);
    }
}

// Загрузка данных с сервера
async function loadFromServer() {
    if (!settings.serverSync || !settings.userId) return false;
    
    try {
        const response = await fetch(`${SERVER_URL}/load-progress/${settings.userId}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.gameState) {
                gameState = {...gameState, ...data.gameState};
                console.log("Прогресс успешно загружен с сервера");
                return true;
            }
        } else {
            console.error("Ошибка при загрузке с сервера:", await response.text());
        }
    } catch (error) {
        console.error("Ошибка сети при загрузке:", error);
    }
    
    return false;
}

// Загрузка данных из localStorage
function loadGameState() {
    const savedState = localStorage.getItem('minionsGameState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            gameState = {...gameState, ...parsed};
            
            // Проверка на ежедневный вход
            checkDailyLogin();
            
            console.log("Состояние игры загружено из localStorage");
            return true;
        } catch (e) {
            console.error('Ошибка при загрузке сохраненных данных:', e);
        }
    }
    return false;
}

// Сохранение данных в localStorage
function saveGameState() {
    localStorage.setItem('minionsGameState', JSON.stringify(gameState));
    console.log("Состояние игры сохранено в localStorage");
    
    // Если прошло более 5 минут с последнего сохранения, синхронизируем с сервером
    if (Date.now() - gameState.lastSaveTime > 5 * 60 * 1000) {
        syncWithServer();
    }
}

// Настройки аналитики и отслеживания
const ANALYTICS = {
    enabled: true,
    serverUrl: 'https://minions-game-server.glitch.me/api',
    sampleRate: 1.0, // Доля событий для отправки (1.0 = 100%)
    batchSize: 10, // Количество событий в одном запросе
    flushInterval: 30000 // Интервал отправки данных (30 сек)
};

// Очередь событий для отправки
let eventQueue = [];
let lastEventTime = 0;
let flushTimeoutId = null;

// Функция для отслеживания события
function trackEvent(eventName, properties = {}) {
    if (!ANALYTICS.enabled) return;
    
    // Если отключено семплирование или попадаем в выборку
    if (Math.random() <= ANALYTICS.sampleRate) {
        const eventData = {
            event: eventName,
            userId: settings.userId || 'anonymous',
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            gameState: {
                level: gameState.level,
                bananas: gameState.totalBananas,
                stars: gameState.totalStars,
                completedTasks: gameState.completedTasks
            },
            ...properties
        };
        
        // Добавляем событие в очередь
        eventQueue.push(eventData);
        console.log(`Отслеживание: ${eventName}`, properties);
        
        // Если очередь достигла максимального размера или прошло достаточно времени
        const now = Date.now();
        if (eventQueue.length >= ANALYTICS.batchSize || (now - lastEventTime > ANALYTICS.flushInterval && eventQueue.length > 0)) {
            flushEvents();
        } else if (!flushTimeoutId) {
            // Устанавливаем таймер для отложенной отправки
            flushTimeoutId = setTimeout(flushEvents, ANALYTICS.flushInterval);
        }
        
        lastEventTime = now;
    }
}

// Отправка событий на сервер
async function flushEvents() {
    if (flushTimeoutId) {
        clearTimeout(flushTimeoutId);
        flushTimeoutId = null;
    }
    
    if (eventQueue.length === 0) return;
    
    const events = [...eventQueue];
    eventQueue = [];
    
    try {
        const response = await fetch(`${ANALYTICS.serverUrl}/track`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ events }),
            // Используем keepalive, чтобы запрос завершился даже если пользователь закрыл страницу
            keepalive: true
        });
        
        if (response.ok) {
            console.log(`Отправлено ${events.length} событий на сервер`);
        } else {
            console.error('Ошибка при отправке событий:', await response.text());
            // Возвращаем события в очередь для повторной попытки
            eventQueue = [...events, ...eventQueue];
        }
    } catch (error) {
        console.error('Ошибка сети при отправке событий:', error);
        // Возвращаем события в очередь для повторной попытки
        eventQueue = [...events, ...eventQueue];
    }
}

// Уникальный идентификатор сессии
const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// Проверка ежедневного входа
function checkDailyLogin() {
    const today = new Date().toDateString();
    
    if (gameState.lastReward !== today) {
        // Показываем награду
        document.getElementById('daily-reward-container').style.display = 'block';
        
        // Если последний вход был вчера, увеличиваем серию
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        if (gameState.lastReward === yesterdayString) {
            gameState.streak++;
            
            // Проверяем задание на серию входов
            if (gameState.streak >= 5 && gameState.taskProgress.task8 < 1) {
                gameState.taskProgress.task8 = 1;
                completeTask(8);
            }
        } else if (gameState.lastReward) {
            // Сбрасываем серию, если был пропуск
            gameState.streak = 0;
        }
        
        // Увеличиваем счетчик активных дней
        gameState.activeDays++;
        
        // Обновляем счетчик серии
        document.getElementById('streak-count').textContent = gameState.streak;
    } else {
        // Скрываем награду, если уже забрали сегодня
        document.getElementById('daily-reward-container').style.display = 'none';
    }
}

// Получение ежедневной награды
function claimDailyReward() {
    const today = new Date().toDateString();
    
    // Награда зависит от длины серии посещений
    let bananaReward = 5 + (gameState.streak * 2);
    let starReward = Math.floor(gameState.streak / 3) + 1;
    
    gameState.bananas += bananaReward;
    gameState.stars += starReward;
    gameState.totalBananas += bananaReward;
    gameState.totalStars += starReward;
    
    // Запоминаем дату получения
    gameState.lastReward = today;
    
    // Скрываем блок награды
    document.getElementById('daily-reward-container').style.display = 'none';
    
    // Проверяем задания на сбор бананов и звезд
    checkResourceTasks();
    
    // Показываем анимацию и оповещение
    document.getElementById('reward-animation').innerHTML = '🎁';
    showPopup(`Ежедневная награда: +${bananaReward} бананов, +${starReward} звезд!`);
    
    // Звуковой эффект и вибрация
    playSound('reward');
    vibrate([100, 50, 100]);
    
    // Создаем эффект конфетти
    createConfetti();
    
    // Обновляем статистику
    updateStats();
    saveGameState();
    
    console.log(`Ежедневная награда получена: +${bananaReward} бананов, +${starReward} звезд`);
}

// Инициализация
async function init() {
    console.log("Инициализация приложения");
    
    // Показываем экран загрузки
    document.getElementById('splash-screen').style.display = 'flex';
    
    // Загружаем настройки
    loadSettings();
    
    // Предзагрузка изображений
    preloadImages();
    
    // Если приложение запущено в Telegram, получаем идентификатор пользователя
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        settings.userId = user.id.toString();
        document.getElementById('user-name').textContent = user.username || 'Игрок';
        
        // Включаем синхронизацию
        settings.serverSync = true;
        saveSettings();
        
        // Пробуем загрузить данные с сервера
        const serverLoaded = await loadFromServer();
        
        // Если не удалось загрузить с сервера, пробуем из localStorage
        if (!serverLoaded) {
            loadGameState();
        }
    } else {
        document.getElementById('user-name').textContent = 'Игрок';
        loadGameState();
    }
    
    // Обновляем статистику
    updateStats();
    
    // Обновляем прогресс заданий
    updateTaskProgress();
    
    // Скрываем экран загрузки с анимацией после короткой задержки
    setTimeout(function() {
        document.getElementById('splash-screen').style.opacity = 0;
        setTimeout(function() {
            document.getElementById('splash-screen').style.display = 'none';
        }, 500);
        
        // Проигрываем приветственный звук
        playSound('task');
    }, 1500);
    
    // Добавляем обработчик для ежедневной награды
    document.getElementById('daily-reward-btn').addEventListener('click', claimDailyReward);
    
    // Добавляем обработчики для кнопок меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                playSound('click');
                vibrate(30);
                showSection(sectionId);
            }
        });
    });
    
    // Добавляем обработчики для кнопок настроек
    document.getElementById('sound-toggle').addEventListener('click', function() {
        settings.soundEnabled = !settings.soundEnabled;
        this.innerHTML = settings.soundEnabled ? '🔊' : '🔇';
        saveSettings();
        if (settings.soundEnabled) playSound('click');
    });
    
    document.getElementById('vibration-toggle').addEventListener('click', function() {
        settings.vibrationEnabled = !settings.vibrationEnabled;
        this.innerHTML = settings.vibrationEnabled ? '📳' : '📴';
        saveSettings();
        if (settings.vibrationEnabled) vibrate(50);
        if (settings.soundEnabled) playSound('click');
    });
    
    // Установка начальных значений для кнопок настроек
    document.getElementById('sound-toggle').innerHTML = settings.soundEnabled ? '🔊' : '🔇';
    document.getElementById('vibration-toggle').innerHTML = settings.vibrationEnabled ? '📳' : '📴';
    
    // Инициализация интерактивного миньона
    initInteractiveMinion();
    
    console.log("Инициализация приложения завершена");
}

// Проверка заданий на сбор ресурсов
function checkResourceTasks() {
    // Задание 4: Собери 30 бананов
    if (gameState.totalBananas >= 30 && gameState.taskProgress.task4 < 1) {
        gameState.taskProgress.task4 = 1;
        completeTask(4);
    }
    
    // Задание 9: Собери 100 бананов
    if (gameState.totalBananas >= 100 && gameState.taskProgress.task9 < 1) {
        gameState.taskProgress.task9 = 1;
        completeTask(9);
    }
    
    // Задание 10: Накопи 20 звезд
    if (gameState.totalStars >= 20 && gameState.taskProgress.task10 < 1) {
        gameState.taskProgress.task10 = 1;
        completeTask(10);
    }
}

// Обновление статистики
function updateStats() {
    document.getElementById('bananas').textContent = gameState.bananas;
    document.getElementById('stars').textContent = gameState.stars;
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('profile-level').textContent = gameState.level;
    document.getElementById('total-bananas').textContent = gameState.totalBananas;
    document.getElementById('total-stars').textContent = gameState.totalStars;
    document.getElementById('completed-tasks').textContent = gameState.completedTasks;
    document.getElementById('opened-boxes').textContent = gameState.openedBoxes;
    document.getElementById('invited-friends').textContent = gameState.invitedFriends;
    document.getElementById('active-days').textContent = gameState.activeDays;
    
    updateAchievements();
    checkResourceTasks();
}

// Обновление прогресса заданий
function updateTaskProgress() {
    // Задание 1: Пригласи 10 друзей
    updateTaskProgressUI(1, gameState.taskProgress.task1, 10);
    
    // Задание 2: Открой премиум-кейс
    updateTaskProgressUI(2, gameState.taskProgress.task2, 1);
    
    // Задание 3: Накорми 5 миньонов
    updateTaskProgressUI(3, gameState.taskProgress.task3, 5);
    
    // Задание 4: Собери 30 бананов
    updateTaskProgressUI(4, Math.min(gameState.totalBananas, 30), 30);
    
    // Задание 5: Открой 5 боксов
    updateTaskProgressUI(5, Math.min(gameState.openedBoxes, 5), 5);
    
    // Задание 6: Достигни 3 уровня
    updateTaskProgressUI(6, Math.min(gameState.level, 3), 3);
    
    // Задание 7: Получи 5 достижений
    updateTaskProgressUI(7, Math.min(gameState.achievements.length, 5), 5);
    
    // Задание 8: Серия входов 5 дней подряд
    updateTaskProgressUI(8, Math.min(gameState.streak, 5), 5);
    
    // Задание 9: Собери 100 бананов
    updateTaskProgressUI(9, Math.min(gameState.totalBananas, 100), 100);
    
    // Задание 10: Накопи 20 звезд
    updateTaskProgressUI(10, Math.min(gameState.totalStars, 20), 20);
}

// Обновление UI прогресса задания
function updateTaskProgressUI(taskId, current, total) {
    const progressBar = document.getElementById(`task${taskId}-progress`);
    const counter = document.getElementById(`task${taskId}-counter`);
    
    if (progressBar && counter) {
        progressBar.style.width = `${(current / total) * 100}%`;
        counter.textContent = `${current}/${total}`;
    }
}

// Показать секцию
function showSection(sectionId) {
    console.log("Переключение на секцию:", sectionId);
    
    // Скрываем все секции
    document.getElementById('tasks-section').classList.add('hidden-section');
    document.getElementById('tasks-section').classList.remove('active-section');
    
    document.getElementById('boxes-section').classList.add('hidden-section');
    document.getElementById('boxes-section').classList.remove('active-section');
    
    document.getElementById('friends-section').classList.add('hidden-section');
    document.getElementById('friends-section').classList.remove('active-section');
    
    document.getElementById('profile-section').classList.add('hidden-section');
    document.getElementById('profile-section').classList.remove('active-section');
    
    document.getElementById('settings-section').classList.add('hidden-section');
    document.getElementById('settings-section').classList.remove('active-section');
    
    document.getElementById('shop-section').classList.add('hidden-section');
    document.getElementById('shop-section').classList.remove('active-section');
    
    // Показываем нужную секцию
    document.getElementById(sectionId).classList.remove('hidden-section');
    document.getElementById(sectionId).classList.add('active-section');
    
    // Обновляем активный пункт меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Находим кнопку, связанную с этой секцией
    const clickedButton = Array.from(menuItems).find(item => {
        return item.getAttribute('data-section') === sectionId;
    });
    
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// Выполнение задания
function completeTask(taskId) {
    console.log("Выполнение задания:", taskId);
    
    // Проверяем, не выполнено ли уже задание
    if (gameState.taskProgress[`task${taskId}`] >= 1) {
        return;
    }
    
    let reward = {};
    
    switch(taskId) {
        case 1: // Пригласи 10 друзей
            if (gameState.taskProgress.task1 >= 10) {
                gameState.taskProgress.task1 = 1;
                reward = { type: 'bananas', amount: 100 };
            }
            break;
            
        case 2: // Открой премиум-кейс
            reward = { type: 'bananas', amount: 50 };
            break;
            
        case 3: // Накорми 5 миньонов
            if (gameState.taskProgress.task3 >= 5) {
                gameState.taskProgress.task3 = 1;
                reward = { type: 'bananas', amount: 20 };
            }
            break;
            
        case 4: // Собери 30 бананов
            reward = { type: 'stars', amount: 5 };
            break;
            
        case 5: // Открой 5 боксов
            reward = { type: 'stars', amount: 10 };
            break;
            
        case 6: // Достигни 3 уровня
            reward = { type: 'stars', amount: 15 };
            break;
            
        case 7: // Получи 5 достижений
            reward = { type: 'both', bananas: 50, stars: 5 };
            break;
            
        case 8: // Серия входов 5 дней подряд
            reward = { type: 'stars', amount: 8 };
            break;
            
        case 9: // Собери 100 бананов
            reward = { type: 'stars', amount: 10 };
            break;
            
        case 10: // Накопи 20 звезд
            reward = { type: 'bananas', amount: 150 };
            break;
    }
    
    // Отмечаем задание как выполненное
    gameState.taskProgress[`task${taskId}`] = 1;
    gameState.completedTasks++;
    
    // Выдаем награду
    let rewardText = '';
    
    if (reward.type === 'bananas') {
        gameState.bananas += reward.amount;
        gameState.totalBananas += reward.amount;
        rewardText = `Задание выполнено! +${reward.amount} бананов`;
    } else if (reward.type === 'stars') {
        gameState.stars += reward.amount;
        gameState.totalStars += reward.amount;
        rewardText = `Задание выполнено! +${reward.amount} звезд`;
    } else if (reward.type === 'both') {
        gameState.bananas += reward.bananas;
        gameState.totalBananas += reward.bananas;
        gameState.stars += reward.stars;
        gameState.totalStars += reward.stars;
        rewardText = `Задание выполнено! +${reward.bananas} бананов, +${reward.stars} звезд`;
    }
    
    // Обновляем статистику
    updateStats();
    updateTaskProgress();
    saveGameState();
    
    // Показываем уведомление
    showPopup(rewardText);
    
    // Звук и вибрация
    playSound('task');
    vibrate([100, 30, 100, 30, 100]);
    
    // Создаем эффект конфетти
    createConfetti();
}

// Открытие бокса
function openBox(type) {
    console.log("Открытие бокса:", type);
    
    let canOpen = false;
    let rewardText = '';
    
    switch(type) {
        case 'simple':
            if (gameState.bananas >= 10) {
                gameState.bananas -= 10;
                canOpen = true;
                
                // Случайная награда
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    reward = Math.floor(Math.random() * 3) + 1;
                    if (reward === 1) {
                        // Банан
                        gameState.bananas += 5;
                        gameState.totalBananas += 5;
                        rewardText = '+5 бананов';
                    } else if (reward === 2) {
                        // Звезда
                        gameState.stars += 1;
                        gameState.totalStars += 1;
                        rewardText = '+1 звезда';
                    } else {
                        // Уровень
                        addExperience(5);
                        rewardText = '+5 опыта';
                    }
                }
                break;
                
        case 'standard':
            if (gameState.bananas >= 25) {
                gameState.bananas -= 25;
                canOpen = true;
                
                // Случайная награда
                reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    gameState.bananas += 15;
                    gameState.totalBananas += 15;
                    rewardText = '+15 бананов';
                } else if (reward === 2) {
                    gameState.stars += 3;
                    gameState.totalStars += 3;
                    rewardText = '+3 звезды';
                } else {
                    addExperience(10);
                    rewardText = '+10 опыта';
                }
            }
            break;
            
        case 'premium':
            if (gameState.stars >= 5) {
                gameState.stars -= 5;
                canOpen = true;
                
                // Случайная награда
                reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    gameState.bananas += 50;
                    gameState.totalBananas += 50;
                    rewardText = '+50 бананов';
                } else if (reward === 2) {
                    gameState.stars += 10;
                    gameState.totalStars += 10;
                    rewardText = '+10 звезд';
                } else {
                    addExperience(25);
                    rewardText = '+25 опыта';
                }
                
                // Отмечаем задание на открытие премиум-кейса
                if (gameState.taskProgress.task2 < 1) {
                    gameState.taskProgress.task2 = 1;
                    completeTask(2);
                }
            }
            break;
            
        case 'mega':
            if (gameState.stars >= 15) {
                gameState.stars -= 15;
                canOpen = true;
                
                // Случайная награда
                reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    gameState.bananas += 100;
                    gameState.totalBananas += 100;
                    rewardText = '+100 бананов';
                } else if (reward === 2) {
                    gameState.stars += 20;
                    gameState.totalStars += 20;
                    rewardText = '+20 звезд';
                } else {
                    addExperience(50);
                    rewardText = '+50 опыта';
                }
            }
            break;
            
        case 'special':
            if (gameState.bananas >= 100 && gameState.stars >= 5) {
                gameState.bananas -= 100;
                gameState.stars -= 5;
                canOpen = true;
                
                // Гарантированная награда
                gameState.bananas += 25;
                gameState.totalBananas += 25;
                gameState.stars += 5;
                gameState.totalStars += 5;
                addExperience(15);
                rewardText = '+25 бананов, +5 звезд, +15 опыта';
            }
            break;
            
        case 'epic':
            if (gameState.bananas >= 200 && gameState.stars >= 15) {
                gameState.bananas -= 200;
                gameState.stars -= 15;
                canOpen = true;
                
                // Гарантированная награда
                gameState.bananas += 100;
                gameState.totalBananas += 100;
                gameState.stars += 20;
                gameState.totalStars += 20;
                addExperience(40);
                rewardText = '+100 бананов, +20 звезд, +40 опыта';
            }
            break;
    }
    
    if (canOpen) {
        // Увеличиваем счетчик открытых боксов
        gameState.openedBoxes++;
        
        // Проверяем задание на открытие боксов
        if (gameState.openedBoxes >= 5 && gameState.taskProgress.task5 < 1) {
            gameState.taskProgress.task5 = 1;
            completeTask(5);
        }
        
        // Обновляем статистику и сохраняем игру
        updateStats();
        saveGameState();
        
        // Показываем анимацию и оповещение
        showBoxAnimation(type, rewardText);
        
        // Звуковой эффект и вибрация
        playSound('box');
        vibrate([100, 50, 200]);
        
        // Отслеживаем событие
        trackEvent('box_opened', { type, reward: rewardText });
        
        return true;
    } else {
        // Показываем сообщение о недостатке ресурсов
        showPopup('Недостаточно ресурсов!');
        playSound('minionShocked');
        return false;
    }
}

// Анимация открытия бокса
function showBoxAnimation(type, rewardText) {
    const boxContainer = document.getElementById('box-animation-container');
    boxContainer.style.display = 'flex';
    
    // Устанавливаем картинку бокса
    const boxImage = document.getElementById('box-image');
    boxImage.src = getImage(`box_${type}`);
    
    // Анимация открытия
    setTimeout(() => {
        boxImage.classList.add('shake');
        
        setTimeout(() => {
            boxImage.classList.remove('shake');
            boxImage.classList.add('open');
            
            // Показываем награду
            document.getElementById('box-reward').textContent = rewardText;
            document.getElementById('box-reward').style.opacity = 1;
            
            // Создаем эффект конфетти
            createConfetti();
            
            // Закрываем анимацию через 3 секунды
            setTimeout(() => {
                boxImage.classList.remove('open');
                document.getElementById('box-reward').style.opacity = 0;
                boxContainer.style.display = 'none';
            }, 3000);
        }, 1000);
    }, 500);
}

// Добавление опыта и проверка повышения уровня
function addExperience(amount) {
    // Формула для расчета опыта, необходимого для следующего уровня
    const expNeeded = Math.floor(100 * Math.pow(1.5, gameState.level - 1));
    
    // Текущий опыт для данного уровня
    let currentExp = gameState.exp || 0;
    currentExp += amount;
    
    // Проверяем, достаточно ли опыта для повышения уровня
    if (currentExp >= expNeeded) {
        // Повышаем уровень
        gameState.level++;
        
        // Остаток опыта переносим на следующий уровень
        gameState.exp = currentExp - expNeeded;
        
        // Награда за новый уровень
        gameState.bananas += 10 * gameState.level;
        gameState.totalBananas += 10 * gameState.level;
        gameState.stars += Math.floor(gameState.level / 2) + 1;
        gameState.totalStars += Math.floor(gameState.level / 2) + 1;
        
        // Показываем анимацию и уведомление
        showLevelUpAnimation();
        
        // Проверяем задание "Достигни 3 уровня"
        if (gameState.level >= 3 && gameState.taskProgress.task6 < 1) {
            gameState.taskProgress.task6 = 1;
            completeTask(6);
        }
        
        // Отслеживаем событие
        trackEvent('level_up', { level: gameState.level });
    } else {
        // Сохраняем текущий опыт
        gameState.exp = currentExp;
    }
    
    // Обновляем UI прогресса уровня
    updateLevelProgress();
}

// Обновление прогресса уровня
function updateLevelProgress() {
    const expNeeded = Math.floor(100 * Math.pow(1.5, gameState.level - 1));
    const currentExp = gameState.exp || 0;
    const percentage = (currentExp / expNeeded) * 100;
    
    const levelProgress = document.getElementById('level-progress');
    if (levelProgress) {
        levelProgress.style.width = `${percentage}%`;
    }
    
    const levelCounter = document.getElementById('level-counter');
    if (levelCounter) {
        levelCounter.textContent = `${currentExp}/${expNeeded}`;
    }
}

// Анимация повышения уровня
function showLevelUpAnimation() {
    const container = document.getElementById('level-up-container');
    container.style.display = 'flex';
    
    // Показываем новый уровень
    document.getElementById('new-level').textContent = gameState.level;
    
    // Звуковой эффект и вибрация
    playSound('levelUp');
    vibrate([100, 50, 100, 50, 200]);
    
    // Создаем эффект конфетти
    createConfetti();
    
    // Закрываем анимацию через 3 секунды
    setTimeout(() => {
        container.style.display = 'none';
    }, 3000);
}

// Создание эффекта конфетти
function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    
    // Создаем элементы конфетти
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Случайные свойства для разнообразия
        const size = Math.floor(Math.random() * 10) + 5; // от 5 до 15px
        const color = `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
        const left = Math.floor(Math.random() * 100); // от 0 до 100%
        const delay = Math.random() * 3; // от 0 до 3 секунд
        
        // Применяем стили
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = color;
        confetti.style.left = `${left}%`;
        confetti.style.animationDelay = `${delay}s`;
        
        // Добавляем в контейнер
        container.appendChild(confetti);
    }
    
    // Удаляем конфетти через 6 секунд (анимация длится 4-5 секунд)
    setTimeout(() => {
        container.innerHTML = '';
    }, 6000);
}

// Инициализация интерактивного миньона
function initInteractiveMinion() {
    const minion = document.getElementById('interactive-minion');
    
    // Обработчик нажатия на миньона
    minion.addEventListener('click', () => {
        // Проигрываем анимацию нажатия
        minion.classList.add('pet-animation');
        setTimeout(() => {
            minion.classList.remove('pet-animation');
        }, 500);
        
        // Увеличиваем счетчик поглаживаний
        gameState.petCount++;
        
        // Выдаем банан каждые 5 поглаживаний
        if (gameState.petCount % 5 === 0) {
            gameState.bananas++;
            gameState.totalBananas++;
            showPopup('+1 банан за заботу о миньоне!');
            updateStats();
            saveGameState();
            
            // Проверяем задания на "кормление миньонов"
            if (gameState.petCount >= 25 && gameState.taskProgress.task3 < 5) {
                gameState.taskProgress.task3 = Math.min(5, Math.floor(gameState.petCount / 5));
                updateTaskProgress();
                
                if (gameState.taskProgress.task3 >= 5) {
                    completeTask(3);
                }
            }
        }
        
        // Проигрываем один из случайных звуков миньона
        const sounds = ['minionHappy', 'minionJump'];
        const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
        playSound(randomSound);
        
        // Небольшая вибрация
        vibrate(30);
        
        // Отслеживаем событие
        trackEvent('minion_pet', { count: gameState.petCount });
    });
}

// Обновление достижений
function updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    achievementsList.innerHTML = '';
    
    // Проверяем новые достижения
    checkAchievements();
    
    // Отображаем все имеющиеся достижения
    gameState.achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.textContent = achievement;
        achievementsList.appendChild(item);
    });
    
    // Проверяем задание на получение 5 достижений
    if (gameState.achievements.length >= 5 && gameState.taskProgress.task7 < 1) {
        gameState.taskProgress.task7 = 1;
        completeTask(7);
    }
}

// Проверка новых достижений
function checkAchievements() {
    const achievements = [
        { id: 'beginner', title: 'Начинающий миньоновод', condition: () => true },
        { id: 'collector', title: 'Банановый коллекционер', condition: () => gameState.totalBananas >= 50 },
        { id: 'star_gatherer', title: 'Звездочёт', condition: () => gameState.totalStars >= 15 },
        { id: 'box_opener', title: 'Распаковщик', condition: () => gameState.openedBoxes >= 10 },
        { id: 'box_master', title: 'Мастер кейсов', condition: () => gameState.openedBoxes >= 25 },
        { id: 'task_master', title: 'Исполнительный миньон', condition: () => gameState.completedTasks >= 5 },
        { id: 'minion_friend', title: 'Друг миньонов', condition: () => gameState.petCount >= 50 },
        { id: 'minion_lover', title: 'Заботливый хозяин', condition: () => gameState.petCount >= 100 },
        { id: 'invite_king', title: 'Социальная бабочка', condition: () => gameState.invitedFriends >= 5 },
        { id: 'daily_master', title: 'Постоянный игрок', condition: () => gameState.activeDays >= 7 },
        { id: 'streak_master', title: 'Верный миньон', condition: () => gameState.streak >= 3 },
        { id: 'high_level', title: 'Опытный миньоновод', condition: () => gameState.level >= 5 }
    ];
    
    // Проверяем и добавляем новые достижения
    achievements.forEach(achievement => {
        if (achievement.condition() && !gameState.achievements.includes(achievement.title)) {
            gameState.achievements.push(achievement.title);
            
            // Показываем уведомление о новом достижении
            showPopup(`Новое достижение: ${achievement.title}!`);
            
            // Звук и вибрация
            playSound('achievement');
            vibrate([100, 30, 100, 30, 200]);
        }
    });
}

// Функция приглашения друзей
function inviteFriend() {
    console.log("Приглашение друга");
    
    // Если приложение запущено в Telegram, используем его функционал
    if (tg) {
        tg.shareGame('minions_game_bot');
        
        // Увеличиваем счетчик приглашенных друзей
        gameState.invitedFriends++;
        
        // Обновляем прогресс задания
        gameState.taskProgress.task1 = Math.min(10, gameState.invitedFriends);
        updateTaskProgress();
        
        // Проверяем выполнение задания
        if (gameState.invitedFriends >= 10 && gameState.taskProgress.task1 < 1) {
            completeTask(1);
        }
        
        // Обновляем статистику и сохраняем
        updateStats();
        saveGameState();
        
        // Отслеживаем событие
        trackEvent('friend_invited', { total: gameState.invitedFriends });
    } else {
        // Если вне Telegram, показываем уведомление
        showPopup('Эта функция доступна только в Telegram!');
    }
}

// Функция кручения колеса фортуны
function spinWheel() {
    console.log("Кручение колеса фортуны");
    
    // Проверяем, достаточно ли звезд
    if (gameState.stars < 3) {
        showPopup('Недостаточно звезд! Требуется 3 звезды.');
        playSound('minionShocked');
        return;
    }
    
    // Списываем звезды
    gameState.stars -= 3;
    
    // Получаем случайный сектор (от 1 до 8)
    const sector = Math.floor(Math.random() * 8) + 1;
    
    // Подготавливаем колесо
    const wheel = document.getElementById('fortune-wheel');
    wheel.style.transform = 'rotate(0deg)';
    
    // Показываем колесо
    document.getElementById('wheel-container').style.display = 'flex';
    
    // Определяем награду
    let reward;
    
    switch(sector) {
        case 1: // 5 бананов
            reward = { type: 'bananas', amount: 5, text: '+5 бананов' };
            break;
        case 2: // 10 бананов
            reward = { type: 'bananas', amount: 10, text: '+10 бананов' };
            break;
        case 3: // 20 бананов
            reward = { type: 'bananas', amount: 20, text: '+20 бананов' };
            break;
        case 4: // 1 звезда
            reward = { type: 'stars', amount: 1, text: '+1 звезда' };
            break;
        case 5: // 2 звезды
            reward = { type: 'stars', amount: 2, text: '+2 звезды' };
            break;
        case 6: // 5 опыта
            reward = { type: 'exp', amount: 5, text: '+5 опыта' };
            break;
        case 7: // 10 опыта
            reward = { type: 'exp', amount: 10, text: '+10 опыта' };
            break;
        case 8: // 50 бананов (джекпот)
            reward = { type: 'bananas', amount: 50, text: 'ДЖЕКПОТ! +50 бананов' };
            break;
    }
    
    // Вычисляем угол поворота для выпадения нужного сектора
    // Каждый сектор по 45 градусов (360 / 8)
    // Добавляем случайность в пределах сектора и несколько полных оборотов
    const baseAngle = (sector - 1) * 45;
    const randomOffset = Math.random() * 30 - 15; // От -15 до +15 градусов
    const fullRotations = 5 * 360; // 5 полных оборотов
    const finalAngle = fullRotations + baseAngle + randomOffset;
    
    // Запускаем вращение
    setTimeout(() => {
        wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.24, 0.99)';
        wheel.style.transform = `rotate(${finalAngle}deg)`;
        
        // Звуковой эффект и вибрация
        playSound('wheel');
        vibrate([50, 50, 50, 50, 50, 50]);
        
        // Выдаем награду после остановки колеса
        setTimeout(() => {
            // Применяем награду
            if (reward.type === 'bananas') {
                gameState.bananas += reward.amount;
                gameState.totalBananas += reward.amount;
            } else if (reward.type === 'stars') {
                gameState.stars += reward.amount;
                gameState.totalStars += reward.amount;
            } else if (reward.type === 'exp') {
                addExperience(reward.amount);
            }
            
            // Показываем результат
            document.getElementById('wheel-result').textContent = reward.text;
            document.getElementById('wheel-result').style.opacity = 1;
            
            // Звуковой эффект и вибрация для награды
            playSound('reward');
            vibrate([200]);
            
            // Создаем эффект конфетти
            createConfetti();
            
            // Обновляем статистику и сохраняем
            updateStats();
            saveGameState();
            
            // Скрываем колесо через 3 секунды
            setTimeout(() => {
                document.getElementById('wheel-container').style.display = 'none';
                document.getElementById('wheel-result').style.opacity = 0;
                wheel.style.transition = 'none';
            }, 3000);
            
            // Отслеживаем событие
            trackEvent('wheel_spin', { sector, reward: reward.text });
        }, 4200);
    }, 500);
}

// Показать всплывающее сообщение
function showPopup(message) {
    const popup = document.getElementById('popup-message');
    popup.textContent = message;
    popup.style.display = 'block';
    popup.style.opacity = 1;
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        popup.style.opacity = 0;
        setTimeout(() => {
            popup.style.display = 'none';
        }, 500);
    }, 3000);
}

// Обработчик перед закрытием страницы
window.addEventListener('beforeunload', function() {
    // Сохраняем данные
    saveGameState();
    
    // Отправляем оставшиеся события аналитики
    flushEvents();
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', init);
