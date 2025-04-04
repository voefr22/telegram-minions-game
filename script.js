// Инициализация Telegram WebApp
let tg = null;
try {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        console.log("Telegram WebApp инициализирован успешно");
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
    minion: 'https://i.imgur.com/UdwGAoD.png',
    banana: 'https://i.imgur.com/NSrR5EC.png',
    star: 'https://i.imgur.com/v9nfCnG.png',
    level: 'https://i.imgur.com/hkzYK6m.png',
    box_simple: 'https://i.imgur.com/ZcukEsb.png',
    box_standard: 'https://i.imgur.com/ZcukEsb.png',
    box_premium: 'https://i.imgur.com/ZcukEsb.png',
    box_mega: 'https://i.imgur.com/ZcukEsb.png',
    box_special: 'https://i.imgur.com/ZcukEsb.png',
    box_epic: 'https://i.imgur.com/ZcukEsb.png',
    avatar: 'https://i.imgur.com/UdwGAoD.png',
    gift: 'https://i.imgur.com/ZcukEsb.png',
    wheel: 'https://i.imgur.com/ZcukEsb.png'
};

// Предзагрузка изображений
const preloadedImages = {};
function preloadImages() {
    console.log('Предзагрузка изображений...');
    for (const [key, src] of Object.entries(IMAGES)) {
        preloadedImages[key] = new Image();
        preloadedImages[key].src = src;
        preloadedImages[key].onload = () => console.log(`Изображение ${key} загружено`);
        preloadedImages[key].onerror = () => {
            console.warn(`Ошибка загрузки ${key}. Используется запасное изображение`);
            preloadedImages[key].src = 'https://i.imgur.com/ZcukEsb.png';
        };
    }
}

// Получение изображения
function getImage(key) {
    return (preloadedImages[key] && preloadedImages[key].complete && preloadedImages[key].naturalWidth !== 0)
        ? preloadedImages[key].src
        : IMAGES[key] || 'https://i.imgur.com/ZcukEsb.png';
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
    userId: null,
    serverSync: false
};

// Игровое состояние
let gameState = {
    bananas: 0,
    stars: 0,
    level: 1,
    exp: 0,
    completedTasks: 0,
    openedBoxes: 0,
    totalBananas: 0,
    totalStars: 0,
    activeDays: 1,
    streak: 0,
    lastReward: null,
    lastWheelSpin: null,
    invitedFriends: 0,
    petCount: 0,
    lastSaveTime: Date.now(),
    achievements: ['Начинающий миньоновод'],
    taskProgress: {
        task1: 0, task2: 0, task3: 0, task4: 0, task5: 0,
        task6: 0, task7: 0, task8: 0, task9: 0, task10: 0
    }
};

// Серверный URL
const SERVER_URL = 'https://minions-game-server.glitch.me/api';

