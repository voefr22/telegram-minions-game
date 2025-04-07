// ============= FIXES.JS =============
// Набор исправлений для Minions Game
// 
// Решает следующие проблемы:
// 1. Прогресс не сохраняется
// 2. Боксы не активны
// 3. Звезды в заданиях, хотя их не должно быть
// 4. Кнопка профиль в главном меню не активна
// 5. Таблица лидеров отображается неправильно
// 6. Улучшение интеграции с Telegram

// ========== УЛУЧШЕННАЯ СИСТЕМА СОХРАНЕНИЯ ==========

// Улучшенная функция сохранения прогресса
function saveGameState() {
    try {
        // Добавим метку времени сохранения
        gameState.lastSaveTime = Date.now();
        
        // Преобразуем gameState в строку
        const gameStateJSON = JSON.stringify(gameState);
        
        // Сохраняем в localStorage
        localStorage.setItem('minionsGameState', gameStateJSON);
        
        console.log("Состояние игры сохранено в localStorage:", new Date().toLocaleTimeString());
        
        // Сохранение успешно - можно добавить дополнительную обратную связь
        return true;
    } catch (e) {
        console.error('Ошибка при сохранении игрового состояния:', e);
        
        // В случае ошибки - можно добавить запасной вариант сохранения
        // Например, сохранить только ключевые параметры
        try {
            const minimalState = {
                bananas: gameState.bananas,
                stars: gameState.stars,
                level: gameState.level,
                totalBananas: gameState.totalBananas
            };
            localStorage.setItem('minionsGameState_backup', JSON.stringify(minimalState));
            console.log("Сохранено минимальное состояние игры");
        } catch (backupError) {
            console.error('Не удалось создать резервную копию:', backupError);
        }
        
        return false;
    }
}

// Улучшенная функция загрузки прогресса
function loadGameState() {
    try {
        // Пытаемся загрузить основные данные
        const savedState = localStorage.getItem('minionsGameState');
        
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                
                // Проверяем корректность данных
                if (parsed && typeof parsed === 'object') {
                    // Объединяем загруженные данные с базовым состоянием
                    // для случая, если в gameState появились новые поля
                    gameState = {...gameState, ...parsed};
                    
                    console.log("Состояние игры успешно загружено из localStorage");
                    
                    // Проверка на ежедневный вход
                    checkDailyLogin();
                    
                    // Принудительное обновление UI
                    updateStats();
                    updateTaskProgress();
                    
                    return true;
                } else {
                    throw new Error("Некорректный формат сохраненных данных");
                }
            } catch (parseError) {
                console.error("Ошибка при разборе сохраненных данных:", parseError);
                
                // Пробуем загрузить резервную копию
                return loadBackupState();
            }
        } else {
            console.log("Сохраненные данные не найдены, начинаем новую игру");
            return false;
        }
    } catch (e) {
        console.error('Ошибка при загрузке сохраненных данных:', e);
        return loadBackupState();
    }
}

// Загрузка резервной копии
function loadBackupState() {
    try {
        const backupState = localStorage.getItem('minionsGameState_backup');
        if (backupState) {
            const parsed = JSON.parse(backupState);
            if (parsed && typeof parsed === 'object') {
                gameState = {...gameState, ...parsed};
                console.log("Загружены данные из резервной копии");
                return true;
            }
        }
    } catch (e) {
        console.error('Ошибка при загрузке резервной копии:', e);
    }
    return false;
}

// Добавляем автосохранение каждые 60 секунд
let autoSaveInterval;
function startAutoSave() {
    // Останавливаем предыдущий интервал, если был
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
    }
    
    // Запускаем новый интервал
    autoSaveInterval = setInterval(() => {
        saveGameState();
    }, 60000); // Сохранение каждую минуту
    
    console.log("Автосохранение запущено");
}

// Функция для инициализации системы сохранения
function initSaveSystem() {
    loadGameState();
    startAutoSave();
    
    // Добавляем сохранение при уходе со страницы
    window.addEventListener('beforeunload', saveGameState);
    
    // Добавляем сохранение при сворачивании приложения (для мобильных)
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.onEvent('viewportChanged', () => {
            if (window.Telegram.WebApp.isExpanded === false) {
                saveGameState();
            }
        });
    }
}

// ========== ИСПРАВЛЕНИЕ СИСТЕМЫ БОКСОВ ==========

