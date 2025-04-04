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

// Аудио эффекты
const sounds = {
    click: new Audio('https://cdn.freesound.org/previews/220/220206_4100637-lq.mp3'),
    reward: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'),
    task: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
    box: new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'),
    achievement: new Audio('https://cdn.freesound.org/previews/320/320775_1661766-lq.mp3'),
    levelUp: new Audio('https://cdn.freesound.org/previews/522/522616_2336793-lq.mp3')
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
                    rewardText = 'Вы получили 15 бананов!';
                    gameState.bananas += 15;
                    gameState.totalBananas += 15;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 2 звезды!';
                    gameState.stars += 2;
                    gameState.totalStars += 2;
                } else {
                    rewardText = 'Вы получили стикер для Telegram!';
                }
            } else {
                showPopup('Недостаточно бананов для открытия простого бокса!');
                return;
            }
            break;
            
        case 'standard':
            if (gameState.bananas >= 20) {
                gameState.bananas -= 20;
                canOpen = true;
                
                // Случайная награда
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    rewardText = 'Вы получили 30 бананов!';
                    gameState.bananas += 30;
                    gameState.totalBananas += 30;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 4 звезды!';
                    gameState.stars += 4;
                    gameState.totalStars += 4;
                } else {
                    rewardText = 'Вы получили премиум-стикер для Telegram!';
                }
            } else {
                showPopup('Недостаточно бананов для открытия стандартного бокса!');
                return;
            }
            break;
            
        case 'premium':
            if (gameState.stars >= 5) {
                gameState.stars -= 5;
                canOpen = true;
                
                // Случайная награда
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    rewardText = 'Вы получили 50 бананов!';
                    gameState.bananas += 50;
                    gameState.totalBananas += 50;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 7 звезд!';
                    gameState.stars += 7;
                    gameState.totalStars += 7;
                } else {
                    rewardText = 'Вы получили эксклюзивный подарок для Telegram!';
                }
            } else {
                showPopup('Недостаточно звезд для открытия премиум-бокса!');
                return;
            }
            break;
            
        case 'mega':
            if (gameState.stars >= 10) {
                gameState.stars -= 10;
                canOpen = true;
                
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    rewardText = 'Вы получили 100 бананов!';
                    gameState.bananas += 100;
                    gameState.totalBananas += 100;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 12 звезд!';
                    gameState.stars += 12;
                    gameState.totalStars += 12;
                } else {
                    rewardText = 'Вы получили редкий подарок для Telegram!';
                }
            } else {
                showPopup('Недостаточно звезд для открытия мега-бокса!');
                return;
            }
            break;
            
        case 'special':
            if (gameState.bananas >= 30) {
                gameState.bananas -= 30;
                canOpen = true;
                
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    rewardText = 'Вы получили 40 бананов и 3 звезды!';
                    gameState.bananas += 40;
                    gameState.stars += 3;
                    gameState.totalBananas += 40;
                    gameState.totalStars += 3;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 5 звезд!';
                    gameState.stars += 5;
                    gameState.totalStars += 5;
                } else {
                    rewardText = 'Вы получили специальный подарок для Telegram!';
                }
            } else {
                showPopup('Недостаточно бананов для открытия особого бокса!');
                return;
            }
            break;
            
        case 'epic':
            if (gameState.stars >= 15) {
                gameState.stars -= 15;
                canOpen = true;
                
                let reward = Math.floor(Math.random() * 3) + 1;
                if (reward === 1) {
                    rewardText = 'Вы получили 150 бананов!';
                    gameState.bananas += 150;
                    gameState.totalBananas += 150;
                } else if (reward === 2) {
                    rewardText = 'Вы получили 20 звезд!';
                    gameState.stars += 20;
                    gameState.totalStars += 20;
                } else {
                    rewardText = 'Вы получили эпический подарок для Telegram!';
                }
            } else {
                showPopup('Недостаточно звезд для открытия эпического бокса!');
                return;
            }
            break;
    }
    
    if (canOpen) {
        gameState.openedBoxes++;
       // Проверка задания на открытие премиум-кейса
        if (type === 'premium' && gameState.taskProgress.task2 === 0) {
            gameState.taskProgress.task2 = 1;
            completeTask(2);
        }
        
        // Проверка задания на открытие 5 боксов
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
}

