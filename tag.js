// tag.js - Обработка Telegram WebApp и тегов в игре

// Инициализация Telegram WebApp и переменных тегирования
const TagManager = {
    // Экземпляр WebApp Telegram
    tgApp: null,
    // Флаг готовности WebApp
    isReady: false,
    // Текущая тема (светлая/темная)
    theme: 'light',
    // Данные пользователя из Telegram
    userData: null,
    // Параметры запуска (включая реферальные коды)
    startParams: null,
    
    // Инициализация Telegram WebApp
    init: function() {
        console.log("Инициализация Tag Manager");
        
        try {
            // Проверяем, запущено ли приложение внутри Telegram
            if (window.Telegram && window.Telegram.WebApp) {
                this.tgApp = window.Telegram.WebApp;
                
                // Сообщаем Telegram, что приложение готово к отображению
                this.tgApp.ready();
                
                // Расширяем окно на весь экран
                this.tgApp.expand();
                
                // Определяем тему (светлая/темная)
                this.theme = this.tgApp.colorScheme || 'light';
                document.documentElement.classList.toggle('dark-theme', this.theme === 'dark');
                
                // Сохраняем данные пользователя
                if (this.tgApp.initDataUnsafe && this.tgApp.initDataUnsafe.user) {
                    this.userData = this.tgApp.initDataUnsafe.user;
                    
                    // Отладочная информация
                    console.log("Данные пользователя получены:", this.userData);
                }
                
                // Получаем параметры запуска (для обработки рефералов)
                if (this.tgApp.initDataUnsafe && this.tgApp.initDataUnsafe.start_param) {
                    this.startParams = this.tgApp.initDataUnsafe.start_param;
                    this.processStartParams();
                }
                
                // Добавляем слушатель событий изменения темы
                this.tgApp.onEvent('themeChanged', () => {
                    this.theme = this.tgApp.colorScheme;
                    document.documentElement.classList.toggle('dark-theme', this.theme === 'dark');
                });
                
                this.isReady = true;
                console.log("Tag Manager инициализирован успешно");
            } else {
                console.warn('Приложение запущено вне среды Telegram WebApp');
                
                // Добавляем отладочный режим для локального тестирования
                this.setupDebugMode();
            }
        } catch (e) {
            console.error('Ошибка при инициализации Tag Manager:', e);
            this.setupDebugMode(); // Инициализируем отладочный режим в случае ошибки
        }
    },
    
    // Обработка параметров запуска (например, реферальных ссылок)
    processStartParams: function() {
        if (!this.startParams) return;
        
        console.log("Обработка параметров запуска:", this.startParams);
        
        // Обработка реферальных ссылок
        if (this.startParams.startsWith('ref_')) {
            const referrerId = this.startParams.replace('ref_', '');
            console.log("Обнаружен реферальный код:", referrerId);
            
            // Сохраняем реферальный код для дальнейшей обработки
            localStorage.setItem('minionsGame_referrer', referrerId);
            
            // Отправляем событие о реферале
            document.dispatchEvent(new CustomEvent('referralDetected', { 
                detail: { referrerId: referrerId } 
            }));
        }
    },
    
    // Установка отладочного режима для локального тестирования
    setupDebugMode: function() {
        console.log("Запуск в отладочном режиме");
        
        // Создаем имитацию пользователя для тестирования
        this.userData = {
            id: 12345678,
            first_name: "Тестовый",
            last_name: "Пользователь",
            username: "test_user",
            language_code: "ru"
        };
        
        // Устанавливаем тему по умолчанию
        this.theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark-theme', this.theme === 'dark');
        
        // Добавляем переключатель темы для тестирования
        this.addDebugThemeSwitcher();
        
        this.isReady = true;
    },
    
    // Добавляет кнопку переключения темы для отладки
    addDebugThemeSwitcher: function() {
        const themeSwitcher = document.createElement('button');
        themeSwitcher.textContent = 'Сменить тему';
        themeSwitcher.style.cssText = 'position:fixed;bottom:80px;right:10px;z-index:9999;padding:8px;background:#333;color:#fff;border:none;border-radius:5px;';
        
        themeSwitcher.addEventListener('click', () => {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            document.documentElement.classList.toggle('dark-theme', this.theme === 'dark');
        });
        
        document.body.appendChild(themeSwitcher);
    },
    
    // Получение данных пользователя
    getUserData: function() {
        return this.userData;
    },
    
    // Получение темы приложения
    getTheme: function() {
        return this.theme;
    },
    
    // Показать уведомление в Telegram (если доступно)
    showAlert: function(message) {
        if (this.tgApp && this.tgApp.showAlert) {
            this.tgApp.showAlert(message);
        } else {
            alert(message);
        }
    },
    
    // Поделиться с контактом
    shareWithContact: function(text) {
        if (this.tgApp) {
            if (this.tgApp.shareGame) {
                this.tgApp.shareGame({
                    text: text,
                    url: `https://t.me/minions_game_bot?start=ref_${this.userData ? this.userData.id : 'share'}`
                });
            } else if (this.tgApp.share) {
                this.tgApp.share({
                    text: text,
                    url: `https://t.me/minions_game_bot?start=ref_${this.userData ? this.userData.id : 'share'}`
                });
            } else {
                this.showAlert('Ссылка скопирована в буфер обмена. Поделитесь ею с друзьями!');
                
                const shareText = `${text} https://t.me/minions_game_bot?start=ref_${this.userData ? this.userData.id : 'share'}`;
                
                if (this.tgApp.clipboard && this.tgApp.clipboard.setText) {
                    this.tgApp.clipboard.setText(shareText);
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareText).catch(e => 
                        console.error('Не удалось скопировать текст:', e)
                    );
                }
            }
            return true;
        }
        return false;
    },
    
    // Установка данных для передачи боту
    sendDataToBot: function(data) {
        if (this.tgApp && this.tgApp.sendData) {
            this.tgApp.sendData(JSON.stringify(data));
            return true;
        }
        return false;
    },
    
    // Вызов вибрации на устройстве (безопасная функция)
    vibrate: function(pattern) {
        try {
            if (navigator.vibrate) {
                navigator.vibrate(pattern);
                return true;
            }
        } catch (e) {
            console.warn('Вибрация не поддерживается:', e);
        }
        return false;
    },
    
    // Управление тегами в игре
    tags: {
        // Теги игрока
        playerTags: new Set(),
        
        // Добавить тег игроку
        add: function(tagName) {
            this.playerTags.add(tagName);
            localStorage.setItem('minionsGame_tags', JSON.stringify([...this.playerTags]));
            console.log(`Тег "${tagName}" добавлен игроку`);
            
            // Отправляем событие о добавлении тега
            document.dispatchEvent(new CustomEvent('tagAdded', { 
                detail: { tag: tagName } 
            }));
        },
        
        // Удалить тег у игрока
        remove: function(tagName) {
            if (this.playerTags.has(tagName)) {
                this.playerTags.delete(tagName);
                localStorage.setItem('minionsGame_tags', JSON.stringify([...this.playerTags]));
                console.log(`Тег "${tagName}" удален у игрока`);
                
                // Отправляем событие об удалении тега
                document.dispatchEvent(new CustomEvent('tagRemoved', { 
                    detail: { tag: tagName } 
                }));
            }
        },
        
        // Проверить наличие тега у игрока
        has: function(tagName) {
            return this.playerTags.has(tagName);
        },
        
        // Загрузить теги из localStorage
        load: function() {
            try {
                const savedTags = localStorage.getItem('minionsGame_tags');
                if (savedTags) {
                    this.playerTags = new Set(JSON.parse(savedTags));
                    console.log("Теги игрока загружены:", [...this.playerTags]);
                }
            } catch (e) {
                console.error('Ошибка при загрузке тегов игрока:', e);
            }
        }
    },
    
    // Система советов и подсказок
    tips: {
        // Показанные подсказки
        shownTips: new Set(),
        
        // Доступные подсказки
        availableTips: {
            'farm': 'Ферма позволяет вам автоматически получать бананы! Нанимайте миньонов и улучшайте их эффективность.',
            'boxes': 'Боксы содержат различные награды. Чем дороже бокс, тем ценнее награда внутри!',
            'tasks': 'Выполняйте задания, чтобы получать ценные награды. Некоторые задания регулярно обновляются!',
            'friends': 'Приглашайте друзей и получайте бонусы за каждого приглашенного. Больше друзей - больше бонусов!',
            'minion': 'Регулярно кормите своего миньона, чтобы получать бонусы!',
            'leaderboard': 'Рейтинг лидеров показывает ваш прогресс среди всех игроков и друзей. Собирайте больше бананов, чтобы подняться в рейтинге!'
        },
        
        // Показать подсказку
        show: function(tipId) {
            if (this.availableTips[tipId] && !this.shownTips.has(tipId)) {
                TagManager.showAlert(this.availableTips[tipId]);
                this.shownTips.add(tipId);
                localStorage.setItem('minionsGame_shownTips', JSON.stringify([...this.shownTips]));
                return true;
            }
            return false;
        },
        
        // Загрузить список показанных подсказок
        load: function() {
            try {
                const savedTips = localStorage.getItem('minionsGame_shownTips');
                if (savedTips) {
                    this.shownTips = new Set(JSON.parse(savedTips));
                }
            } catch (e) {
                console.error('Ошибка при загрузке показанных подсказок:', e);
            }
        },
        
        // Сбросить все показанные подсказки
        reset: function() {
            this.shownTips.clear();
            localStorage.removeItem('minionsGame_shownTips');
        }
    },
    
    // Добавляем функционал рейтинга лидеров в TagManager
    // Расширяем TagManager для работы с рейтингом лидеров
    leaderboard: {
        // Данные рейтинга
        data: {
            global: [],
            friends: [],
            lastUpdate: null
        },
        
        // Запрос данных рейтинга у бота Telegram
        requestLeaderboardData: function() {
            console.log("Запрос данных рейтинга у бота Telegram");
            
            // Проверяем доступность Telegram WebApp
            if (TagManager.tgApp && TagManager.isReady) {
                // Отправляем запрос на получение данных рейтинга
                TagManager.sendDataToBot({
                    action: "get_leaderboard",
                    userId: TagManager.userData?.id || null
                });
                
                // Показываем кнопку для обработки ответа
                if (TagManager.tgApp.MainButton) {
                    TagManager.tgApp.MainButton.setText("ПОЛУЧИТЬ РЕЙТИНГ");
                    TagManager.tgApp.MainButton.show();
                    
                    // Сохраняем текущий обработчик (если он есть)
                    this._prevMainButtonHandler = TagManager.tgApp.MainButton.onClick;
                    
                    // Устанавливаем новый обработчик
                    TagManager.tgApp.MainButton.onClick(() => {
                        // В реальном сценарии, бот должен вернуть данные через initDataUnsafe.data
                        // Но поскольку здесь нет прямого механизма, используем генерацию тестовых данных
                        setTimeout(() => {
                            this.handleLeaderboardData(this.generateTestData());
                            TagManager.tgApp.MainButton.hide();
                            
                            // Восстанавливаем предыдущий обработчик
                            if (this._prevMainButtonHandler) {
                                TagManager.tgApp.MainButton.onClick(this._prevMainButtonHandler);
                                this._prevMainButtonHandler = null;
                            }
                        }, 1000);
                    });
                }
                
                return true;
            } else {
                console.warn("TagManager или Telegram WebApp не инициализированы");
                // В случае недоступности Telegram WebApp используем тестовые данные
                setTimeout(() => {
                    this.handleLeaderboardData(this.generateTestData());
                }, 1000);
                
                return false;
            }
        },
        
        // Обработка полученных данных рейтинга
        handleLeaderboardData: function(data) {
            console.log("Получены данные рейтинга:", data);
            
            // Сохраняем данные
            this.data = {
                ...data,
                lastUpdate: Date.now()
            };
            
            // Отправляем событие о получении данных рейтинга
            document.dispatchEvent(new CustomEvent('leaderboardDataReceived', { 
                detail: { data: this.data } 
            }));
            
            return true;
        },
        
        // Генерация тестовых данных для рейтинга (для демо и тестирования)
        generateTestData: function() {
            const userId = TagManager.userData?.id || 12345678;
            const userName = TagManager.userData?.first_name || "Тестовый Игрок";
            
            // Глобальный рейтинг
            const globalLeaderboard = [];
            for (let i = 0; i < 20; i++) {
                globalLeaderboard.push({
                    id: i === 7 ? userId : 1000 + i,
                    username: i === 0 ? "MinionsKing" : i === 1 ? "BananaHunter" : i === 7 ? userName : `Player${1000 + i}`,
                    level: Math.floor(Math.random() * 10) + 10,
                    score: Math.floor(Math.random() * 50000) + 10000,
                    isMe: i === 7
                });
            }
            
            // Сортировка по убыванию очков
            globalLeaderboard.sort((a, b) => b.score - a.score);
            
            // Рейтинг друзей
            const friendsLeaderboard = [
                {
                    id: userId,
                    username: userName,
                    level: window.gameState?.level || 5,
                    score: window.gameState?.totalBananas || 5000,
                    isMe: true
                }
            ];
            
            // Добавляем случайных друзей
            const friendIndices = [0, 2, 5, 9, 12];
            friendIndices.forEach(index => {
                if (globalLeaderboard[index] && !globalLeaderboard[index].isMe) {
                    const friend = { ...globalLeaderboard[index], isMe: false };
                    friendsLeaderboard.push(friend);
                }
            });
            
            // Сортировка друзей по убыванию очков
            friendsLeaderboard.sort((a, b) => b.score - a.score);
            
            return {
                global: globalLeaderboard,
                friends: friendsLeaderboard,
                lastUpdate: Date.now()
            };
        },
        
        // Обновление данных текущего пользователя в рейтинге
        updateCurrentUserData: function() {
            if (!window.gameState) return false;
            
            const updateInList = (list) => {
                if (!list || !Array.isArray(list)) return;
                
                const currentUser = list.find(player => player.isMe);
                if (currentUser) {
                    currentUser.level = window.gameState.level || 1;
                    currentUser.score = window.gameState.totalBananas || 0;
                    
                    // Пересортировка списка
                    list.sort((a, b) => b.score - a.score);
                }
            };
            
            // Обновляем в обоих списках
            updateInList(this.data.global);
            updateInList(this.data.friends);
            
            // Отправляем событие об обновлении данных
            document.dispatchEvent(new CustomEvent('leaderboardDataUpdated', { 
                detail: { data: this.data } 
            }));
            
            return true;
        }
    }
};