// Улучшенная функция открытия бокса
function openBox(type) {
    console.log("Попытка открытия бокса:", type);
    
    // Проверяем наличие типа бокса
    if (!type) {
        console.error("Не указан тип бокса");
        showPopup('Ошибка: неизвестный тип бокса');
        return false;
    }
    
    // Определяем стоимость в зависимости от типа
    let cost = 0;
    switch(type) {
        case 'simple': cost = 10; break;
        case 'standard': cost = 25; break;
        case 'premium': cost = 50; break;
        case 'mega': cost = 100; break;
        case 'special': cost = 75; break;
        default:
            console.error("Неизвестный тип бокса:", type);
            showPopup('Ошибка: неизвестный тип бокса');
            return false;
    }
    
    // Проверяем, хватает ли бананов
    if (gameState.bananas < cost) {
        console.log("Недостаточно бананов для открытия бокса");
        showPopup(`Недостаточно бананов! Нужно ${cost} 🍌`);
        playSound('minionShocked');
        return false;
    }
    
    // Списываем бананы
    gameState.bananas -= cost;
    
    // Определяем награду
    let reward;
    switch(type) {
        case 'simple':
            // 70% шанс на бананы (5-15), 30% шанс на опыт (5-10)
            if (Math.random() < 0.7) {
                const bananas = Math.floor(Math.random() * 11) + 5;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
            } else {
                const exp = Math.floor(Math.random() * 6) + 5;
                addExperience(exp);
                reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
            }
            break;
            
        case 'standard':
            // 60% шанс на бананы (15-30), 40% шанс на опыт (10-20)
            if (Math.random() < 0.6) {
                const bananas = Math.floor(Math.random() * 16) + 15;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
            } else {
                const exp = Math.floor(Math.random() * 11) + 10;
                addExperience(exp);
                reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
            }
            break;
            
        case 'premium':
            // Премиум награды
            const premiumReward = Math.random();
            if (premiumReward < 0.5) {
                // 50% шанс на бананы (40-80)
                const bananas = Math.floor(Math.random() * 41) + 40;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
            } else if (premiumReward < 0.85) {
                // 35% шанс на опыт (20-40)
                const exp = Math.floor(Math.random() * 21) + 20;
                addExperience(exp);
                reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
            } else {
                // 15% шанс на звезду
                gameState.stars += 1;
                gameState.totalStars += 1;
                reward = { type: 'stars', amount: 1, text: `+1 звезда` };
            }
            
            // Отмечаем задание на открытие премиум-кейса
            if (gameState.taskProgress.task2 < 1) {
                gameState.taskProgress.task2 = 1;
                setTimeout(() => {
                    completeTask(2);
                }, 1000);
            }
            break;
            
        case 'mega':
            // Мега награды
            const megaReward = Math.random();
            if (megaReward < 0.4) {
                // 40% шанс на бананы (80-150)
                const bananas = Math.floor(Math.random() * 71) + 80;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
            } else if (megaReward < 0.7) {
                // 30% шанс на опыт (40-80)
                const exp = Math.floor(Math.random() * 41) + 40;
                addExperience(exp);
                reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
            } else if (megaReward < 0.9) {
                // 20% шанс на звезды (2-3)
                const stars = Math.floor(Math.random() * 2) + 2;
                gameState.stars += stars;
                gameState.totalStars += stars;
                reward = { type: 'stars', amount: stars, text: `+${stars} звезды` };
            } else {
                // 10% шанс на джекпот - все виды наград
                const bananas = 100;
                const exp = 50;
                const stars = 1;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                gameState.stars += stars;
                gameState.totalStars += stars;
                addExperience(exp);
                reward = { type: 'jackpot', text: `ДЖЕКПОТ! +${bananas} бананов, +${exp} опыта, +${stars} звезда` };
            }
            break;
            
        case 'special':
            // Специальные награды
            const specialReward = Math.random();
            if (specialReward < 0.3) {
                // 30% шанс на бананы (60-120)
                const bananas = Math.floor(Math.random() * 61) + 60;
                gameState.bananas += bananas;
                gameState.totalBananas += bananas;
                reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
            } else if (specialReward < 0.6) {
                // 30% шанс на опыт (30-60)
                const exp = Math.floor(Math.random() * 31) + 30;
                addExperience(exp);
                reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
            } else if (specialReward < 0.9) {
                // 30% шанс на звезды (1-2)
                const stars = Math.floor(Math.random() * 2) + 1;
                gameState.stars += stars;
                gameState.totalStars += stars;
                reward = { type: 'stars', amount: stars, text: `+${stars} ${stars === 1 ? 'звезда' : 'звезды'}` };
            } else {
                // 10% шанс на бонус эффективности фермы
                if (!gameState.farm) gameState.farm = { efficiency: 1.0 };
                gameState.farm.efficiency += 0.2;
                reward = { type: 'boost', text: `+20% к эффективности фермы!` };
            }
            break;
    }
    
    // Увеличиваем счетчик открытых боксов
    gameState.openedBoxes = (gameState.openedBoxes || 0) + 1;
    
    // Проверяем задание на открытие боксов
    if (gameState.openedBoxes >= 5 && gameState.taskProgress.task5 < 1) {
        gameState.taskProgress.task5 = 1;
        setTimeout(() => {
            completeTask(5);
        }, 2000);
    }
    
    // Обновляем статистику
    updateStats();
    saveGameState();
    
    // Показываем анимацию
    showBoxAnimation(type, reward);
    
    // Воспроизводим звук
    playSound('box');
    vibrate([100, 50, 100]);
    
    return true;
}

// Функция для отображения анимации открытия бокса
function showBoxAnimation(type, reward) {
    // Находим контейнер для анимации
    let container = document.getElementById('box-animation-container');
    
    // Если контейнер не существует, создаем его
    if (!container) {
        container = document.createElement('div');
        container.id = 'box-animation-container';
        container.className = 'modal-container';
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'close-btn';
        closeBtn.textContent = '✖';
        closeBtn.onclick = function() { closeModal('box-animation-container'); };
        
        const content = document.createElement('div');
        content.className = 'box-animation-content';
        
        const boxImage = document.createElement('img');
        boxImage.id = 'box-image';
        boxImage.onerror = function() { this.src = 'https://i.imgur.com/ZcukEsb.png'; };
        
        const boxReward = document.createElement('div');
        boxReward.id = 'box-reward';
        boxReward.className = 'box-reward';
        
        content.appendChild(boxImage);
        content.appendChild(boxReward);
        
        container.appendChild(closeBtn);
        container.appendChild(content);
        
        document.body.appendChild(container);
    }
    
    // Получаем элементы анимации
    const boxImage = document.getElementById('box-image');
    const boxReward = document.getElementById('box-reward');
    
    // Устанавливаем изображение бокса
    boxImage.src = `images/box_${type}.png`;
    boxImage.onerror = function() { this.src = 'https://i.imgur.com/ZcukEsb.png'; };
    
    // Сбрасываем классы и стили для новой анимации
    boxImage.className = '';
    boxReward.style.opacity = '0';
    boxReward.textContent = '';
    
    // Показываем контейнер
    container.style.display = 'flex';
    
    // Запускаем анимацию встряхивания
    setTimeout(() => {
        boxImage.classList.add('shake');
        
        // После анимации встряхивания показываем анимацию открытия
        setTimeout(() => {
            boxImage.classList.remove('shake');
            boxImage.classList.add('open');
            
            // После открытия показываем награду
            setTimeout(() => {
                boxReward.textContent = reward.text;
                boxReward.style.opacity = '1';
                
                // Создаем конфетти для особых наград
                if (reward.type === 'stars' || reward.type === 'jackpot' || reward.type === 'boost') {
                    createConfetti();
                }
            }, 500);
        }, 1000);
    }, 500);
}

