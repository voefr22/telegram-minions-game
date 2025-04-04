// Глобальная переменная для Telegram WebApp
let tg = null;

// Инициализация Telegram WebApp
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

// Аудио эффекты
const sounds = {
    click: new Audio('https://cdn.freesound.org/previews/220/220206_4100637-lq.mp3'),
    reward: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'),
    task: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
    box: new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'),
    achievement: new Audio('https://cdn.freesound.org/previews/320/320775_1661766-lq.mp3'),
    levelUp: new Audio('https://cdn.freesound.org/previews/522/522616_2336793-lq.mp3')
};

// Настройки игры
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
    completedTasks: 0,
    openedBoxes: 0,
    totalBananas: 0,
    totalStars: 0,
    activeDays: 1,
    streak: 0,
    lastReward: null,
    lastWheelSpin: null,
    invitedFriends: 0,
    lastSaveTime: Date.now(),
    achievements: ['Начинающий миньоновод'],
    taskProgress: {
        task1: 0, task2: 0, task3: 0, task4: 0, task5: 0,
        task6: 0, task7: 0, task8: 0, task9: 0, task10: 0
    }
};

// Серверный URL
const SERVER_URL = 'https://minions-game-server.glitch.me/api';

// Утилиты для работы с настройками
function loadSettings() {
    const savedSettings = localStorage.getItem('minionsGameSettings');
    if (savedSettings) {
        try {
            settings = { ...settings, ...JSON.parse(savedSettings) };
            console.log("Настройки загружены", settings);
        } catch (e) {
            console.error('Ошибка при загрузке настроек:', e);
        }
    }
}

function saveSettings() {
    localStorage.setItem('minionsGameSettings', JSON.stringify(settings));
    console.log("Настройки сохранены", settings);
}

// Утилиты для работы с звуком и вибрацией
function playSound(sound) {
    if (settings.soundEnabled && sounds[sound]) {
        sounds[sound].currentTime = 0;
        sounds[sound].play().catch(err => console.warn('Ошибка воспроизведения звука:', err));
    }
}

function vibrate(pattern) {
    if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

// Работа с сервером
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
    } catch (error) {
        console.error("Ошибка сети:", error);
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
            console.error("Ошибка загрузки с сервера:", await response.text());
        }
    } catch (error) {
        console.error("Ошибка сети:", error);
    }
    return false;
}

// Работа с локальным хранилищем
function loadGameState() {
    const savedState = localStorage.getItem('minionsGameState');
    if (savedState) {
        try {
            gameState = { ...gameState, ...JSON.parse(savedState) };
            checkDailyLogin();
            console.log("Состояние загружено из localStorage");
            return true;
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
        }
    }
    return false;
}

function saveGameState() {
    localStorage.setItem('minionsGameState', JSON.stringify(gameState));
    console.log("Состояние сохранено в localStorage");
    if (Date.now() - gameState.lastSaveTime > 5 * 60 * 1000) {
        syncWithServer();
    }
}

// Логика ежедневного входа
function checkDailyLogin() {
    const today = new Date().toDateString();
    const rewardContainer = document.getElementById('daily-reward-container');
    if (gameState.lastReward !== today) {
        rewardContainer.style.display = 'block';
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (gameState.lastReward === yesterday.toDateString()) {
            gameState.streak++;
            if (gameState.streak >= 5 && gameState.taskProgress.task8 < 1) {
                gameState.taskProgress.task8 = 1;
                completeTask(8);
            }
        } else if (gameState.lastReward) {
            gameState.streak = 0;
        }
        gameState.activeDays++;
        document.getElementById('streak-count').textContent = gameState.streak;
    } else {
        rewardContainer.style.display = 'none';
    }
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

    document.getElementById('daily-reward-container').style.display = 'none';
    checkResourceTasks();
    document.getElementById('reward-animation').innerHTML = '🎁';
    showPopup(`Ежедневная награда: +${bananaReward} бананов, +${starReward} звезд!`);
    playSound('reward');
    vibrate([100, 50, 100]);
    createConfetti();
    updateStats();
    saveGameState();
}

