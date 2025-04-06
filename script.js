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
    const minion = document.getElementById('interactive-minion');
    if (!minion) return;

    let isAnimating = false;
    let clickTimeout;
    const minionImage = minion.querySelector('img');
    const originalSrc = minionImage.src;

    // Добавляем обработчик клика с анимацией
    minion.addEventListener('click', () => {
        if (isAnimating) return;
        
        isAnimating = true;
        minion.classList.add('minion-clicked');
        
        // Создаем и анимируем банан
        const banana = document.createElement('img');
        banana.src = getImage('banana');
        banana.className = 'banana-animation';
        document.body.appendChild(banana);

        // Анимация броска банана
        const minionRect = minion.getBoundingClientRect();
        const startX = minionRect.left + minionRect.width / 2;
        const startY = minionRect.top + minionRect.height / 2;
        
        banana.style.left = `${startX}px`;
        banana.style.top = `${startY}px`;
        
        requestAnimationFrame(() => {
            banana.style.transform = 'translate(100px, -100px) rotate(360deg)';
            banana.style.opacity = '0';
        });

        // Очищаем банан после анимации
        setTimeout(() => {
            document.body.removeChild(banana);
            minion.classList.remove('minion-clicked');
            isAnimating = false;
        }, 1000);

        // Обновляем счетчик бананов
        updateBananaCount(1);
    });

    // Добавляем эффект при наведении
    minion.addEventListener('mouseenter', () => {
        minion.classList.add('minion-hover');
    });

    minion.addEventListener('mouseleave', () => {
        minion.classList.remove('minion-hover');
    });
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
                // Создаем уникальную реферальную ссылку для отслеживания
                const userId = tg.initDataUnsafe?.user?.id || settings.userId || 'anonymous';
                const refLink = `https://t.me/minions_game_bot?start=ref_${userId}`;
                
                // Текст для приглашения
                const inviteText = `🍌 Присоединяйся ко мне в игре Minions! Собирай бананы, открывай боксы и развивай свою ферму миньонов! ${refLink}`;
                
                // Пробуем использовать shareGame или fallback на обычный share
                if (tg.shareGame) {
                    tg.shareGame({
                        text: inviteText,
                        url: refLink
                    });
                } else if (tg.share) {
                    tg.share({
                        text: inviteText,
                        url: refLink
                    });
                } else {
                    // Если API share недоступен, используем clipboardText
                    if (tg.showAlert) {
                        tg.showAlert('Ссылка скопирована в буфер обмена. Поделитесь ею с друзьями!');
                    }
                    if (tg.clipboard && tg.clipboard.setText) {
                        tg.clipboard.setText(inviteText);
                    } else {
                        navigator.clipboard.writeText(inviteText).catch(e => 
                            console.error('Не удалось скопировать текст:', e)
                        );
                    }
                }
                
                // Увеличиваем счетчик приглашенных друзей
                gameState.invitedFriends++;
                
                // Обновляем прогресс задания
                gameState.taskProgress.task1 = Math.min(10, gameState.invitedFriends);
                updateTaskProgress();
                
                // Проверяем выполнение задания
                if (gameState.invitedFriends >= 10 && gameState.taskProgress.task1 < 10) {
                    completeTask(1);
                }
                
                // Обновляем статистику и сохраняем
                updateStats();
                saveGameState();
                
                // Награда за приглашение
                if (gameState.invitedFriends % 3 === 0) {
                    // Каждые 3 приглашения даем дополнительную награду
                    gameState.bananas += 15;
                    gameState.totalBananas += 15;
                    gameState.stars += 1;
                    gameState.totalStars += 1;
                    
                    showPopup('Бонус за приглашения: +15 бананов, +1 звезда!');
                    playSound('achievement');
                    vibrate([100, 50, 100, 50, 100]);
                }
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

// Функция для предзагрузки ресурсов с отслеживанием прогресса
function preloadResources(callback) {
    console.log("Начинаем предзагрузку ресурсов");
    
    // Обновленный список изображений на основе тех, что вы добавили
    const imagesToPreload = [
        'logo.png',
        'banana.png',
        'box_mega.png',
        'box_premium.png',
        'box_simple.png',
        'box_special.png',
        'box_standard.png',
        'farm.png',
        'level.png',
        'minion_1.png',
        'minion_2.png'
    ];
    
    let loadedResources = 0;
    const totalResources = imagesToPreload.length;
    
    function updateProgress() {
        loadedResources++;
        const progress = Math.floor((loadedResources / totalResources) * 100);
        const cappedProgress = Math.min(progress, 100);
        
        const progressElement = document.getElementById('loading-progress');
        if (progressElement) {
            progressElement.textContent = `${cappedProgress}%`;
        }
        
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = `${cappedProgress}%`;
        }
        
        if (loadedResources >= totalResources && callback) {
            callback();
        }
    }
    
    // Предзагрузка каждого изображения
    imagesToPreload.forEach(imageName => {
        const img = new Image();
        img.onload = () => {
            console.log(`Загружено изображение: ${imageName}`);
            preloadedImages[imageName] = img;
            updateProgress();
        };
        img.onerror = () => {
            console.warn(`Не удалось загрузить изображение: ${imageName}`);
            updateProgress();
        };
        img.src = `images/${imageName}`;
    });
}