// Инициализация обработчиков для боксов
function initBoxHandlers() {
    console.log("Инициализация обработчиков боксов");
    
    // Находим все кнопки открытия боксов
    const boxButtons = document.querySelectorAll('.open-box-btn');
    
    boxButtons.forEach(button => {
        // Удаляем старые обработчики
        const newButton = button.cloneNode(true);
        if (button.parentNode) {
            button.parentNode.replaceChild(newButton, button);
        }
        
        // Добавляем новый обработчик
        newButton.addEventListener('click', function(event) {
            // Предотвращаем всплытие события
            event.preventDefault();
            event.stopPropagation();
            
            // Получаем тип бокса
            const boxType = this.getAttribute('data-type');
            console.log("Клик по кнопке открытия бокса:", boxType);
            
            // Открываем бокс
            openBox(boxType);
        });
    });
    
    // Также добавляем обработчик к самим боксам для удобства
    const boxes = document.querySelectorAll('.box');
    
    boxes.forEach(box => {
        // Получаем тип бокса
        const boxType = box.getAttribute('data-type');
        if (!boxType) return;
        
        // Удаляем старые обработчики
        const newBox = box.cloneNode(true);
        if (box.parentNode) {
            box.parentNode.replaceChild(newBox, box);
        }
        
        // Находим кнопку в этом боксе и добавляем обработчик
        const button = newBox.querySelector('.open-box-btn');
        if (button) {
            button.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                openBox(boxType);
            });
        }
        
        // Добавляем обработчик на весь бокс для удобства
        newBox.addEventListener('click', function(event) {
            // Если клик был не по кнопке, а по самому боксу
            if (event.target !== button) {
                openBox(boxType);
            }
        });
    });
    
    console.log("Обработчики боксов установлены");
}

// ========== ИСПРАВЛЕНИЕ СИСТЕМЫ ЗАДАНИЙ ==========

// Обновленные данные для заданий (все награды в бананах)
const tasksData = [
    { id: 1, title: "Пригласи 10 друзей", reward: "+100 🍌", maxProgress: 10 },
    { id: 2, title: "Открой премиум-кейс", reward: "+50 🍌", maxProgress: 1 },
    { id: 3, title: "Накорми 5 миньонов", reward: "+20 🍌", maxProgress: 5 },
    { id: 4, title: "Собери 30 бананов", reward: "+25 🍌", maxProgress: 30 },
    { id: 5, title: "Открой 5 боксов", reward: "+40 🍌", maxProgress: 5 },
    { id: 6, title: "Достигни 3 уровня", reward: "+60 🍌", maxProgress: 3 },
    { id: 7, title: "Получи 5 достижений", reward: "+75 🍌", maxProgress: 5 },
    { id: 8, title: "Серия входов 5 дней", reward: "+35 🍌", maxProgress: 5 },
    { id: 9, title: "Собери 100 бананов", reward: "+50 🍌", maxProgress: 100 },
    { id: 10, title: "Накопи 20 бананов в час", reward: "+100 🍌", maxProgress: 20 }
];

// Функция для инициализации заданий
function initTasks() {
    console.log("Инициализация системы заданий");
    
    // Находим контейнер для заданий
    const tasksContainer = document.querySelector('.tasks-container');
    if (!tasksContainer) {
        console.error("Не найден контейнер для заданий");
        return;
    }
    
    // Очищаем контейнер
    tasksContainer.innerHTML = '';
    
    // Создаем HTML для каждого задания
    tasksData.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task';
        taskDiv.setAttribute('data-task-id', task.id);
        
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
        
        // Добавляем обработчик клика для удобства
        taskDiv.addEventListener('click', function() {
            // Для заданий, которые можно активно выполнять (например, приглашение друзей)
            if (task.id === 1) {
                inviteFriend();
            }
        });
        
        // Добавляем задание в контейнер
        tasksContainer.appendChild(taskDiv);
    });
    
    // Обновляем прогресс заданий
    updateTaskProgress();
    
    console.log("Задания инициализированы");
}

// Обновленная функция выполнения задания
function completeTask(taskId) {
    console.log("Выполнение задания:", taskId);
    
    // Находим данные задания
    const taskData = tasksData.find(task => task.id === taskId);
    if (!taskData) {
        console.error("Неизвестное задание:", taskId);
        return;
    }
    
    // Проверяем, не выполнено ли уже задание
    if (gameState.taskProgress[`task${taskId}`] >= 1) {
        console.log("Задание уже выполнено");
        return;
    }
    
    // Отмечаем задание как выполненное
    gameState.taskProgress[`task${taskId}`] = 1;
    gameState.completedTasks = (gameState.completedTasks || 0) + 1;
    
    // Определяем награду (всегда бананы, извлекаем число из строки награды)
    let reward = 0;
    const rewardMatch = taskData.reward.match(/\+(\d+)/);
    if (rewardMatch && rewardMatch[1]) {
        reward = parseInt(rewardMatch[1]);
    }
    
    // Выдаем награду
    gameState.bananas += reward;
    gameState.totalBananas += reward;
    
    // Обновляем статистику
    updateStats();
    updateTaskProgress();
    saveGameState();
    
    // Показываем уведомление
    showPopup(`Задание выполнено! ${taskData.reward}`);
    
    // Звук и вибрация
    playSound('task');
    vibrate([100, 30, 100, 30, 100]);
    
    // Создаем эффект конфетти
    createConfetti();
    
    return true;
}

// Обновленная функция для обновления прогресса заданий
function updateTaskProgress() {
    try {
        // Задание 1: Пригласи 10 друзей
        updateTaskProgressUI(1, Math.min(gameState.invitedFriends || 0, 10), 10);
        
        // Задание 2: Открой премиум-кейс
        updateTaskProgressUI(2, gameState.taskProgress.task2 || 0, 1);
        
        // Задание 3: Накорми 5 миньонов
        const feedCount = Math.min(Math.floor((gameState.petCount || 0) / 5), 5);
        updateTaskProgressUI(3, feedCount, 5);
        
        // Задание 4: Собери 30 бананов
        updateTaskProgressUI(4, Math.min(gameState.totalBananas || 0, 30), 30);
        
        // Задание 5: Открой 5 боксов
        updateTaskProgressUI(5, Math.min(gameState.openedBoxes || 0, 5), 5);
        
        // Задание 6: Достигни 3 уровня
        updateTaskProgressUI(6, Math.min(gameState.level || 1, 3), 3);
        
        // Задание 7: Получи 5 достижений
        updateTaskProgressUI(7, Math.min(gameState.achievements?.length || 1, 5), 5);
        
        // Задание 8: Серия входов 5 дней подряд
        updateTaskProgressUI(8, Math.min(gameState.streak || 0, 5), 5);
        
        // Задание 9: Собери 100 бананов
        updateTaskProgressUI(9, Math.min(gameState.totalBananas || 0, 100), 100);
        
        // Задание 10: Накопи 20 бананов в час
        const farmRate = calculateFarmRate();
        updateTaskProgressUI(10, Math.min(farmRate, 20), 20);
    } catch (error) {
        console.error("Ошибка при обновлении прогресса заданий:", error);
    }
}

