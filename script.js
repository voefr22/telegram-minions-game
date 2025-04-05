// Add at the beginning of your script.js
const gameElements = {};

// Cache frequently accessed elements
function cacheElements() {
  gameElements.bananas = document.getElementById('bananas');
  gameElements.stars = document.getElementById('stars');
  gameElements.level = document.getElementById('level');
  gameElements.interactiveMinion = document.getElementById('interactive-minion');
  gameElements.splashScreen = document.getElementById('splash-screen');
  gameElements.popupMessage = document.getElementById('popup-message');
  // Add other frequently accessed elements
}

// Add this utility function
function throttle(func, delay) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

// Инициализация интерактивного миньона
function initInteractiveMinion() {
    try {
        const minion = document.getElementById('interactive-minion');
        
        if (!minion) {
            console.warn("Элемент миньона не найден");
            return;
        }
        
        // Обработчик нажатия на миньона с использованием throttle
        minion.addEventListener('click', throttle(() => {
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
        }, 300)); // 300ms throttle
        
        console.log("Интерактивный миньон инициализирован");
    } catch (error) {
        console.error("Ошибка при инициализации интерактивного миньона:", error);
    }
}

// Обновление достижений
function updateAchievements() {
    try {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) {
            console.warn("Список достижений не найден");
            return;
        }
        
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
    } catch (error) {
        console.error("Ошибка при обновлении достижений:", error);
    }
}

// Проверка новых достижений
function checkAchievements() {
    try {
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
    } catch (e) {
        console.error('Ошибка при проверке достижений:', e);
    }
}

// Функция приглашения друзей
function inviteFriend() {
    console.log("Приглашение друга");
    
    try {
        // Если приложение запущено в Telegram, используем его функционал
        if (tg) {
            try {
                tg.shareGame('minions_game_bot');
            } catch (e) {
                console.error('Ошибка при вызове shareGame:', e);
                // Если shareGame не работает, пробуем показать сообщение
                if (tg.showAlert) {
                    tg.showAlert('Приглашение отправлено!');
                }
            }
            
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
        } else {
            // Если вне Telegram, показываем уведомление
            showPopup('Эта функция доступна только в Telegram!');
        }
    } catch (e) {
        console.error('Ошибка при приглашении друга:', e);
        showPopup('Не удалось пригласить друга. Пожалуйста, попробуйте позже.');
    }
}

// Функция кручения колеса фортуны
function spinWheel() {
    console.log("Кручение колеса фортуны");
    
    try {
        // Проверяем, достаточно ли бананов
        if (gameState.bananas < 30) {
            showPopup('Недостаточно бананов! Требуется 30 бананов.');
            playSound('minionShocked');
            return;
        }
        
        // Списываем бананы
        gameState.bananas -= 30;
        
        // Получаем случайный сектор (от 1 до 8)
        const sector = Math.floor(Math.random() * 8) + 1;
        
        // Проверяем наличие элементов
        const wheelContainer = document.getElementById('wheel-container');
        const wheel = document.getElementById('fortune-wheel');
        
        if (!wheelContainer || !wheel) {
            console.warn('Элементы колеса фортуны не найдены');
            processWheelReward(sector); // Обрабатываем награду без анимации
            return;
        }
        
        // Подготавливаем колесо
        wheel.style.transform = 'rotate(0deg)';
        
        // Показываем колесо
        wheelContainer.style.display = 'flex';
        
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
                processWheelReward(sector);
            }, 4200);
        }, 500);
    } catch (e) {
        console.error('Ошибка при кручении колеса фортуны:', e);
        // Обрабатываем награду без анимации в случае ошибки
        const sector = Math.floor(Math.random() * 8) + 1;
        processWheelReward(sector);
    }
}