// Аналитика
const ANALYTICS = {
    enabled: true,
    serverUrl: 'https://minions-game-server.glitch.me/api',
    sampleRate: 1.0,
    batchSize: 10,
    flushInterval: 30000
};
let eventQueue = [];
let lastEventTime = 0;
let flushTimeoutId = null;
const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// Загрузка и сохранение настроек
function loadSettings() {
    try {
        const savedSettings = localStorage.getItem('minionsGameSettings');
        if (savedSettings) settings = { ...settings, ...JSON.parse(savedSettings) };
        console.log("Настройки загружены", settings);
    } catch (e) {
        console.error('Ошибка загрузки настроек:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('minionsGameSettings', JSON.stringify(settings));
        console.log("Настройки сохранены", settings);
    } catch (e) {
        console.error('Ошибка сохранения настроек:', e);
    }
}

// Управление звуком и вибрацией
function playSound(sound) {
    if (settings.soundEnabled && sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play().catch(err => console.warn('Ошибка звука:', err));
    }
}

function vibrate(pattern) {
    if (settings.vibrationEnabled && navigator.vibrate) navigator.vibrate(pattern);
}

// Загрузка и сохранение игрового состояния
function loadGameState() {
    try {
        const savedState = localStorage.getItem('minionsGameState');
        if (savedState) {
            gameState = { ...gameState, ...JSON.parse(savedState) };
            checkDailyLogin();
            console.log("Состояние загружено из localStorage");
            return true;
        }
    } catch (e) {
        console.error('Ошибка загрузки состояния:', e);
    }
    return false;
}

function saveGameState() {
    try {
        localStorage.setItem('minionsGameState', JSON.stringify(gameState));
        console.log("Состояние сохранено");
        if (Date.now() - gameState.lastSaveTime > 5 * 60 * 1000) syncWithServer();
    } catch (e) {
        console.error('Ошибка сохранения состояния:', e);
    }
}

// Синхронизация с сервером
async function syncWithServer() {
    if (!settings.serverSync || !settings.userId) return;
    try {
        const response = await fetch(`${SERVER_URL}/save-progress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: settings.userId, gameState })
        });
        if (response.ok) {
            console.log("Прогресс синхронизирован с сервером");
            gameState.lastSaveTime = Date.now();
        } else {
            console.error("Ошибка синхронизации:", await response.text());
        }
    } catch (e) {
        console.error("Ошибка сети:", e);
    }
}

async function loadFromServer() {
    if (!settings.serverSync || !settings.userId) return false;
    try {
        const response = await fetch(`${SERVER_URL}/load-progress/${settings.userId}`);
        if (response.ok) {
            const data = await response.json();
            if (data && data.gameState) {
                gameState = { ...gameState, ...data.gameState };
                console.log("Прогресс загружен с сервера");
                return true;
            }
        } else {
            console.error("Ошибка загрузки:", await response.text());
        }
    } catch (e) {
        console.error("Ошибка сети:", e);
    }
    return false;
}

// Аналитика событий
function trackEvent(eventName, properties = {}) {
    if (!ANALYTICS.enabled || Math.random() > ANALYTICS.sampleRate) return;
    const eventData = {
        event: eventName,
        userId: settings.userId || 'anonymous',
        sessionId,
        timestamp: new Date().toISOString(),
        gameState: {
            level: gameState.level,
            bananas: gameState.totalBananas,
            stars: gameState.totalStars,
            completedTasks: gameState.completedTasks
        },
        ...properties
    };
    eventQueue.push(eventData);
    console.log(`Событие: ${eventName}`, properties);
    const now = Date.now();
    if (eventQueue.length >= ANALYTICS.batchSize || (now - lastEventTime > ANALYTICS.flushInterval && eventQueue.length > 0)) {
        flushEvents();
    } else if (!flushTimeoutId) {
        flushTimeoutId = setTimeout(flushEvents, ANALYTICS.flushInterval);
    }
    lastEventTime = now;
}

async function flushEvents() {
    if (flushTimeoutId) clearTimeout(flushTimeoutId);
    flushTimeoutId = null;
    if (eventQueue.length === 0) return;
    const events = [...eventQueue];
    eventQueue = [];
    try {
        const response = await fetch(`${ANALYTICS.serverUrl}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events }),
            keepalive: true
        });
        if (response.ok) console.log(`Отправлено ${events.length} событий`);
        else {
            console.error('Ошибка отправки:', await response.text());
            eventQueue = [...events, ...eventQueue];
        }
    } catch (e) {
        console.error('Ошибка сети:', e);
        eventQueue = [...events, ...eventQueue];
    }
}

// Ежедневный вход
function checkDailyLogin() {
    const today = new Date().toDateString();
    const dailyRewardContainer = document.getElementById('daily-reward-container');
    if (gameState.lastReward !== today) {
        if (dailyRewardContainer) dailyRewardContainer.style.display = 'block';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (gameState.lastReward === yesterday.toDateString()) {
            gameState.streak++;
            if (gameState.streak >= 5 && gameState.taskProgress.task8 < 1) {
                gameState.taskProgress.task8 = 1;
                completeTask(8);
            }
        } else if (gameState.lastReward) gameState.streak = 0;
        gameState.activeDays++;
        const streakCount = document.getElementById('streak-count');
        if (streakCount) streakCount.textContent = gameState.streak;
    } else if (dailyRewardContainer) dailyRewardContainer.style.display = 'none';
}