// Функция для расчета производительности фермы
function calculateFarmRate() {
    if (!gameState.farm) return 0;
    
    const minions = gameState.farm.minions || 0;
    const efficiency = gameState.farm.efficiency || 1.0;
    
    // Базовое производство: 1 банан в час на миньона
    return Math.floor(minions * efficiency);
}

// Обновление UI прогресса задания
function updateTaskProgressUI(taskId, current, total) {
    try {
        const progressBar = document.getElementById(`task${taskId}-progress`);
        const counter = document.getElementById(`task${taskId}-counter`);
        
        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = `${percentage}%`;
        }
        
        if (counter) {
            counter.textContent = `${current}/${total}`;
        }
        
        // Выделяем выполненные задания
        const taskElement = document.querySelector(`.task[data-task-id="${taskId}"]`);
        if (taskElement) {
            if (current >= total) {
                taskElement.classList.add('completed-task');
                
                // Если задание выполнено, но не отмечено как завершенное, завершаем его
                if (gameState.taskProgress[`task${taskId}`] < 1) {
                    setTimeout(() => {
                        completeTask(taskId);
                    }, 1000);
                }
            } else {
                taskElement.classList.remove('completed-task');
            }
        }
    } catch (error) {
        console.error(`Ошибка при обновлении UI задания ${taskId}:`, error);
    }
}

// ========== ИСПРАВЛЕНИЕ РАБОТЫ ПРОФИЛЯ ==========

// Исправление функционала профиля
function initProfile() {
    console.log("Инициализация профиля пользователя");
    
    // Получаем данные пользователя из Telegram
    let userName = "Игрок";
    let userAvatar = null;
    
    if (window.Telegram && window.Telegram.WebApp) {
        try {
            // Пытаемся получить имя пользователя из Telegram
            if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
                const user = window.Telegram.WebApp.initDataUnsafe.user;
                userName = user.first_name || "Игрок";
                
                // Также можно было бы получить аватар, но Telegram WebApp не предоставляет такую возможность
                // Вместо этого можно использовать псевдослучайный аватар на основе ID пользователя
                if (user.id) {
                    userAvatar = `https://i.pravatar.cc/300?img=${user.id % 70}`;
                }
            }
        } catch (e) {
            console.error("Ошибка при получении данных пользователя из Telegram:", e);
        }
    } else if (window.TagManager && window.TagManager.getUserData) {
        try {
            // Пытаемся получить имя пользователя из TagManager
            const userData = window.TagManager.getUserData();
            if (userData) {
                userName = userData.first_name || userData.username || "Игрок";
                
                // Также можно было бы использовать ID для аватара
                if (userData.id) {
                    userAvatar = `https://i.pravatar.cc/300?img=${userData.id % 70}`;
                }
            }
        } catch (e) {
            console.error("Ошибка при получении данных пользователя из TagManager:", e);
        }
    }
    
    // Обновляем имя пользователя в профиле
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }
    
    // Обновляем аватар пользователя
    const profileAvatar = document.querySelector('.profile-avatar');
    if (profileAvatar && userAvatar) {
        profileAvatar.style.backgroundImage = `url('${userAvatar}')`;
    }
    
    // Обновляем статистику в профиле
    updateProfileStats();
    
    // Добавляем обработчик клика для кнопки профиля на главном экране
    const profileLink = document.querySelector('.profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', function() {
            console.log("Клик по кнопке профиля");
                                showSection('main-screen');
                }, 500);
            }
        }, 1000);
        
        return true;
    } catch (error) {
        console.error("Ошибка при инициализации игры:", error);
        
        // Даже в случае ошибки скрываем экран загрузки
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                
                // Показываем главный экран
                showSection('main-screen');
            }, 500);
        }
        
        // Показываем сообщение об ошибке
        showErrorMessage("Произошла ошибка при загрузке. Некоторые функции могут быть недоступны.");
        
        return false;
    }
}