// Обновление интерфейса
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
    if (progressBar && counter) {
        progressBar.style.width = `${(current / total) * 100}%`;
        counter.textContent = `${current}/${total}`;
    }
}

// Переключение секций
function showSection(sectionId) {
    console.log("Переключение на секцию:", sectionId);
    const sections = ['tasks-section', 'boxes-section', 'friends-section', 'profile-section', 'settings-section'];
    sections.forEach(id => {
        const section = document.getElementById(id);
        section.classList.toggle('hidden-section', id !== sectionId);
        section.classList.toggle('active-section', id === sectionId);
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
    });
}

// Логика заданий
function completeTask(taskId) {
    if (gameState.taskProgress[`task${taskId}`] >= 1) return;

    const rewards = {
        1: { type: 'bananas', amount: 100, condition: () => gameState.taskProgress.task1 >= 10 },
        2: { type: 'bananas', amount: 50 },
        3: { type: 'bananas', amount: 20, condition: () => gameState.taskProgress.task3 >= 5 },
        4: { type: 'stars', amount: 5 },
        5: { type: 'stars', amount: 10 },
        6: { type: 'stars', amount: 15 },
        7: { type: 'both', bananas: 50, stars: 5 },
        8: { type: 'stars', amount: 8 },
        9: { type: 'stars', amount: 10 },
        10: { type: 'bananas', amount: 150 }
    };

    const reward = rewards[taskId];
    if (reward.condition && !reward.condition()) return;

    gameState.taskProgress[`task${taskId}`] = 1;
    gameState.completedTasks++;

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

    updateStats();
    updateTaskProgress();
    saveGameState();
    showPopup(rewardText);
    playSound('task');
    vibrate([100, 30, 100, 30, 100]);
    createConfetti();
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

// Логика боксов
function openBox(type) {
    const boxTypes = {
        simple: { cost: 10, currency: 'bananas', rewards: ['15 бананов', '2 звезды', 'Стикер'] },
        standard: { cost: 20, currency: 'bananas', rewards: ['30 бананов', '4 звезды', 'Премиум-стикер'] },
        premium: { cost: 5, currency: 'stars', rewards: ['50 бананов', '7 звезд', 'Эксклюзивный подарок'] },
        mega: { cost: 10, currency: 'stars', rewards: ['100 бананов', '12 звезд', 'Редкий подарок'] },
        special: { cost: 30, currency: 'bananas', rewards: ['40 бананов и 3 звезды', '5 звезд', 'Специальный подарок'] },
        epic: { cost: 15, currency: 'stars', rewards: ['150 бананов', '20 звезд', 'Эпический подарок'] }
    };

    const box = boxTypes[type];
    if (!box) return;

    const currency = gameState[box.currency];
    if (currency < box.cost) {
        showPopup(`Недостаточно ${box.currency === 'bananas' ? 'бананов' : 'звезд'} для открытия бокса!`);
        return;
    }

    gameState[box.currency] -= box.cost;
    gameState.openedBoxes++;

    const rewardIndex = Math.floor(Math.random() * 3);
    let rewardText = `Вы получили ${box.rewards[rewardIndex]}!`;

    if (rewardIndex === 0) {
        const [bananas, stars] = box.rewards[0].match(/\d+/g) || [];
        gameState.bananas += parseInt(bananas) || 0;
        gameState.totalBananas += parseInt(bananas) || 0;
        if (stars) {
            gameState.stars += parseInt(stars);
            gameState.totalStars += parseInt(stars);
        }
    } else if (rewardIndex === 1) {
        const stars = parseInt(box.rewards[1].match(/\d+/)[0]);
        gameState.stars += stars;
        gameState.totalStars += stars;
    }

    if (type === 'premium' && gameState.taskProgress.task2 === 0) {
        gameState.taskProgress.task2 = 1;
        completeTask(2);
    }
    if (gameState.openedBoxes >= 5 && gameState.taskProgress.task5 === 0) {
        gameState.taskProgress.task5 = 1;
        completeTask(5);
    }

    showPopup(rewardText);
    playSound('box');
    vibrate([50, 30, 100]);
    createConfetti();
    updateStats();
    updateTaskProgress();
    saveGameState();
}

// Приглашение друзей
function inviteFriends() {
    if (tg && tg.MainButton) {
        tg.MainButton.setText('Поделиться с друзьями');
        tg.MainButton.show();
        tg.MainButton.onClick(() => {
            tg.shareGameScore?.() || tg.share?.();
            processFriendInvitation();
            tg.MainButton.hide();
        });
    } else {
        processFriendInvitation();
    }
}

function processFriendInvitation() {
    gameState.invitedFriends++;
    gameState.taskProgress.task1 = Math.min(gameState.taskProgress.task1 + 1, 10);
    addFriendToList('Друг ' + gameState.invitedFriends);

    if (gameState.taskProgress.task1 >= 10 && gameState.taskProgress.task1 !== 1) {
        gameState.taskProgress.task1 = 1;
        completeTask(1);
    } else {
        updateTaskProgress();
        saveGameState();
    }

    showPopup('Друг приглашен! Прогресс: ' + Math.min(gameState.invitedFriends, 10) + '/10');
    playSound('click');
    vibrate(50);
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
    if (gameState.bananas < 3) {
        showPopup('Недостаточно бананов! Нужно 3 банана для кормления.');
        return;
    }

    gameState.bananas -= 3;
    gameState.taskProgress.task3 = Math.min(gameState.taskProgress.task3 + 1, 5);

    const minion = document.querySelector('.big-minion');
    minion.classList.add('feed-animation');
    setTimeout(() => minion.classList.remove('feed-animation'), 1000);

    if (gameState.taskProgress.task3 >= 5 && gameState.taskProgress.task3 !== 1) {
        gameState.taskProgress.task3 = 1;
        completeTask(3);
    } else {
        showPopup(`Миньон накормлен! Прогресс: ${gameState.taskProgress.task3}/5`);
        updateStats();
        updateTaskProgress();
        saveGameState();
    }

    playSound('task');
    vibrate(50);
}

// Достижения
function updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;

    achievementsList.innerHTML = gameState.achievements.map(ach => `<li>${ach}</li>`).join('');

    const newAchievements = [
        { condition: gameState.completedTasks >= 3, name: 'Трудолюбивый помощник' },
        { condition: gameState.totalBananas >= 100, name: 'Банановый коллекционер' },
        { condition: gameState.openedBoxes >= 5, name: 'Охотник за сокровищами' },
        { condition: gameState.invitedFriends >= 5, name: 'Популярный миньон' },
        { condition: gameState.streak >= 3, name: 'Постоянный игрок' },
        { condition: gameState.level >= 5, name: 'Опытный миньоновод' }
    ];

    newAchievements.forEach(ach => {
        if (ach.condition && !gameState.achievements.includes(ach.name)) {
            gameState.achievements.push(ach.name);
            showAchievementNotification(ach.name);
        }
    });

    if (gameState.achievements.length >= 5 && gameState.taskProgress.task7 === 0) {
        gameState.taskProgress.task7 = 1;
        completeTask(7);
    }

    if (gameState.totalBananas >= gameState.level * 50 && gameState.totalStars >= gameState.level * 5) {
        gameState.level++;
        showPopup(`Поздравляем! Вы достигли уровня ${gameState.level}!`);
        playSound('levelUp');
        vibrate([100, 50, 100, 50, 200]);
        if (gameState.level >= 3 && gameState.taskProgress.task6 === 0) {
            gameState.taskProgress.task6 = 1;
            completeTask(6);
        }
    }
}