function claimDailyReward() {
    const today = new Date().toDateString();
    let bananaReward = 5 + (gameState.streak * 2);
    let starReward = Math.floor(gameState.streak / 3) + 1;
    gameState.bananas += bananaReward;
    gameState.stars += starReward;
    gameState.totalBananas += bananaReward;
    gameState.totalStars += starReward;
    gameState.lastReward = today;
    const dailyRewardContainer = document.getElementById('daily-reward-container');
    if (dailyRewardContainer) dailyRewardContainer.style.display = 'none';
    showPopup(`Ежедневная награда: +${bananaReward} 🍌, +${starReward} ⭐!`);
    playSound('reward');
    vibrate([100, 50, 100]);
    createConfetti();
    updateStats();
    saveGameState();
    trackEvent('daily_reward', { bananas: bananaReward, stars: starReward });
}

// Инициализация приложения
async function init() {
    console.log("Инициализация...");
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) splashScreen.style.display = 'flex';
    loadSettings();
    preloadImages();
    if (tg && tg.initDataUnsafe?.user) {
        settings.userId = tg.initDataUnsafe.user.id.toString();
        document.getElementById('user-name').textContent = tg.initDataUnsafe.user.username || 'Игрок';
        settings.serverSync = true;
        saveSettings();
        if (!(await loadFromServer())) loadGameState();
    } else {
        document.getElementById('user-name').textContent = 'Игрок';
        loadGameState();
    }
    updateStats();
    updateTaskProgress();
    setupEventListeners();
    setTimeout(() => {
        if (splashScreen) {
            splashScreen.style.opacity = 0;
            setTimeout(() => {
                splashScreen.style.display = 'none';
                showSection('tasks-section');
            }, 500);
            playSound('task');
        }
    }, 1500);
    console.log("Инициализация завершена");
}

// Обновление статистики
function updateStats() {
    const updateElement = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    updateElement('bananas', gameState.bananas);
    updateElement('stars', gameState.stars);
    updateElement('level', gameState.level);
    updateElement('profile-level', gameState.level);
    updateElement('total-bananas', gameState.totalBananas);
    updateElement('total-stars', gameState.totalStars);
    updateElement('completed-tasks', gameState.completedTasks);
    updateElement('opened-boxes', gameState.openedBoxes);
    updateElement('invited-friends', gameState.invitedFriends);
    updateElement('active-days', gameState.activeDays);
    updateLevelProgress();
    updateAchievements();
    checkResourceTasks();
}

// Прогресс заданий
function updateTaskProgress() {
    updateTaskProgressUI(1, gameState.taskProgress.task1, 10);
    updateTaskProgressUI(2, gameState.taskProgress.task2, 1);
    updateTaskProgressUI(3, gameState.taskProgress.task3, 5);
    updateTaskProgressUI(4, Math.min(gameState.totalBananas, 30), 30);
    updateTaskProgressUI(5, Math.min(gameState.openedBoxes, 5), 5);
    updateTaskProgressUI(6, Math.min(gameState.level, 3), 3);
    updateTaskProgressUI(7, Math.min(gameState.achievements.length, 5), 5);
    updateTaskProgressUI(8, Math.min(gameState.streak, 5), 5);
    updateTaskProgressUI(9, Math.min(gameState.totalBananas, 100), 100);
    updateTaskProgressUI(10, Math.min(gameState.totalStars, 20), 20);
}

function updateTaskProgressUI(taskId, current, total) {
    const progressBar = document.getElementById(`task${taskId}-progress`);
    const counter = document.getElementById(`task${taskId}-counter`);
    if (progressBar) progressBar.style.width = `${(current / total) * 100}%`;
    if (counter) counter.textContent = `${current}/${total}`;
}