// Функция для отображения прогресса загрузки
function showLoadingProgress(percentage) {
    const progressBar = document.getElementById('loading-progress-bar');
    const progressText = document.getElementById('loading-progress');
    
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${percentage}%`;
    }
}

// Функция для отображения сообщения об ошибке
function showErrorMessage(message) {
    // Создаем элемент для сообщения
    const errorContainer = document.createElement('div');
    errorContainer.style.position = 'fixed';
    errorContainer.style.top = '20px';
    errorContainer.style.left = '50%';
    errorContainer.style.transform = 'translateX(-50%)';
    errorContainer.style.backgroundColor = '#FF6B6B';
    errorContainer.style.color = 'white';
    errorContainer.style.padding = '10px 20px';
    errorContainer.style.borderRadius = '5px';
    errorContainer.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    errorContainer.style.zIndex = '9999';
    errorContainer.style.maxWidth = '90%';
    errorContainer.style.textAlign = 'center';
    errorContainer.textContent = message;
    
    // Добавляем на страницу
    document.body.appendChild(errorContainer);
    
    // Удаляем через некоторое время
    setTimeout(() => {
        errorContainer.style.opacity = '0';
        errorContainer.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            if (errorContainer.parentNode) {
                errorContainer.parentNode.removeChild(errorContainer);
            }
        }, 500);
    }, 5000);
}

// Финальная инициализация
function finalizeInitialization() {
    // Проверка ежедневного входа
    if (typeof checkDailyLogin === 'function') {
        checkDailyLogin();
    }
    
    // Обновление статистики
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Запуск автоматического сохранения
    startAutoSave();
    
    // Исправление отображения всех разделов
    fixAllSections();
    
    // Добавляем периодические обновления
    startPeriodicUpdates();
}

// Исправление отображения всех разделов
function fixAllSections() {
    // Исправляем отображение секций
    document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });
    
    // Отображаем только активную секцию
    const activeSection = document.querySelector('.section.active, [id$="-section"].active') || 
                          document.getElementById('main-screen');
    
    if (activeSection) {
        activeSection.style.display = 'block';
    } else {
        // Если нет активной секции, показываем главную
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            mainScreen.style.display = 'block';
        }
    }
    
    // Исправляем активные пункты меню
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        
        // Если соответствующая секция активна, делаем пункт активным
        const sectionId = item.getAttribute('data-section');
        if (sectionId && (activeSection && activeSection.id === sectionId)) {
            item.classList.add('active');
        }
    });
}

// Запуск периодических обновлений
function startPeriodicUpdates() {
    // Обновление интерфейса каждую секунду
    setInterval(() => {
        if (typeof updateStats === 'function') {
            updateStats();
        }
    }, 1000);
    
    // Обновление заданий каждые 5 секунд
    setInterval(() => {
        updateTaskProgress();
    }, 5000);
    
    // Автоматическое сохранение каждую минуту
    setInterval(() => {
        saveGameState();
    }, 60000);
    
    // Проверка и обновление производительности фермы каждые 10 секунд
    if (typeof updateFarm === 'function') {
        setInterval(() => {
            updateFarm();
        }, 10000);
    }
}

// Исправление функции показа секций
function showSection(sectionId) {
    console.log("Переключение на секцию:", sectionId);
    
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
        
        // Выполняем дополнительные действия в зависимости от секции
        if (sectionId === 'profile-section') {
            // Обновляем статистику профиля
            updateProfileStats();
        } else if (sectionId === 'tasks-section') {
            // Обновляем прогресс заданий
            updateTaskProgress();
        } else if (sectionId === 'leaderboard-tab-content') {
            // Обновляем таблицу лидеров
            if (typeof fetchLeaderboardData === 'function') {
                fetchLeaderboardData();
            }
        }
    } catch (error) {
        console.error("Ошибка при отображении секции:", error);
        
        // В случае ошибки, показываем главный экран
        const mainScreen = document.getElementById('main-screen');
        if (mainScreen) {
            document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                section.style.display = 'none';
            });
            mainScreen.style.display = 'block';
        }
    }
}

// Функция закрытия модальных окон
function closeModal(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.style.opacity = '0';
        setTimeout(() => {
            container.style.display = 'none';
            container.style.opacity = '1';
        }, 300);
    }
}

// Исправление для скрытия кнопки "ПОЛУЧИТЬ РЕЙТИНГ"
function hideMainButton() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.MainButton) {
        // Скрываем кнопку, если она отображается
        if (window.Telegram.WebApp.MainButton.isVisible) {
            window.Telegram.WebApp.MainButton.hide();
        }
        
        // Удаляем обработчик, который может показывать кнопку
        window.Telegram.WebApp.MainButton.onClick(function() {});
        
        console.log("MainButton скрыта");
    }
}

// Переопределение метода requestLeaderboardData в TagManager
if (window.TagManager && window.TagManager.leaderboard) {
    const originalRequestLeaderboardData = window.TagManager.leaderboard.requestLeaderboardData;
    
    // Заменяем оригинальную функцию новой, которая не показывает кнопку
    window.TagManager.leaderboard.requestLeaderboardData = function() {
        console.log("Запрос данных рейтинга без отображения MainButton");
        
        // Проверяем доступность Telegram WebApp
        if (window.TagManager.tgApp && window.TagManager.isReady) {
            // Отправляем запрос на получение данных рейтинга
            window.TagManager.sendDataToBot({
                action: "get_leaderboard",
                userId: window.TagManager.userData?.id || null
            });
            
            // Вместо показа кнопки используем генерацию тестовых данных
            setTimeout(() => {
                this.handleLeaderboardData(this.generateTestData());
            }, 1000);
            
            return true;
        } else {
            console.warn("TagManager или Telegram WebApp не инициализированы");
            // В случае недоступности Telegram WebApp используем тестовые данные
            setTimeout(() => {
                this.handleLeaderboardData(this.generateTestData());
            }, 1000);
            
            return false;
        }
    };
}

// Запуск инициализации при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    // Скрываем кнопку получения рейтинга
    hideMainButton();
    
    // Запускаем инициализацию игры
    initGame();
});
profile-section');
            updateProfileStats();
            
            // Звуки и вибрация
            if (typeof playSound === 'function') {
                playSound('click');
            }
            
            if (typeof vibrate === 'function') {
                vibrate(30);
            }
        });
    }
    
    // Добавляем CSS для выделения выполненных заданий
    const style = document.createElement('style');
    style.textContent = `
        .completed-task {
            background-color: rgba(76, 175, 80, 0.1) !important;
            border-left: 3px solid #4CAF50 !important;
        }
        
        .dark-theme .completed-task {
            background-color: rgba(76, 175, 80, 0.2) !important;
        }
    `;
    document.head.appendChild(style);
    
    console.log("Профиль инициализирован");
}

// Функция для обновления статистики в профиле
function updateProfileStats() {
    // Элементы, которые нужно обновить
    const statsToUpdate = {
        'profile-level': gameState.level || 1,
        'total-bananas': gameState.totalBananas || 0,
        'completed-tasks': gameState.completedTasks || 0,
        'opened-boxes': gameState.openedBoxes || 0,
        'invited-friends': gameState.invitedFriends || 0,
        'active-days': gameState.activeDays || 1
    };
    
    // Обновляем каждый элемент
    Object.entries(statsToUpdate).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = typeof value === 'number' ? value.toLocaleString() : value;
        }
    });
    
    // Обновляем список достижений
    updateAchievements();
}

// Функция обновления достижений
function updateAchievements() {
    const achievementsList = document.getElementById('achievements-list');
    if (!achievementsList) return;
    
    // Очищаем список
    achievementsList.innerHTML = '';
    
    // Если у пользователя нет достижений, показываем сообщение
    if (!gameState.achievements || gameState.achievements.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'achievement-empty';
        emptyMessage.textContent = 'У вас пока нет достижений. Играйте, чтобы получить их!';
        achievementsList.appendChild(emptyMessage);
        return;
    }
    
    // Добавляем каждое достижение в список
    gameState.achievements.forEach(achievement => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        
        const icon = document.createElement('span');
        icon.className = 'achievement-icon';
        icon.textContent = '🏆';
        
        const text = document.createElement('span');
        text.className = 'achievement-text';
        text.textContent = achievement;
        
        item.appendChild(icon);
        item.appendChild(text);
        achievementsList.appendChild(item);
    });
}

// ========== ИСПРАВЛЕНИЕ ТАБЛИЦЫ ЛИДЕРОВ ==========

// Исправление таблицы лидеров без сервера
function initLeaderboard() {
    console.log("Инициализация локальной таблицы лидеров");
    
    // Создаем глобальную переменную для данных лидерборда
    window.leaderboardData = {
        global: [],
        friends: [],
        lastUpdate: null
    };
    
    // Находим блок для отображения таблицы лидеров
    const leaderboardTabContent = document.getElementById('leaderboard-tab-content');
    if (!leaderboardTabContent) {
        console.error("Не найден блок для таблицы лидеров");
        return;
    }
    
    // Проверяем, есть ли необходимые элементы интерфейса
    const leaderboardList = leaderboardTabContent.querySelector('.leaderboard-list');
    const refreshButton = leaderboardTabContent.querySelector('#refresh-leaderboard');
    
    if (!leaderboardList) {
        console.error("Не найден список для таблицы лидеров");
        return;
    }
    
    // Добавляем обработчик для кнопки обновления
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            console.log("Обновление таблицы лидеров");
            fetchLeaderboardData(true);
            
            // Звуки и вибрация
            if (typeof playSound === 'function') {
                playSound('click');
            }
            
            if (typeof vibrate === 'function') {
                vibrate([30, 50, 30]);
            }
        });
    }
    
    // Инициализируем фильтры
    const filterButtons = leaderboardTabContent.querySelectorAll('.leaderboard-filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            // Отмечаем активный фильтр
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Отображаем соответствующие данные
            renderLeaderboard(filter);
            
            // Звуки и вибрация
            if (typeof playSound === 'function') {
                playSound('click');
            }
            
            if (typeof vibrate === 'function') {
                vibrate(30);
            }
        });
    });
    
    // Инициализируем табы
    initLeaderboardTabs();
    
    // Загружаем данные рейтинга
    fetchLeaderboardData();
    
    console.log("Таблица лидеров инициализирована");
}

// Инициализация табов для раздела друзей/лидеров
function initLeaderboardTabs() {
    const tabs = document.querySelectorAll('.friends-tab');
    const contents = document.querySelectorAll('.friends-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Скрываем все вкладки и контенты
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Активируем выбранную вкладку и контент
            this.classList.add('active');
            const content = document.getElementById(`${tabName}-tab-content`);
            if (content) {
                content.classList.add('active');
            }
            
            // Если выбрана вкладка с лидерами, обновляем данные
            if (tabName === 'leaderboard') {
                if (!window.leaderboardData || !window.leaderboardData.lastUpdate || 
                    Date.now() - window.leaderboardData.lastUpdate > 5 * 60 * 1000) {
                    fetchLeaderboardData();
                }
            }
            
            // Звуки и вибрация
            if (typeof playSound === 'function') {
                playSound('click');
            }
            
            if (typeof vibrate === 'function') {
                vibrate(30);
            }
        });
    });
}

// Функция для загрузки данных рейтинга
function fetchLeaderboardData(forceUpdate = false) {
    console.log("Загрузка данных рейтинга");
    
    // Элемент для отображения списка
    const leaderboardList = document.querySelector('.leaderboard-list');
    
    // Показываем индикатор загрузки
    if (leaderboardList) {
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Загрузка рейтинга...</div>';
    }
    
    // Проверяем, не обновляли ли мы данные недавно
    if (!forceUpdate && window.leaderboardData && window.leaderboardData.lastUpdate && 
        Date.now() - window.leaderboardData.lastUpdate < 5 * 60 * 1000) {
        console.log("Используем кешированные данные рейтинга");
        renderLeaderboard(document.querySelector('.leaderboard-filter-btn.active')?.getAttribute('data-filter') || 'global');
        return;
    }
    
    // Генерируем тестовые данные для демонстрации
    generateLocalLeaderboardData().then(data => {
        // Сохраняем данные
        window.leaderboardData = {
            ...data,
            lastUpdate: Date.now()
        };
        
        // Отображаем данные
        renderLeaderboard(document.querySelector('.leaderboard-filter-btn.active')?.getAttribute('data-filter') || 'global');
    });
}

// Функция генерации данных рейтинга
async function generateLocalLeaderboardData() {
    // Получаем имя пользователя
    let currentUserId = 12345;
    let currentUserName = "Игрок";
    
    // Пытаемся получить данные из Telegram или TagManager
    if (window.Telegram && window.Telegram.WebApp && 
        window.Telegram.WebApp.initDataUnsafe && 
        window.Telegram.WebApp.initDataUnsafe.user) {
        
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        currentUserId = user.id || 12345;
        currentUserName = user.first_name || "Игрок";
    } else if (window.TagManager && window.TagManager.getUserData) {
        const userData = window.TagManager.getUserData();
        if (userData) {
            currentUserId = userData.id || 12345;
            currentUserName = userData.first_name || userData.username || "Игрок";
        }
    }
    
    // Создаем глобальный список лидеров
    const globalLeaderboard = [];
    
    // Добавляем текущего пользователя
    globalLeaderboard.push({
        id: currentUserId,
        username: currentUserName,
        level: gameState.level || 1,
        score: gameState.totalBananas || 0,
        isMe: true
    });
    
    // Добавляем ботов с случайными именами и счетом
    const botNames = ["MinionsKing", "BananaHunter", "MinionMaster", "BananaCollector", 
                       "YellowMinion", "StarCollector", "BoxOpener", "MinionFan", 
                       "BananaBoss", "StarHunter", "MinionLover", "BoxMaster"];
    
    for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * botNames.length);
        const name = botNames[randomIndex] + Math.floor(Math.random() * 100);
        
        globalLeaderboard.push({
            id: 1000 + i,
            username: name,
            level: Math.floor(Math.random() * 20) + 1,
            score: Math.floor(Math.random() * 10000) + 100,
            isMe: false
        });
    }
    
    // Сортируем по очкам (убывание)
    globalLeaderboard.sort((a, b) => b.score - a.score);
    
    // Создаем список друзей (в данном случае, просто часть глобального списка)
    const friendsLeaderboard = [
        // Текущий пользователь
        globalLeaderboard.find(player => player.isMe)
    ];
    
    // Добавляем несколько "друзей"
    for (let i = 0; i < 5; i++) {
        // Берем случайного бота из глобального списка
        const randomIndex = Math.floor(Math.random() * globalLeaderboard.length);
        const friend = globalLeaderboard[randomIndex];
        
        // Проверяем, что это не мы и не уже добавленный друг
        if (!friend.isMe && !friendsLeaderboard.some(f => f.id === friend.id)) {
            friendsLeaderboard.push(friend);
        }
    }
    
    // Сортируем список друзей по очкам
    friendsLeaderboard.sort((a, b) => b.score - a.score);
    
    return {
        global: globalLeaderboard,
        friends: friendsLeaderboard
    };
}

// Функция для отображения таблицы лидеров
function renderLeaderboard(filter = 'global') {
    console.log(`Отображение таблицы лидеров: ${filter}`);
    
    // Элемент для отображения списка
    const leaderboardList = document.querySelector('.leaderboard-list');
    if (!leaderboardList) return;
    
    // Проверяем наличие данных
    if (!window.leaderboardData || !window.leaderboardData[filter]) {
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Нет данных рейтинга</div>';
        return;
    }
    
    // Получаем данные для выбранного фильтра
    const data = window.leaderboardData[filter];
    
    // Если данных нет, показываем сообщение
    if (!data || data.length === 0) {
        leaderboardList.innerHTML = '<div class="leaderboard-loading">Рейтинг пуст</div>';
        return;
    }
    
    // Создаем HTML для списка
    let html = '';
    
    data.forEach((player, index) => {
        // Определяем класс для ранга (топ-3 получают особый цвет)
        const rankClass = index < 3 ? `rank-${index + 1}` : '';
        
        // Генерируем аватар на основе ID игрока
        const avatarUrl = `https://i.pravatar.cc/150?img=${(player.id % 70) || 1}`;
        
        html += `
            <div class="leaderboard-item ${player.isMe ? 'leaderboard-me' : ''}">
                <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                <div class="leaderboard-avatar" style="background-image: url('${avatarUrl}')"></div>
                <div class="leaderboard-user-info">
                    <div class="leaderboard-username">${player.username}</div>
                    <div class="leaderboard-level">Уровень: ${player.level}</div>
                </div>
                <div class="leaderboard-score">
                    <div class="leaderboard-score-value">${player.score.toLocaleString()}</div>
                    <div class="leaderboard-score-label">бананов</div>
                </div>
            </div>
        `;
    });
    
    // Обновляем содержимое списка
    leaderboardList.innerHTML = html;
    
    // Обновляем время последнего обновления
    const leaderboardInfo = document.querySelector('.leaderboard-info p');
    if (leaderboardInfo && window.leaderboardData.lastUpdate) {
        const date = new Date(window.leaderboardData.lastUpdate);
        leaderboardInfo.textContent = `Обновлено: ${date.toLocaleTimeString()}`;
    }
}