// Приглашение друзей
function inviteFriends() {
    console.log("Приглашение друзей");
    
    if (tg && tg.initDataUnsafe?.user) {
        // Показываем кнопку "Поделиться" в Telegram
        if (tg.MainButton) {
            tg.MainButton.setText('Поделиться с друзьями');
            tg.MainButton.show();
            tg.MainButton.onClick(function() {
                if (tg.shareGameScore) {
                    tg.shareGameScore();
                } else if (tg.share) {
                    tg.share();
                }
                // Увеличиваем счетчик приглашенных друзей
                processFriendInvitation();
                tg.MainButton.hide();
            });
        } else {
            // Если кнопки нет, просто обрабатываем приглашение
            processFriendInvitation();
        }
    } else {
        // Имитация приглашения друга (в реальном приложении тут будет API Telegram)
        processFriendInvitation();
    }
}

// Обработка приглашения друга
function processFriendInvitation() {
    gameState.invitedFriends++;
    gameState.taskProgress.task1 = Math.min(gameState.taskProgress.task1 + 1, 10);
    
    // Добавляем друга в список
    addFriendToList('Друг ' + gameState.invitedFriends);
    
    // Проверяем выполнение задания
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

// Добавление друга в список
function addFriendToList(name) {
    const friendsList = document.getElementById('friends-list');
    
    // Очищаем сообщение "нет друзей", если это первый друг
    if (gameState.invitedFriends === 1) {
        friendsList.innerHTML = '';
    }
    
    const friendItem = document.createElement('div');
    friendItem.className = 'friend-item';
    friendItem.innerHTML = `
        <div class="friend-avatar"></div>
        <div>${name}</div>
    `;
    
    friendsList.appendChild(friendItem);
}

// Кормление миньона
function feedMinion() {
    if (gameState.bananas >= 3) {
        gameState.bananas -= 3;
        gameState.taskProgress.task3 = Math.min(gameState.taskProgress.task3 + 1, 5);
        
        // Анимация кормления
        const minion = document.querySelector('.big-minion');
        minion.classList.add('feed-animation');
        setTimeout(() => {
            minion.classList.remove('feed-animation');
        }, 1000);
        
        // Проверяем задание на кормление 5 миньонов
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
    } else {
        showPopup('Недостаточно бананов! Нужно 3 банана для кормления.');
    }
}

// Обновление достижений
function updateAchievements() {
    let achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;
    
    achievementsList.innerHTML = '';
    
    gameState.achievements.forEach(achievement => {
        let li = document.createElement('li');
        li.textContent = achievement;
        achievementsList.appendChild(li);
    });

    // Проверка новых достижений
    if (gameState.completedTasks >= 3 && !gameState.achievements.includes('Трудолюбивый помощник')) {
        gameState.achievements.push('Трудолюбивый помощник');
        showAchievementNotification('Трудолюбивый помощник');
    }
    
    if (gameState.totalBananas >= 100 && !gameState.achievements.includes('Банановый коллекционер')) {
        gameState.achievements.push('Банановый коллекционер');
        showAchievementNotification('Банановый коллекционер');
    }
    
    if (gameState.openedBoxes >= 5 && !gameState.achievements.includes('Охотник за сокровищами')) {
        gameState.achievements.push('Охотник за сокровищами');
        showAchievementNotification('Охотник за сокровищами');
    }
    
    if (gameState.invitedFriends >= 5 && !gameState.achievements.includes('Популярный миньон')) {
        gameState.achievements.push('Популярный миньон');
        showAchievementNotification('Популярный миньон');
    }
    
    if (gameState.streak >= 3 && !gameState.achievements.includes('Постоянный игрок')) {
        gameState.achievements.push('Постоянный игрок');
        showAchievementNotification('Постоянный игрок');
    }
    
    if (gameState.level >= 5 && !gameState.achievements.includes('Опытный миньоновод')) {
        gameState.achievements.push('Опытный миньоновод');
        showAchievementNotification('Опытный миньоновод');
    }
    
    if (gameState.achievements.length >= 5 && gameState.taskProgress.task7 === 0) {
        gameState.taskProgress.task7 = 1;
        completeTask(7);
    }

    // Проверка повышения уровня
    if (gameState.totalBananas >= gameState.level * 50 && gameState.totalStars >= gameState.level * 5) {
        gameState.level++;
        showPopup(`Поздравляем! Вы достигли уровня ${gameState.level}!`);
        playSound('levelUp');
        vibrate([100, 50, 100, 50, 200]);
        
        // Проверка задания на достижение 3 уровня
        if (gameState.level >= 3 && gameState.taskProgress.task6 === 0) {
            gameState.taskProgress.task6 = 1;
            completeTask(6);
        }
    }
}

// Показать уведомление о достижении
function showAchievementNotification(achievementName) {
    const notification = document.getElementById('achievement-notification');
    document.getElementById('achievement-text').textContent = achievementName;
    
    notification.style.display = 'block';
    
    // Звук достижения
    playSound('achievement');
    vibrate([50, 50, 50, 50, 150]);
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Показать всплывающее окно
function showPopup(text) {
    document.getElementById('reward-text').textContent = text;
    const popup = document.getElementById('reward-popup');
    popup.style.display = 'flex';
    setTimeout(() => {
        popup.classList.add('show');
    }, 10);
}

// Закрыть всплывающее окно
function closePopup() {
    const popup = document.getElementById('reward-popup');
    popup.classList.remove('show');
    setTimeout(() => {
        popup.style.display = 'none';
    }, 300);
    
    playSound('click');
}

// Создание эффекта конфетти
function createConfetti() {
    const colors = ['#FFD000', '#FFB700', '#FFC400', '#FF8C00', '#FFE066'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.opacity = Math.random();
        confetti.style.transform = 'rotate(' + Math.random() * 360 + 'deg)';
        
        // Анимация падения
        confetti.style.animation = `
            slideIn ${Math.random() * 2 + 1}s linear forwards,
            fadeIn ${Math.random() * 2 + 1}s ease-out forwards
        `;
        
        document.body.appendChild(confetti);
        
        // Удаление конфетти после анимации
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// Запуск мини-игры
function startMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (!miniGameContainer) return;
    
    miniGameContainer.style.display = 'flex';
    
    // Генерация миньонов для игры
    const gameField = document.getElementById('mini-game-field');
    gameField.innerHTML = '';
    
    const minionCount = 9;
    let targetMinion = Math.floor(Math.random() * minionCount);
    
    for (let i = 0; i < minionCount; i++) {
        const minionElement = document.createElement('div');
        minionElement.className = 'mini-game-minion';
        minionElement.dataset.index = i;
        
        if (i === targetMinion) {
            minionElement.classList.add('target-minion');
        }
        
        minionElement.addEventListener('click', function() {
            if (i === targetMinion) {
                // Верный миньон
                showPopup('Вы поймали нужного миньона! +10 бананов');
                gameState.bananas += 10;
                gameState.totalBananas += 10;
                playSound('reward');
                vibrate([50, 50, 100]);
                createConfetti();
                
                // Проверяем задания на сбор бананов
                checkResourceTasks();
            } else {
                // Неверный миньон
                showPopup('Это не тот миньон! Попробуйте еще раз.');
                playSound('click');
            }
            
            updateStats();
            saveGameState();
            miniGameContainer.style.display = 'none';
        });
        
        gameField.appendChild(minionElement);
    }
    
    // Инструкция
    document.getElementById('mini-game-instruction').textContent = 'Найдите и нажмите на особенного миньона!';
}

// Закрытие мини-игры
function closeMiniGame() {
    const miniGameContainer = document.getElementById('mini-game-container');
    if (miniGameContainer) {
        miniGameContainer.style.display = 'none';
    }
    playSound('click');
}

// Функция для отображения подсказок
function showTip(tipId) {
    const tips = {
        'bananas': 'Бананы - основная валюта. Их можно тратить на открытие боксов.',
        'stars': 'Звезды - премиум валюта. Они нужны для открытия особых боксов.',
        'level': 'Ваш уровень растет, когда вы собираете бананы и звезды. Новый уровень даёт бонусы!',
        'tasks': 'Выполняйте задания, чтобы получать награды и достижения.',
        'daily': 'Заходите в игру каждый день, чтобы получать ежедневные награды и бонусы за серию дней.'
    };
    
    const tipText = tips[tipId] || 'Играйте и развлекайтесь с миньонами!';
    showPopup(tipText);
}

// Сбросить прогресс
function resetProgress() {
    if (confirm('Вы уверены, что хотите сбросить весь игровой прогресс? Это действие нельзя отменить!')) {
        localStorage.removeItem('minionsGameState');
        localStorage.removeItem('minionsGameSettings');
        
        // Если включена синхронизация с сервером, удаляем данные оттуда
        if (settings.serverSync && settings.userId) {
            fetch(`${SERVER_URL}/delete-progress/${settings.userId}`, {
                method: 'DELETE'
            }).then(() => {
                console.log('Данные с сервера удалены');
            }).catch(error => {
                console.error('Ошибка при удалении данных с сервера:', error);
            });
        }
        
        // Перезагружаем страницу для применения изменений
        location.reload();
    }
}

// Предварительная загрузка звуков
function preloadSounds() {
    // Предзагружаем все звуки
    Object.values(sounds).forEach(sound => {
        sound.load();
    });
}

// Устанавливаем обработчики событий
function setupEventListeners() {
    // Кнопка кормления миньона
    const feedButton = document.getElementById('feed-minion-btn');
    if (feedButton) {
        feedButton.addEventListener('click', feedMinion);
    }
    
    // Кнопка запуска мини-игры
    const miniGameButton = document.getElementById('start-mini-game');
    if (miniGameButton) {
        miniGameButton.addEventListener('click', startMiniGame);
    }
    
    // Кнопка закрытия мини-игры
    const closeMiniGameButton = document.getElementById('close-mini-game');
    if (closeMiniGameButton) {
        closeMiniGameButton.addEventListener('click', closeMiniGame);
    }
    
    // Кнопка сброса прогресса
    const resetButton = document.getElementById('reset-progress');
    if (resetButton) {
        resetButton.addEventListener('click', resetProgress);
    }
    
    // Кнопки подсказок
    document.querySelectorAll('.tip-button').forEach(button => {
        button.addEventListener('click', function() {
            showTip(this.dataset.tip);
            playSound('click');
        });
    });
    
    // Ежедневный бонус
    const spinWheelButton = document.getElementById('spin-wheel-btn');
    if (spinWheelButton) {
        spinWheelButton.addEventListener('click', spinRewardWheel);
    }
}

// Вращение колеса наград
function spinRewardWheel() {
    // Проверяем, можно ли вращать (раз в день)
    const today = new Date().toDateString();
    if (gameState.lastWheelSpin === today) {
        showPopup('Вы уже крутили колесо сегодня! Приходите завтра.');
        return;
    }
    
    // Показываем анимацию вращения
    const wheel = document.getElementById('reward-wheel');
    if (!wheel) return;
    
    playSound('box');
    vibrate([50, 50, 50, 50, 100]);
    
    // Случайное количество оборотов плюс случайный сектор
    const sectors = 8; // Количество секторов на колесе
    const rotations = 5; // Количество полных оборотов
    const sector = Math.floor(Math.random() * sectors);
    const angle = rotations * 360 + (sector * (360 / sectors));
    
    wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    wheel.style.transform = `rotate(${angle}deg)`;
    
    // Определяем награду после остановки колеса
    setTimeout(() => {
        let reward;
        
        // Награды по секторам (от 0 до 7)
        switch(sector) {
            case 0: // 10 бананов
                reward = { type: 'bananas', amount: 10 };
                break;
            case 1: // 20 бананов
                reward = { type: 'bananas', amount: 20 };
                break;
            case 2: // 2 звезды
                reward = { type: 'stars', amount: 2 };
                break;
            case 3: // 50 бананов
                reward = { type: 'bananas', amount: 50 };
                break;
            case 4: // 5 звезд
                reward = { type: 'stars', amount: 5 };
                break;
            case 5: // 30 бананов
                reward = { type: 'bananas', amount: 30 };
                break;
            case 6: // 3 звезды
                reward = { type: 'stars', amount: 3 };
                break;
            case 7: // Джекпот: 100 бананов и 10 звезд
                reward = { type: 'both', bananas: 100, stars: 10 };
                break;
        }
        
        // Выдаем награду
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
            
            // Особый эффект для джекпота
            createConfetti();
            playSound('achievement');
            vibrate([100, 50, 100, 50, 200, 50, 200]);
        }
        
        // Запоминаем дату вращения
        gameState.lastWheelSpin = today;
        
        // Обновляем статистику и сохраняем
        updateStats();
        checkResourceTasks();
        saveGameState();
        
        // Показываем результат
        showPopup(rewardText);
        
    }, 4000); // Подождем окончания анимации вращения
}

// Добавляем обработчик события DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM полностью загружен");
    
    // Предзагрузка звуков
    preloadSounds();
    
    // Настраиваем обработчики для кнопок меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const sectionId = item.getAttribute('data-section');
        if (sectionId) {
            item.addEventListener('click', function() {
                playSound('click');
                vibrate(30);
                showSection(sectionId);
            });
        }
    });
    
    // Настраиваем другие обработчики событий
    setupEventListeners();
    
    // Инициализируем приложение
    init();
});

// Инициализация приложения при загрузке страницы
window.onload = function() {
    console.log("Страница полностью загружена");
};