function checkResourceTasks() {
    if (gameState.totalBananas >= 30 && gameState.taskProgress.task4 < 1) {
        gameState.taskProgress.task4 = 1;
        completeTask(4);
    }
    if (gameState.totalBananas >= 100 && gameState.taskProgress.task9 < 1) {
        gameState.taskProgress.task9 = 1;
        completeTask(9);
    }
    if (gameState.totalStars >= 20 && gameState.taskProgress.task10 < 1) {
        gameState.taskProgress.task10 = 1;
        completeTask(10);
    }
}

// Выполнение заданий
function completeTask(taskId) {
    if (gameState.taskProgress[`task${taskId}`] >= 1) return;
    let reward = {};
    switch (taskId) {
        case 1: if (gameState.taskProgress.task1 >= 10) { reward = { type: 'bananas', amount: 100 }; } break;
        case 2: reward = { type: 'bananas', amount: 50 }; break;
        case 3: if (gameState.taskProgress.task3 >= 5) { reward = { type: 'bananas', amount: 20 }; } break;
        case 4: reward = { type: 'stars', amount: 5 }; break;
        case 5: reward = { type: 'stars', amount: 10 }; break;
        case 6: reward = { type: 'stars', amount: 15 }; break;
        case 7: reward = { type: 'both', bananas: 50, stars: 5 }; break;
        case 8: reward = { type: 'stars', amount: 8 }; break;
        case 9: reward = { type: 'stars', amount: 10 }; break;
        case 10: reward = { type: 'bananas', amount: 150 }; break;
    }
    if (Object.keys(reward).length === 0) return;
    gameState.taskProgress[`task${taskId}`] = 1;
    gameState.completedTasks++;
    let rewardText = '';
    if (reward.type === 'bananas') {
        gameState.bananas += reward.amount;
        gameState.totalBananas += reward.amount;
        rewardText = `+${reward.amount} 🍌`;
    } else if (reward.type === 'stars') {
        gameState.stars += reward.amount;
        gameState.totalStars += reward.amount;
        rewardText = `+${reward.amount} ⭐`;
    } else if (reward.type === 'both') {
        gameState.bananas += reward.bananas;
        gameState.totalBananas += reward.bananas;
        gameState.stars += reward.stars;
        gameState.totalStars += reward.stars;
        rewardText = `+${reward.bananas} 🍌, +${reward.stars} ⭐`;
    }
    showPopup(`Задание выполнено! ${rewardText}`);
    playSound('task');
    vibrate([100, 30, 100, 30, 100]);
    createConfetti();
    updateStats();
    saveGameState();
    trackEvent('task_completed', { taskId, reward: rewardText });
}