// Функция для обновления данных пользователя в таблице лидеров
function updateLeaderboardUserData() {
    if (!window.leaderboardData) return;
    
    // Находим пользователя в глобальном рейтинге
    const globalUser = window.leaderboardData.global.find(player => player.isMe);
    if (globalUser) {
        globalUser.level = gameState.level || 1;
        globalUser.score = gameState.totalBananas || 0;
    }
    
    // Находим пользователя в рейтинге друзей
    const friendsUser = window.leaderboardData.friends.find(player => player.isMe);
    if (friendsUser) {
        friendsUser.level = gameState.level || 1;
        friendsUser.score = gameState.totalBananas || 0;
    }
    
    // Пересортируем рейтинги
    if (window.leaderboardData.global) {
        window.leaderboardData.global.sort((a, b) => b.score - a.score);
    }
    
    if (window.leaderboardData.friends) {
        window.leaderboardData.friends.sort((a, b) => b.score - a.score);
    }
    
    // Обновляем отображение, если открыт рейтинг
    const leaderboardTabContent = document.getElementById('leaderboard-tab-content');
    if (leaderboardTabContent && leaderboardTabContent.classList.contains('active')) {
        renderLeaderboard(document.querySelector('.leaderboard-filter-btn.active')?.getAttribute('data-filter') || 'global');
    }
}