// Обработка награды от колеса фортуны
function processWheelReward(sector) {
    try {
        // Определяем награду
        let reward;
        
        switch(sector) {
            case 1: // 10 бананов
                reward = { type: 'bananas', amount: 10, text: '+10 бананов' };
                break;
            case 2: // 20 бананов
                reward = { type: 'bananas', amount: 20, text: '+20 бананов' };
                break;
            case 3: // 30 бананов
                reward = { type: 'bananas', amount: 30, text: '+30 бананов' };
                break;
            case 4: // 40 бананов
                reward = { type: 'bananas', amount: 40, text: '+40 бананов' };
                break;
            case 5: // 5 опыта
                reward = { type: 'exp', amount: 5, text: '+5 опыта' };
                break;
            case 6: // 10 опыта
                reward = { type: 'exp', amount: 10, text: '+10 опыта' };
                break;
            case 7: // 15 опыта
                reward = { type: 'exp', amount: 15, text: '+15 опыта' };
                break;
            case 8: // 100 бананов (джекпот)
                reward = { type: 'bananas', amount: 100, text: 'ДЖЕКПОТ! +100 бананов' };
                break;
        }
        
        // Применяем награду
        if (reward.type === 'bananas') {
            gameState.bananas += reward.amount;
            gameState.totalBananas += reward.amount;
        } else if (reward.type === 'exp') {
            addExperience(reward.amount);
        }
        
        // Показываем результат
        const wheelResult = document.getElementById('wheel-result');
        if (wheelResult) {
            wheelResult.textContent = reward.text;
            wheelResult.style.opacity = 1;
        } else {
            // Если элемент не найден, показываем всплывающее сообщение
            showPopup(`Колесо фортуны: ${reward.text}`);
        }
        
        // Звуковой эффект и вибрация для награды
        playSound('reward');
        vibrate([200]);
        
        // Создаем эффект конфетти
        createConfetti();
        
        // Обновляем статистику и сохраняем
        updateStats();
        saveGameState();
    } catch (e) {
        console.error('Ошибка при обработке награды колеса фортуны:', e);
    }
}

// Показать всплывающее сообщение
function showPopup(message) {
    try {
        const popup = document.getElementById('popup-message');
        if (!popup) {
            // Если элемент не найден, создаем его
            const newPopup = document.createElement('div');
            newPopup.id = 'popup-message';
            newPopup.style.position = 'fixed';
            newPopup.style.top = '20px';
            newPopup.style.left = '50%';
            newPopup.style.transform = 'translateX(-50%)';
            newPopup.style.background = '#FFD000';
            newPopup.style.color = '#333';
            newPopup.style.padding = '15px 25px';
            newPopup.style.borderRadius = '10px';
            newPopup.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
            newPopup.style.zIndex = '1000';
            newPopup.style.textAlign = 'center';
            newPopup.style.fontWeight = 'bold';
            newPopup.style.transition = 'opacity 0.3s ease';
            
            document.body.appendChild(newPopup);
            
            // Используем созданный элемент
            newPopup.textContent = message;
            newPopup.style.display = 'block';
            newPopup.style.opacity = 1;
            
            // Скрываем через 3 секунды
            setTimeout(() => {
                newPopup.style.opacity = 0;
                setTimeout(() => {
                    newPopup.style.display = 'none';
                }, 500);
            }, 3000);
        } else {
            // Используем существующий элемент
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
    } catch (error) {
        console.error("Ошибка при отображении всплывающего сообщения:", error);
    }
}

// Проверка загрузки DOM перед вызовом init()
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Устанавливаем таймаут на случай, если init зависнет
        const initTimeout = setTimeout(function() {
            // Если через 5 секунд всё ещё есть экран загрузки, принудительно его скрываем
            const splashScreen = document.getElementById('splash-screen');
            if (splashScreen && splashScreen.style.display !== 'none') {
                console.error('Инициализация заняла слишком много времени, принудительно скрываем экран загрузки');
                splashScreen.style.display = 'none';
                handleError('Таймаут инициализации', new Error('Init timeout'));
            }
        }, 5000);
        
        // Запускаем инициализацию
        init().finally(() => {
            clearTimeout(initTimeout); // Очищаем таймаут, если init завершился
        });
    });
} else {
    // DOM уже загружен, запускаем init немедленно
    init().catch(error => {
        handleError("Ошибка при немедленном запуске init", error);
    });
}