// Открытие боксов
function openBox(type) {
    let cost = { bananas: 0, stars: 0 }, rewardText = '';
    switch (type) {
        case 'simple':
            if (gameState.bananas >= 10) {
                gameState.bananas -= 10;
                rewardText = Math.random() < 0.7 ? '+15 🍌' : '+2 ⭐';
                if (rewardText === '+15 🍌') { gameState.bananas += 15; gameState.totalBananas += 15; }
                else { gameState.stars += 2; gameState.totalStars += 2; }
            } else return showPopup('Недостаточно бананов!');
            break;
        case 'standard':
            if (gameState.bananas >= 20) {
                gameState.bananas -= 20;
                rewardText = Math.random() < 0.7 ? '+30 🍌' : '+4 ⭐';
                if (rewardText === '+30 🍌') { gameState.bananas += 30; gameState.totalBananas += 30; }
                else { gameState.stars += 4; gameState.totalStars += 4; }
            } else return showPopup('Недостаточно бананов!');
            break;
        case 'premium':
            if (gameState.stars >= 5) {
                gameState.stars -= 5;
                rewardText = Math.random() < 0.7 ? '+50 🍌' : '+7 ⭐';
                if (rewardText === '+50 🍌') { gameState.bananas += 50; gameState.totalBananas += 50; }
                else { gameState.stars += 7; gameState.totalStars += 7; }
                if (gameState.taskProgress.task2 < 1) {
                    gameState.taskProgress.task2 = 1;
                    completeTask(2);
                }
            } else return showPopup('Недостаточно звезд!');
            break;
        case 'mega':
            if (gameState.stars >= 10) {
                gameState.stars -= 10;
                rewardText = Math.random() < 0.7 ? '+100 🍌' : '+12 ⭐';
                if (rewardText === '+100 🍌') { gameState.bananas += 100; gameState.totalBananas += 100; }
                else { gameState.stars += 12; gameState.totalStars += 12; }
            } else return showPopup('Недостаточно звезд!');
            break;
        case 'special':
            if (gameState.bananas >= 30) {
                gameState.bananas -= 30;
                rewardText = Math.random() < 0.7 ? '+40 🍌, +3 ⭐' : '+5 ⭐';
                if (rewardText === '+40 🍌, +3 ⭐') { gameState.bananas += 40; gameState.totalBananas += 40; gameState.stars += 3; gameState.totalStars += 3; }
                else { gameState.stars += 5; gameState.totalStars += 5; }
            } else return showPopup('Недостаточно бананов!');
            break;
        case 'epic':
            if (gameState.stars >= 15) {
                gameState.stars -= 15;
                rewardText = Math.random() < 0.7 ? '+150 🍌' : '+20 ⭐';
                if (rewardText === '+150 🍌') { gameState.bananas += 150; gameState.totalBananas += 150; }
                else { gameState.stars += 20; gameState.totalStars += 20; }
            } else return showPopup('Недостаточно звезд!');
            break;
    }
    gameState.openedBoxes++;
    if (gameState.openedBoxes >= 5 && gameState.taskProgress.task5 < 1) {
        gameState.taskProgress.task5 = 1;
        completeTask(5);
    }
    showPopup(`Бокс открыт! ${rewardText}`);
    playSound('box');
    vibrate([50, 30, 100]);
    createConfetti();
    updateStats();
    saveGameState();
    trackEvent('box_opened', { type, reward: rewardText });
}

// Управление секциями
function showSection(sectionId) {
    const sections = ['tasks-section', 'boxes-section', 'friends-section', 'profile-section', 'settings-section', 'shop-section'];
    sections.forEach(section => {
        const element = document.getElementById(section);
        if (element) {
            element.classList.toggle('hidden-section', section !== sectionId);
            element.classList.toggle('active-section', section === sectionId);
        }
    });
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
    });
    trackEvent('section_viewed', { section: sectionId });
}

// Приглашение друзей
function inviteFriends() {
    if (tg) {
        tg.MainButton.setText('Поделиться с друзьями').show().onClick(() => {
            tg.shareGameScore ? tg.shareGameScore() : tg.share();
            processFriendInvitation();
            tg.MainButton.hide();
        });
    } else processFriendInvitation();
}

function processFriendInvitation() {
    gameState.invitedFriends++;
    gameState.taskProgress.task1 = Math.min(gameState.taskProgress.task1 + 1, 10);
    addFriendToList(`Друг ${gameState.invitedFriends}`);
    if (gameState.taskProgress.task1 >= 10 && gameState.taskProgress.task1 !== 1) completeTask(1);
    else {
        updateTaskProgress();
        saveGameState();
    }
    showPopup(`Друг приглашен! ${Math.min(gameState.invitedFriends, 10)}/10`);
    playSound('click');
    vibrate(50);
    trackEvent('friend_invited', { total: gameState.invitedFriends });
}

function addFriendToList(name) {
    const friendsList = document.getElementById('friends-list');
    if (gameState.invitedFriends === 1) friendsList.innerHTML = '';
    const friendItem = document.createElement('div');
    friendItem.className = 'friend-item';
    friendItem.innerHTML = `<div class="friend-avatar"></div><div>${name}</div>`;
    friendsList.appendChild(friendItem);
}

