updateTaskProgress() {
        try {
            // Задание 1: Пригласи 10 друзей
            this.updateTaskProgressUI(1, GameState.data.taskProgress.task1, 10);
            
            // Задание 2: Открой премиум-кейс
            this.updateTaskProgressUI(2, GameState.data.taskProgress.task2, 1);
            
            // Задание 3: Найми 3 миньона на ферме
            this.updateTaskProgressUI(3, Math.min(GameState.data.farm.minions, 3), 3);
            
            // Задание 4: Собери 30 бананов
            this.updateTaskProgressUI(4, Math.min(GameState.data.totalBananas, 30), 30);
            
            // Задание 5: Открой 5 боксов
            this.updateTaskProgressUI(5, Math.min(GameState.data.openedBoxes, 5), 5);
            
            // Задание 6: Достигни 3 уровня
            this.updateTaskProgressUI(6, Math.min(GameState.data.level, 3), 3);
            
            // Задание 7: Улучши эффективность фермы
            this.updateTaskProgressUI(7, Math.min(GameState.data.farm.upgrades.efficiency || 0, 1), 1);
            
            // Задание 8: Серия входов 5 дней подряд
            this.updateTaskProgressUI(8, Math.min(GameState.data.streak, 5), 5);
            
            // Задание 9: Собери 100 бананов
            this.updateTaskProgressUI(9, Math.min(GameState.data.totalBananas, 100), 100);
            
            // Задание 10: Найми 5 миньонов
            this.updateTaskProgressUI(10, Math.min(GameState.data.farm.minions, 5), 5);
        } catch (error) {
            console.error("Error updating task progress:", error);
        }
    },// Minions Game - Optimized Script
// This file contains the optimized version of the game code

// ===== GAME STATE MANAGEMENT =====
const GameState = {
    data: {
        bananas: 0,
        stars: 0,
        level: 1,
        exp: 0,
        totalBananas: 0,
        totalStars: 0,
        openedBoxes: 0,
        completedTasks: 0,
        invitedFriends: 0,
        activeDays: 1,
        streak: 0,
        lastReward: null,
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
        },
        petCount: 0,
        lastSaveTime: Date.now(),
        userId: null,
        // Обновляем UI фермы
        this.updateFarmUI();
        
        // Сохраняем состояние
        GameState.save();
    },
    
    collectBananas() {
        if (!GameState.data.farm || GameState.data.farm.bananasPending <= 0) {
            UI.showPopup('Нет бананов для сбора!');
            return;
        }
        
        // Округляем количество бананов до целого числа
        const bananasToCollect = Math.floor(GameState.data.farm.bananasPending);
        
        // Добавляем бананы игроку
        GameState.updateResource('bananas', bananasToCollect);
        
        // Сбрасываем счетчик накопленных бананов
        GameState.data.farm.bananasPending = 0;
        
        // Обновляем время последнего сбора
        GameState.data.farm.lastCollect = Date.now();
        
        // Обновляем UI и сохраняем состояние
        this.updateFarmUI();
        GameState.save();
        
        // Показываем уведомление
        UI.showPopup(`Собрано ${bananasToCollect} бананов!`);
        
        // Звуковой эффект и вибрация
        SoundManager.play('reward');
        VibrationManager.vibrate([100, 50, 100]);
    },
    
    buyUpgrade(type) {
        if (!GameState.data.farm) return;
        
        const upgradeCosts = {
            minion: [50, 65, 80, 95, 110, 125, 140, 155, 170, 185], // Стоимость миньонов увеличивается с каждым новым
            efficiency: [100, 200, 300, 400, 500], // Стоимость улучшения эффективности
            automation: [150, 300, 450, 600, 750], // Стоимость автоматизации (в бананах)
            boost: [200, 400, 600, 800, 1000] // Стоимость буста (в бананах)
        };
        
        // Для миньонов используем текущее количество как индекс
        const upgradeIndex = type === 'minion' ? GameState.data.farm.minions : 
                             (GameState.data.farm.upgrades[type] || 0);
        
        // Проверяем, не достигнут ли максимальный уровень
        if ((type !== 'minion' && upgradeIndex >= 5) || (type === 'minion' && upgradeIndex >= 10)) {
            UI.showPopup('Достигнут максимальный уровень улучшения!');
            return;
        }
        
        // Проверяем стоимость улучшения
        const costs = upgradeCosts[type];
        if (!costs || upgradeIndex >= costs.length) {
            console.error(`Invalid upgrade or level: ${type} - ${upgradeIndex}`);
            return;
        }
        
        const cost = costs[upgradeIndex];
        const currency = 'bananas';
        
        // Проверяем, хватает ли ресурсов
        if (GameState.data[currency] < cost) {
            UI.showPopup(`Недостаточно бананов! Нужно: ${cost}`);
            return;
        }
        
        // Списываем ресурсы
        GameState.data[currency] -= cost;
        
        // Применяем улучшение
        if (type === 'minion') {
            GameState.data.farm.minions++;
        } else {
            GameState.data.farm.upgrades[type]++;
        }
        
        // Обновляем эффекты улучшений
        switch(type) {
            case 'efficiency':
                GameState.data.farm.efficiency = 1 + (GameState.data.farm.upgrades.efficiency * 0.2);
                break;
            case 'automation':
                // Автоматический сбор на 1 час за каждый уровень
                GameState.data.farm.autoCollectUntil = Date.now() + (3600000 * GameState.data.farm.upgrades.automation);
                break;
            case 'boost':
                // Буст на 30 минут за каждый уровень
                GameState.data.farm.boostUntil = Date.now() + (1800000 * GameState.data.farm.upgrades.boost);
                break;
        }
        
        // Проверяем задания, связанные с фермой
        TaskManager.checkFarmTasks();
        
        // Обновляем UI и сохраняем состояние
        this.updateFarmUI();
        UI.updateStats();
        GameState.save();
        
        // Показываем уведомление
        UI.showPopup(`Улучшение "${type}" повышено до уровня ${type === 'minion' ? GameState.data.farm.minions : GameState.data.farm.upgrades[type]}!`);
        
        // Звуковой эффект и вибрация
        SoundManager.play('reward');
        VibrationManager.vibrate([100, 50, 100]);
    },
    
    updateFarmUI() {
        // Обновляем счетчики фермы
        if (UI.elements.farmMinionCount) {
            UI.elements.farmMinionCount.textContent = GameState.data.farm.minions;
        }
        
        if (UI.elements.farmBananasRate) {
            // Расчет текущей производительности в час
            let productionRate = GameState.data.farm.minions * GameState.data.farm.efficiency;
            if (Date.now() < GameState.data.farm.boostUntil) {
                productionRate *= 2;
            }
            UI.elements.farmBananasRate.textContent = productionRate.toFixed(1);
        }
        
        if (UI.elements.farmLastCollect) {
            const lastCollect = new Date(GameState.data.farm.lastCollect);
            UI.elements.farmLastCollect.textContent = lastCollect.toLocaleTimeString();
        }
        
        // Обновляем контейнер с миньонами
        if (UI.elements.farmMinionsContainer) {
            UI.elements.farmMinionsContainer.innerHTML = '';
            
            for (let i = 0; i < GameState.data.farm.minions; i++) {
                const minionElement = document.createElement('div');
                minionElement.className = 'farm-minion';
                UI.elements.farmMinionsContainer.appendChild(minionElement);
            }
        }
        
        // Обновляем состояние кнопки сбора
        if (UI.elements.farmCollectBtn) {
            const canCollect = GameState.data.farm.bananasPending > 0;
            UI.elements.farmCollectBtn.disabled = !canCollect;
            if (canCollect) {
                const pendingBananas = Math.floor(GameState.data.farm.bananasPending);
                UI.elements.farmCollectBtn.textContent = `Собрать бананы (${pendingBananas})`;
            } else {
                UI.elements.farmCollectBtn.textContent = 'Собрать бананы';
            }
        }
        
        // Обновляем статус улучшений
        document.querySelectorAll('.upgrade-btn').forEach(button => {
            const upgradeType = button.getAttribute('data-type');
            if (!upgradeType) return;
            
            const upgradeLevel = upgradeType === 'minion' ? 
                GameState.data.farm.minions : 
                (GameState.data.farm.upgrades[upgradeType] || 0);
            
            const upgradeParent = button.closest('.upgrade-item');
            if (upgradeParent) {
                if (upgradeType === 'automation' || upgradeType === 'boost') {
                    const timeLeft = upgradeType === 'automation' ? 
                        GameState.data.farm.autoCollectUntil - Date.now() : 
                        GameState.data.farm.boostUntil - Date.now();
                    
                    if (timeLeft > 0) {
                        // Если буст активен, показываем сколько времени осталось
                        const minutesLeft = Math.ceil(timeLeft / 60000);
                        const upgradeDescription = upgradeParent.querySelector('.upgrade-description');
                        if (upgradeDescription) {
                            upgradeDescription.textContent = `Активно еще ${minutesLeft} мин.`;
                        }
                        upgradeParent.classList.add('boost-active');
                    } else {
                        upgradeParent.classList.remove('boost-active');
                    }
                }
            }
        });
    },
    
    startAutoCollectTimer() {
        // Запускаем периодическое обновление фермы
        setInterval(() => {
            this.updateFarm();
        }, 60000); // Каждую минуту
    }
};