// Обработчик перед закрытием страницы
window.addEventListener('beforeunload', function() {
    try {
        // Сохраняем данные
        saveGameState();
    } catch (e) {
        console.error('Ошибка при закрытии страницы:', e);
    }
});// Функция для обработки ошибок без блокировки приложения
function handleError(message, error) {
    console.error(message, error);
    
    // Показываем ошибку пользователю только если это критическая ошибка
    if (message.includes("инициализации") || message.includes("загрузки")) {
        showErrorPopup("Произошла ошибка при загрузке игры. Но мы всё равно попробуем запустить её!");
    }
    
    // Убедимся, что экран загрузки не остался видимым
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.style.opacity = 0;
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }
    
    // Показываем какую-нибудь секцию, чтобы не оставлять пустой экран
    try {
        showSection('tasks-section');
    } catch (e) {
        console.error("Не удалось показать секцию после ошибки", e);
    }
}

// Функция для показа ошибки
function showErrorPopup(message) {
    try {
        // Сначала попробуем показать через стандартный popup
        showPopup(message);
    } catch (e) {
        // Если это не сработало, создадим упрощенное сообщение
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translateX(-50%)';
        errorDiv.style.backgroundColor = '#FF6B6B';
        errorDiv.style.color = '#fff';
        errorDiv.style.padding = '15px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.zIndex = '10000';
        errorDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        errorDiv.style.maxWidth = '80%';
        errorDiv.style.textAlign = 'center';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 500);
        }, 3000);
    }
}

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

// Пути к изображениям с fallback URL
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

function preloadResources(callback) {
    const images = Object.entries(IMAGES);
    const totalResources = images.length;
    let loadedResources = 0;
    
    // Update loading progress
    function updateProgress() {
        loadedResources++;
        const progress = Math.floor((loadedResources / totalResources) * 100);
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = `${progress}%`;
        }
        
        if (loadedResources >= totalResources && callback) {
            callback();
        }
    }
    
    // Load each image
    images.forEach(([key, src]) => {
        preloadedImages[key] = new Image();
        preloadedImages[key].onload = updateProgress;
        preloadedImages[key].onerror = () => {
            console.warn(`Failed to load image: ${key}, using fallback`);
            preloadedImages[key].src = 'https://i.imgur.com/ZcukEsb.png';
            updateProgress();
        };
        preloadedImages[key].src = src;
    });
}

// Получение изображения (с fallback на случай ошибки)
function getImage(key) {
    if (preloadedImages[key] && preloadedImages[key].complete && preloadedImages[key].naturalWidth !== 0) {
        return preloadedImages[key].src;
    }
    // Возвращаем URL изображения или fallback
    return IMAGES[key] || 'https://i.imgur.com/ZcukEsb.png';
}

// Аудио эффекты с предзагрузкой
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
    try {
        const savedSettings = localStorage.getItem('minionsGameSettings');
        if (savedSettings) {
            settings = {...settings, ...JSON.parse(savedSettings)};
            console.log("Настройки загружены", settings);
        }
    } catch (e) {
        console.error('Ошибка при загрузке настроек:', e);
    }
}

// Сохранение настроек
function saveSettings() {
    try {
        localStorage.setItem('minionsGameSettings', JSON.stringify(settings));
        console.log("Настройки сохранены", settings);
    } catch (e) {
        console.error('Ошибка при сохранении настроек:', e);
    }
}

// Воспроизведение звука
function playSound(sound) {
    if (settings.soundEnabled && sounds[sound]) {
        try {
            sounds[sound].currentTime = 0;
            sounds[sound].play().catch(err => console.warn('Ошибка воспроизведения звука:', err));
        } catch (e) {
            console.warn('Ошибка при воспроизведении звука:', e);
        }
    }
}