// Кормление миньона
function feedMinion() {
    if (gameState.bananas < 3) return showPopup('Нужно 3 🍌 для кормления!');
    gameState.bananas -= 3;
    gameState.taskProgress.task3 = Math.min(gameState.taskProgress.task3 + 1, 5);
    const minion = document.querySelector('.big-minion');
    if (minion) {
        minion.classList.add('feed-animation');
        setTimeout(() => minion.classList.remove('feed-animation'), 1000);
    }
    if (gameState.taskProgress.task3 >= 5 && gameState.taskProgress.task3 !== 1) completeTask(3);
    else {
        showPopup(`Миньон накормлен! ${gameState.taskProgress.task3}/5`);
        updateStats();
        updateTaskProgress();
        saveGameState();
    }
    playSound('minionHappy');
    vibrate(50);
    trackEvent('minion_fed', { progress: gameState.taskProgress.task3 });
}

// Мини-игра
function startMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (!miniGameContainer) return;
    miniGameContainer.style.display = 'flex';
    const gameField = document.getElementById('mini-game-field');
    gameField.innerHTML = '';
    const minionCount = 9, targetMinion = Math.floor(Math.random() * minionCount);
    for (let i = 0; i < minionCount; i++) {
        const minionElement = document.createElement('div');
        minionElement.className = 'mini-game-minion';
        minionElement.dataset.index = i;
        if (i === targetMinion) minionElement.classList.add('target-minion');
        minionElement.addEventListener('click', () => {
            if (i === targetMinion) {
                gameState.bananas += 10;
                gameState.totalBananas += 10;
                showPopup('Пойман нужный миньон! +10 🍌');
                playSound('reward');
                vibrate([50, 50, 100]);
                createConfetti();
                checkResourceTasks();
            } else {
                showPopup('Не тот миньон!');
                playSound('minionShocked');
            }
            updateStats();
            saveGameState();
            miniGameContainer.style.display = 'none';
            trackEvent('mini_game_played', { won: i === targetMinion });
        });
        gameField.appendChild(minionElement);
    }
}

function closeMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (miniGameContainer) miniGameContainer.style.display = 'none';
    playSound('click');
}