// ===== SOUND AND VIBRATION MANAGEMENT =====
const SoundManager = {
    sounds: {
        click: new Audio('https://cdn.freesound.org/previews/220/220206_4100637-lq.mp3'),
        reward: new Audio('https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3'),
        task: new Audio('https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3'),
        box: new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'),
        box_shake: new Audio('https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3'),
        achievement: new Audio('https://cdn.freesound.org/previews/320/320775_1661766-lq.mp3'),
        levelUp: new Audio('https://cdn.freesound.org/previews/522/522616_2336793-lq.mp3'),
        minionHappy: new Audio('https://cdn.freesound.org/previews/539/539050_12274768-lq.mp3'),
        minionJump: new Audio('https://cdn.freesound.org/previews/444/444921_9159316-lq.mp3'),
        minionShocked: new Audio('https://cdn.freesound.org/previews/554/554056_8164871-lq.mp3')
    },
    
    play(soundName) {
        if (!SettingsManager.data.soundEnabled) return;
        
        if (this.sounds[soundName]) {
            try {
                this.sounds[soundName].currentTime = 0;
                this.sounds[soundName].play().catch(e => console.warn('Sound play error:', e));
            } catch (e) {
                console.warn('Error playing sound:', e);
            }
        }
    }
};

const VibrationManager = {
    vibrate(pattern) {
        if (!SettingsManager.data.vibrationEnabled) return;
        
        try {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
                return true;
            }
        } catch (e) {
            console.warn('Vibration not supported:', e);
        }
        return false;
    }
};

// ===== SOCIAL MANAGER =====
const SocialManager = {
    inviteFriend() {
        console.log("Inviting friend");
        
        try {
            const inviteText = `🍌 Присоединяйся ко мне в игре Minions! Собирай бананы, открывай боксы и развивай свою ферму миньонов!`;
            
            // Используем Telegram для приглашения друзей
            if (TelegramManager.shareGame(inviteText)) {
                // Увеличиваем счетчик приглашенных друзей
                GameState.data.invitedFriends++;
                
                // Обновляем прогресс задания
                GameState.data.taskProgress.task1 = Math.min(10, GameState.data.invitedFriends);
                TaskManager.updateTaskProgress();
                
                // Проверяем выполнение задания
                if (GameState.data.invitedFriends >= 10 && GameState.data.taskProgress.task1 < 10) {
                    TaskManager.completeTask(1);
                }
                
                // Обновляем статистику и сохраняем
                UI.updateStats();
                GameState.save();
                
                // Награда за приглашение
                if (GameState.data.invitedFriends % 3 === 0) {
                    // Каждые 3 приглашения даем дополнительную награду
                    GameState.updateResource('bananas', 30);
                    
                    UI.showPopup('Бонус за приглашения: +30 бананов!');
                    SoundManager.play('achievement');
                    VibrationManager.vibrate([100, 50, 100, 50, 100]);
                }
                
                return true;
            } else {
                UI.showPopup('Не удалось пригласить друга');
                return false;
            }
        } catch (e) {
            console.error('Error inviting friend:', e);
            UI.showPopup('Ошибка при приглашении друга');
            return false;
        }
    }
};

// ===== TELEGRAM INTEGRATION =====
const TelegramManager = {
    tg: null,
    isReady: false,
    
    init() {
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            
            // Tell Telegram the app is ready
            this.tg.ready();
            
            // Expand to full screen
            this.tg.expand();
            
            // Set theme based on Telegram theme
            const theme = this.tg.colorScheme || 'light';
            document.documentElement.classList.toggle('dark-theme', theme === 'dark');
            
            // Get user data
            const user = this.tg.initDataUnsafe?.user;
            if (user) {
                console.log("User data received from Telegram:", user.first_name);
                
                // Сохраняем ID пользователя
                if (!GameState.data.userId) {
                    GameState.data.userId = user.id;
                    GameState.save();
                }
            }
            
            // Subscribe to theme change events
            this.tg.onEvent('themeChanged', () => {
                const newTheme = this.tg.colorScheme;
                document.documentElement.classList.toggle('dark-theme', newTheme === 'dark');
                console.log("Theme changed to:", newTheme);
            });
            
            // Subscribe to viewport change events
            this.tg.onEvent('viewportChanged', () => {
                // Save data when app is minimized
                if (!this.tg.isExpanded) {
                    GameState.save();
                }
            });
            
            this.isReady = true;
            console.log("Telegram WebApp integration initialized successfully");
            return true;
        } else {
            console.warn("Telegram WebApp not available, using debug mode");
            this.setupDebugMode();
            return false;
        }
    },
    
    setupDebugMode() {
        console.log("Setting up debug mode");
        
        // Создаем имитацию пользователя для тестирования
        window.tg = {
            ready: () => console.log("Debug: Telegram ready"),
            expand: () => console.log("Debug: Telegram expand"),
            colorScheme: 'light',
            initDataUnsafe: {
                user: {
                    id: 12345678,
                    first_name: "Тестовый",
                    last_name: "Пользователь",
                    username: "test_user",
                    language_code: "ru"
                }
            },
            onEvent: (event, callback) => console.log(`Debug: Telegram event ${event} registered`),
            showAlert: (message) => alert(message),
            shareGame: (options) => {
                alert(`Debug: Share game: ${options.text}`);
                return true;
            },
            share: (options) => {
                alert(`Debug: Share: ${options.text}`);
                return true;
            },
            clipboard: {
                setText: (text) => {
                    navigator.clipboard.writeText(text).catch(e => console.error('Clipboard error:', e));
                    return true;
                }
            }
        };
        
        // При запуске в отладочном режиме устанавливаем ID пользователя
        if (!GameState.data.userId) {
            GameState.data.userId = 12345678;
            GameState.save();
        }
        
        this.tg = window.tg;
        this.isReady = true;
        
        // Add theme switcher for testing
        this.addDebugThemeSwitcher();
    },
    
    addDebugThemeSwitcher() {
        const themeSwitcher = document.createElement('button');
        themeSwitcher.textContent = 'Сменить тему';
        themeSwitcher.style.cssText = 'position:fixed;bottom:80px;right:10px;z-index:9999;padding:8px;background:#333;color:#fff;border:none;border-radius:5px;';
        
        themeSwitcher.addEventListener('click', () => {
            if (this.tg.colorScheme === 'dark') {
                this.tg.colorScheme = 'light';
            } else {
                this.tg.colorScheme = 'dark';
            }
            document.documentElement.classList.toggle('dark-theme', this.tg.colorScheme === 'dark');
        });
        
        document.body.appendChild(themeSwitcher);
    },
    
    getUserName() {
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
            const user = this.tg.initDataUnsafe.user;
            return user.first_name || user.username || 'Игрок';
        }
        return 'Игрок';
    },
    
    getUserAvatar() {
        // Telegram WebApp API не предоставляет доступа к аватарам пользователей
        // Можно использовать ID пользователя для генерации псевдо-случайного аватара
        if (this.tg && this.tg.initDataUnsafe && this.tg.initDataUnsafe.user && this.tg.initDataUnsafe.user.id) {
            const userId = this.tg.initDataUnsafe.user.id;
            return `https://i.pravatar.cc/300?img=${userId % 70}`;
        }
        return null;
    },
    
    showAlert(message) {
        if (this.tg && this.tg.showAlert) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    },
    
    shareGame(text) {
        if (!this.tg) return false;
        
        const userId = GameState.data.userId || 'share';
        const refLink = `https://t.me/minions_game_bot?start=ref_${userId}`;
        
        if (this.tg.shareGame) {
            this.tg.shareGame({
                text: text,
                url: refLink
            });
            return true;
        } else if (this.tg.share) {
            this.tg.share({
                text: text,
                url: refLink
            });
            return true;
        } else {
            this.showAlert('Ссылка скопирована в буфер обмена. Поделитесь ею с друзьями!');
            
            const shareText = `${text} ${refLink}`;
            
            if (this.tg.clipboard && this.tg.clipboard.setText) {
                this.tg.clipboard.setText(shareText);
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(shareText).catch(e => 
                    console.error('Не удалось скопировать текст:', e)
                );
            }
            return true;
        }
    }
};