// Вибрация устройства
function vibrate(pattern) {
    if (settings.vibrationEnabled && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            console.warn('Ошибка при вибрации:', e);
        }
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
    try {
        const savedState = localStorage.getItem('minionsGameState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            gameState = {...gameState, ...parsed};
            
            // Проверка на ежедневный вход
            checkDailyLogin();
            
            console.log("Состояние игры загружено из localStorage");
            return true;
        }
    } catch (e) {
        console.error('Ошибка при загрузке сохраненных данных:', e);
    }
    return false;
}

// Сохранение данных в localStorage
function saveGameState() {
    try {
        localStorage.setItem('minionsGameState', JSON.stringify(gameState));
        console.log("Состояние игры сохранено в localStorage");
        
        // Если прошло более 5 минут с последнего сохранения, синхронизируем с сервером
        if (Date.now() - gameState.lastSaveTime > 5 * 60 * 1000) {
            syncWithServer();
        }
    } catch (e) {
        console.error('Ошибка при сохранении игрового состояния:', e);
    }
}

// Уникальный идентификатор сессии
const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);

// Проверка ежедневного входа
function checkDailyLogin() {
    try {
        const today = new Date().toDateString();
        
        if (gameState.lastReward !== today) {
            // Показываем награду
            const dailyRewardContainer = document.getElementById('daily-reward-container');
            if (dailyRewardContainer) {
                dailyRewardContainer.style.display = 'block';
            }
            
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
            const streakCount = document.getElementById('streak-count');
            if (streakCount) {
                streakCount.textContent = gameState.streak;
            }
        } else {
            // Скрываем награду, если уже забрали сегодня
            const dailyRewardContainer = document.getElementById('daily-reward-container');
            if (dailyRewardContainer) {
                dailyRewardContainer.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Ошибка при проверке ежедневного входа:', e);
    }
}

// Получение ежедневной награды
function claimDailyReward() {
    try {
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
        const dailyRewardContainer = document.getElementById('daily-reward-container');
        if (dailyRewardContainer) {
            dailyRewardContainer.style.display = 'none';
        }
        
        // Проверяем задания на сбор бананов и звезд
        checkResourceTasks();
        
        // Показываем анимацию и оповещение
        const rewardAnimation = document.getElementById('reward-animation');
        if (rewardAnimation) {
            rewardAnimation.innerHTML = '🎁';
        }
        
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
    } catch (e) {
        console.error('Ошибка при получении ежедневной награды:', e);
    }
}

// Инициализация
async function init() {
    console.log("Инициализация приложения");
    
    try {
        // Cache DOM elements
        cacheElements();
        
        // Проверяем наличие элемента экрана загрузки
        if (gameElements.splashScreen) {
            gameElements.splashScreen.style.display = 'flex';
        } else {
            console.warn('Элемент splash-screen не найден');
        }
        
        // Загружаем настройки
        try {
            loadSettings();
        } catch (e) {
            console.error('Ошибка при загрузке настроек, используем значения по умолчанию', e);
        }
        
        // Предзагрузка изображений
        try {
            preloadResources(() => {
                // Загрузка ресурсов завершена
            });
        } catch (e) {
            console.error('Ошибка при предзагрузке изображений', e);
        }
        
        // Если приложение запущено в Telegram, получаем идентификатор пользователя
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            try {
                const user = tg.initDataUnsafe.user;
                settings.userId = user.id.toString();
                
                const userNameElement = document.getElementById('user-name');
                if (userNameElement) {
                    userNameElement.textContent = user.username || 'Игрок';
                }
                
                // Включаем синхронизацию
                settings.serverSync = true;
                saveSettings();
                
                // Пробуем загрузить данные с сервера
                let serverLoaded = false;
                try {
                    serverLoaded = await loadFromServer();
                } catch (e) {
                    console.error('Ошибка при загрузке с сервера', e);
                }
                
                // Если не удалось загрузить с сервера, пробуем из localStorage
                if (!serverLoaded) {
                    try {
                        loadGameState();
                    } catch (e) {
                        console.error('Ошибка при загрузке из localStorage', e);
                    }
                }
            } catch (e) {
                console.error('Ошибка при обработке данных Telegram', e);
            }
        } else {
            const userNameElement = document.getElementById('user-name');
            if (userNameElement) {
                userNameElement.textContent = 'Игрок';
            }
            
            try {
                loadGameState();
            } catch (e) {
                console.error('Ошибка при загрузке игрового состояния', e);
            }
        }
        
        // Обновляем статистику и прогресс
        try {
            updateStats();
            updateTaskProgress();
        } catch (e) {
            console.error('Ошибка при обновлении статистики', e);
        }
        
        // Инициализация UI
        try {
            initializeUI();
        } catch (e) {
            console.error('Ошибка при инициализации UI', e);
        }
        
        // Гарантированно закрываем экран загрузки через 2 секунды
        setTimeout(function() {
            try {
                if (gameElements.splashScreen) {
                    gameElements.splashScreen.style.opacity = 0;
                    setTimeout(function() {
                        gameElements.splashScreen.style.display = 'none';
                        
                        // Показываем последнюю активную секцию или главный экран
                        const lastSection = localStorage.getItem('lastActiveSection') || 'main-screen';
                        showSection(lastSection);
                    }, 500);
                    
                    // Проигрываем приветственный звук
                    playSound('task');
                } else {
                    showSection('main-screen');
                }
            } catch (e) {
                // Критическая ошибка - напрямую скрываем экран загрузки и показываем сообщение
                if (gameElements.splashScreen) gameElements.splashScreen.style.display = 'none';
                handleError('Критическая ошибка при инициализации интерфейса', e);
            }
        }, 2000);
        
        console.log("Инициализация приложения завершена");
    } catch (error) {
        // Общий обработчик ошибок
        handleError("Ошибка при инициализации приложения", error);
    }
}

// Инициализация UI-элементов 
function initializeUI() {
    try {
        // Добавляем обработчик для ежедневной награды
        const dailyRewardBtn = document.getElementById('daily-reward-btn');
        if (dailyRewardBtn) {
            dailyRewardBtn.addEventListener('click', claimDailyReward);
        }
        
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
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.innerHTML = settings.soundEnabled ? '🔊' : '🔇';
            soundToggle.addEventListener('click', function() {
                settings.soundEnabled = !settings.soundEnabled;
                this.innerHTML = settings.soundEnabled ? '🔊' : '🔇';
                saveSettings();
                if (settings.soundEnabled) playSound('click');
            });
        }
        
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.innerHTML = settings.vibrationEnabled ? '📳' : '📴';
            vibrationToggle.addEventListener('click', function() {
                settings.vibrationEnabled = !settings.vibrationEnabled;
                this.innerHTML = settings.vibrationEnabled ? '📳' : '📴';
                saveSettings();
                if (settings.vibrationEnabled) vibrate(50);
                if (settings.soundEnabled) playSound('click');
            });
        }
        
        // Добавляем обработчики для кнопок в других секциях
        const inviteButton = document.getElementById('invite-button');
        if (inviteButton) {
            inviteButton.addEventListener('click', inviteFriend);
        }
        
        // Добавляем обработчики для открытия боксов
        document.querySelectorAll('.box').forEach(box => {
            const boxType = box.getAttribute('data-type');
            if (boxType) {
                box.addEventListener('click', function() {
                    openBox(boxType);
                });
            }
        });
        
        // Инициализация кнопки для колеса фортуны
        const wheelButton = document.getElementById('wheel-button');
        if (wheelButton) {
            wheelButton.addEventListener('click', spinWheel);
        }
        
        // Инициализация интерактивного миньона
        initInteractiveMinion();
    } catch (e) {
        console.error('Ошибка при инициализации UI:', e);
    }
}

