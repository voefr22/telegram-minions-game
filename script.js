// Инициализация Telegram WebApp
let tg = window.Telegram.WebApp;
tg.expand();

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
    achievements: ['Начинающий миньоновод'],
    taskProgress: {
        task1: 0, // Приглашение друзей
        task2: 0, // Открытие премиум-кейса
        task3: 0, // Кормление миньонов
        task4: 0  // Сбор бананов
    }
};

// Загрузка данных из localStorage
function loadGameState() {
    const savedState = localStorage.getItem('minionsGameState');
    if (savedState) {
        try {
            const parsed = JSON.parse(savedState);
            gameState = {...gameState, ...parsed};
            
            // Проверка на ежедневный вход
            checkDailyLogin();
        } catch (e) {
            console.error('Ошибка при загрузке сохраненных данных:', e);
        }
    }
}

// Сохранение данных в localStorage
function saveGameState() {
    localStorage.setItem('minionsGameState', JSON.stringify(gameState));
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
    
    // Показываем анимацию и оповещение
    document.getElementById('reward-animation').innerHTML = '🎁';
    showPopup(`Ежедневная награда: +${bananaReward} бананов, +${starReward} звезд!`);
    
    // Создаем эффект конфетти
    createConfetti();
    
    // Обновляем статистику
    updateStats();
    saveGameState();
}

// Инициализация
function init() {
    // Загружаем состояние игры
    loadGameState();
    
    // Устанавливаем имя пользователя
    document.getElementById('user-name').textContent = tg.initDataUnsafe?.user?.username || 'Игрок';
    
    // Обновляем статистику
    updateStats();
    
    // Обновляем прогресс заданий
    updateTaskProgress();
    
    // Скрываем экран загрузки с анимацией
    setTimeout(function() {
        document.getElementById('splash-screen').style.opacity = 0;
        setTimeout(function() {
            document.getElementById('splash-screen').style.display = 'none';
        }, 500);
    }, 1500);
    
    // Добавляем обработчик для ежедневной награды
    document.getElementById('daily-reward-btn').addEventListener('click', claimDailyReward);
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
    checkTaskProgress();
}

// Обновление прогресса заданий
function updateTaskProgress() {
    // Задание 1: Пригласи 10 друзей
    document.getElementById('task1-counter').textContent = `${gameState.taskProgress.task1}/10`;
    document.getElementById('task1-progress').style.width = `${(gameState.taskProgress.task1 / 10) * 100}%`;
    
    // Задание 2: Открой премиум-кейс
    document.getElementById('task2-counter').textContent = `${gameState.taskProgress.task2}/1`;
    document.getElementById('task2-progress').style.width = `${gameState.taskProgress.task2 * 100}%`;
    
    // Задание 3: Накорми 5 миньонов
    document.getElementById('task3-counter').textContent = `${gameState.taskProgress.task3}/5`;
    document.getElementById('task3-progress').style.width = `${(gameState.taskProgress.task3 / 5) * 100}%`;
    
    // Задание 4: Собери 30 бананов
    document.getElementById('task4-counter').textContent = `${Math.min(gameState.totalBananas, 30)}/30`;
    document.getElementById('task4-progress').style.width = `${Math.min((gameState.totalBananas / 30) * 100, 100)}%`;
}

// Показать секцию
function showSection(sectionId) {
    // Скрываем все секции
    document.getElementById('tasks-section').classList.add('hidden-section');
    document.getElementById('tasks-section').classList.remove('active-section');
    
    document.getElementById('boxes-section').classList.add('hidden-section');
    document.getElementById('boxes-section').classList.remove('active-section');
    
    document.getElementById('friends-section').classList.add('hidden-section');
    document.getElementById('friends-section').classList.remove('active-section');
    
    document.getElementById('profile-section').classList.add('hidden-section');
    document.getElementById('profile-section').classList.remove('active-section');
    
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
        return item.getAttribute('onclick').includes(sectionId);
    });
    
    if (clickedButton) {
        clickedButton.classList.add('active');
    }
}