// Колесо фортуны
function spinRewardWheel() {
    const today = new Date().toDateString();
    if (gameState.lastWheelSpin === today) return showPopup('Колесо уже крутили сегодня!');
    const wheel = document.getElementById('reward-wheel');
    if (!wheel) return;
    playSound('box');
    vibrate([50, 50, 50, 50, 100]);
    const sectors = 8, rotations = 5, sector = Math.floor(Math.random() * sectors);
    const angle = rotations * 360 + (sector * (360 / sectors));
    wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${angle}deg)`;
    setTimeout(() => {
        let rewardText = '';
        switch (sector) {
            case 0: gameState.bananas += 10; gameState.totalBananas += 10; rewardText = '+10 🍌'; break;
            case 1: gameState.bananas += 20; gameState.totalBananas += 20; rewardText = '+20 🍌'; break;
            case 2: gameState.stars += 2; gameState.totalStars += 2; rewardText = '+2 ⭐'; break;
            case 3: gameState.bananas += 50; gameState.totalBananas += 50; rewardText = '+50 🍌'; break;
            case 4: gameState.stars += 5; gameState.totalStars += 5; rewardText = '+5 ⭐'; break;
            case 5: gameState.bananas += 30; gameState.totalBananas += 30; rewardText = '+30 🍌'; break;
            case 6: gameState.stars += 3; gameState.totalStars += 3; rewardText = '+3 ⭐'; break;
            case 7: gameState.bananas += 100; gameState.totalBananas += 100; gameState.stars += 10; gameState.totalStars += 10; rewardText = 'Джекпот! +100 🍌, +10 ⭐'; break;
        }
        gameState.lastWheelSpin = today;
        showPopup(`Вы выиграли: ${rewardText}`);
        if (sector === 7) {
            createConfetti();
            playSound('achievement');
            vibrate([100, 50, 100, 50, 200]);
        }
        updateStats();
        checkResourceTasks();
        saveGameState();
        trackEvent('wheel_spun', { sector, reward: rewardText });
    }, 4000);
}

// Достижения
function updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;
    achievementsList.innerHTML = '';
    checkAchievements();
    gameState.achievements.forEach(achievement => {
        const li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });
    if (gameState.achievements.length >= 5 && gameState.taskProgress.task7 < 1) {
        gameState.taskProgress.task7 = 1;
        completeTask(7);
    }
}

function checkAchievements() {
    const achievements = [
        { title: 'Трудолюбивый помощник', condition: () => gameState.completedTasks >= 3 },
        { title: 'Банановый коллекционер', condition: () => gameState.totalBananas >= 100 },
        { title: 'Охотник за сокровищами', condition: () => gameState.openedBoxes >= 5 },
        { title: 'Популярный миньон', condition: () => gameState.invitedFriends >= 5 },
        { title: 'Постоянный игрок', condition: () => gameState.streak >= 3 },
        { title: 'Опытный миньоновод', condition: () => gameState.level >= 5 }
    ];
    achievements.forEach(({ title, condition }) => {
        if (condition() && !gameState.achievements.includes(title)) {
            gameState.achievements.push(title);
            showAchievementNotification(title);
        }
    });
}

function showAchievementNotification(achievementName) {
    const notification = document.getElementById('achievement-notification');
    if (notification) {
        document.getElementById('achievement-text').textContent = achievementName;
        notification.style.display = 'block';
        playSound('achievement');
        vibrate([50, 50, 50, 50, 150]);
        setTimeout(() => notification.style.display = 'none', 3000);
    }
}

// Уровень и опыт
function addExperience(amount) {
    const expNeeded = Math.floor(100 * Math.pow(1.5, gameState.level - 1));
    gameState.exp = (gameState.exp || 0) + amount;
    if (gameState.exp >= expNeeded) {
        gameState.level++;
        gameState.exp -= expNeeded;
        gameState.bananas += 10 * gameState.level;
        gameState.totalBananas += 10 * gameState.level;
        gameState.stars += Math.floor(gameState.level / 2) + 1;
        gameState.totalStars += Math.floor(gameState.level / 2) + 1;
        showPopup(`Уровень ${gameState.level}! +${10 * gameState.level} 🍌, +${Math.floor(gameState.level / 2) + 1} ⭐`);
        playSound('levelUp');
        vibrate([100, 50, 100, 50, 200]);
        createConfetti();
        if (gameState.level >= 3 && gameState.taskProgress.task6 < 1) {
            gameState.taskProgress.task6 = 1;
            completeTask(6);
        }
        trackEvent('level_up', { level: gameState.level });
    }
    updateLevelProgress();
}

function updateLevelProgress() {
    const expNeeded = Math.floor(100 * Math.pow(1.5, gameState.level - 1));
    const percentage = ((gameState.exp || 0) / expNeeded) * 100;
    const levelProgress = document.getElementById('level-progress');
    if (levelProgress) levelProgress.style.width = `${percentage}%`;
    const levelCounter = document.getElementById('level-counter');
    if (levelCounter) levelCounter.textContent = `${gameState.exp || 0}/${expNeeded}`;
}

// Всплывающие окна
function showPopup(text) {
    const popup = document.getElementById('reward-popup');
    if (popup) {
        document.getElementById('reward-text').textContent = text;
        popup.style.display = 'flex';
        setTimeout(() => popup.classList.add('show'), 10);
    } else {
        console.warn('Popup не найден, используется простой alert');
        alert(text);
    }
}

function closePopup() {
    const popup = document.getElementById('reward-popup');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.style.display = 'none', 300);
        playSound('click');
    }
}

// Конфетти
function createConfetti() {
    const colors = ['#FFD000', '#FFB700', '#FFC400', '#FF8C00', '#FFE066'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.width = `${Math.random() * 10 + 5}px`;
        confetti.style.height = `${Math.random() * 10 + 5}px`;
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `slideIn ${Math.random() * 2 + 1}s linear forwards, fadeIn ${Math.random() * 2 + 1}s ease-out forwards`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Интерактивный миньон
function initInteractiveMinion() {
    const minion = document.getElementById('interactive-minion');
    if (minion) {
        minion.addEventListener('click', () => {
            minion.classList.add('pet-animation');
            setTimeout(() => minion.classList.remove('pet-animation'), 500);
            gameState.petCount++;
            if (gameState.petCount % 5 === 0) {
                gameState.bananas++;
                gameState.totalBananas++;
                showPopup('+1 🍌 за заботу!');
                updateStats();
                saveGameState();
            }
            playSound(Math.random() < 0.5 ? 'minionHappy' : 'minionJump');
            vibrate(30);
            trackEvent('minion_pet', { count: gameState.petCount });
        });
    }
}

// Сброс прогресса
function resetProgress() {
    if (confirm('Сбросить весь прогресс? Это действие необратимо!')) {
        localStorage.removeItem('minionsGameState');
        localStorage.removeItem('minionsGameSettings');
        if (settings.serverSync && settings.userId) {
            fetch(`${SERVER_URL}/delete-progress/${settings.userId}`, { method: 'DELETE' })
                .then(() => console.log('Данные сервера удалены'))
                .catch(e => console.error('Ошибка удаления:', e));
        }
        location.reload();
    }
}

// Обработчики событий
function setupEventListeners() {
    document.getElementById('daily-reward-btn')?.addEventListener('click', claimDailyReward);
    document.getElementById('feed-minion-btn')?.addEventListener('click', feedMinion);
    document.getElementById('start-mini-game')?.addEventListener('click', startMiniGame);
    document.getElementById('close-mini-game')?.addEventListener('click', closeMiniGame);
    document.getElementById('spin-wheel-btn')?.addEventListener('click', spinRewardWheel);
    document.getElementById('reset-progress')?.addEventListener('click', resetProgress);
    document.getElementById('invite-button')?.addEventListener('click', inviteFriends);
    document.getElementById('sound-toggle')?.addEventListener('click', () => {
        settings.soundEnabled = !settings.soundEnabled;
        document.getElementById('sound-toggle').innerHTML = settings.soundEnabled ? '🔊' : '🔇';
        saveSettings();
        if (settings.soundEnabled) playSound('click');
    });
    document.getElementById('vibration-toggle')?.addEventListener('click', () => {
        settings.vibrationEnabled = !settings.vibrationEnabled;
        document.getElementById('vibration-toggle').innerHTML = settings.vibrationEnabled ? '📳' : '📴';
        saveSettings();
        if (settings.vibrationEnabled) vibrate(50);
    });
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const sectionId = item.getAttribute('data-section');
            playSound('click');
            vibrate(30);
            showSection(sectionId);
        });
    });
    document.querySelectorAll('.tip-button').forEach(button => {
        button.addEventListener('click', () => showTip(button.dataset.tip));
    });
    document.getElementById('sound-toggle').innerHTML = settings.soundEnabled ? '🔊' : '🔇';
    document.getElementById('vibration-toggle').innerHTML = settings.vibrationEnabled ? '📳' : '📴';
    initInteractiveMinion();
}

// Подсказки
function showTip(tipId) {
    const tips = {
        bananas: 'Бананы - основная валюта для боксов и кормления миньонов.',
        stars: 'Звезды - редкая валюта для премиум-боксов.',
        level: 'Собирайте ресурсы, чтобы повысить уровень!',
        tasks: 'Выполняйте задания для наград.',
        daily: 'Ежедневные награды увеличиваются с серией входов.'
    };
    showPopup(tips[tipId] || 'Играйте и наслаждайтесь!');
    playSound('click');
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => {
    saveGameState();
    flushEvents();
});