// Проверка заданий на сбор ресурсов
function checkResourceTasks() {
    try {
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
    } catch (e) {
        console.error('Ошибка при проверке заданий на сбор ресурсов:', e);
    }
}

// Обновление статистики
function updateStats() {
    try {
        // Безопасно обновляем элементы интерфейса
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
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
        
        // Обновляем прогресс уровня если элемент существует
        updateLevelProgress();
        
        // Обновляем достижения и проверяем задания
        updateAchievements();
        checkResourceTasks();
    } catch (error) {
        console.error("Ошибка при обновлении статистики:", error);
    }
}

// Обновление прогресса заданий
function updateTaskProgress() {
    try {
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
    } catch (error) {
        console.error("Ошибка при обновлении прогресса заданий:", error);
    }
}

// Обновление UI прогресса задания
function updateTaskProgressUI(taskId, current, total) {
    try {
        const progressBar = document.getElementById(`task${taskId}-progress`);
        const counter = document.getElementById(`task${taskId}-counter`);
        
        if (progressBar) {
            progressBar.style.width = `${(current / total) * 100}%`;
        }
        
        if (counter) {
            counter.textContent = `${current}/${total}`;
        }
    } catch (error) {
        console.error(`Ошибка при обновлении UI задания ${taskId}:`, error);
    }
}