// Выполнение задания
function completeTask(taskId) {
    switch(taskId) {
        case 1: // Пригласи 10 друзей
            if (gameState.taskProgress.task1 < 10) {
                gameState.taskProgress.task1++;
                if (gameState.taskProgress.task1 === 10) {
                    gameState.bananas += 100;
                    gameState.totalBananas += 100;
                    gameState.completedTasks++;
                    showPopup('Задание выполнено! +100 бананов');
                } else {
                    showPopup('Прогресс задания: ' + gameState.taskProgress.task1 + '/10');
                }
            }
            break;
            
        case 2: // Открой премиум-кейс
            if (gameState.taskProgress.task2 < 1) {
                if (gameState.openedBoxes > 0) {
                    gameState.taskProgress.task2 = 1;
                    gameState.bananas += 50;
                    gameState.totalBananas += 50;
                    gameState.completedTasks++;
                    showPopup('Задание выполнено! +50 бананов');
                } else {
                    showPopup('Сначала нужно открыть премиум-кейс');
                }
            }
            break;
            
        case 3: // Накорми 5 миньонов
            if (gameState.taskProgress.task3 < 5) {
                gameState.taskProgress.task3++;
                if (gameState.taskProgress.task3 === 5) {
                    gameState.bananas += 20;
                    gameState.totalBananas += 20;
                    gameState.completedTasks++;
                    showPopup('Задание выполнено! +20 бананов');
                } else {
                    showPopup('Прогресс задания: ' + gameState.taskProgress.task3 + '/5');
                }
            }
            break;
            
        case 4: // Собери 30 бананов
            if (gameState.taskProgress.task4 < 1 && gameState.totalBananas >= 30) {
                gameState.taskProgress.task4 = 1;
                gameState.stars += 5;
                gameState.totalStars += 5;
                gameState.completedTasks++;
                showPopup('Задание выполнено! +5 звезд');
            } else if (gameState.totalBananas < 30) {
                showPopup('Прогресс задания: ' + gameState.totalBananas + '/30 бананов');
            }
            break;
    }
    
    updateStats();
    updateTaskProgress();
    saveGameState();
}

// Открытие бокса
function openBox(type) {
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
            completeTask(2);
        }
        
        showPopup(rewardText);
        createConfetti();
        updateStats();
        saveGameState();
    }
}

// Проверка выполнения заданий
function checkTaskProgress() {
    // Проверка задания на сбор 30 бананов
    if (gameState.totalBananas >= 30 && gameState.taskProgress.task4 === 0) {
        completeTask(4);
    }
}

// Приглашение друзей
function inviteFriends() {
    if (tg.initDataUnsafe?.user) {
        tg.shareGameScore();
    } else {
        // Имитация приглашения друга (в реальном приложении тут будет API Telegram)
        gameState.invitedFriends++;
        gameState.taskProgress.task1 = Math.min(gameState.taskProgress.task1 + 1, 10);
        
        // Добавляем друга в список
        addFriendToList('Друг ' + gameState.invitedFriends);
        
        // Проверяем выполнение задания
        if (gameState.taskProgress.task1 === 10) {
            completeTask(1);
        } else {
            updateTaskProgress();
            saveGameState();
        }
        
        showPopup('Друг приглашен! Прогресс: ' + gameState.taskProgress.task1 + '/10');
    }
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

// Обновление достижений
function updateAchievements() {
    let achievementsList = document.getElementById('achievements-list');
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

    // Проверка повышения уровня
    if (gameState.totalBananas >= gameState.level * 50 && gameState.totalStars >= gameState.level * 5) {
        gameState.level++;
        showPopup(`Поздравляем! Вы достигли уровня ${gameState.level}!`);
    }
}

// Показать уведомление о достижении
function showAchievementNotification(achievementName) {
    const notification = document.getElementById('achievement-notification');
    document.getElementById('achievement-text').textContent = achievementName;
    
    notification.style.display = 'block';
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

// Инициализация приложения при загрузке страницы
window.onload = init;
