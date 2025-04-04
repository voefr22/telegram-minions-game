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