// Проверка элементов DOM перед их использованием
function domElementExists(id) {
    return document.getElementById(id) !== null;
}
// Показать секцию
function showSection(sectionId) {
    console.log(`Переключение на секцию: ${sectionId}`);
    
    // Нормализуем ID секции
    if (!sectionId.endsWith('-section') && sectionId !== 'main-screen') {
        sectionId = sectionId + '-section';
    }
    
    // Получаем целевую секцию
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
        console.warn(`Секция не найдена: ${sectionId}`);
        return;
    }
    
    // Сначала скрываем все секции
    const sections = document.querySelectorAll('[id$="-section"], #main-screen');
    sections.forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });
    
    // Показываем целевую секцию
    targetSection.style.display = 'block';
    targetSection.classList.add('active-section');
    
    // Обновляем активные пункты меню
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        const itemSectionId = item.getAttribute('data-section');
        if (itemSectionId === sectionId || 
            itemSectionId + '-section' === sectionId || 
            (itemSectionId === 'main-screen' && sectionId === 'main-screen')) {
            item.classList.add('active');
        }
    });
    
    // Сохраняем последнюю активную секцию
    localStorage.setItem('lastActiveSection', sectionId);
}
// Выполнение задания
function completeTask(taskId) {
    console.log("Выполнение задания:", taskId);
    
    try {
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
                reward = { type: 'bananas', amount: 25 };
                break;
                
            case 5: // Открой 5 боксов
                reward = { type: 'bananas', amount: 40 };
                break;
                
            case 6: // Достигни 3 уровня
                reward = { type: 'bananas', amount: 60 };
                break;
                
            case 7: // Получи 5 достижений
                reward = { type: 'bananas', amount: 75 };
                break;
                
            case 8: // Серия входов 5 дней подряд
                reward = { type: 'bananas', amount: 35 };
                break;
                
            case 9: // Собери 100 бананов
                reward = { type: 'bananas', amount: 50 };
                break;
                
            case 10: // Накопи банановую ферму из 10 растений
                reward = { type: 'bananas', amount: 100 };
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
    } catch (e) {
        console.error('Ошибка при выполнении задания:', e);
    }
}