// ========== УЛУЧШЕНИЕ ИНТЕГРАЦИИ С TELEGRAM ==========

// Улучшенная интеграция с Telegram WebApp
function initTelegramIntegration() {
    console.log("Инициализация интеграции с Telegram");
    
    // Переменная для хранения экземпляра WebApp
    let tg = null;
    
    // Проверяем доступность Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        
        // Сообщаем Telegram, что приложение готово
        tg.ready();
        
        // Расширяем на весь экран
        tg.expand();
        
        // Устанавливаем тему в соответствии с темой Telegram
        const theme = tg.colorScheme || 'light';
        document.documentElement.classList.toggle('dark-theme', theme === 'dark');
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            console.log("Получены данные пользователя из Telegram:", user.first_name);
            
            // Сохраняем ID пользователя для использования в игре
            if (!gameState.userId) {
                gameState.userId = user.id;
            }
            
            // Обновляем имя пользователя в профиле
            const userNameElement = document.getElementById('user-name');
            if (userNameElement && user.first_name) {
                userNameElement.textContent = user.first_name;
            }
        }
        
        // Подписываемся на события смены темы
        tg.onEvent('themeChanged', () => {
            const newTheme = tg.colorScheme;
            document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
            console.log("Тема изменена на:", newTheme);
        });
        
        // Подписываемся на событие сворачивания приложения
        tg.onEvent('viewportChanged', () => {
            // Сохраняем данные при сворачивании
            if (!tg.isExpanded) {
                saveGameState();
            }
        });
        
        // Сохраняем ссылку на WebApp для использования в других функциях
        window.tg = tg;
        
        console.log("Интеграция с Telegram WebApp успешно инициализирована");
    } else {
        console.warn("Telegram WebApp недоступен, используем режим отладки");
        initDebugMode();
    }
}