// Получение изображения (с fallback на случай ошибки)
function getImage(key) {
    // Проверяем, есть ли изображение в кэше предзагруженных
    if (preloadedImages[key] && preloadedImages[key].complete && preloadedImages[key].naturalWidth !== 0) {
        return preloadedImages[key].src;
    }
    
    // Обновленный список путей к изображениям
    const imagePaths = {
        'minion': 'images/minion_1.png',
        'banana': 'images/banana.png',
        'star': 'images/star.png',
        'level': 'images/level.png',
        'box_simple': 'images/box_simple.png',
        'box_standard': 'images/box_standard.png',
        'box_premium': 'images/box_premium.png',
        'box_mega': 'images/box_mega.png',
        'box_special': 'images/box_special.png',
        'farm': 'images/farm.png',
        'logo': 'images/logo.png'
    };
    
    // Возвращаем путь к изображению или запасную URL
    return imagePaths[key] || 'https://i.imgur.com/ZcukEsb.png';
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
    minionShocked: new Audio('https://cdn.freesound.org/previews/554/554056_8164871-lq.mp3'),
    box_appear: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'),
    box_shake: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3')
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
  try {
    console.log("Инициализация игры");
    
    // Загружаем настройки
    loadSettings();
    
    // Загружаем состояние игры
    loadGameState();
    
    // Инициализируем UI только после загрузки DOM
    document.addEventListener('DOMContentLoaded', function() {
      // Исправляем экран загрузки
      const splashScreen = document.getElementById('splash-screen');
      
      // Кэшируем элементы
      cacheElements();
      
      // Инициализируем пользовательский интерфейс
      initializeUI();
      
      // Проверяем ежедневный вход
      checkDailyLogin();
      
      // Проверяем реферальную ссылку
      checkReferralLink();
      
      // Инициализируем ферму
      initFarm();
      
      // Инициализируем магазин
      initShop();
      
      // Инициализируем главный экран
      initMainScreen();
      
      // Обновляем статистику
      updateStats();
      
      // Обновляем прогресс заданий
      updateTaskProgress();
      
      // Обновляем достижения
      updateAchievements();
      
      // Синхронизируем с сервером
      syncWithServer();
      
      // Запускаем периодическое обновление
      setInterval(updateStats, 1000);
      setInterval(updateTaskProgress, 1000);
      setInterval(updateFarm, 1000);
      
      // Устанавливаем обработчики для меню 
      fixMenuClicks();
      
      // Отображаем главный экран после загрузки
      setTimeout(() => {
        if (splashScreen) {
          splashScreen.style.opacity = '0';
          setTimeout(() => {
            splashScreen.style.display = 'none';
            showSection('main-screen');
          }, 500);
        }
      }, 2000);
    });
  } catch (e) {
    handleError('Критическая ошибка при инициализации игры', e);
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
        
        // Инициализация фермы
        initFarmState();
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
// Исправленная функция для показа секций
function showSection(sectionId) {
  console.log("Показываем секцию:", sectionId);
  
  try {
    // Нормализуем ID секции
    if (sectionId !== 'main-screen' && !sectionId.endsWith('-section')) {
      sectionId = sectionId + '-section';
    }
    
    // Получаем элемент секции
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) {
      console.warn(`Секция не найдена: ${sectionId}`);
      return;
    }
    
    // Скрываем все секции
    document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
      section.style.display = 'none';
      section.classList.remove('active-section');
    });
    
    // Показываем целевую секцию
    targetSection.style.display = 'block';
    targetSection.classList.add('active-section');
    
    // Обновляем активные пункты меню
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
      const itemSection = item.getAttribute('data-section');
      if (itemSection === sectionId || itemSection + '-section' === sectionId) {
        item.classList.add('active');
      }
    });
  } catch (error) {
    console.error("Ошибка при отображении секции:", error);
    // Показываем главный экран в случае ошибки
    const mainScreen = document.getElementById('main-screen');
    if (mainScreen) {
      mainScreen.style.display = 'block';
    }
  }
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
    return safeExecute(() => {
        console.log("Открытие бокса:", type);
        
        let canOpen = false;
        let rewardText = '';
        
        switch(type) {
            case 'simple':
                if (gameState.bananas >= 10) {
                    gameState.bananas -= 10;
                    canOpen = true;
                    
                    // Случайные награды с балансом (только бананы и опыт)
                    const reward = Math.random();
                    if (reward < 0.7) {
                        // 70% шанс на бананы (5-15)
                        const bananas = Math.floor(Math.random() * 11) + 5;
                        gameState.bananas += bananas;
                        gameState.totalBananas += bananas;
                        rewardText = `+${bananas} бананов`;
                    } else {
                        // 30% шанс на опыт (5-10)
                        const exp = Math.floor(Math.random() * 6) + 5;
                        addExperience(exp);
                        rewardText = `+${exp} опыта`;
                    }
                }
                break;
                
            case 'standard':
                if (gameState.bananas >= 25) {
                    gameState.bananas -= 25;
                    canOpen = true;
                    
                    // Улучшенные награды (только бананы и опыт)
                    const reward = Math.random();
                    if (reward < 0.6) {
                        // 60% шанс на бананы (15-30)
                        const bananas = Math.floor(Math.random() * 16) + 15;
                        gameState.bananas += bananas;
                        gameState.totalBananas += bananas;
                        rewardText = `+${bananas} бананов`;
                    } else {
                        // 40% шанс на опыт (10-20)
                        const exp = Math.floor(Math.random() * 11) + 10;
                        addExperience(exp);
                        rewardText = `+${exp} опыта`;
                    }
                }
                break;
                
            case 'premium':
                if (gameState.bananas >= 50) {
                    gameState.bananas -= 50;
                    canOpen = true;
                    
                    // Премиум награды (бананы, опыт и буст)
                    const reward = Math.random();
                    if (reward < 0.5) {
                        // 50% шанс на бананы (40-80)
                        const bananas = Math.floor(Math.random() * 41) + 40;
                        gameState.bananas += bananas;
                        gameState.totalBananas += bananas;
                        rewardText = `+${bananas} бананов`;
                    } else if (reward < 0.85) {
                        // 35% шанс на опыт (20-40)
                        const exp = Math.floor(Math.random() * 21) + 20;
                        addExperience(exp);
                        rewardText = `+${exp} опыта`;
                    } else {
                        // 15% шанс на временный буст
                        if (!gameState.boosts) gameState.boosts = {};
                        const now = Date.now();
                        gameState.boosts.doubleXPUntil = now + (60 * 60 * 1000); // 1 час
                        rewardText = 'Двойной опыт на 1 час!';
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
                    
                    // Мега награды (улучшенные награды и редкие бусты)
                    const reward = Math.random();
                    if (reward < 0.4) {
                        // 40% шанс на бананы (80-150)
                        const bananas = Math.floor(Math.random() * 71) + 80;
                        gameState.bananas += bananas;
                        gameState.totalBananas += bananas;
                        rewardText = `+${bananas} бананов`;
                    } else if (reward < 0.7) {
                        // 30% шанс на опыт (40-80)
                        const exp = Math.floor(Math.random() * 41) + 40;
                        addExperience(exp);
                        rewardText = `+${exp} опыта`;
                    } else if (reward < 0.85) {
                        // 15% шанс на телеграм подарок
                        if (tg && tg.showPopup) {
                            tg.showPopup({
                                title: "Поздравляем!",
                                message: "Вы выиграли телеграм подарок! Заберите его у бота.",
                                buttons: [{ type: "ok" }]
                            });
                        }
                        rewardText = 'Телеграм подарок! 🎁';
                        
                        // Отправляем данные боту о выигрыше подарка, если есть интеграция
                        if (window.TagManager && window.TagManager.sendDataToBot) {
                            window.TagManager.sendDataToBot({
                                action: "gift_won",
                                boxType: "mega"
                            });
                        }
                    } else {
                        // 15% шанс на редкий буст
                        if (!gameState.boosts) gameState.boosts = {};
                        const now = Date.now();
                        
                        // Равные шансы на двойной опыт или автокликер
                        if (Math.random() < 0.5) {
                            gameState.boosts.doubleXPUntil = now + (3 * 60 * 60 * 1000); // 3 часа
                            rewardText = 'Двойной опыт на 3 часа!';
                        } else {
                            gameState.boosts.autoClickerUntil = now + (3 * 60 * 60 * 1000); // 3 часа
                            startAutoClicker();
                            rewardText = 'Авто-кликер на 3 часа!';
                        }
                    }
                }
                break;
                
            case 'special':
                if (gameState.bananas >= 75) {
                    gameState.bananas -= 75;
                    canOpen = true;
                    
                    // Специальная награда (телеграм подарки и особые бусты)
                    const reward = Math.random();
                    if (reward < 0.3) {
                        // 30% шанс на бананы (60-120)
                        const bananas = Math.floor(Math.random() * 61) + 60;
                        gameState.bananas += bananas;
                        gameState.totalBananas += bananas;
                        rewardText = `+${bananas} бананов`;
                    } else if (reward < 0.6) {
                        // 30% шанс на опыт (30-60)
                        const exp = Math.floor(Math.random() * 31) + 30;
                        addExperience(exp);
                        rewardText = `+${exp} опыта`;
                    } else {
                        // 40% шанс на телеграм подарок
                        if (tg && tg.showPopup) {
                            tg.showPopup({
                                title: "Специальный подарок!",
                                message: "Вы выиграли особый телеграм подарок! Заберите его у бота.",
                                buttons: [{ type: "ok" }]
                            });
                        }
                        rewardText = 'Телеграм подарок! 🎁';
                        
                        // Отправляем данные боту о выигрыше подарка, если есть интеграция
                        if (window.TagManager && window.TagManager.sendDataToBot) {
                            window.TagManager.sendDataToBot({
                                action: "gift_won",
                                boxType: "special"
                            });
                        }
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
            
            return true;
        } else {
            // Показываем сообщение о недостатке ресурсов
            showPopup('Недостаточно бананов!');
            playSound('minionShocked');
            return false;
        }
    }, `Error opening box: ${type}`);
}

// Анимация открытия бокса
function showBoxAnimation(boxType, rewards) {
    const container = document.createElement('div');
    container.className = 'box-animation-container';
    
    // Создаем элемент коробки
    const box = document.createElement('img');
    box.src = getImage(`box_${boxType}`);
    box.className = 'box-animation';
    container.appendChild(box);
    
    // Добавляем контейнер на страницу
    document.body.appendChild(container);
    
    // Анимация открытия коробки
    setTimeout(() => {
        box.classList.add('box-opening');
        
        // Создаем и анимируем награды
        rewards.forEach((reward, index) => {
            const rewardElement = document.createElement('div');
            rewardElement.className = 'reward-item';
            
            const rewardImage = document.createElement('img');
            rewardImage.src = getImage(reward.type);
            rewardElement.appendChild(rewardImage);
            
            const rewardText = document.createElement('span');
            rewardText.textContent = `+${reward.amount}`;
            rewardElement.appendChild(rewardText);
            
            container.appendChild(rewardElement);
            
            // Анимация появления награды
            setTimeout(() => {
                rewardElement.classList.add('reward-show');
                
                // Анимация исчезновения награды
                setTimeout(() => {
                    rewardElement.classList.add('reward-hide');
                }, 2000 + index * 500);
            }, 500 + index * 500);
        });
        
        // Удаляем контейнер после завершения анимации
        setTimeout(() => {
            document.body.removeChild(container);
        }, 3000 + rewards.length * 500);
    }, 1000);
}

// Добавление опыта и проверка повышения уровня
function addExperience(amount) {
    try {
        // Используем новую формулу для расчета необходимого опыта
        const expNeeded = getExpForNextLevel(gameState.level);
        
        // Проверяем, активен ли буст двойного опыта
        if (gameState.boosts && gameState.boosts.doubleXPUntil && Date.now() < gameState.boosts.doubleXPUntil) {
            // Удваиваем получаемый опыт
            amount *= 2;
        }
        
        // Текущий опыт для данного уровня
        let currentExp = gameState.exp || 0;
        currentExp += amount;
        
        // Проверяем, достаточно ли опыта для повышения уровня
        if (currentExp >= expNeeded) {
            // Повышаем уровень
            gameState.level++;
            
            // Остаток опыта переносим на следующий уровень
            gameState.exp = currentExp - expNeeded;
            
            // Награда за новый уровень по обновленной формуле
            const reward = calculateLevelReward(gameState.level);
            
            gameState.bananas += reward.bananas;
            gameState.totalBananas += reward.bananas;
            gameState.stars += reward.stars;
            gameState.totalStars += reward.stars;
            
            // Показываем анимацию и уведомление
            showLevelUpAnimation(reward);
            
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
function showLevelUpAnimation(reward) {
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
        
        // Показываем награду за уровень
        const levelUpContent = container.querySelector('.level-up-content');
        if (levelUpContent && reward) {
            // Добавляем информацию о награде
            const rewardInfo = document.createElement('div');
            rewardInfo.className = 'level-reward-info';
            rewardInfo.innerHTML = `
                <div class="reward-item">+${reward.bananas} 🍌</div>
                <div class="reward-item">+${reward.stars} ⭐</div>
            `;
            
            // Добавляем после параграфа с поздравлением
            const congratsText = levelUpContent.querySelector('p');
            if (congratsText) {
                levelUpContent.insertBefore(rewardInfo, congratsText.nextSibling);
            } else {
                levelUpContent.appendChild(rewardInfo);
            }
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

// Добавляем состояние фермы в gameState
function initFarmState() {
    // Устанавливаем начальные значения фермы, если их нет
    if (!gameState.farm) {
        gameState.farm = {
            minions: 0,
            efficiency: 1, // множитель эффективности (1 = 100%)
            lastCollect: Date.now(),
            bananasPending: 0,
            boostUntil: 0, // время окончания буста (timestamp)
            autoCollectUntil: 0, // время окончания автосбора (timestamp)
            upgrades: {
                efficiency: 0,
                automation: 0,
                boost: 0
            }
        };
    }
    
    // Добавляем пункт фермы в меню, если его нет
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.setAttribute('data-section', 'farm-section');
    menuItem.textContent = 'Ферма';
    
    const bottomMenu = document.querySelector('.bottom-menu');
    if (bottomMenu && !document.querySelector('.menu-item[data-section="farm-section"]')) {
        // Вставляем перед профилем и настройками
        const profileItem = document.querySelector('.menu-item[data-section="profile-section"]');
        if (profileItem) {
            bottomMenu.insertBefore(menuItem, profileItem);
        } else {
            bottomMenu.appendChild(menuItem);
        }
    }
    
    // Инициализируем обработчики для фермы
    initFarmHandlers();
    
    // Запускаем таймер обновления фермы
    setInterval(updateFarm, 60000); // обновляем каждую минуту
}

// Обработчики событий для фермы
function initFarmHandlers() {
    // Кнопка сбора урожая
    const collectBtn = document.getElementById('farm-collect-btn');
    if (collectBtn) {
        collectBtn.addEventListener('click', collectFarmBananas);
    }
    
    // Кнопки покупки улучшений
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const upgradeType = this.getAttribute('data-type');
            buyFarmUpgrade(upgradeType);
        });
    });
    
    // Обновляем отображение фермы
    updateFarmUI();
}

// Обновление фермы (вызывается по таймеру)
function updateFarm() {
    // Если нет миньонов, ничего не делаем
    if (!gameState.farm || gameState.farm.minions <= 0) return;
    
    const now = Date.now();
    const elapsedHours = (now - gameState.farm.lastCollect) / (1000 * 60 * 60);
    
    // Считаем производство бананов
    let production = gameState.farm.minions; // базовое производство: 1 банан в час на миньона
    
    // Применяем множитель эффективности
    production *= gameState.farm.efficiency;
    
    // Применяем буст, если активен
    if (now < gameState.farm.boostUntil) {
        production *= 2;
    }
    
    // Добавляем накопленные бананы
    gameState.farm.bananasPending += production * elapsedHours;
    
    // Обновляем время последнего подсчета
    gameState.farm.lastCollect = now;
    
    // Если включен автосбор и он активен
    if (now < gameState.farm.autoCollectUntil) {
        collectFarmBananas();
    }
    
    // Обновляем UI фермы
    updateFarmUI();
    
    // Сохраняем состояние
    saveGameState();
}

// Сбор бананов с фермы
function collectFarmBananas() {
    if (!gameState.farm || gameState.farm.bananasPending <= 0) {
        showPopup('Нет бананов для сбора!');
        return;
    }
    
    // Округляем количество бананов до целого числа
    const bananasToCollect = Math.floor(gameState.farm.bananasPending);
    
    // Добавляем бананы игроку
    gameState.bananas += bananasToCollect;
    gameState.totalBananas += bananasToCollect;
    
    // Сбрасываем счетчик накопленных бананов
    gameState.farm.bananasPending = 0;
    
    // Обновляем время последнего сбора
    gameState.farm.lastCollect = Date.now();
    
    // Обновляем UI и сохраняем состояние
    updateFarmUI();
    updateStats();
    saveGameState();
    
    // Показываем уведомление
    showPopup(`Собрано ${bananasToCollect} бананов!`);
    
    // Звуковой эффект и вибрация
    playSound('reward');
    vibrate([100, 50, 100]);
}

// Покупка улучшений для фермы
function buyFarmUpgrade(type) {
    if (!gameState.farm) return;
    
    const upgradeCosts = {
        efficiency: [10, 25, 50, 100, 200],
        automation: [15, 35, 70, 150, 300],
        boost: [20, 40, 80, 160, 320]
    };
    
    const upgradeLevel = gameState.farm.upgrades[type];
    
    // Проверяем, не достигнут ли максимальный уровень
    if (upgradeLevel >= 5) {
        showPopup('Достигнут максимальный уровень улучшения!');
        return;
    }
    
    // Проверяем стоимость улучшения
    const cost = upgradeCosts[type][upgradeLevel];
    
    if (gameState.bananas < cost) {
        showPopup(`Недостаточно бананов! Нужно: ${cost}`);
        return;
    }
    
    // Списываем бананы
    gameState.bananas -= cost;
    
    // Применяем улучшение
    gameState.farm.upgrades[type]++;
    
    // Обновляем эффекты улучшений
    switch(type) {
        case 'efficiency':
            gameState.farm.efficiency = 1 + (gameState.farm.upgrades.efficiency * 0.2);
            break;
        case 'automation':
            // Автоматический сбор на 1 час за каждый уровень
            gameState.farm.autoCollectUntil = Date.now() + (3600000 * gameState.farm.upgrades.automation);
            break;
        case 'boost':
            // Буст на 30 минут за каждый уровень
            gameState.farm.boostUntil = Date.now() + (1800000 * gameState.farm.upgrades.boost);
            break;
    }
    
    // Обновляем UI и сохраняем состояние
    updateFarmUI();
    updateStats();
    saveGameState();
    
    // Показываем уведомление
    showPopup(`Улучшение "${type}" повышено до уровня ${gameState.farm.upgrades[type]}!`);
    
    // Звуковой эффект и вибрация
    playSound('reward');
    vibrate([100, 50, 100]);
}

// Обновление UI фермы
function updateFarmUI() {
    const farmSection = document.getElementById('farm-section');
    if (!farmSection) return;

    // Обновляем статистику фермы
    const statsContainer = farmSection.querySelector('.farm-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-item">
                <img src="${getImage('banana')}" alt="Бананы">
                <span>${gameState.farmBananas}</span>
            </div>
            <div class="stat-item">
                <img src="${getImage('minion')}" alt="Миньоны">
                <span>${gameState.farmMinions}</span>
            </div>
            <div class="stat-item">
                <img src="${getImage('level')}" alt="Уровень">
                <span>${gameState.farmLevel}</span>
            </div>
        `;
    }

    // Обновляем кнопку сбора
    const collectButton = farmSection.querySelector('#farm-collect-btn');
    if (collectButton) {
        const canCollect = gameState.farmBananas > 0;
        collectButton.disabled = !canCollect;
        collectButton.classList.toggle('disabled', !canCollect);
        
        // Обновляем текст кнопки
        collectButton.innerHTML = `
            <img src="${getImage('banana')}" alt="Собрать">
            <span>Собрать ${gameState.farmBananas}</span>
        `;
    }

    // Обновляем контейнер миньонов
    const minionsContainer = farmSection.querySelector('.farm-minions');
    if (minionsContainer) {
        minionsContainer.innerHTML = '';
        
        // Создаем элементы миньонов
        for (let i = 0; i < gameState.farmMinions; i++) {
            const minionElement = document.createElement('div');
            minionElement.className = 'farm-minion';
            
            const minionImage = document.createElement('img');
            minionImage.src = getImage('minion');
            minionImage.alt = 'Миньон';
            
            minionElement.appendChild(minionImage);
            minionsContainer.appendChild(minionElement);
            
            // Добавляем анимацию для каждого миньона
            setTimeout(() => {
                minionElement.classList.add('minion-appear');
            }, i * 100);
        }
    }

    // Обновляем контейнер улучшений
    const upgradesContainer = farmSection.querySelector('.farm-upgrades');
    if (upgradesContainer) {
        upgradesContainer.innerHTML = `
            <div class="upgrade-item ${gameState.farmLevel >= 2 ? 'unlocked' : ''}">
                <img src="${getImage('minion')}" alt="Новый миньон">
                <span>Новый миньон (Уровень 2)</span>
            </div>
            <div class="upgrade-item ${gameState.farmLevel >= 3 ? 'unlocked' : ''}">
                <img src="${getImage('banana')}" alt="Ускорение">
                <span>Ускорение сбора (Уровень 3)</span>
            </div>
            <div class="upgrade-item ${gameState.farmLevel >= 5 ? 'unlocked' : ''}">
                <img src="${getImage('star')}" alt="Автосбор">
                <span>Автосбор (Уровень 5)</span>
            </div>
        `;
    }
}

// Обновление функции для учета приглашенных пользователей
function checkReferralLink() {
    try {
        // Проверка, запущено ли приложение по реферальной ссылке
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param) {
            const startParam = tg.initDataUnsafe.start_param;
            
            // Проверяем, является ли это реферальной ссылкой
            if (startParam.startsWith('ref_')) {
                const referrerId = startParam.replace('ref_', '');
                
                // Отправляем запрос на сервер для учета реферала
                if (settings.serverSync) {
                    fetch(`${SERVER_URL}/register-referral`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            referrerId: referrerId,
                            userId: settings.userId || tg.initDataUnsafe.user.id
                        })
                    }).catch(e => console.error('Ошибка при отправке данных реферала:', e));
                }
                
                // Показываем приветственное сообщение для новых пользователей
                setTimeout(() => {
                    showPopup('Добро пожаловать в игру Minions! Вы пришли по приглашению друга.');
                }, 2000);
                
                // Даем бонус новому игроку
                if (!gameState.receivedReferralBonus) {
                    gameState.bananas += 25;
                    gameState.totalBananas += 25;
                    gameState.stars += 2;
                    gameState.totalStars += 2;
                    
                    // Отмечаем, что бонус получен
                    gameState.receivedReferralBonus = true;
                    
                    // Показываем уведомление с небольшой задержкой
                    setTimeout(() => {
                        showPopup('Вы получили бонус за приглашение: +25 бананов, +2 звезды!');
                        playSound('reward');
                        vibrate([100, 50, 100]);
                        updateStats();
                        saveGameState();
                    }, 3000);
                }
            }
        }
    } catch (e) {
        console.error('Ошибка при проверке реферальной ссылки:', e);
    }
}

// Инициализация магазина
function initShop() {
    try {
        console.log("Инициализация магазина");
        
        // Инициализация кнопок покупки в магазине
        const shopItems = document.querySelectorAll('.shop-item');
        shopItems.forEach(item => {
            const buyButton = item.querySelector('.shop-buy-btn');
            if (buyButton) {
                buyButton.addEventListener('click', function() {
                    const itemType = this.getAttribute('data-type');
                    const itemCost = parseInt(this.getAttribute('data-cost'));
                    const itemName = item.querySelector('.shop-item-title').textContent;
                    
                    // Проверяем, достаточно ли ресурсов
                    if (gameState.bananas >= itemCost) {
                        // Списываем ресурсы
                        gameState.bananas -= itemCost;
                        
                        // Применяем эффект покупки
                        applyShopItemEffect(itemType);
                        
                        // Обновляем статистику
                        updateStats();
                        saveGameState();
                        
                        // Показываем уведомление
                        showPopup(`Вы купили: ${itemName}`);
                        
                        // Звуковой эффект и вибрация
                        playSound('reward');
                        vibrate([100, 50, 100]);
                    } else {
                        // Недостаточно ресурсов
                        showPopup('Недостаточно бананов!');
                        playSound('minionShocked');
                    }
                });
            }
        });
        
        // Инициализация кнопок улучшений фермы
        const upgradeButtons = document.querySelectorAll('.upgrade-btn');
        upgradeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const upgradeType = this.getAttribute('data-type');
                buyFarmUpgrade(upgradeType);
            });
        });
        
        // Обновляем отображение цен в магазине
        updateShopPrices();
        
        console.log("Магазин инициализирован");
    } catch (e) {
        console.error('Ошибка при инициализации магазина:', e);
    }
}

// Применение эффекта купленного предмета
function applyShopItemEffect(itemType) {
    try {
        switch(itemType) {
            case 'double_xp':
                // Активируем двойной опыт на 1 час
                if (!gameState.boosts) gameState.boosts = {};
                gameState.boosts.doubleXPUntil = Date.now() + (60 * 60 * 1000);
                break;
                
            case 'auto_clicker':
                // Активируем авто-кликер на 1 час
                if (!gameState.boosts) gameState.boosts = {};
                gameState.boosts.autoClickerUntil = Date.now() + (60 * 60 * 1000);
                startAutoClicker();
                break;
                
            case 'banana_boost':
                // Увеличиваем производство бананов на 2 часа
                if (!gameState.boosts) gameState.boosts = {};
                gameState.boosts.bananaBoostUntil = Date.now() + (2 * 60 * 60 * 1000);
                break;
                
            case 'star_boost':
                // Увеличиваем шанс получения звезд на 2 часа
                if (!gameState.boosts) gameState.boosts = {};
                gameState.boosts.starBoostUntil = Date.now() + (2 * 60 * 60 * 1000);
                break;
                
            default:
                console.warn(`Неизвестный тип предмета: ${itemType}`);
        }
    } catch (e) {
        console.error('Ошибка при применении эффекта предмета:', e);
    }
}

// Обновление цен в магазине
function updateShopPrices() {
    try {
        // Обновляем цены на улучшения фермы
        const upgradeItems = document.querySelectorAll('.upgrade-item');
        upgradeItems.forEach(item => {
            const type = item.getAttribute('data-type');
            const costElement = item.querySelector('.upgrade-cost');
            const button = item.querySelector('.upgrade-btn');
            
            if (costElement && button) {
                // Получаем текущий уровень улучшения
                const upgradeLevel = gameState.farm?.upgrades?.[type] || 0;
                
                // Рассчитываем стоимость следующего уровня
                let cost = 0;
                switch(type) {
                    case 'minion':
                        cost = getMinionCost(gameState.farm?.minions || 0);
                        break;
                    case 'efficiency':
                        cost = [10, 25, 50, 100, 200][upgradeLevel] || 0;
                        break;
                    case 'automation':
                        cost = [15, 35, 70, 150, 300][upgradeLevel] || 0;
                        break;
                    case 'boost':
                        cost = [20, 40, 80, 160, 320][upgradeLevel] || 0;
                        break;
                }
                
                // Обновляем отображение цены
                costElement.textContent = `${cost} 🍌`;
                button.setAttribute('data-cost', cost);
                
                // Отключаем кнопку, если достигнут максимальный уровень
                if (upgradeLevel >= 5) {
                    button.disabled = true;
                    button.textContent = 'Максимум';
                } else {
                    button.disabled = gameState.bananas < cost;
                }
            }
        });
    } catch (e) {
        console.error('Ошибка при обновлении цен в магазине:', e);
    }
}

// Функция для проверки и восстановления раздела заданий
function fixTasksSection() {
  const tasksSection = document.getElementById('tasks-section');
  if (!tasksSection) return;
  
  // Проверяем, есть ли внутренний контент
  if (!tasksSection.querySelector('.tasks') || !tasksSection.querySelector('.task')) {
    console.log("Восстанавливаем раздел заданий");
    
    // Создаем контейнер для заданий, если его нет
    let tasksContainer = tasksSection.querySelector('.tasks');
    if (!tasksContainer) {
      tasksContainer = document.createElement('div');
      tasksContainer.className = 'tasks';
      tasksSection.appendChild(tasksContainer);
    }
    
    // Очищаем контейнер и добавляем задания заново
    tasksContainer.innerHTML = '';
    
    // Массив с данными для заданий
    const tasksData = [
      { id: 1, title: "Пригласи 10 друзей", reward: "+100 🍌", maxProgress: 10 },
      { id: 2, title: "Открой премиум-кейс", reward: "+50 🍌", maxProgress: 1 },
      { id: 3, title: "Накорми 5 миньонов", reward: "+20 🍌", maxProgress: 5 },
      { id: 4, title: "Собери 30 бананов", reward: "+5 ⭐", maxProgress: 30 },
      { id: 5, title: "Открой 5 боксов", reward: "+10 ⭐", maxProgress: 5 },
      { id: 6, title: "Достигни 3 уровня", reward: "+15 ⭐", maxProgress: 3 }
    ];
    
    // Создаем HTML для каждого задания
    tasksData.forEach(task => {
      const taskDiv = document.createElement('div');
      taskDiv.className = 'task';
      taskDiv.innerHTML = `
        <div class="task-header">
          <div class="task-title">${task.title}</div>
          <div class="task-reward">${task.reward}</div>
        </div>
        <div class="progress-bar">
          <div id="task${task.id}-progress" class="progress" style="width: 0%;"></div>
        </div>
        <div class="task-counter" id="task${task.id}-counter">0/${task.maxProgress}</div>
      `;
      tasksContainer.appendChild(taskDiv);
    });
    
    // Обновляем прогресс заданий
    updateTaskProgress();
  }
}

// Вызываем эту функцию после загрузки DOM и в обработчике переключения на секцию заданий
document.addEventListener('DOMContentLoaded', function() {
  fixTasksSection();
  
  // Также добавляем проверку при переключении на раздел заданий
  document.querySelectorAll('.menu-item[data-section="tasks-section"]').forEach(item => {
    item.addEventListener('click', function() {
      setTimeout(fixTasksSection, 100); // Небольшая задержка для уверенности
    });
  });
});

function fixFarmSection() {
    // Check if farm menu item exists
    const farmMenuItem = document.querySelector('.menu-item[data-section="farm-section"]');
    if (!farmMenuItem) {
        // Create farm menu item if it doesn't exist
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        menuItem.setAttribute('data-section', 'farm-section');
        menuItem.textContent = 'Ферма';
        
        const bottomMenu = document.querySelector('.bottom-menu');
        if (bottomMenu) {
            // Insert before profile and settings
            const profileItem = document.querySelector('.menu-item[data-section="profile-section"]');
            if (profileItem) {
                bottomMenu.insertBefore(menuItem, profileItem);
            } else {
                bottomMenu.appendChild(menuItem);
            }
        }
    }

    // Check if farm section exists
    const farmSection = document.getElementById('farm-section');
    if (!farmSection) {
        // Create farm section if it doesn't exist
        const section = document.createElement('div');
        section.id = 'farm-section';
        section.className = 'section hidden-section';
        
        // Add farm section content
        section.innerHTML = `
            <h2 class="section-heading">Ферма миньонов <span class="tip-button" data-tip="farm">❓</span></h2>
            
            <div class="farm-stats">
                <div class="farm-stat">
                    <span>Миньоны:</span>
                    <span id="farm-minions-count">0</span>
                </div>
                <div class="farm-stat">
                    <span>Бананы в час:</span>
                    <span id="farm-bananas-rate">0</span>
                </div>
                <div class="farm-stat">
                    <span>Последний сбор:</span>
                    <span id="farm-last-collect">-</span>
                </div>
            </div>
            
            <button id="farm-collect-btn" class="action-button">Собрать бананы</button>
            
            <div class="farm-minions-container">
                <!-- Миньоны будут добавлены динамически -->
            </div>
            
            <div class="farm-upgrades">
                <h3>Улучшения фермы</h3>
                <!-- Улучшения будут добавлены динамически -->
            </div>
        `;
        
        // Add farm section to main container
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.appendChild(section);
        }
    }

    // Initialize farm state if not already initialized
    if (!gameState.farm) {
        initFarmState();
    }

    // Add click handler for farm menu item
    const menuItem = document.querySelector('.menu-item[data-section="farm-section"]');
    if (menuItem) {
        menuItem.addEventListener('click', () => {
            switchSection('farm-section');
            updateFarmUI();
        });
    }

    // Initialize farm handlers
    initFarmHandlers();
}

// Add event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
    fixFarmSection();
});

// Add event listener for section switching
document.addEventListener('sectionSwitched', (event) => {
    if (event.detail.section === 'farm-section') {
        fixFarmSection();
    }
});

// Функция для исправления навигации в главный раздел
function fixMainSectionNavigation() {
    // Проверяем, есть ли пункт меню для главного экрана
    let mainMenuItem = document.querySelector('.menu-item[data-section="main-screen"]');
    
    // Если пункта меню нет, создаём его
    if (!mainMenuItem) {
        const bottomMenu = document.querySelector('.bottom-menu');
        if (bottomMenu) {
            mainMenuItem = document.createElement('div');
            mainMenuItem.className = 'menu-item';
            mainMenuItem.setAttribute('data-section', 'main-screen');
            mainMenuItem.textContent = 'Главная';
            
            // Вставляем в начало меню
            if (bottomMenu.firstChild) {
                bottomMenu.insertBefore(mainMenuItem, bottomMenu.firstChild);
            } else {
                bottomMenu.appendChild(mainMenuItem);
            }
        }
    }
    
    // Обновляем обработчик события для пункта главного меню
    if (mainMenuItem) {
        mainMenuItem.removeEventListener('click', null);
        mainMenuItem.addEventListener('click', function() {
            console.log("Переключение на главный экран");
            showSection('main-screen');
            playSound('click');
            vibrate(30);
        });
    }
    
    // Исправляем функцию showSection для корректной работы с main-screen
    if (typeof showSection === 'function') {
        const originalShowSection = showSection;
        window.showSection = function(sectionId) {
            console.log("Вызов showSection с:", sectionId);
            
            // Убедимся, что main-screen обрабатывается корректно
            if (sectionId === 'main-screen' || sectionId === 'main') {
                const mainScreen = document.getElementById('main-screen');
                if (mainScreen) {
                    // Скрываем все секции
                    document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                        section.style.display = 'none';
                        section.classList.remove('active-section');
                    });
                    
                    // Показываем главный экран
                    mainScreen.style.display = 'block';
                    mainScreen.classList.add('active-section');
                    
                    // Обновляем активный пункт меню
                    document.querySelectorAll('.menu-item').forEach(item => {
                        item.classList.remove('active');
                        if (item.getAttribute('data-section') === 'main-screen') {
                            item.classList.add('active');
                        }
                    });
                    
                    return;
                }
            }
            
            // Для других разделов используем оригинальную функцию
            originalShowSection(sectionId);
        };
    }
    
    // Добавляем кнопку возврата в главный экран на все разделы
    document.querySelectorAll('.section-heading').forEach(heading => {
        if (!heading.querySelector('.back-to-main')) {
            const backButton = document.createElement('span');
            backButton.className = 'back-to-main';
            backButton.innerHTML = '« Главная';
            backButton.style.cssText = 'cursor:pointer; margin-left:10px; font-size:0.8em; color:#FF8C00;';
            backButton.addEventListener('click', function() {
                showSection('main-screen');
                playSound('click');
            });
            
            heading.appendChild(backButton);
        }
    });
}

// Вызываем функцию после загрузки DOM
document.addEventListener('DOMContentLoaded', fixMainSectionNavigation);

// Также можем добавить её в инициализацию UI
if (typeof initializeUI === 'function') {
    const originalInitializeUI = initializeUI;
    initializeUI = function() {
        originalInitializeUI();
        fixMainSectionNavigation();
    };
}

// Farm state management
let farmState = {
    plants: 0,
    maxPlants: 10,
    bananasReady: 0,
    efficiency: 1.0,
    lastHarvest: Date.now()
};

// Initialize farm functionality
function initFarm() {
    const plantBtn = document.getElementById('plant-banana-btn');
    const harvestBtn = document.getElementById('harvest-bananas-btn');
    
    if (plantBtn) {
        plantBtn.addEventListener('click', plantBanana);
    }
    
    if (harvestBtn) {
        harvestBtn.addEventListener('click', harvestBananas);
    }
    
    // Initialize upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.getAttribute('data-type');
            upgradeFarm(type);
        });
    });
    
    // Start farm update loop
    setInterval(updateFarm, 1000);
}

// Plant a banana
function plantBanana() {
    if (gameState.bananas < 5) {
        showPopup('Недостаточно бананов!');
        return;
    }
    
    if (farmState.plants >= farmState.maxPlants) {
        showPopup('Достигнут лимит растений!');
        return;
    }
    
    gameState.bananas -= 5;
    farmState.plants++;
    updateFarmUI();
    showPopup('Банановое растение посажено!');
}

// Harvest bananas
function harvestBananas() {
    if (farmState.bananasReady <= 0) {
        showPopup('Нет готовых бананов для сбора!');
        return;
    }
    
    gameState.bananas += farmState.bananasReady;
    farmState.bananasReady = 0;
    farmState.lastHarvest = Date.now();
    updateFarmUI();
    showPopup(`Собрано ${farmState.bananasReady} бананов!`);
}

// Upgrade farm
function upgradeFarm(type) {
    const costs = {
        capacity: 50,
        efficiency: 100
    };
    
    if (gameState.bananas < costs[type]) {
        showPopup('Недостаточно бананов!');
        return;
    }
    
    gameState.bananas -= costs[type];
    
    switch (type) {
        case 'capacity':
            farmState.maxPlants += 2;
            break;
        case 'efficiency':
            farmState.efficiency += 0.2;
            break;
    }
    
    updateFarmUI();
    showPopup('Улучшение применено!');
}

// Update farm state
function updateFarm() {
    const now = Date.now();
    const hoursPassed = (now - farmState.lastHarvest) / (1000 * 60 * 60);
    
    // Calculate banana production
    const baseProduction = 0.5; // bananas per hour per plant
    const totalProduction = baseProduction * farmState.plants * farmState.efficiency * hoursPassed;
    
    farmState.bananasReady = Math.floor(totalProduction);
    updateFarmUI();
}

// Update farm UI
function updateFarmUI() {
    // Update stats
    document.getElementById('farm-plants-count').textContent = farmState.plants;
    document.getElementById('farm-max-plants').textContent = farmState.maxPlants;
    document.getElementById('farm-bananas-ready').textContent = farmState.bananasReady;
    document.getElementById('farm-efficiency').textContent = farmState.efficiency.toFixed(1);
    
    // Update buttons state
    const plantBtn = document.getElementById('plant-banana-btn');
    const harvestBtn = document.getElementById('harvest-bananas-btn');
    
    if (plantBtn) {
        plantBtn.disabled = gameState.bananas < 5 || farmState.plants >= farmState.maxPlants;
    }
    
    if (harvestBtn) {
        harvestBtn.disabled = farmState.bananasReady <= 0;
    }
    
    // Update upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const type = btn.getAttribute('data-type');
        const costs = {
            capacity: 50,
            efficiency: 100
        };
        btn.disabled = gameState.bananas < costs[type];
    });
}

// Show popup message
function showPopup(message) {
    const popup = document.getElementById('popup-message');
    if (popup) {
        popup.textContent = message;
        popup.style.display = 'block';
        popup.style.opacity = '1';
        
        setTimeout(() => {
            popup.style.opacity = '0';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 300);
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initFarm();
    // ... existing initialization code ...
});

// Проверяем, существует ли элемент экрана загрузки и правильно ли он отображается
function fixSplashScreen() {
    console.log("Исправление экрана загрузки");
    
    // Проверяем, существует ли элемент
    let splashScreen = document.getElementById('splash-screen');
    
    // Если элемент не существует, создаем его
    if (!splashScreen) {
        console.log("Элемент splash-screen не найден, создаем новый");
        
        splashScreen = document.createElement('div');
        splashScreen.id = 'splash-screen';
        splashScreen.innerHTML = `
            <div class="splash-content">
                <img src="images/logo.png" alt="" class="splash-logo" onerror="this.onerror=null; this.src='https://i.imgur.com/ZcukEsb.png';">
                <div class="loading-container">
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <div class="loading-text">Загрузка... <span id="loading-progress">0%</span></div>
                </div>
            </div>
        `;
        
        // Добавляем необходимые стили
        splashScreen.style.position = 'fixed';
        splashScreen.style.top = '0';
        splashScreen.style.left = '0';
        splashScreen.style.width = '100%';
        splashScreen.style.height = '100%';
        splashScreen.style.background = 'linear-gradient(135deg, #FFE500, #FFB700)';
        splashScreen.style.display = 'flex';
        splashScreen.style.justifyContent = 'center';
        splashScreen.style.alignItems = 'center';
        splashScreen.style.zIndex = '9999';
        
        // Добавляем в body как первый элемент
        document.body.insertBefore(splashScreen, document.body.firstChild);
    } else {
        // Если элемент существует, убедимся, что он отображается правильно
        console.log("Элемент splash-screen найден, исправляем его стили");
        
        splashScreen.style.display = 'flex';
        splashScreen.style.opacity = '1';
        splashScreen.style.zIndex = '9999';
    }
    
    // Обновляем содержимое, если необходимо
    const splashContent = splashScreen.querySelector('.splash-content');
    if (!splashContent) {
        splashScreen.innerHTML = `
            <div class="splash-content">
                <img src="images/logo.png" alt="" class="splash-logo" onerror="this.onerror=null; this.src='https://i.imgur.com/ZcukEsb.png';">
                <div class="loading-container">
                    <div class="loading-bar">
                        <div class="loading-progress"></div>
                    </div>
                    <div class="loading-text">Загрузка... <span id="loading-progress">0%</span></div>
                </div>
            </div>
        `;
    }
    
    // Запускаем анимацию загрузки
    let progress = 0;
    const progressBar = splashScreen.querySelector('.loading-progress');
    const progressText = splashScreen.querySelector('#loading-progress');
    
    if (progressBar && progressText) {
        const loadingInterval = setInterval(() => {
            progress += 5;
            if (progress > 100) {
                clearInterval(loadingInterval);
                
                // Скрываем экран загрузки после завершения
                setTimeout(() => {
                    splashScreen.style.opacity = '0';
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                        
                        // Отображаем главный экран после закрытия экрана загрузки
                        showSection('main-screen');
                    }, 500);
                }, 500);
                
                return;
            }
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }, 100);
    }
    
    // Возвращаем элемент для дальнейшего использования
    return splashScreen;
}

// Исправление для кликабельности пунктов меню
function fixMenuClicks() {
    console.log("Исправление кликабельности меню");
    
    // Находим меню
    const menuItems = document.querySelectorAll('.menu-item');
    
    if (!menuItems || menuItems.length === 0) {
        console.warn("Элементы меню не найдены");
        
        // Попробуем найти нижнее меню и восстановить его
        const bottomMenu = document.querySelector('.bottom-menu');
        if (bottomMenu) {
            console.log("Нашли контейнер меню, пробуем восстановить элементы");
            
            // Очистим и заново создадим элементы меню
            bottomMenu.innerHTML = `
                <div class="menu-item" data-section="main-screen">Главная</div>
                <div class="menu-item" data-section="tasks-section">Задания</div>
                <div class="menu-item" data-section="boxes-section">Боксы</div>
                <div class="menu-item" data-section="farm-section">Ферма</div>
                <div class="menu-item" data-section="profile-section">Профиль</div>
            `;
            
            // Заново добавим обработчики
            attachMenuHandlers();
        } else {
            console.error("Меню не найдено, создаем новое");
            
            // Создаем новое меню
            const newMenu = document.createElement('div');
            newMenu.className = 'bottom-menu';
            newMenu.innerHTML = `
                <div class="menu-item" data-section="main-screen">Главная</div>
                <div class="menu-item" data-section="tasks-section">Задания</div>
                <div class="menu-item" data-section="boxes-section">Боксы</div>
                <div class="menu-item" data-section="farm-section">Ферма</div>
                <div class="menu-item" data-section="profile-section">Профиль</div>
            `;
            
            // Применяем базовые стили для меню
            newMenu.style.position = 'fixed';
            newMenu.style.bottom = '0';
            newMenu.style.left = '0';
            newMenu.style.width = '100%';
            newMenu.style.display = 'flex';
            newMenu.style.justifyContent = 'space-around';
            newMenu.style.backgroundColor = '#FFB700';
            newMenu.style.padding = '10px 0';
            newMenu.style.boxShadow = '0 -4px 10px rgba(0,0,0,0.1)';
            newMenu.style.zIndex = '10';
            
            // Добавляем меню в body
            document.body.appendChild(newMenu);
            
            // Добавляем обработчики
            attachMenuHandlers();
        }
    } else {
        console.log(`Найдено ${menuItems.length} элементов меню, восстанавливаем обработчики`);
        
        // Просто переназначаем обработчики для существующих элементов
        attachMenuHandlers();
    }
}

// Функция для добавления обработчиков к элементам меню
function attachMenuHandlers() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        // Удаляем старые обработчики, если есть
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        // Применяем стили к элементам меню
        newItem.style.color = '#333';
        newItem.style.textAlign = 'center';
        newItem.style.cursor = 'pointer';
        newItem.style.transition = 'all 0.3s';
        newItem.style.fontWeight = 'bold';
        newItem.style.padding = '8px 10px';
        newItem.style.borderRadius = '20px';
        newItem.style.fontSize = '14px';
        
        // Добавляем новый обработчик
        newItem.addEventListener('click', function(event) {
            // Предотвращаем стандартное поведение
            event.preventDefault();
            
            // Получаем идентификатор секции
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                console.log(`Клик по пункту меню: ${sectionId}`);
                
                // Проигрываем звук клика, если функция доступна
                if (typeof playSound === 'function') {
                    playSound('click');
                }
                
                // Вибрация, если функция доступна
                if (typeof vibrate === 'function') {
                    vibrate(30);
                }
                
                // Показываем соответствующую секцию
                showSection(sectionId);
                
                // Делаем элемент активным
                document.querySelectorAll('.menu-item').forEach(menuItem => {
                    menuItem.classList.remove('active');
                });
                this.classList.add('active');
            }
        });
        
        console.log(`Добавлен обработчик для меню: ${newItem.getAttribute('data-section')}`);
    });
}

// Улучшенная функция для переключения секций
function showSection(sectionId) {
    console.log(`Показываем секцию: ${sectionId}`);
    
    try {
        // Нормализуем ID секции (добавляем "-section", если его нет и это не main-screen)
        if (sectionId !== 'main-screen' && !sectionId.endsWith('-section')) {
            sectionId = sectionId + '-section';
        }
        
        // Получаем элемент секции
        const targetSection = document.getElementById(sectionId);
        
        // Если секция не найдена, пробуем создать ее
        if (!targetSection) {
            console.warn(`Секция ${sectionId} не найдена, пробуем создать`);
            
            // Создаем простую заглушку для секции
            const newSection = document.createElement('div');
            newSection.id = sectionId;
            newSection.className = 'section';
            newSection.innerHTML = `<h2 class="section-heading">${sectionId.replace('-section', '').toUpperCase()}</h2>`;
            
            // Добавляем секцию в body
            document.body.appendChild(newSection);
            
            // Обновляем ссылку на секцию
            const createdSection = document.getElementById(sectionId);
            
            if (createdSection) {
                // Скрываем все секции
                document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                    section.style.display = 'none';
                });
                
                // Показываем созданную секцию
                createdSection.style.display = 'block';
                
                // Обновляем активные пункты меню
                updateActiveMenuItem(sectionId);
                
                console.log(`Секция ${sectionId} создана и отображена`);
                return; // Прерываем выполнение функции
            }
        } else {
            // Скрываем все секции
            document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                section.style.display = 'none';
            });
            
            // Показываем целевую секцию
            targetSection.style.display = 'block';
            
            // Обновляем активные пункты меню
            updateActiveMenuItem(sectionId);
            
            console.log(`Секция ${sectionId} отображена`);
        }
    } catch (error) {
        console.error(`Ошибка при переключении на секцию ${sectionId}:`, error);
        
        // В случае ошибки, показываем главный экран как запасной вариант
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                section.style.display = 'none';
            });
            mainScreen.style.display = 'block';
            console.log("Показан главный экран из-за ошибки");
        }
    }
}

// Функция для обновления активного пункта меню
function updateActiveMenuItem(sectionId) {
    // Удаляем класс active у всех пунктов меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Добавляем класс active для соответствующего пункта меню
    const menuItem = document.querySelector(`.menu-item[data-section="${sectionId}"]`) || 
                    document.querySelector(`.menu-item[data-section="${sectionId.replace('-section', '')}"]`);
    
    if (menuItem) {
        menuItem.classList.add('active');
    }
}

// Экстренный скрипт для восстановления функциональности игры
// Вставьте этот скрипт в консоль браузера (F12) для быстрого исправления критических ошибок

(function() {
    console.log("🚨 Запуск экстренного исправления Minions Game 🚨");
    
    // 1. Исправление экрана загрузки
    function fixSplashScreen() {
        console.log("Исправление экрана загрузки");
        
        // Проверяем, существует ли элемент
        let splashScreen = document.getElementById('splash-screen');
        
        // Если элемент не существует, создаем его
        if (!splashScreen) {
            console.log("Элемент splash-screen не найден, создаем новый");
            
            splashScreen = document.createElement('div');
            splashScreen.id = 'splash-screen';
            splashScreen.innerHTML = `
                <div class="splash-content">
                    <img src="images/logo.png" alt="" class="splash-logo" onerror="this.onerror=null; this.src='https://i.imgur.com/ZcukEsb.png';">
                    <div class="loading-container">
                        <div class="loading-bar">
                            <div class="loading-progress"></div>
                        </div>
                        <div class="loading-text">Загрузка... <span id="loading-progress">0%</span></div>
                    </div>
                </div>
            `;
            
            // Добавляем необходимые стили
            splashScreen.style.position = 'fixed';
            splashScreen.style.top = '0';
            splashScreen.style.left = '0';
            splashScreen.style.width = '100%';
            splashScreen.style.height = '100%';
            splashScreen.style.background = 'linear-gradient(135deg, #FFE500, #FFB700)';
            splashScreen.style.display = 'flex';
            splashScreen.style.justifyContent = 'center';
            splashScreen.style.alignItems = 'center';
            splashScreen.style.zIndex = '9999';
            
            // Добавляем в body как первый элемент
            document.body.insertBefore(splashScreen, document.body.firstChild);
        } else {
            // Если элемент существует, убедимся, что он отображается правильно
            console.log("Элемент splash-screen найден, исправляем его стили");
            
            splashScreen.style.display = 'flex';
            splashScreen.style.opacity = '1';
            splashScreen.style.zIndex = '9999';
        }
        
        return splashScreen;
    }
    
    // 2. Исправление кликабельности меню
    function fixMenuClicks() {
        console.log("Исправление кликабельности меню");
        
        // Находим меню
        const menuItems = document.querySelectorAll('.menu-item');
        
        if (!menuItems || menuItems.length === 0) {
            console.warn("Элементы меню не найдены");
            
            // Попробуем найти нижнее меню и восстановить его
            const bottomMenu = document.querySelector('.bottom-menu');
            if (bottomMenu) {
                console.log("Нашли контейнер меню, пробуем восстановить элементы");
                
                // Очистим и заново создадим элементы меню
                bottomMenu.innerHTML = `
                    <div class="menu-item" data-section="main-screen">Главная</div>
                    <div class="menu-item" data-section="tasks-section">Задания</div>
                    <div class="menu-item" data-section="boxes-section">Боксы</div>
                    <div class="menu-item" data-section="farm-section">Ферма</div>
                    <div class="menu-item" data-section="profile-section">Профиль</div>
                `;
            } else {
                console.error("Меню не найдено, создаем новое");
                
                // Создаем новое меню
                const newMenu = document.createElement('div');
                newMenu.className = 'bottom-menu';
                newMenu.innerHTML = `
                    <div class="menu-item" data-section="main-screen">Главная</div>
                    <div class="menu-item" data-section="tasks-section">Задания</div>
                    <div class="menu-item" data-section="boxes-section">Боксы</div>
                    <div class="menu-item" data-section="farm-section">Ферма</div>
                    <div class="menu-item" data-section="profile-section">Профиль</div>
                `;
                
                // Применяем базовые стили для меню
                newMenu.style.position = 'fixed';
                newMenu.style.bottom = '0';
                newMenu.style.left = '0';
                newMenu.style.width = '100%';
                newMenu.style.display = 'flex';
                newMenu.style.justifyContent = 'space-around';
                newMenu.style.backgroundColor = '#FFB700';
                newMenu.style.padding = '10px 0';
                newMenu.style.boxShadow = '0 -4px 10px rgba(0,0,0,0.1)';
                newMenu.style.zIndex = '10';
                
                // Добавляем меню в body
                document.body.appendChild(newMenu);
            }
        }
        
        // Добавляем обработчики для всех элементов меню
        document.querySelectorAll('.menu-item').forEach(item => {
            // Удаляем старые обработчики, если есть
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            
            // Стили для элементов меню
            newItem.style.color = '#333';
            newItem.style.textAlign = 'center';
            newItem.style.cursor = 'pointer';
            newItem.style.transition = 'all 0.3s';
            newItem.style.fontWeight = 'bold';
            newItem.style.padding = '8px 10px';
            newItem.style.borderRadius = '20px';
            newItem.style.fontSize = '14px';
            
            // Добавляем новый обработчик
            newItem.addEventListener('click', function(event) {
                // Предотвращаем стандартное поведение
                event.preventDefault();
                
                // Получаем идентификатор секции
                const sectionId = this.getAttribute('data-section');
                if (sectionId) {
                    console.log(`Клик по пункту меню: ${sectionId}`);
                    
                    // Показываем соответствующую секцию
                    showSectionEmergency(sectionId);
                    
                    // Делаем элемент активным
                    document.querySelectorAll('.menu-item').forEach(menuItem => {
                        menuItem.classList.remove('active');
                    });
                    this.classList.add('active');
                }
            });
        });
        
        // Показываем сообщение об успешном восстановлении
        showEmergencyMessage('Меню успешно восстановлено', 'success');
    }
    
    // 3. Экстренная функция для переключения секций
    function showSectionEmergency(sectionId) {
        console.log(`Показываем секцию: ${sectionId}`);
        
        try {
            // Нормализуем ID секции (добавляем "-section", если его нет и это не main-screen)
            if (sectionId !== 'main-screen' && !sectionId.endsWith('-section')) {
                sectionId = sectionId + '-section';
            }
            
            // Получаем все секции
            const sections = document.querySelectorAll('.section, [id$="-section"]');
            
            // Скрываем все секции
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Проверяем, существует ли целевая секция
            const targetSection = document.getElementById(sectionId);
            
            if (targetSection) {
                // Показываем целевую секцию
                targetSection.style.display = 'block';
                console.log(`Секция ${sectionId} отображена`);
                
                // Показываем сообщение об успешном переключении
                showEmergencyMessage(`Переключено на ${sectionId}`, 'info');
            } else {
                console.warn(`Секция ${sectionId} не найдена`);
                
                // Показываем сообщение об ошибке
                showEmergencyMessage(`Секция ${sectionId} не найдена`, 'error');
                
                // Показываем главный экран как запасной вариант
                const mainScreen = document.getElementById('main-screen');
                if (mainScreen) {
                    mainScreen.style.display = 'block';
                }
            }
        } catch (error) {
            console.error(`Ошибка при переключении на секцию ${sectionId}:`, error);
            
            // Показываем сообщение об ошибке
            showEmergencyMessage('Ошибка при переключении секции', 'error');
        }
    }
    
    // 4. Функция для отображения сообщений
    function showEmergencyMessage(message, type = 'info') {
        // Создаем элемент сообщения
        const messageElement = document.createElement('div');
        
        // Устанавливаем стиль в зависимости от типа
        let backgroundColor, color;
        
        switch (type) {
            case 'success':
                backgroundColor = '#4CAF50';
                color = 'white';
                break;
            case 'error':
                backgroundColor = '#F44336';
                color = 'white';
                break;
            case 'info':
            default:
                backgroundColor = '#2196F3';
                color = 'white';
                break;
        }
        
        // Применяем стили
        messageElement.style.position = 'fixed';
        messageElement.style.top = '20px';
        messageElement.style.left = '50%';
        messageElement.style.transform = 'translateX(-50%)';
        messageElement.style.backgroundColor = backgroundColor;
        messageElement.style.color = color;
        messageElement.style.padding = '10px 20px';
        messageElement.style.borderRadius = '4px';
        messageElement.style.zIndex = '10000';
        messageElement.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        messageElement.style.transition = 'opacity 0.3s ease';
        
        // Устанавливаем текст сообщения
        messageElement.textContent = message;
        
        // Добавляем сообщение на страницу
        document.body.appendChild(messageElement);
        
        // Удаляем сообщение через 3 секунды
        setTimeout(() => {
            messageElement.style.opacity = '0';
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 3000);
    }
    
    // Запускаем исправления
    fixSplashScreen();
    fixMenuClicks();
    
    // Запускаем анимацию загрузки
    let progress = 0;
    const progressBar = document.querySelector('.loading-progress');
    const progressText = document.getElementById('loading-progress');
    
    if (progressBar && progressText) {
        const loadingInterval = setInterval(() => {
            progress += 5;
            if (progress > 100) {
                clearInterval(loadingInterval);
                
                // Скрываем экран загрузки после завершения
                const splashScreen = document.getElementById('splash-screen');
                if (splashScreen) {
                    setTimeout(() => {
                        splashScreen.style.opacity = '0';
                        setTimeout(() => {
                            splashScreen.style.display = 'none';
                            
                            // Показываем главный экран
                            const mainScreen = document.getElementById('main-screen');
                            if (mainScreen) {
                                mainScreen.style.display = 'block';
                            } else {
                                showEmergencyMessage('Главный экран не найден', 'error');
                            }
                        }, 500);
                    }, 500);
                }
                
                return;
            }
            
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${progress}%`;
        }, 50);
    }
    
    // Выводим сообщение о запуске исправлений
    showEmergencyMessage('Экстренное восстановление игры запущено', 'info');
    
    console.log("🎮 Экстренное исправление завершено!");
})();