// Add robust error handling wrapper
function safeExecute(func, errorMessage, fallback) {
  try {
    return func();
  } catch (error) {
    console.error(`${errorMessage}: ${error}`);
    showPopup(`Произошла ошибка. Пожалуйста, попробуйте еще раз.`);
    
    if (typeof fallback === 'function') {
      return fallback();
    }
  }
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
          // Банан
          gameState.bananas += 15;
          gameState.totalBananas += 15;
          rewardText = '+15 бананов';
        } else if (reward === 2) {
          // Опыт
          addExperience(5);
          rewardText = '+5 опыта';
        } else {
          // Больше бананов
          gameState.bananas += 12;
          gameState.totalBananas += 12;
          rewardText = '+12 бананов';
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
          gameState.bananas += 35;
          gameState.totalBananas += 35;
          rewardText = '+35 бананов';
        } else if (reward === 2) {
          gameState.bananas += 30;
          gameState.totalBananas += 30;
          rewardText = '+30 бананов';
        } else {
          addExperience(10);
          rewardText = '+10 опыта';
        }
      }
      break;
      
    case 'premium':
      if (gameState.bananas >= 50) {
        gameState.bananas -= 50;
        canOpen = true;
        
        // Случайная награда
        reward = Math.floor(Math.random() * 3) + 1;
        if (reward === 1) {
          gameState.bananas += 80;
          gameState.totalBananas += 80;
          rewardText = '+80 бананов';
        } else if (reward === 2) {
          gameState.bananas += 65;
          gameState.totalBananas += 65;
          rewardText = '+65 бананов';
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
      if (gameState.bananas >= 100) {
        gameState.bananas -= 100;
        canOpen = true;
        
        // Случайная награда
        reward = Math.floor(Math.random() * 3) + 1;
        if (reward === 1) {
          gameState.bananas += 160;
          gameState.totalBananas += 160;
          rewardText = '+160 бананов';
        } else if (reward === 2) {
          gameState.bananas += 140;
          gameState.totalBananas += 140;
          rewardText = '+140 бананов';
        } else {
          addExperience(50);
          rewardText = '+50 опыта';
        }
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
    
    return true;
  } else {
    // Показываем сообщение о недостатке ресурсов
    showPopup('Недостаточно бананов!');
    playSound('minionShocked');
    return false;
  }
}

// Анимация открытия бокса
function showBoxAnimation(type, rewardText) {
    try {
        const container = document.getElementById('box-animation-container');
        const boxImage = document.getElementById('box-image');
        const boxReward = document.getElementById('box-reward');
        
        if (!container || !boxImage || !boxReward) {
            console.warn('Элементы анимации бокса не найдены');
            showPopup(rewardText);
            return;
        }
        
        // Устанавливаем изображение бокса
        boxImage.src = `images/box_${type}.png`;
        
        // Показываем контейнер
        container.style.display = 'flex';
        
        // Анимация открытия бокса
        setTimeout(() => {
            boxImage.style.transform = 'scale(1.2)';
            
            // Показываем награду
            setTimeout(() => {
                boxReward.textContent = rewardText;
                boxReward.style.opacity = '1';
                
                // Звуковой эффект и вибрация
                playSound('reward');
                vibrate([100, 50, 100]);
                
                // Создаем эффект конфетти
                createConfetti();
            }, 500);
        }, 300);
    } catch (e) {
        console.error('Ошибка при анимации открытия бокса:', e);
        showPopup(rewardText);
    }
}

// Добавление опыта и проверка повышения уровня
function addExperience(amount) {
    try {
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
        } else {
            // Сохраняем текущий опыт
            gameState.exp = currentExp;
        }
        
        // Обновляем UI прогресса уровня
        updateLevelProgress();
    } catch (e) {
        console.error('Ошибка при добавлении опыта:', e);
    }
}

// Обновление прогресса уровня
function updateLevelProgress() {
    try {
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
    } catch (e) {
        console.error('Ошибка при обновлении прогресса уровня:', e);
    }
}

// Анимация повышения уровня
function showLevelUpAnimation() {
    try {
        const container = document.getElementById('level-up-container');
        if (!container) {
            console.warn('Контейнер анимации уровня не найден');
            showPopup(`Уровень повышен! Вы достигли ${gameState.level} уровня!`);
            return;
        }
        
        container.style.display = 'flex';
        
        // Показываем новый уровень
        const newLevel = document.getElementById('new-level');
        if (newLevel) {
            newLevel.textContent = gameState.level;
        }
        
        // Звуковой эффект и вибрация
        playSound('levelUp');
        vibrate([100, 50, 100, 50, 200]);
        
        // Создаем эффект конфетти
        createConfetti();
        
        // НЕ закрываем анимацию автоматически - пользователь закроет сам
    } catch (e) {
        console.error('Ошибка при анимации повышения уровня:', e);
        showPopup(`Уровень повышен! Вы достигли ${gameState.level} уровня!`);
    }
}