// ===== LEADERBOARD MANAGER =====
const LeaderboardManager = {
    data: {
        global: [],
        friends: [],
        lastUpdate: null
    },
    
    init() {
        this.initLeaderboardTabs();
        this.fetchLeaderboardData();
    },
    
    initLeaderboardTabs() {
        // Инициализация табов внутри раздела друзей
        const tabs = document.querySelectorAll('.friends-tab');
        const contents = document.querySelectorAll('.friends-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Удаляем активный класс у всех табов
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                
                // Добавляем активный класс текущему табу
                this.classList.add('active');
                
                // Отображаем соответствующий контент
                const tabName = this.getAttribute('data-tab');
                document.getElementById(tabName + '-tab-content').classList.add('active');
                
                // Если переключились на таб лидеров, обновляем данные
                if (tabName === 'leaderboard') {
                    LeaderboardManager.fetchLeaderboardData();
                }
                
                // Звук клика
                SoundManager.play('click');
                VibrationManager.vibrate(30);
            });
        });
        
        // Инициализация фильтров в рейтинге
        document.querySelectorAll('.leaderboard-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Удаляем активный класс у всех кнопок фильтра
                document.querySelectorAll('.leaderboard-filter-btn').forEach(b => b.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');
                
                // Применяем фильтр
                const filter = this.getAttribute('data-filter');
                LeaderboardManager.renderLeaderboard(filter);
                
                // Звук клика
                SoundManager.play('click');
                VibrationManager.vibrate(30);
            });
        });
        
        // Обработчик нажатия на кнопку обновления
        const refreshBtn = document.getElementById('refresh-leaderboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                LeaderboardManager.fetchLeaderboardData(true);
                SoundManager.play('click');
                VibrationManager.vibrate([30, 50, 30]);
            });
        }
    },
    
    async fetchLeaderboardData(forceUpdate = false) {
        // Check if we need to update
        if (!forceUpdate && this.data.lastUpdate && Date.now() - this.data.lastUpdate < 5 * 60 * 1000) {
            return this.data;
        }
        
        // Отображаем индикатор загрузки
        const leaderboardList = document.querySelector('.leaderboard-list');
        if (leaderboardList) {
            leaderboardList.innerHTML = '<div class="leaderboard-loading">Загрузка рейтинга...</div>';
        }
        
        try {
            // Try to get data from TagManager if available
            if (window.TagManager && window.TagManager.leaderboard && 
                typeof window.TagManager.leaderboard.requestLeaderboardData === 'function') {
                window.TagManager.leaderboard.requestLeaderboardData();
                
                // Set a timeout in case data doesn't come
                setTimeout(() => {
                    if (!this.data.lastUpdate || this.data.lastUpdate < Date.now() - 10000) {
                        this.data = this.generateLeaderboardData();
                        this.renderLeaderboard();
                    }
                }, 3000);
                
                return;
            }
            
            // If TagManager is not available, generate test data
            this.data = this.generateLeaderboardData();
            this.renderLeaderboard();
            
            return this.data;
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
            
            // In case of error, generate test data
            this.data = this.generateLeaderboardData();
            this.renderLeaderboard();
            
            return this.data;
        }
    },
    
    generateLeaderboardData() {
        const currentUserId = GameState.data.userId || 'anonymous';
        const currentUserName = TelegramManager.getUserName() || 'Игрок';
        
        // Generate global leaderboard
        const globalLeaderboard = [];
        
        // Add current user
        globalLeaderboard.push({
            id: currentUserId,
            username: currentUserName,
            level: GameState.data.level || 1,
            score: GameState.data.totalBananas || 0,
            isMe: true
        });
        
        // Add random players
        for (let i = 0; i < 20; i++) {
            globalLeaderboard.push({
                id: 1000 + i,
                username: i === 0 ? 'MinionsKing' : i === 1 ? 'BananaHunter' : `Player${1000 + i}`,
                level: Math.floor(Math.random() * 10) + 10,
                score: Math.floor(Math.random() * 50000) + 10000,
                avatar: `https://i.pravatar.cc/150?img=${i+10}`,
                isMe: false
            });
        }
        
        // Sort by score
        globalLeaderboard.sort((a, b) => b.score - a.score);
        
        // Generate friends leaderboard
        const friendsLeaderboard = [
            {
                id: currentUserId,
                username: currentUserName,
                level: GameState.data.level || 1,
                score: GameState.data.totalBananas || 0,
                isMe: true
            }
        ];
        
        // Add some random friends
        for (let i = 0; i < 5; i++) {
            const randomIndex = Math.floor(Math.random() * 10);
            const friend = { ...globalLeaderboard[randomIndex], isMe: false };
            friendsLeaderboard.push(friend);
        }
        
        // Sort friends by score
        friendsLeaderboard.sort((a, b) => b.score - a.score);
        
        return {
            global: globalLeaderboard,
            friends: friendsLeaderboard,
            lastUpdate: Date.now()
        };
    },
    
    renderLeaderboard(filter = 'global') {
        const leaderboardList = document.querySelector('.leaderboard-list');
        if (!leaderboardList) return;
        
        // Clear current list
        leaderboardList.innerHTML = '';
        
        // Get data based on filter
        const data = filter === 'friends' ? this.data.friends : this.data.global;
        
        if (!data || data.length === 0) {
            leaderboardList.innerHTML = `<div class="leaderboard-loading">Рейтинг ${filter === 'global' ? 'глобальный' : 'друзей'} пуст</div>`;
            return;
        }
        
        // Create HTML for each player
        let html = '';
        
        data.forEach((item, index) => {
            const rankClass = index < 3 ? `rank-${index + 1}` : '';
            const isMe = item.isMe;
            
            html += `
                <div class="leaderboard-item ${isMe ? 'leaderboard-me' : ''}">
                    <div class="leaderboard-rank ${rankClass}">${index + 1}</div>
                    <div class="leaderboard-avatar" style="background-image: url('${item.avatar || `https://i.pravatar.cc/150?img=${(item.id % 70) || 1}`}')"></div>
                    <div class="leaderboard-user-info">
                        <div class="leaderboard-username">${item.username}</div>
                        <div class="leaderboard-level">Уровень: ${item.level}</div>
                    </div>
                    <div class="leaderboard-score">
                        <div class="leaderboard-score-value">${item.score.toLocaleString()}</div>
                        <div class="leaderboard-score-label">бананов</div>
                    </div>
                </div>
            `;
        });
        
        leaderboardList.innerHTML = html;
        
        // Update last update time
        const leaderboardInfo = document.querySelector('.leaderboard-info p');
        if (leaderboardInfo && this.data.lastUpdate) {
            const date = new Date(this.data.lastUpdate);
            leaderboardInfo.textContent = `Обновлено: ${date.toLocaleTimeString()}`;
        }
    }
};

// ===== UTILITY FUNCTIONS =====

// Функция из economy.js для расчета опыта для следующего уровня
function getExpForNextLevel(currentLevel) {
    return Math.floor(100 * Math.pow(1.5, currentLevel - 1));
}

// Функция из economy.js для расчета награды за уровень
function calculateLevelReward(level) {
    const bananas = level * 10;
    
    return { bananas };
}

// ===== INITIALIZATION =====
async function initGame() {
    console.log("Initializing Minions Game");
    
    try {
        // Показываем прогресс загрузки
        updateLoadingProgress(10, "Загрузка настроек...");
        
        // Инициализируем настройки
        SettingsManager.load();
        
        updateLoadingProgress(20, "Загрузка данных игры...");
        
        // Инициализируем Telegram
        TelegramManager.init();
        
        updateLoadingProgress(30, "Загрузка прогресса...");
        
        // Загруж Данные фермы
        farm: {
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
        },
        // Бусты игрока
        boosts: {}
    },
    
    load() {
        try {
            const savedState = localStorage.getItem('minionsGameState');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.data = {...this.data, ...parsed};
                console.log("Game state loaded from localStorage");
                
                // Проверяем, созданы ли объекты, если нет - инициализируем их
                if (!this.data.farm) {
                    this.data.farm = {
                        minions: 0,
                        efficiency: 1,
                        lastCollect: Date.now(),
                        bananasPending: 0,
                        boostUntil: 0,
                        autoCollectUntil: 0,
                        upgrades: {
                            efficiency: 0,
                            automation: 0,
                            boost: 0
                        }
                    };
                }
                
                if (!this.data.taskProgress) {
                    this.data.taskProgress = {
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
                    };
                }
                
                if (!this.data.achievements) {
                    this.data.achievements = ['Начинающий миньоновод'];
                }
                
                return true;
            }
        } catch (e) {
            console.error('Error loading game state:', e);
            
            // Попытка загрузить бэкап
            try {
                const backupState = localStorage.getItem('minionsGameState_backup');
                if (backupState) {
                    const parsed = JSON.parse(backupState);
                    this.data = {...this.data, ...parsed};
                    console.log("Game state loaded from backup");
                    return true;
                }
            } catch (backupError) {
                console.error('Error loading backup state:', backupError);
            }
        }
        return false;
    },
    
    save() {
        try {
            this.data.lastSaveTime = Date.now();
            localStorage.setItem('minionsGameState', JSON.stringify(this.data));
            
            // Сохраняем бэкап с ключевыми данными
            const backupData = {
                bananas: this.data.bananas,
                stars: this.data.stars,
                level: this.data.level,
                totalBananas: this.data.totalBananas,
                totalStars: this.data.totalStars,
                lastSaveTime: this.data.lastSaveTime
            };
            localStorage.setItem('minionsGameState_backup', JSON.stringify(backupData));
            
            console.log("Game state saved to localStorage");
            
            // Sync with server if needed
            if (SettingsManager.data.serverSync && 
                (Date.now() - this.data.lastSaveTime > 5 * 60 * 1000)) {
                this.syncWithServer();
            }
            return true;
        } catch (e) {
            console.error('Error saving game state:', e);
        }
        return false;
    },
    
    async syncWithServer() {
        if (!SettingsManager.data.serverSync || !this.data.userId) return false;
        
        console.log("Syncing with server...");
        
        try {
            if (TagManager && TagManager.sendDataToBot) {
                TagManager.sendDataToBot({
                    action: "save_progress",
                    userId: this.data.userId,
                    gameData: {
                        level: this.data.level,
                        bananas: this.data.totalBananas,
                        stars: this.data.totalStars
                    }
                });
                return true;
            }
        } catch (e) {
            console.error("Error syncing with server:", e);
        }
        
        return false;
    },
    
    updateResource(type, amount) {
        if (type === 'bananas') {
            this.data.bananas += amount;
            if (amount > 0) this.data.totalBananas += amount;
        }
        this.save();
        UI.updateStats();
        
        // Проверяем выполнение заданий на сбор ресурсов
        this.checkResourceTasks();
        
        return true;
    },
    
    checkResourceTasks() {
        // Задание 4: Собери 30 бананов
        if (this.data.totalBananas >= 30 && this.data.taskProgress.task4 < 1) {
            this.data.taskProgress.task4 = 1;
            TaskManager.completeTask(4);
        }
        
        // Задание 9: Собери 100 бананов
        if (this.data.totalBananas >= 100 && this.data.taskProgress.task9 < 1) {
            this.data.taskProgress.task9 = 1;
            TaskManager.completeTask(9);
        }
    },
    
    checkDailyLogin() {
        const today = new Date().toDateString();
        
        if (this.data.lastReward !== today) {
            // Update streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (this.data.lastReward === yesterdayString) {
                this.data.streak++;
                
                // Проверяем задание на серию входов
                if (this.data.streak >= 5 && this.data.taskProgress.task8 < 1) {
                    this.data.taskProgress.task8 = 1;
                    TaskManager.completeTask(8);
                }
            } else if (this.data.lastReward) {
                this.data.streak = 1; // Сбрасываем, но учитываем текущий день
            } else {
                this.data.streak = 1; // Первый вход
            }
            
            this.data.activeDays++;
            this.save();
            
            // Show daily reward
            UI.showDailyReward();
            return true;
        }
        return false;
    },
    
    claimDailyReward() {
        const today = new Date().toDateString();
        
        if (this.data.lastReward === today) {
            return false; // Already claimed today
        }
        
        // Calculate rewards based on streak
        const bananaReward = 5 + (this.data.streak * 2);
        
        // Add rewards
        this.updateResource('bananas', bananaReward);
        
        // Update last reward date
        this.data.lastReward = today;
        this.save();
        
        // Show reward animation
        UI.showRewardAnimation(bananaReward);
        
        return true;
    },
    
    addExperience(amount) {
        try {
            // Используем формулу из economy.js для расчета необходимого опыта
            const expNeeded = getExpForNextLevel(this.data.level);
            
            // Проверяем, активен ли буст двойного опыта
            if (this.data.boosts && this.data.boosts.doubleXPUntil && 
                Date.now() < this.data.boosts.doubleXPUntil) {
                // Удваиваем получаемый опыт
                amount *= 2;
            }
            
            // Текущий опыт для данного уровня
            let currentExp = this.data.exp || 0;
            currentExp += amount;
            
            // Проверяем, достаточно ли опыта для повышения уровня
            if (currentExp >= expNeeded) {
                // Повышаем уровень
                this.data.level++;
                
                // Остаток опыта переносим на следующий уровень
                this.data.exp = currentExp - expNeeded;
                
                // Награда за новый уровень
                const reward = calculateLevelReward(this.data.level);
                
                this.updateResource('bananas', reward.bananas);
                this.updateResource('stars', reward.stars);
                
                // Показываем анимацию и уведомление
                UI.showLevelUpAnimation(reward);
                
                // Проверяем задание "Достигни 3 уровня"
                if (this.data.level >= 3 && this.data.taskProgress.task6 < 1) {
                    this.data.taskProgress.task6 = 1;
                    TaskManager.completeTask(6);
                }
            } else {
                // Сохраняем текущий опыт
                this.data.exp = currentExp;
            }
            
            // Обновляем UI прогресса уровня
            UI.updateLevelProgress();
            this.save();
            
            return true;
        } catch (e) {
            console.error('Error adding experience:', e);
            return false;
        }
    }
};

// ===== SETTINGS MANAGER =====
const SettingsManager = {
    data: {
        soundEnabled: true,
        vibrationEnabled: true,
        serverSync: false,
        notificationsEnabled: true,
        darkTheme: false
    },
    
    load() {
        try {
            const savedSettings = localStorage.getItem('minionsGameSettings');
            if (savedSettings) {
                this.data = {...this.data, ...JSON.parse(savedSettings)};
                console.log("Settings loaded");
            }
            return true;
        } catch (e) {
            console.error('Error loading settings:', e);
            return false;
        }
    },
    
    save() {
        try {
            localStorage.setItem('minionsGameSettings', JSON.stringify(this.data));
            console.log("Settings saved");
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },
    
    toggle(setting) {
        if (this.data[setting] !== undefined) {
            this.data[setting] = !this.data[setting];
            this.save();
            
            // Apply changes immediately
            if (setting === 'darkTheme') {
                document.body.classList.toggle('dark-theme', this.data.darkTheme);
            }
            
            return this.data[setting];
        }
        return false;
    }
};

// ===== UI MANAGEMENT =====
const UI = {
    elements: {
        bananas: document.getElementById('bananas'),
        level: document.getElementById('level'),
        interactiveMinion: document.getElementById('interactive-minion'),
        mainInteractiveMinion: document.getElementById('main-interactive-minion'),
        splashScreen: document.getElementById('splash-screen'),
        popupMessage: document.getElementById('popup-message'),
        achievementsList: document.getElementById('achievements-list'),
        dailyRewardContainer: document.getElementById('daily-reward-container'),
        dailyRewardBtn: document.getElementById('daily-reward-btn'),
        farmMinionCount: document.getElementById('farm-minions-count'),
        farmBananasRate: document.getElementById('farm-bananas-rate'),
        farmLastCollect: document.getElementById('farm-last-collect'),
        farmCollectBtn: document.getElementById('farm-collect-btn'),
        farmMinionsContainer: document.querySelector('.farm-minions-container'),
        levelUpContainer: document.getElementById('level-up-container'),
        boxAnimationContainer: document.getElementById('box-animation-container'),
        mainBananasCount: document.getElementById('main-bananas-count'),
        mainBananasLarge: document.getElementById('main-bananas-large'),
        levelProgress: document.getElementById('level-progress'),
        levelCounter: document.getElementById('level-counter')
    },
    
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.applyTheme();
        this.updateStats();
    },
    
    cacheElements() {
        // Собираем все часто используемые элементы
        this.elements = {
            bananas: document.getElementById('bananas'),
            stars: document.getElementById('stars'),
            level: document.getElementById('level'),
            interactiveMinion: document.getElementById('interactive-minion'),
            mainInteractiveMinion: document.getElementById('main-interactive-minion'),
            splashScreen: document.getElementById('splash-screen'),
            popupMessage: document.getElementById('popup-message'),
            achievementsList: document.getElementById('achievements-list'),
            dailyRewardContainer: document.getElementById('daily-reward-container'),
            dailyRewardBtn: document.getElementById('daily-reward-btn'),
            farmMinionCount: document.getElementById('farm-minions-count'),
            farmBananasRate: document.getElementById('farm-bananas-rate'),
            farmLastCollect: document.getElementById('farm-last-collect'),
            farmCollectBtn: document.getElementById('farm-collect-btn'),
            farmMinionsContainer: document.querySelector('.farm-minions-container'),
            levelUpContainer: document.getElementById('level-up-container'),
            boxAnimationContainer: document.getElementById('box-animation-container'),
            mainBananasCount: document.getElementById('main-bananas-count'),
            mainBananasLarge: document.getElementById('main-bananas-large'),
            levelProgress: document.getElementById('level-progress'),
            levelCounter: document.getElementById('level-counter')
        };
    },
    
    setupEventListeners() {
        // Настройка обработчиков событий UI
        
        // Обработчик для ежедневной награды
        if (this.elements.dailyRewardBtn) {
            this.elements.dailyRewardBtn.addEventListener('click', () => {
                if (GameState.claimDailyReward()) {
                    this.hideDailyReward();
                }
                SoundManager.play('reward');
                VibrationManager.vibrate([100, 50, 100]);
            });
        }
        
        // Обработчики для кнопок меню
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const sectionId = item.getAttribute('data-section');
                if (sectionId) {
                    this.showSection(sectionId);
                    SoundManager.play('click');
                    VibrationManager.vibrate(30);
                }
            });
        });
        
        // Обработчики для кнопок открытия боксов
        document.querySelectorAll('.open-box-btn').forEach(button => {
            button.addEventListener('click', () => {
                const boxType = button.getAttribute('data-type');
                if (boxType) {
                    BoxManager.openBox(boxType);
                }
            });
        });
        
        // Обработчик для кнопки сбора бананов с фермы
        if (this.elements.farmCollectBtn) {
            this.elements.farmCollectBtn.addEventListener('click', () => {
                FarmManager.collectBananas();
            });
        }
        
        // Обработчики для улучшений фермы
        document.querySelectorAll('.upgrade-btn').forEach(button => {
            button.addEventListener('click', () => {
                const upgradeType = button.getAttribute('data-type');
                if (upgradeType) {
                    FarmManager.buyUpgrade(upgradeType);
                }
            });
        });
        
        // Обработчик для интерактивного миньона
        if (this.elements.mainInteractiveMinion) {
            this.elements.mainInteractiveMinion.addEventListener('click', this.handleMinionClick.bind(this));
        }
        
        // Обработчик для кнопки закрытия модального окна
        document.querySelectorAll('.close-btn').forEach(button => {
            button.addEventListener('click', () => {
                const containerId = button.closest('.modal-container').id;
                this.closeModal(containerId);
            });
        });
        
        // Обработчик для кнопки приглашения друзей
        const inviteButton = document.getElementById('invite-button');
        if (inviteButton) {
            inviteButton.addEventListener('click', () => {
                SocialManager.inviteFriend();
            });
        }
    },
    
    applyTheme() {
        // Применяем тему (светлую/темную)
        const isDark = SettingsManager.data.darkTheme || 
                      (TelegramManager.tg && TelegramManager.tg.colorScheme === 'dark');
                      
        document.documentElement.classList.toggle('dark-theme', isDark);
    },
    
    updateStats() {
        // Обновляем отображение счетчиков ресурсов
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        // Обновляем основные счетчики
        updateElement('bananas', GameState.data.bananas);
        updateElement('stars', GameState.data.stars);
        updateElement('level', GameState.data.level);
        updateElement('profile-level', GameState.data.level);
        updateElement('total-bananas', GameState.data.totalBananas);
        updateElement('completed-tasks', GameState.data.completedTasks);
        updateElement('opened-boxes', GameState.data.openedBoxes);
        updateElement('invited-friends', GameState.data.invitedFriends);
        updateElement('active-days', GameState.data.activeDays);
        
        // Обновляем счетчики на главном экране
        if (this.elements.mainBananasCount) {
            this.elements.mainBananasCount.textContent = GameState.data.bananas;
        }
        
        if (this.elements.mainBananasLarge) {
            this.elements.mainBananasLarge.textContent = GameState.data.bananas;
        }
        
        // Обновляем прогресс уровня
        this.updateLevelProgress();
    },
    
    updateLevelProgress() {
        try {
            // Расчет опыта для уровня
            const expNeeded = getExpForNextLevel(GameState.data.level);
            const currentExp = GameState.data.exp || 0;
            const percentage = (currentExp / expNeeded) * 100;
            
            // Обновляем визуальный прогресс
            if (this.elements.levelProgress) {
                this.elements.levelProgress.style.width = `${percentage}%`;
            }
            
            // Обновляем текстовый счетчик
            if (this.elements.levelCounter) {
                this.elements.levelCounter.textContent = `${currentExp}/${expNeeded}`;
            }
        } catch (e) {
            console.error('Error updating level progress:', e);
        }
    },
    
    handleMinionClick() {
        // Обработка клика по миньону на главном экране
        if (!this.elements.mainInteractiveMinion) return;
        
        // Анимация клика
        this.elements.mainInteractiveMinion.classList.add('pet-animation');
        setTimeout(() => {
            this.elements.mainInteractiveMinion.classList.remove('pet-animation');
        }, 500);
        
        // Увеличиваем счетчик поглаживаний
        GameState.data.petCount++;
        
        // Каждые 5 поглаживаний дают банан
        if (GameState.data.petCount % 5 === 0) {
            GameState.updateResource('bananas', 1);
            this.showPopup('+1 банан за заботу о миньоне!');
            
            // Каждые 5 нажатий увеличивают счетчик прогресса задания
            if (GameState.data.petCount % 5 === 0) {
                // Проверка задания на нажатия миньона
                if (GameState.data.petCount <= 25 && GameState.data.taskProgress.task3 < 25) {
                    GameState.data.taskProgress.task3 = GameState.data.petCount;
                    TaskManager.updateTaskProgress();
                    
                    if (GameState.data.petCount >= 25 && GameState.data.taskProgress.task3 < 25) {
                        TaskManager.completeTask(3);
                    }
                }
            }
        }
        
        // Звук и вибрация
        SoundManager.play('minionHappy');
        VibrationManager.vibrate(30);
    },
    
    showDailyReward() {
        if (this.elements.dailyRewardContainer) {
            // Обновляем счетчик серии
            const streakCount = document.getElementById('streak-count');
            if (streakCount) {
                streakCount.textContent = GameState.data.streak;
            }
            
            this.elements.dailyRewardContainer.style.display = 'block';
        }
    },
    
    hideDailyReward() {
        if (this.elements.dailyRewardContainer) {
            this.elements.dailyRewardContainer.style.display = 'none';
        }
    },
    
    showRewardAnimation(bananaReward) {
        const rewardAnimation = document.getElementById('reward-animation');
        if (rewardAnimation) {
            rewardAnimation.innerHTML = '🎁';
        }
        
        this.showPopup(`Ежедневная награда: +${bananaReward} бананов!`);
        
        // Sound and vibration
        SoundManager.play('reward');
        VibrationManager.vibrate([100, 50, 100]);
        
        // Confetti effect
        this.createConfetti();
    },
    
    showPopup(message) {
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
            console.error("Error showing popup:", error);
        }
    },
    
    createConfetti() {
        try {
            const container = document.getElementById('confetti-container');
            if (!container) {
                console.warn('Confetti container not found');
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
            console.error('Error creating confetti:', e);
        }
    },
    
    showLevelUpAnimation(reward) {
        try {
            const container = document.getElementById('level-up-container');
            if (!container) {
                this.showPopup(`Уровень повышен! Вы достигли ${GameState.data.level} уровня!`);
                return;
            }
            
            container.style.display = 'flex';
            
            // Показываем новый уровень
            const newLevel = document.getElementById('new-level');
            if (newLevel) {
                newLevel.textContent = GameState.data.level;
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
            SoundManager.play('levelUp');
            VibrationManager.vibrate([100, 50, 100, 50, 200]);
            
            // Создаем эффект конфетти
            this.createConfetti();
        } catch (e) {
            console.error('Error showing level up animation:', e);
            this.showPopup(`Уровень повышен! Вы достигли ${GameState.data.level} уровня!`);
        }
    },
    
    showBoxAnimation(type, reward) {
        try {
            const container = document.getElementById('box-animation-container');
            const boxImage = document.getElementById('box-image');
            const boxReward = document.getElementById('box-reward');
            
            if (!container || !boxImage || !boxReward) {
                console.error('Box animation elements not found');
                this.showPopup(`Открыт бокс: ${reward.text}`);
                return;
            }
            
            // Устанавливаем изображение бокса
            boxImage.src = `images/box_${type}.png`;
            boxImage.onerror = function() {
                this.src = 'https://i.imgur.com/ZcukEsb.png';
            };
            
            // Сбрасываем классы анимации
            boxImage.classList.remove('shake', 'open');
            boxReward.style.opacity = '0';
            
            // Показываем контейнер
            container.style.display = 'flex';
            
            // Анимация тряски
            setTimeout(() => {
                boxImage.classList.add('shake');
                
                // Звук тряски
                SoundManager.play('box_shake');
                
                // После тряски показываем, что внутри
                setTimeout(() => {
                    boxImage.classList.remove('shake');
                    boxImage.classList.add('open');
                    
                    // Устанавливаем текст награды
                    boxReward.textContent = reward.text;
                    
                    // Показываем награду
                    setTimeout(() => {
                        boxReward.style.opacity = '1';
                        
                        // Звук награды
                        SoundManager.play('box');
                        VibrationManager.vibrate([100, 50, 100]);
                    }, 500);
                }, 800);
            }, 500);
        } catch (e) {
            console.error('Error showing box animation:', e);
            this.showPopup(`Открыт бокс: ${reward.text}`);
        }
    },
    
    closeModal(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            // Добавляем анимацию исчезновения
            container.style.opacity = '0';
            
            // После анимации скрываем элемент
            setTimeout(() => {
                container.style.display = 'none';
                container.style.opacity = '1'; // Сбрасываем прозрачность для будущих показов
            }, 300);
            
            console.log(`Modal ${containerId} closed by user`);
        }
    },
    
    hideSplashScreen() {
        if (this.elements.splashScreen) {
            this.elements.splashScreen.style.opacity = '0';
            setTimeout(() => {
                this.elements.splashScreen.style.display = 'none';
                this.showSection('main-screen');
            }, 500);
        }
    },
    
    showSection(sectionId) {
        console.log(`Showing section: ${sectionId}`);
        
        try {
            // Normalize section ID (add "-section" if missing and not main-screen)
            if (sectionId !== 'main-screen' && !sectionId.endsWith('-section')) {
                sectionId = sectionId + '-section';
            }
            
            // Get target section
            const targetSection = document.getElementById(sectionId);
            if (!targetSection) {
                console.warn(`Section not found: ${sectionId}`);
                return;
            }
            
            // Hide all sections
            document.querySelectorAll('.section, [id$="-section"]').forEach(section => {
                section.style.display = 'none';
                section.classList.remove('active-section');
            });
            
            // Show target section
            targetSection.style.display = 'block';
            targetSection.classList.add('active-section');
            
            // Update active menu item
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
                const itemSection = item.getAttribute('data-section');
                if (itemSection === sectionId || itemSection + '-section' === sectionId) {
                    item.classList.add('active');
                }
            });
            
            // Section-specific updates
            if (sectionId === 'farm-section') {
                FarmManager.updateFarmUI();
            } else if (sectionId === 'profile-section') {
                this.updateProfileStats();
            } else if (sectionId === 'leaderboard-tab-content') {
                LeaderboardManager.renderLeaderboard();
            } else if (sectionId === 'tasks-section') {
                TaskManager.updateTaskDisplay();
            }
        } catch (error) {
            console.error("Error when switching to section:", error);
            
            // In case of error, show main screen
            const mainScreen = document.getElementById('main-screen');
            if (mainScreen) {
                mainScreen.style.display = 'block';
            }
        }
    },
    
    updateProfileStats() {
        const stats = GameState.data;
        
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        updateElement('total-bananas', stats.totalBananas);
        updateElement('total-stars', stats.totalStars);
        updateElement('completed-tasks', stats.completedTasks);
        updateElement('opened-boxes', stats.openedBoxes);
        updateElement('invited-friends', stats.invitedFriends);
        updateElement('active-days', stats.activeDays);
        updateElement('pet-count', stats.petCount);
        
        // Обновляем имя пользователя, если доступно
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const userName = TelegramManager.getUserName() || 'Игрок';
            userNameElement.textContent = userName;
        }
        
        // Обновляем аватар пользователя, если доступно
        const profileAvatar = document.querySelector('.profile-avatar');
        if (profileAvatar) {
            const userAvatar = TelegramManager.getUserAvatar();
            if (userAvatar) {
                profileAvatar.style.backgroundImage = `url(${userAvatar})`;
            } else {
                profileAvatar.style.backgroundImage = "url('images/avatar.png')";
            }
        }
    }
};

// ===== ACHIEVEMENT MANAGEMENT =====
const AchievementManager = {
    init() {
        this.checkAchievements();
        this.updateAchievementsUI();
    },
    
    checkAchievements() {
        try {
            const achievements = [
                { id: 'beginner', title: 'Начинающий миньоновод', condition: () => true },
                { id: 'collector', title: 'Банановый коллекционер', condition: () => GameState.data.totalBananas >= 50 },
                { id: 'star_gatherer', title: 'Звездочёт', condition: () => GameState.data.totalStars >= 15 },
                { id: 'box_opener', title: 'Распаковщик', condition: () => GameState.data.openedBoxes >= 10 },
                { id: 'box_master', title: 'Мастер кейсов', condition: () => GameState.data.openedBoxes >= 25 },
                { id: 'task_master', title: 'Исполнительный миньон', condition: () => GameState.data.completedTasks >= 5 },
                { id: 'minion_friend', title: 'Друг миньонов', condition: () => GameState.data.petCount >= 50 },
                { id: 'minion_lover', title: 'Заботливый хозяин', condition: () => GameState.data.petCount >= 100 },
                { id: 'invite_king', title: 'Социальная бабочка', condition: () => GameState.data.invitedFriends >= 5 },
                { id: 'daily_master', title: 'Постоянный игрок', condition: () => GameState.data.activeDays >= 7 },
                { id: 'streak_master', title: 'Верный миньон', condition: () => GameState.data.streak >= 3 },
                { id: 'high_level', title: 'Опытный миньоновод', condition: () => GameState.data.level >= 5 }
            ];
            
            // Проверяем и добавляем новые достижения
            achievements.forEach(achievement => {
                if (achievement.condition() && !GameState.data.achievements.includes(achievement.title)) {
                    GameState.data.achievements.push(achievement.title);
                    
                    // Показываем уведомление о новом достижении
                    UI.showPopup(`Новое достижение: ${achievement.title}!`);
                    
                    // Звук и вибрация
                    SoundManager.play('achievement');
                    VibrationManager.vibrate([100, 30, 100, 30, 200]);
                }
            });
            
            // Проверяем задание на получение 5 достижений
            if (GameState.data.achievements.length >= 5 && GameState.data.taskProgress.task7 < 1) {
                GameState.data.taskProgress.task7 = 1;
                TaskManager.completeTask(7);
            }
            
            // Сохраняем состояние игры
            GameState.save();
        } catch (e) {
            console.error('Error checking achievements:', e);
        }
    },
    
    updateAchievementsUI() {
        try {
            const achievementsList = document.getElementById('achievements-list');
            if (!achievementsList) {
                console.warn("Achievements list not found");
                return;
            }
            
            achievementsList.innerHTML = '';
            
            // Отображаем все имеющиеся достижения
            GameState.data.achievements.forEach(achievement => {
                const item = document.createElement('div');
                item.className = 'achievement-item';
                item.textContent = achievement;
                achievementsList.appendChild(item);
            });
        } catch (error) {
            console.error("Error updating achievements UI:", error);
        }
    }
};

// ===== TASK MANAGEMENT =====
const TaskManager = {
    // Массив с данными для заданий
    tasksData: [
        { id: 1, title: "Пригласи 10 друзей", reward: "+100 🍌", maxProgress: 10 },
        { id: 2, title: "Открой премиум-кейс", reward: "+50 🍌", maxProgress: 1 },
        { id: 3, title: "Найми 3 миньона на ферме", reward: "+20 🍌", maxProgress: 3 },
        { id: 4, title: "Собери 30 бананов", reward: "+25 🍌", maxProgress: 30 },
        { id: 5, title: "Открой 5 боксов", reward: "+40 🍌", maxProgress: 5 },
        { id: 6, title: "Достигни 3 уровня", reward: "+60 🍌", maxProgress: 3 },
        { id: 7, title: "Улучши эффективность фермы", reward: "+75 🍌", maxProgress: 1 },
        { id: 8, title: "Серия входов 5 дней", reward: "+35 🍌", maxProgress: 5 },
        { id: 9, title: "Собери 100 бананов", reward: "+50 🍌", maxProgress: 100 },
        { id: 10, title: "Найми 5 миньонов", reward: "+100 🍌", maxProgress: 5 }Открой премиум-кейс", reward: "+50 🍌", maxProgress: 1 },
        { id: 3, title: "Накорми 5 миньонов", reward: "+20 🍌", maxProgress: 5 },
        { id: 4, title: "Собери 30 бананов", reward: "+25 🍌", maxProgress: 30 },
        { id: 5, title: "Открой 5 боксов", reward: "+40 🍌", maxProgress: 5 },
        { id: 6, title: "Достигни 3 уровня", reward: "+60 🍌", maxProgress: 3 },
        { id: 7, title: "Получи 5 достижений", reward: "+75 🍌", maxProgress: 5 },
        { id: 8, title: "Серия входов 5 дней", reward: "+35 🍌", maxProgress: 5 },
        { id: 9, title: "Собери 100 бананов", reward: "+50 🍌", maxProgress: 100 },
        { id: 10, title: "Накопи 20 звезд", reward: "+100 🍌", maxProgress: 20 }
    ],
    
    init() {
        this.createTasksUI();
        this.updateTaskProgress();
    },
    
    createTasksUI() {
        const tasksSection = document.getElementById('tasks-section');
        if (!tasksSection) return;
        
        // Создаем контейнер для заданий, если его нет
        let tasksContainer = tasksSection.querySelector('.tasks');
        if (!tasksContainer) {
            tasksContainer = document.createElement('div');
            tasksContainer.className = 'tasks';
            tasksSection.appendChild(tasksContainer);
        }
        
        // Очищаем контейнер
        tasksContainer.innerHTML = '';
        
        // Создаем HTML для каждого задания
        this.tasksData.forEach(task => {
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
            tasksContainer.appendChild(taskDiv);
        });
    },
    
    updateTaskProgress() {
        try {
            // Задание 1: Пригласи 10 друзей
            this.updateTaskProgressUI(1, GameState.data.taskProgress.task1, 10);
            
            // Задание 2: Открой премиум-кейс
            this.updateTaskProgressUI(2, GameState.data.taskProgress.task2, 1);
            
            // Задание 3: Накорми 5 миньонов
            this.updateTaskProgressUI(3, GameState.data.taskProgress.task3, 5);
            
            // Задание 4: Собери 30 бананов
            this.updateTaskProgressUI(4, Math.min(GameState.data.totalBananas, 30), 30);
            
            // Задание 5: Открой 5 боксов
            this.updateTaskProgressUI(5, Math.min(GameState.data.openedBoxes, 5), 5);
            
            // Задание 6: Достигни 3 уровня
            this.updateTaskProgressUI(6, Math.min(GameState.data.level, 3), 3);
            
            // Задание 7: Получи 5 достижений
            this.updateTaskProgressUI(7, Math.min(GameState.data.achievements.length, 5), 5);
            
            // Задание 8: Серия входов 5 дней подряд
            this.updateTaskProgressUI(8, Math.min(GameState.data.streak, 5), 5);
            
            // Задание 9: Собери 100 бананов
            this.updateTaskProgressUI(9, Math.min(GameState.data.totalBananas, 100), 100);
            
            // Задание 10: Накопи 20 звезд
            this.updateTaskProgressUI(10, Math.min(GameState.data.totalStars, 20), 20);
        } catch (error) {
            console.error("Error updating task progress:", error);
        }
    },
    
    updateTaskProgressUI(taskId, current, total) {
        try {
            const progressBar = document.getElementById(`task${taskId}-progress`);
            const counter = document.getElementById(`task${taskId}-counter`);
            
            if (progressBar) {
                progressBar.style.width = `${(current / total) * 100}%`;
            }
            
            if (counter) {
                counter.textContent = `${current}/${total}`;
            }
            
            // Отмечаем выполненные задания
            const taskElement = document.querySelector(`.task[data-task-id="${taskId}"]`);
            if (taskElement) {
                if (current >= total) {
                    taskElement.classList.add('completed-task');
                } else {
                    taskElement.classList.remove('completed-task');
                }
            }
        } catch (error) {
            console.error(`Error updating UI for task ${taskId}:`, error);
        }
    },
    
    completeTask(taskId) {
        console.log("Completing task:", taskId);
        
        try {
            // Проверяем, не выполнено ли уже задание
            if (GameState.data.taskProgress[`task${taskId}`] >= 1) {
                return;
            }
            
            let reward = {};
            
            switch(taskId) {
                case 1: // Пригласи 10 друзей
                    if (GameState.data.taskProgress.task1 >= 10) {
                        GameState.data.taskProgress.task1 = 1;
                        reward = { type: 'bananas', amount: 100 };
                    }
                    break;
                    
                case 2: // Открой премиум-кейс
                    reward = { type: 'bananas', amount: 50 };
                    break;
                    
                case 3: // Накорми 5 миньонов
                    if (GameState.data.taskProgress.task3 >= 5) {
                        GameState.data.taskProgress.task3 = 1;
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
                    
                case 10: // Накопи 20 звезд
                    reward = { type: 'bananas', amount: 100 };
                    break;
            }
            
            // Отмечаем задание как выполненное
            GameState.data.taskProgress[`task${taskId}`] = 1;
            GameState.data.completedTasks++;
            
            // Выдаем награду
            let rewardText = '';
            
            if (reward.type === 'bananas') {
                GameState.updateResource('bananas', reward.amount);
                rewardText = `Задание выполнено! +${reward.amount} бананов`;
            }
            
            // Обновляем UI
            this.updateTaskProgress();
            GameState.save();
            
            // Показываем уведомление
            UI.showPopup(rewardText);
            
            // Звук и вибрация
            SoundManager.play('task');
            VibrationManager.vibrate([100, 30, 100, 30, 100]);
            
            // Создаем эффект конфетти
            UI.createConfetti();
        } catch (e) {
            console.error('Error completing task:', e);
        }
    }
};

// ===== BOX MANAGER =====
const BoxManager = {
    boxPrices: {
        'simple': 10,
        'standard': 25,
        'premium': 50,
        'mega': 100,
        'special': 75
    },
    
    openBox(type) {
        console.log("Opening box:", type);
        
        // Проверяем наличие типа бокса
        if (!type) {
            console.error("No box type specified");
            UI.showPopup('Ошибка: неизвестный тип бокса');
            return false;
        }
        
        // Определяем стоимость в зависимости от типа
        let cost = this.boxPrices[type];
        if (!cost) {
            console.error("Unknown box type:", type);
            UI.showPopup('Ошибка: неизвестный тип бокса');
            return false;
        }
        
        // Проверяем, хватает ли бананов
        if (GameState.data.bananas < cost) {
            console.log("Not enough bananas to open the box");
            UI.showPopup(`Недостаточно бананов! Нужно ${cost} 🍌`);
            SoundManager.play('minionShocked');
            return false;
        }
        
        // Списываем бананы
        GameState.data.bananas -= cost;
        
        // Определяем награду
        let reward;
        switch(type) {
            case 'simple':
                // 70% шанс на бананы (5-15), 30% шанс на опыт (5-10)
                if (Math.random() < 0.7) {
                    const bananas = Math.floor(Math.random() * 11) + 5;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
                } else {
                    const exp = Math.floor(Math.random() * 6) + 5;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                }
                break;
                
            case 'standard':
                // 60% шанс на бананы (15-30), 40% шанс на опыт (10-20)
                if (Math.random() < 0.6) {
                    const bananas = Math.floor(Math.random() * 16) + 15;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
                } else {
                    const exp = Math.floor(Math.random() * 11) + 10;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                }
                break;
                
            case 'premium':
                // Премиум награды
                const premiumReward = Math.random();
                if (premiumReward < 0.5) {
                    // 50% шанс на бананы (40-80)
                    const bananas = Math.floor(Math.random() * 41) + 40;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
                } else if (premiumReward < 0.85) {
                    // 35% шанс на опыт (20-40)
                    const exp = Math.floor(Math.random() * 21) + 20;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                } else {
                    // 15% шанс на звезду
                    GameState.data.stars += 1;
                    GameState.data.totalStars += 1;
                    reward = { type: 'stars', amount: 1, text: `+1 звезда` };
                }
                
                // Отмечаем задание на открытие премиум-кейса
                if (GameState.data.taskProgress.task2 < 1) {
                    GameState.data.taskProgress.task2 = 1;
                    setTimeout(() => {
                        TaskManager.completeTask(2);
                    }, 1000);
                }
                break;
                
            case 'mega':
                // Мега награды
                const megaReward = Math.random();
                if (megaReward < 0.4) {
                    // 40% шанс на бананы (80-150)
                    const bananas = Math.floor(Math.random() * 71) + 80;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
                } else if (megaReward < 0.7) {
                    // 30% шанс на опыт (40-80)
                    const exp = Math.floor(Math.random() * 41) + 40;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                } else if (megaReward < 0.9) {
                    // 20% шанс на звезды (2-3)
                    const stars = Math.floor(Math.random() * 2) + 2;
                    GameState.data.stars += stars;
                    GameState.data.totalStars += stars;
                    reward = { type: 'stars', amount: stars, text: `+${stars} звезды` };
                } else {
                    // 10% шанс на джекпот - все виды наград
                    const bananas = 200;
                    const exp = 50;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    GameState.addExperience(exp);
                    reward = { type: 'jackpot', text: `ДЖЕКПОТ! +${bananas} бананов, +${exp} опыта` };
                }
                break;
                
            case 'special':
                // Специальные награды
                const specialReward = Math.random();
                if (specialReward < 0.3) {
                    // 30% шанс на бананы (60-120)
                    const bananas = Math.floor(Math.random() * 61) + 60;
                    GameState.data.bananas += bananas;
                    GameState.data.totalBananas += bananas;
                    reward = { type: 'bananas', amount: bananas, text: `+${bananas} бананов` };
                } else if (specialReward < 0.6) {
                    // 30% шанс на опыт (30-60)
                    const exp = Math.floor(Math.random() * 31) + 30;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                } else if (specialReward < 0.9) {
                    // 30% шанс на дополнительный опыт (30-60)
                    const exp = Math.floor(Math.random() * 31) + 50;
                    GameState.addExperience(exp);
                    reward = { type: 'exp', amount: exp, text: `+${exp} опыта` };
                } else {
                    // 10% шанс на бонус эффективности фермы
                    if (!GameState.data.farm) GameState.data.farm = { efficiency: 1.0 };
                    GameState.data.farm.efficiency += 0.2;
                    reward = { type: 'boost', text: `+20% к эффективности фермы!` };
                }
                break;
        }
        
        // Увеличиваем счетчик открытых боксов
        GameState.data.openedBoxes = (GameState.data.openedBoxes || 0) + 1;
        
        // Проверяем задание на открытие боксов
        if (GameState.data.openedBoxes >= 5 && GameState.data.taskProgress.task5 < 1) {
            GameState.data.taskProgress.task5 = 1;
            setTimeout(() => {
                TaskManager.completeTask(5);
            }, 2000);
        }
        
        // Обновляем статистику
        UI.updateStats();
        GameState.save();
        
        // Проверяем достижения
        AchievementManager.checkAchievements();
        
        // Показываем анимацию
        UI.showBoxAnimation(type, reward);
        
        // Воспроизводим звук
        SoundManager.play('box');
        VibrationManager.vibrate([100, 50, 100]);
        
        return true;
    }
};

// ===== FARM MANAGER =====
const FarmManager = {
    init() {
        this.setupEventHandlers();
        this.updateFarmUI();
        this.startAutoCollectTimer();
    },
    
    setupEventHandlers() {
        // Настраиваем обработчики событий для фермы
        
        // Кнопка сбора бананов
        const farmCollectBtn = document.getElementById('farm-collect-btn');
        if (farmCollectBtn) {
            farmCollectBtn.addEventListener('click', this.collectBananas.bind(this));
        }
        
        // Кнопки улучшений
        document.querySelectorAll('.upgrade-btn').forEach(button => {
            button.addEventListener('click', () => {
                const upgradeType = button.getAttribute('data-type');
                this.buyUpgrade(upgradeType);
            });
        });
    },
    
    updateFarm() {
        // Если нет миньонов, ничего не делаем
        if (!GameState.data.farm || GameState.data.farm.minions <= 0) return;
        
        const now = Date.now();
        const elapsedHours = (now - GameState.data.farm.lastCollect) / (1000 * 60 * 60);
        
        // Считаем производство бананов
        let production = GameState.data.farm.minions; // базовое производство: 1 банан в час на миньона
        
        // Применяем множитель эффективности
        production *= GameState.data.farm.efficiency;
        
        // Применяем буст, если активен
        if (now < GameState.data.farm.boostUntil) {
            production *= 2;
        }
        
        // Добавляем накопленные бананы
        GameState.data.farm.bananasPending += production * elapsedHours;
        
        // Обновляем время последнего подсчета
        GameState.data.farm.lastCollect = now;
        
        // Если включен автосбор и он активен
        if (now < GameState.data.farm.autoCollectUntil) {
            this.collectBananas();
        }
        
        //