// Режим отладки для работы вне Telegram
function initDebugMode() {
    console.log("Включен режим отладки (вне Telegram)");
    
    // Создаем имитацию пользователя
    const debugUser = {
        id: 12345678,
        first_name: "Тестовый",
        last_name: "Пользователь",
        username: "test_user"
    };
    
    // Сохраняем ID для использования в игре
    if (!gameState.userId) {
        gameState.userId = debugUser.id;
    }
    
    // Обновляем имя пользователя в профиле
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = debugUser.first_name;
    }
    
    // Создаем кнопку переключения темы для тестирования
    const themeButton = document.createElement('button');
    themeButton.textContent = 'Сменить тему';
    themeButton.style.position = 'fixed';
    themeButton.style.bottom = '120px';
    themeButton.style.right = '20px';
    themeButton.style.zIndex = 1000;
    themeButton.style.padding = '10px';
    themeButton.style.backgroundColor = '#007bff';
    themeButton.style.color = 'white';
    themeButton.style.border = 'none';
    themeButton.style.borderRadius = '5px';
    themeButton.style.cursor = 'pointer';
    
    themeButton.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-theme');
    });
    
    document.body.appendChild(themeButton);
}

// Функция для приглашения друзей через Telegram
function inviteFriend() {
    console.log("Приглашение друга");
    
    // Подготавливаем текст для приглашения
    const inviteText = "🍌 Присоединяйся ко мне в игре Minions! Собирай бананы, открывай боксы и развивай свою ферму миньонов!";
    
    // Подготавливаем реферальную ссылку
    const userId = gameState.userId || 'anonymous';
    const refLink = `https://t.me/minions_game_bot?start=ref_${userId}`;
    
    // Проверяем доступность Telegram WebApp
    if (window.tg) {
        try {
            // Используем API Telegram для отправки приглашения
            if (window.tg.showPopup) {
                window.tg.showPopup({
                    title: 'Пригласить друга',
                    message: 'Поделитесь этой ссылкой с друзьями:',
                    buttons: [
                        { type: 'close' }
                    ]
                });
            }
            
            // Копируем ссылку в буфер обмена
            if (window.tg.clipboard) {
                window.tg.clipboard.setText(`${inviteText} ${refLink}`);
                showPopup('Ссылка скопирована в буфер обмена');
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(`${inviteText} ${refLink}`)
                    .then(() => showPopup('Ссылка скопирована в буфер обмена'))
                    .catch(err => console.error('Ошибка копирования:', err));
            }
            
            // Если доступно, используем функцию shareUrl
            if (typeof window.tg.shareUrl === 'function') {
                window.tg.shareUrl(`${refLink}`);
            }
            
            // Увеличиваем счетчик приглашений
            gameState.invitedFriends = (gameState.invitedFriends || 0) + 1;
            
            // Проверяем прогресс задания
            if (gameState.invitedFriends >= 10 && gameState.taskProgress.task1 < 1) {
                gameState.taskProgress.task1 = 1;
                setTimeout(() => {
                    completeTask(1);
                }, 1000);
            } else {
                // Обновляем прогресс задания
                updateTaskProgress();
            }
            
            // Обновляем статистику и сохраняем
            updateStats();
            saveGameState();
            
            return true;
        } catch (e) {
            console.error('Ошибка при приглашении друга через Telegram:', e);
        }
    }
    
    // Запасной вариант, если Telegram недоступен
    // Показываем диалог со ссылкой
    const message = `Скопируйте и отправьте эту ссылку друзьям:\n\n${inviteText}\n\n${refLink}`;
    alert(message);
    
    // Пытаемся скопировать ссылку в буфер обмена
    try {
        navigator.clipboard.writeText(`${inviteText}\n\n${refLink}`)
            .then(() => showPopup('Ссылка скопирована в буфер обмена'))
            .catch(err => console.error('Ошибка копирования:', err));
    
        // Увеличиваем счетчик приглашений
        gameState.invitedFriends = (gameState.invitedFriends || 0) + 1;
        
        // Обновляем прогресс задания
        updateTaskProgress();
        
        // Обновляем статистику и сохраняем
        updateStats();
        saveGameState();
        
        return true;
    } catch (e) {
        console.error('Ошибка при копировании ссылки:', e);
        return false;
    }
}

// ========== ОБЩИЕ ИСПРАВЛЕНИЯ И ИНТЕГРАЦИЯ ==========

// Запуск всех инициализаций в правильном порядке
function initGame() {
    console.log("Инициализация игры");
    
    // Скрываем экран загрузки
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        // Делаем анимированный индикатор загрузки
        showLoadingProgress(0);
    }
    
    try {
        // Инициализация интеграции с Telegram
        initTelegramIntegration();
        showLoadingProgress(10);
        
        // Загрузка настроек
        if (typeof loadSettings === 'function') {
            loadSettings();
        }
        showLoadingProgress(20);
        
        // Загрузка прогресса игры
        loadGameState();
        showLoadingProgress(30);
        
        // Инициализация системы сохранения
        initSaveSystem();
        showLoadingProgress(40);
        
        // Инициализация пользовательского интерфейса
        if (typeof initializeUI === 'function') {
            initializeUI();
        }
        showLoadingProgress(50);
        
        // Инициализация профиля
        initProfile();
        showLoadingProgress(60);
        
        // Инициализация заданий
        initTasks();
        showLoadingProgress(70);
        
        // Инициализация боксов
        initBoxHandlers();
        showLoadingProgress(80);
        
        // Инициализация таблицы лидеров
        initLeaderboard();
        showLoadingProgress(90);
        
        // Завершение инициализации
        finalizeInitialization();
        showLoadingProgress(100);
        
        console.log("Игра успешно инициализирована");
        
        // Скрываем экран загрузки через небольшую задержку
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    
                    // Показываем главный экран
                    showSection('