// Создание эффекта конфетти
function createConfetti() {
    try {
        const container = document.getElementById('confetti-container');
        if (!container) {
            console.warn('Контейнер конфетти не найден');
            return;
        }
        
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
    } catch (e) {
        console.error('Ошибка при создании конфетти:', e);
    }
}

// Add to your existing init function
function initMainScreen() {
  // Update main screen currency display
  updateMainBananas();
  
  // Add click handler to main minion
  const mainMinion = document.getElementById('main-interactive-minion');
  if (mainMinion) {
    mainMinion.addEventListener('click', function() {
      // Use the existing pet minion function
      // Adding the throttle function to prevent rapid clicking
      throttle(function() {
        // Proigate animation
        mainMinion.classList.add('pet-animation');
        setTimeout(() => {
          mainMinion.classList.remove('pet-animation');
        }, 500);
        
        // Increase pet count
        gameState.petCount++;
        
        // Award banana every 5 pets
        if (gameState.petCount % 5 === 0) {
          gameState.bananas++;
          gameState.totalBananas++;
          showPopup('+1 банан за заботу о миньоне!');
          updateStats();
          updateMainBananas();
          saveGameState();
          
          // Check for minion feeding tasks
          if (gameState.petCount >= 25 && gameState.taskProgress.task3 < 5) {
            gameState.taskProgress.task3 = Math.min(5, Math.floor(gameState.petCount / 5));
            updateTaskProgress();
            
            if (gameState.taskProgress.task3 >= 5) {
              completeTask(3);
            }
          }
        }
        
        // Play sound
        playSound('minionHappy');
        
        // Vibrate device
        vibrate(30);
      }, 300)();
    });
  }
  
  // Add click handlers to action buttons
  const actionButtons = document.querySelectorAll('.main-action-buttons .action-button');
  actionButtons.forEach(button => {
    button.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      if (sectionId) {
        showSection(sectionId);
        playSound('click');
        vibrate(30);
      }
    });
  });
  
  // Profile link navigation
  const profileLink = document.querySelector('.profile-link');
  if (profileLink) {
    profileLink.addEventListener('click', function() {
      showSection('profile-section');
      playSound('click');
    });
  }
  
  // Set as default section on start
  // Add to your showSplashScreen completion callback
  setTimeout(function() {
    showSection('main-screen');
  }, 2000);
}

// Function to update main screen banana counts
function updateMainBananas() {
  const mainBananasCount = document.getElementById('main-bananas-count');
  const mainBananasLarge = document.getElementById('main-bananas-large');
  
  if (mainBananasCount) {
    mainBananasCount.textContent = gameState.bananas;
  }
  
  if (mainBananasLarge) {
    mainBananasLarge.textContent = gameState.bananas;
  }
}

// Update the existing updateStats function to also update main screen
const originalUpdateStats = updateStats;
updateStats = function() {
  if (typeof originalUpdateStats === 'function') {
    originalUpdateStats();
  }
  updateMainBananas();
};

// Функция для закрытия модальных окон
function closeModal(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    // Добавляем анимацию исчезновения
    container.style.opacity = '0';
    
    // После анимации скрываем элемент
    setTimeout(() => {
      container.style.display = 'none';
      container.style.opacity = '1'; // Сбрасываем прозрачность для будущих показов
    }, 300);
    
    // Если это контейнер уровня, дополнительно сбрасываем состояние
    if (containerId === 'level-up-container') {
      const wheelResult = document.getElementById('wheel-result');
      if (wheelResult) {
        wheelResult.style.opacity = 0;
      }
    }
    
    console.log(`Модальное окно ${containerId} закрыто пользователем`);
  }
}

// Добавляем обработчик для инициализации при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  // Скрываем все модальные окна, которые могли остаться открытыми
  const modalContainers = [
    'level-up-container', 
    'wheel-container', 
    'box-animation-container'
  ];
  
  modalContainers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'none';
    }
  });
});