// Инициализация TagManager при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем теги игрока
    TagManager.tags.load();
    
    // Загружаем показанные подсказки
    TagManager.tips.load();
    
    // Инициализируем Telegram WebApp
    TagManager.init();
    
    // Инициализируем обработчики событий для кнопок подсказок
    document.querySelectorAll('.tip-button').forEach(button => {
        const tipId = button.getAttribute('data-tip');
        if (tipId) {
            button.addEventListener('click', function() {
                TagManager.tips.show(tipId);
            });
        }
    });
    
    // Если есть обработчик событий Telegram WebApp
    if (TagManager.tgApp) {
        TagManager.tgApp.onEvent('viewportChanged', function() {
            // Проверяем, нужно ли обновить данные рейтинга
            if (document.querySelector('#leaderboard-tab-content.active') && 
                (!TagManager.leaderboard.data.lastUpdate || 
                Date.now() - TagManager.leaderboard.data.lastUpdate > 5 * 60 * 1000)) {
                TagManager.leaderboard.requestLeaderboardData();
            }
        });
        
        // Добавляем обработчик для обработки данных от бота
        TagManager.tgApp.onEvent('mainButtonClicked', function() {
            if (TagManager.tgApp.MainButton.text === "ПОЛУЧИТЬ РЕЙТИНГ") {
                // Обрабатываем данные рейтинга от бота
                console.log("Обработка данных рейтинга от бота");
                
                // В реальном сценарии бот должен отправить данные
                // Здесь мы создаем тестовые данные для демонстрации
                TagManager.leaderboard.handleLeaderboardData(
                    TagManager.leaderboard.generateTestData()
                );
            }
        });
    }
    
    // Синхронизация рейтинга с изменениями в игре
    window.addEventListener('gameStateUpdated', function() {
        if (TagManager.leaderboard && TagManager.leaderboard.data.lastUpdate) {
            TagManager.leaderboard.updateCurrentUserData();
        }
    });
});

// Экспортируем глобальный объект для доступа из других скриптов
window.TagManager = TagManager;