// Унифицированная функция для обработки кликов меню
function fixMenuClicks() {
  console.log("Инициализация меню");
  
  // Добавляем обработчики для всех пунктов меню
  document.querySelectorAll('.menu-item').forEach(item => {
    // Очищаем существующие обработчики для избежания дублирования
    const newItem = item.cloneNode(true);
    if (item.parentNode) {
      item.parentNode.replaceChild(newItem, item);
    }
    
    // Добавляем обработчик клика
    newItem.addEventListener('click', function() {
      const sectionId = this.getAttribute('data-section');
      if (sectionId) {
        // Проигрываем звук клика
        if (typeof playSound === 'function') {
          playSound('click');
        }
        
        // Вибрация
        if (typeof vibrate === 'function') {
          vibrate(30);
        }
        
        // Переключаем секцию
        showSection(sectionId);
      }
    });
  });
}

// Функция для управления экраном загрузки
function handleLoadingScreen() {
  const splashScreen = document.getElementById('splash-screen');
  if (!splashScreen) return;
  
  const progressBar = document.getElementById('loading-progress-bar');
  const progressText = document.getElementById('loading-progress');
  
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    
    if (progressBar) progressBar.style.width = progress + '%';
    if (progressText) progressText.textContent = progress + '%';
    
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
          splashScreen.style.display = 'none';
          showSection('main-screen');
        }, 500);
      }, 500);
    }
  }, 100);
}

// Вызываем эту функцию после загрузки DOM
document.addEventListener('DOMContentLoaded', handleLoadingScreen);