function showAchievementNotification(achievementName) {
    const notification = document.getElementById('achievement-notification');
    document.getElementById('achievement-text').textContent = achievementName;
    notification.style.display = 'block';
    playSound('achievement');
    vibrate([50, 50, 50, 50, 150]);
    setTimeout(() => notification.style.display = 'none', 3000);
}

// Всплывающие окна
function showPopup(text) {
    const popup = document.getElementById('reward-popup');
    document.getElementById('reward-text').textContent = text;
    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);
}

function closePopup() {
    const popup = document.getElementById('reward-popup');
    popup.classList.remove('show');
    setTimeout(() => popup.style.display = 'none', 300);
    playSound('click');
}

// Эффект конфетти
function createConfetti() {
    const colors = ['#FFD000', '#FFB700', '#FFC400', '#FF8C00', '#FFE066'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.opacity = Math.random();
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.animation = `slideIn ${Math.random() * 2 + 1}s linear forwards, fadeIn ${Math.random() * 2 + 1}s ease-out forwards`;
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 3000);
    }
}

// Мини-игра
function startMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (!miniGameContainer) return;

    miniGameContainer.style.display = 'flex';
    const gameField = document.getElementById('mini-game-field');
    gameField.innerHTML = '';

    const minionCount = 9;
    const targetMinion = Math.floor(Math.random() * minionCount);

    for (let i = 0; i < minionCount; i++) {
        const minionElement = document.createElement('div');
        minionElement.className = 'mini-game-minion';
        minionElement.dataset.index = i;
        if (i === targetMinion) minionElement.classList.add('target-minion');

        minionElement.addEventListener('click', () => {
            if (i === targetMinion) {
                showPopup('Вы поймали нужного миньона! +10 бананов');
                gameState.bananas += 10;
                gameState.totalBananas += 10;
                playSound('reward');
                vibrate([50, 50, 100]);
                createConfetti();
                checkResourceTasks();
            } else {
                showPopup('Это не тот миньон! Попробуйте еще раз.');
                playSound('click');
            }
            updateStats();
            saveGameState();
            miniGameContainer.style.display = 'none';
        });

        gameField.appendChild(minionElement);
    }

    document.getElementById('mini-game-instruction').textContent = 'Найдите и нажмите на особенного миньона!';
}

function closeMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (miniGameContainer) {
        miniGameContainer.style.display = 'none';
        playSound('click');
    }
}

// Колесо наград
function spinRewardWheel() {
    const today = new Date().toDateString();
    if (gameState.lastWheelSpin === today) {
        showPopup('Вы уже крутили колесо сегодня! Приходите завтра.');
        return;
    }

    const wheel = document.getElementById('reward-wheel');
    if (!wheel) return;

    playSound('box');
    vibrate([50, 50, 50, 50, 100]);

    const sectors = 8;
    const rotations = 5;
    const sector = Math.floor(Math.random() * sectors);
    const angle = rotations * 360 + (sector * (360 / sectors));

    wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${angle}deg)`;

    setTimeout(() => {
        const rewards = [
            { type: 'bananas', amount: 10 }, { type: 'bananas', amount: 20 },
            { type: 'stars', amount: 2 }, { type: 'bananas', amount: 50 },
            { type: 'stars', amount: 5 }, { type: 'bananas', amount: 30 },
            { type: 'stars', amount: 3 }, { type: 'both', bananas: 100, stars: 10 }
        ];
        const reward = rewards[sector];
        let rewardText = '';

        if (reward.type === 'bananas') {
            gameState.bananas += reward.amount;
            gameState.totalBananas += reward.amount;
            rewardText = `Вы выиграли ${reward.amount} бананов!`;
        } else if (reward.type === 'stars') {
            gameState.stars += reward.amount;
            gameState.totalStars += reward.amount;
            rewardText = `Вы выиграли ${reward.amount} звезд!`;
        } else if (reward.type === 'both') {
            gameState.bananas += reward.bananas;
            gameState.totalBananas += reward.bananas;
            gameState.stars += reward.stars;
            gameState.totalStars += reward.stars;
            rewardText = `Джекпот! +${reward.bananas} бананов и +${reward.stars} звезд!`;
            createConfetti();
            playSound('achievement');
            vibrate([100, 50, 100, 50, 200, 50, 200]);
        }

        gameState.lastWheelSpin = today;
        updateStats();
        checkResourceTasks();
        saveGameState();
        showPopup(rewardText);
    }, 4000);
}

// Подсказки
function showTip(tipId) {
    const tips = {
        bananas: 'Бананы - основная валюта. Их можно тратить на открытие боксов.',
        stars: 'Звезды - премиум валюта. Они нужны для открытия особых боксов.',
        level: 'Ваш уровень растет, когда вы собираете бананы и звезды. Новый уровень даёт бонусы!',
        tasks: 'Выполняйте задания, чтобы получать награды и достижения.',
        daily: 'Заходите каждый день, чтобы получать ежедневные награды и бонусы за серию дней.'
    };
    showPopup(tips[tipId] || 'Играйте и развлекайтесь с миньонами!');
}

// Сброс прогресса
function resetProgress() {
    if (!confirm('Вы уверены, что хотите сбросить весь прогресс? Это действие нельзя отменить!')) return;

    localStorage.removeItem('minionsGameState');
    localStorage.removeItem('minionsGameSettings');

    if (settings.serverSync && settings.userId) {
        fetch(`${SERVER_URL}/delete-progress/${settings.userId}`, { method: 'DELETE' })
            .then(() => console.log('Данные с сервера удалены'))
            .catch(error => console.error('Ошибка удаления с сервера:', error));
    }

    location.reload();
}

// Инициализация приложения
async function init() {
    console.log("Инициализация приложения");
    document.getElementById('splash-screen').style.display = 'flex';

    loadSettings();
    if (tg && tg.initDataUnsafe?.user) {
        settings.userId = tg.initDataUnsafe.user.id.toString();
        document.getElementById('user-name').textContent = tg.initDataUnsafe.user.username || 'Игрок';
        settings.serverSync = true;
        saveSettings();
        if (!await loadFromServer()) loadGameState();
    } else {
        document.getElementById('user-name').textContent = 'Игрок';
        loadGameState();
    }

    updateStats();
    updateTaskProgress();

    setTimeout(() => {
        document.getElementById('splash-screen').style.opacity = 0;
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
        }, 500);
        playSound('task');
    }, 1500);
}

// Настройка обработчиков событий
function setupEventListeners() {
    const events = {
        'daily-reward-btn': claimDailyReward,
        'feed-minion-btn': feedMinion,
        'start-mini-game': startMiniGame,
        'close-mini-game': closeMiniGame,
        'reset-progress': resetProgress,
        'spin-wheel-btn': spinRewardWheel,
        'sound-toggle': () => {
            settings.soundEnabled = !settings.soundEnabled;
            document.getElementById('sound-toggle').innerHTML = settings.soundEnabled ? '🔊' : '🔇';
            saveSettings();
            if (settings.soundEnabled) playSound('click');
        },
        'vibration-toggle': () => {
            settings.vibrationEnabled = !settings.vibrationEnabled;
            document.getElementById('vibration-toggle').innerHTML = settings.vibrationEnabled ? '📳' : '📴';
            saveSettings();
            if (settings.vibrationEnabled) vibrate(50);
            if (settings.soundEnabled) playSound('click');
        }
    };

    Object.entries(events).forEach(([id, handler]) => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('click', handler);
    });

    document.querySelectorAll('.menu-item').forEach(item => {
        const sectionId = item.getAttribute('data-section');
        if (sectionId) {
            item.addEventListener('click', () => {
                playSound('click');
                vibrate(30);
                showSection(sectionId);
            });
        }
    });

    document.querySelectorAll('.tip-button').forEach(button => {
        button.addEventListener('click', () => {
            showTip(button.dataset.tip);
            playSound('click');
        });
    });

    document.getElementById('sound-toggle').innerHTML = settings.soundEnabled ? '🔊' : '🔇';
    document.getElementById('vibration-toggle').innerHTML = settings.vibrationEnabled ? '📳' : '📴';
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM загружен");
    Object.values(sounds).forEach(sound => sound.load());
    setupEventListeners();
    init();
});

window.onload = () => console.log("Страница загружена");
