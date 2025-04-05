// Game Configuration
const CONFIG = {
    // Resource paths
    IMAGES: {
        MINION: 'images/minion.png',
        MINION_HAPPY: 'images/minion-happy.png',
        MINION_SHOCKED: 'images/minion-shocked.png',
        SIMPLE_BOX: 'images/simple-box.png',
        STANDARD_BOX: 'images/standard-box.png',
        PREMIUM_BOX: 'images/premium-box.png',
        MEGA_BOX: 'images/mega-box.png',
        BANANA: 'images/banana.png',
        STAR: 'images/star.png',
        WHEEL: 'images/wheel.png',
        POINTER: 'images/pointer.png'
    },

    SOUNDS: {
        CLICK: 'sounds/click.mp3',
        MINION_HAPPY: 'sounds/minion-happy.mp3',
        MINION_SHOCKED: 'sounds/minion-shocked.mp3',
        BOX: 'sounds/box.mp3',
        TASK: 'sounds/task.mp3',
        LEVEL_UP: 'sounds/level-up.mp3',
        WHEEL: 'sounds/wheel.mp3'
    },

    // Fallback resources
    FALLBACK_IMAGE: 'images/fallback.png',

    // Game settings
    SAVE_INTERVAL: 30000, // 30 seconds
    ANIMATION_DURATION: 1000, // 1 second
    POPUP_DURATION: 3000, // 3 seconds
    CONFETTI_COUNT: 50,
    VIBRATION_DURATION: 50,

    // Box configurations
    BOXES: {
        SIMPLE: {
            cost: { bananas: 10 },
            rewards: [
                { type: 'bananas', amount: 5, text: '+5 бананов' },
                { type: 'stars', amount: 1, text: '+1 звезда' },
                { type: 'exp', amount: 5, text: '+5 опыта' }
            ]
        },
        STANDARD: {
            cost: { bananas: 25 },
            rewards: [
                { type: 'bananas', amount: 15, text: '+15 бананов' },
                { type: 'stars', amount: 3, text: '+3 звезды' },
                { type: 'exp', amount: 10, text: '+10 опыта' }
            ]
        },
        PREMIUM: {
            cost: { stars: 5 },
            rewards: [
                { type: 'bananas', amount: 50, text: '+50 бананов' },
                { type: 'stars', amount: 10, text: '+10 звезд' },
                { type: 'exp', amount: 25, text: '+25 опыта' }
            ]
        },
        MEGA: {
            cost: { stars: 15 },
            rewards: [
                { type: 'bananas', amount: 100, text: '+100 бананов' },
                { type: 'stars', amount: 20, text: '+20 звезд' },
                { type: 'exp', amount: 50, text: '+50 опыта' }
            ]
        }
    },

    // Task configurations
    TASKS: {
        1: { text: 'Погладить миньона 10 раз', target: 10, reward: { type: 'bananas', amount: 100 } },
        2: { text: 'Собрать 100 бананов', target: 100, reward: { type: 'bananas', amount: 50 } },
        3: { text: 'Собрать 50 бананов за день', target: 50, reward: { type: 'bananas', amount: 20 } },
        4: { text: 'Собрать 10 звезд', target: 10, reward: { type: 'stars', amount: 5 } },
        5: { text: 'Открыть 5 коробок', target: 5, reward: { type: 'stars', amount: 10 } },
        6: { text: 'Достичь 3 уровня', target: 3, reward: { type: 'stars', amount: 15 } },
        7: { text: 'Пригласить 3 друзей', target: 3, reward: { type: 'both', bananas: 50, stars: 5 } },
        8: { text: 'Собрать 20 звезд', target: 20, reward: { type: 'stars', amount: 8 } },
        9: { text: 'Собрать 30 звезд', target: 30, reward: { type: 'stars', amount: 10 } },
        10: { text: 'Собрать 200 бананов', target: 200, reward: { type: 'bananas', amount: 150 } }
    },

    // Level configurations
    LEVELS: {
        BASE_EXP: 100,
        EXP_MULTIPLIER: 1.5,
        REWARDS: {
            BANANAS_MULTIPLIER: 10,
            STARS_DIVISOR: 2,
            STARS_BONUS: 1
        }
    },

    // Default game settings
    DEFAULT_SETTINGS: {
        soundEnabled: true,
        vibrationEnabled: true,
        notificationsEnabled: true
    },

    // Server configuration
    SERVER: {
        URL: 'https://minions-game-server.glitch.me/api',
        ENDPOINTS: {
            SYNC: '/sync',
            DAILY: '/daily',
            ACHIEVEMENTS: '/achievements'
        },
        TIMEOUT: 5000
    }
};

// Initialize game settings
window.gameSettings = { ...CONFIG.DEFAULT_SETTINGS };

// Load saved settings
try {
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
        window.gameSettings = { ...window.gameSettings, ...JSON.parse(savedSettings) };
    }
} catch (error) {
    console.error('Error loading game settings:', error);
}

// Game State Manager
class GameStateManager {
    constructor() {
        this.state = {
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
            invitedFriends: 0,
            lastSaveTime: Date.now(),
            petCount: 0,
            achievements: ['Начинающий миньоновод'],
            taskProgress: {
                task1: 0, task2: 0, task3: 0, task4: 0, task5: 0,
                task6: 0, task7: 0, task8: 0, task9: 0, task10: 0
            }
        };
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    update(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
        this.save();
    }

    async save() {
        try {
            localStorage.setItem('minionsGameState', JSON.stringify(this.state));
            if (Date.now() - this.state.lastSaveTime > CONFIG.SAVE_INTERVAL) {
                await this.syncWithServer();
            }
        } catch (error) {
            console.error('Error saving game state:', error);
        }
    }

    async syncWithServer() {
        if (!window.tg?.initDataUnsafe?.user?.id) return;
        
        try {
            const response = await fetch(`${CONFIG.SERVER.URL}/save-progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: window.tg.initDataUnsafe.user.id.toString(),
                    gameState: this.state
                })
            });
            
            if (response.ok) {
                this.state.lastSaveTime = Date.now();
            }
        } catch (error) {
            console.error('Error syncing with server:', error);
        }
    }
}

// Resource Manager
class ResourceManager {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
        this.loadedResources = 0;
        this.totalResources = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    async preloadResources(onProgress, onComplete) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;

        const resources = [
            // Images
            { type: 'image', id: 'minion', path: 'images/minion.png' },
            { type: 'image', id: 'minion-happy', path: 'images/minion-happy.png' },
            { type: 'image', id: 'minion-shocked', path: 'images/minion-shocked.png' },
            { type: 'image', id: 'simple-box', path: 'images/simple-box.png' },
            { type: 'image', id: 'standard-box', path: 'images/standard-box.png' },
            { type: 'image', id: 'premium-box', path: 'images/premium-box.png' },
            { type: 'image', id: 'mega-box', path: 'images/mega-box.png' },
            { type: 'image', id: 'banana', path: 'images/banana.png' },
            { type: 'image', id: 'star', path: 'images/star.png' },
            { type: 'image', id: 'wheel', path: 'images/wheel.png' },
            { type: 'image', id: 'pointer', path: 'images/pointer.png' },
            
            // Sounds
            { type: 'sound', id: 'click', path: 'sounds/click.mp3' },
            { type: 'sound', id: 'minionHappy', path: 'sounds/minion-happy.mp3' },
            { type: 'sound', id: 'minionShocked', path: 'sounds/minion-shocked.mp3' },
            { type: 'sound', id: 'box', path: 'sounds/box.mp3' },
            { type: 'sound', id: 'task', path: 'sounds/task.mp3' },
            { type: 'sound', id: 'levelUp', path: 'sounds/level-up.mp3' },
            { type: 'sound', id: 'wheel', path: 'sounds/wheel.mp3' }
        ];

        this.totalResources = resources.length;
        this.loadedResources = 0;

        const loadPromises = resources.map(resource => this.loadResource(resource));
        await Promise.all(loadPromises);

        if (this.onComplete) {
            this.onComplete();
        }
    }

    async loadResource(resource) {
        try {
            if (resource.type === 'image') {
                await this.loadImage(resource.id, resource.path);
            } else if (resource.type === 'sound') {
                await this.loadSound(resource.id, resource.path);
            }
        } catch (error) {
            console.error(`Error loading ${resource.type} ${resource.id}:`, error);
            // Use fallback resources if available
            if (resource.type === 'image') {
                this.images.set(resource.id, CONFIG.FALLBACK_IMAGE);
            }
        }
    }

    async loadImage(id, path) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(id, img);
                this.updateProgress();
                resolve();
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${path}`));
            img.src = path;
        });
    }

    async loadSound(id, path) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.sounds.set(id, audio);
                this.updateProgress();
                resolve();
            };
            audio.onerror = () => reject(new Error(`Failed to load sound: ${path}`));
            audio.src = path;
        });
    }

    updateProgress() {
        this.loadedResources++;
        if (this.onProgress) {
            const progress = (this.loadedResources / this.totalResources) * 100;
            this.onProgress(progress);
        }
    }

    getImage(id) {
        return this.images.get(id) || CONFIG.FALLBACK_IMAGE;
    }

    playSound(id) {
        if (!window.gameSettings.soundEnabled) return;

        const sound = this.sounds.get(id);
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.error(`Error playing sound ${id}:`, error);
            });
        }
    }

    stopSound(id) {
        const sound = this.sounds.get(id);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
        }
    }

    stopAllSounds() {
        this.sounds.forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
    }
}

// UI Manager
class UIManager {
    constructor(gameState, resourceManager) {
        this.gameState = gameState;
        this.resourceManager = resourceManager;
        this.elements = this.cacheElements();
        this.setupEventListeners();
    }

    cacheElements() {
        return {
            menuItems: document.querySelectorAll('.menu-item'),
            settingsToggles: document.querySelectorAll('.settings-toggle'),
            gameButtons: document.querySelectorAll('.game-button'),
            interactiveMinion: document.querySelector('.interactive-minion'),
            achievementsList: document.querySelector('.achievements-list'),
            levelProgress: document.querySelector('.level-progress'),
            popupMessage: document.querySelector('.popup-message'),
            boxAnimation: document.querySelector('.box-animation'),
            confettiContainer: document.querySelector('.confetti-container')
        };
    }

    setupEventListeners() {
        // Menu items
        this.elements.menuItems.forEach(item => {
            item.addEventListener('click', () => this.handleMenuItemClick(item));
        });

        // Settings toggles
        this.elements.settingsToggles.forEach(toggle => {
            toggle.addEventListener('change', () => this.handleSettingsToggle(toggle));
        });

        // Game buttons
        this.elements.gameButtons.forEach(button => {
            button.addEventListener('click', () => this.handleGameButtonClick(button));
        });

        // Interactive minion
        if (this.elements.interactiveMinion) {
            this.elements.interactiveMinion.addEventListener('click', () => this.handleMinionClick());
        }
    }

    handleMenuItemClick(item) {
        const action = item.dataset.action;
        switch (action) {
            case 'invite':
                this.inviteFriend();
                break;
            case 'settings':
                this.toggleSettings();
                break;
            case 'help':
                this.showHelp();
                break;
        }
    }

    handleSettingsToggle(toggle) {
        const setting = toggle.dataset.setting;
        const value = toggle.checked;
        window.gameSettings[setting] = value;
        localStorage.setItem('gameSettings', JSON.stringify(window.gameSettings));
    }

    handleGameButtonClick(button) {
        const action = button.dataset.action;
        if (action.startsWith('box-')) {
            const boxType = action.replace('box-', '');
            gameLogic.openBox(boxType);
        }
    }

    handleMinionClick() {
        const state = this.gameState.state;
        this.gameState.update({
            petCount: state.petCount + 1,
            bananas: state.bananas + 1,
            totalBananas: state.totalBananas + 1
        });
        
        this.resourceManager.playSound('minionHappy');
        if (window.gameSettings.vibrationEnabled) {
            navigator.vibrate(50);
        }
        
        this.showMinionAnimation();
        this.checkPetAchievements();
    }

    showMinionAnimation() {
        const minion = this.elements.interactiveMinion;
        minion.classList.add('happy');
        setTimeout(() => minion.classList.remove('happy'), 1000);
    }

    checkPetAchievements() {
        const state = this.gameState.state;
        if (state.petCount >= 10 && state.taskProgress.task1 < 1) {
            this.gameState.update({
                taskProgress: {
                    ...state.taskProgress,
                    task1: 1
                }
            });
            gameLogic.completeTask(1);
        }
    }

    updateAchievements() {
        const state = this.gameState.state;
        const achievements = [
            { id: 1, text: 'Погладить миньона 10 раз', progress: state.petCount, target: 10 },
            { id: 2, text: 'Собрать 100 бананов', progress: state.totalBananas, target: 100 },
            { id: 3, text: 'Собрать 50 бананов за день', progress: state.bananas, target: 50 },
            { id: 4, text: 'Собрать 10 звезд', progress: state.totalStars, target: 10 },
            { id: 5, text: 'Открыть 5 коробок', progress: state.openedBoxes, target: 5 },
            { id: 6, text: 'Достичь 3 уровня', progress: state.level, target: 3 },
            { id: 7, text: 'Пригласить 3 друзей', progress: state.invitedFriends, target: 3 },
            { id: 8, text: 'Собрать 20 звезд', progress: state.totalStars, target: 20 },
            { id: 9, text: 'Собрать 30 звезд', progress: state.totalStars, target: 30 },
            { id: 10, text: 'Собрать 200 бананов', progress: state.totalBananas, target: 200 }
        ];

        this.elements.achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement ${achievement.progress >= achievement.target ? 'completed' : ''}">
                <span class="achievement-text">${achievement.text}</span>
                <span class="achievement-progress">${achievement.progress}/${achievement.target}</span>
            </div>
        `).join('');
    }

    updateLevelProgress() {
        const state = this.gameState.state;
        const expNeeded = Math.floor(100 * Math.pow(1.5, state.level - 1));
        const progress = (state.exp / expNeeded) * 100;
        
        this.elements.levelProgress.style.width = `${progress}%`;
        this.elements.levelProgress.textContent = `Уровень ${state.level} (${state.exp}/${expNeeded})`;
    }

    showPopup(message, duration = 3000) {
        const popup = this.elements.popupMessage;
        popup.textContent = message;
        popup.classList.add('show');
        
        setTimeout(() => {
            popup.classList.remove('show');
        }, duration);
    }

    showBoxAnimation(type, rewardText) {
        const box = this.elements.boxAnimation;
        box.innerHTML = `
            <div class="box ${type}">
                <div class="box-content">
                    <img src="${this.resourceManager.getImage(`${type}-box`)}" alt="${type} box">
                    <div class="reward-text">${rewardText}</div>
                </div>
            </div>
        `;
        
        box.classList.add('show');
        setTimeout(() => box.classList.remove('show'), 2000);
    }

    showLevelUpAnimation() {
        const popup = document.createElement('div');
        popup.className = 'level-up-popup';
        popup.textContent = `Уровень ${this.gameState.state.level}!`;
        document.body.appendChild(popup);
        
        setTimeout(() => popup.remove(), 2000);
    }

    showTaskCompletion(taskId, reward) {
        const rewardText = this.getRewardText(reward);
        this.showPopup(`Задание ${taskId} выполнено! Награда: ${rewardText}`);
    }

    getRewardText(reward) {
        if (reward.type === 'bananas') {
            return `${reward.amount} бананов`;
        } else if (reward.type === 'stars') {
            return `${reward.amount} звезд`;
        } else if (reward.type === 'both') {
            return `${reward.bananas} бананов и ${reward.stars} звезд`;
        }
        return '';
    }

    createConfetti() {
        const container = this.elements.confettiContainer;
        container.innerHTML = '';
        
        for (let i = 0; i < CONFIG.CONFETTI_COUNT; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 3}s`;
            container.appendChild(confetti);
        }
        
        setTimeout(() => container.innerHTML = '', 3000);
    }

    inviteFriend() {
        if (window.Telegram.WebApp) {
            window.Telegram.WebApp.share({
                text: 'Присоединяйся к игре с миньонами!',
                url: window.location.href
            });
            
            const state = this.gameState.state;
            this.gameState.update({
                invitedFriends: state.invitedFriends + 1
            });
            
            if (state.invitedFriends >= 3 && state.taskProgress.task7 < 1) {
                this.gameState.update({
                    taskProgress: {
                        ...state.taskProgress,
                        task7: 1
                    }
                });
                gameLogic.completeTask(7);
            }
        }
    }

    toggleSettings() {
        const settingsPanel = document.querySelector('.settings-panel');
        settingsPanel.classList.toggle('show');
    }

    showHelp() {
        this.showPopup('Поглаживайте миньона, собирайте бананы и звезды, открывайте коробки и выполняйте задания!');
    }
}

// Game Logic Manager
class GameLogicManager {
    constructor(gameState, resourceManager, uiManager) {
        this.gameState = gameState;
        this.resourceManager = resourceManager;
        this.uiManager = uiManager;
    }

    openBox(type) {
        try {
            const boxConfig = this.getBoxConfig(type);
            if (!boxConfig) return false;

            if (this.canOpenBox(type)) {
                this.deductResources(type);
                const reward = this.calculateReward(type);
                this.applyReward(reward);
                this.incrementBoxCount();
                this.checkBoxTasks();
                this.showBoxAnimation(type, reward.text);
                return true;
            } else {
                this.showInsufficientResources();
                return false;
            }
        } catch (error) {
            console.error('Error opening box:', error);
            return false;
        }
    }

    getBoxConfig(type) {
        const configs = {
            simple: { cost: { bananas: 10 }, rewards: [
                { type: 'bananas', amount: 5, text: '+5 бананов' },
                { type: 'stars', amount: 1, text: '+1 звезда' },
                { type: 'exp', amount: 5, text: '+5 опыта' }
            ]},
            standard: { cost: { bananas: 25 }, rewards: [
                { type: 'bananas', amount: 15, text: '+15 бананов' },
                { type: 'stars', amount: 3, text: '+3 звезды' },
                { type: 'exp', amount: 10, text: '+10 опыта' }
            ]},
            premium: { cost: { stars: 5 }, rewards: [
                { type: 'bananas', amount: 50, text: '+50 бананов' },
                { type: 'stars', amount: 10, text: '+10 звезд' },
                { type: 'exp', amount: 25, text: '+25 опыта' }
            ]},
            mega: { cost: { stars: 15 }, rewards: [
                { type: 'bananas', amount: 100, text: '+100 бананов' },
                { type: 'stars', amount: 20, text: '+20 звезд' },
                { type: 'exp', amount: 50, text: '+50 опыта' }
            ]}
        };
        return configs[type];
    }

    canOpenBox(type) {
        const config = this.getBoxConfig(type);
        if (!config) return false;

        const { cost } = config;
        return Object.entries(cost).every(([resource, amount]) => 
            this.gameState.state[resource] >= amount
        );
    }

    deductResources(type) {
        const config = this.getBoxConfig(type);
        if (!config) return;

        const { cost } = config;
        Object.entries(cost).forEach(([resource, amount]) => {
            this.gameState.update({
                [resource]: this.gameState.state[resource] - amount
            });
        });
    }

    calculateReward(type) {
        const config = this.getBoxConfig(type);
        if (!config) return null;

        const randomIndex = Math.floor(Math.random() * config.rewards.length);
        return config.rewards[randomIndex];
    }

    applyReward(reward) {
        if (!reward) return;

        const updates = {};
        if (reward.type === 'bananas') {
            updates.bananas = this.gameState.state.bananas + reward.amount;
            updates.totalBananas = this.gameState.state.totalBananas + reward.amount;
        } else if (reward.type === 'stars') {
            updates.stars = this.gameState.state.stars + reward.amount;
            updates.totalStars = this.gameState.state.totalStars + reward.amount;
        } else if (reward.type === 'exp') {
            this.addExperience(reward.amount);
        }

        if (Object.keys(updates).length > 0) {
            this.gameState.update(updates);
        }
    }

    incrementBoxCount() {
        this.gameState.update({
            openedBoxes: this.gameState.state.openedBoxes + 1
        });
    }

    checkBoxTasks() {
        const state = this.gameState.state;
        if (state.openedBoxes >= 5 && state.taskProgress.task5 < 1) {
            this.gameState.update({
                taskProgress: {
                    ...state.taskProgress,
                    task5: 1
                }
            });
            this.completeTask(5);
        }
    }

    showBoxAnimation(type, rewardText) {
        this.resourceManager.playSound('box');
        if (window.gameSettings.vibrationEnabled) {
            navigator.vibrate([100, 50, 200]);
        }
        this.uiManager.showBoxAnimation(type, rewardText);
    }

    showInsufficientResources() {
        this.uiManager.showPopup('Недостаточно ресурсов!');
        this.resourceManager.playSound('minionShocked');
    }

    addExperience(amount) {
        const state = this.gameState.state;
        const expNeeded = Math.floor(100 * Math.pow(1.5, state.level - 1));
        let currentExp = state.exp || 0;
        currentExp += amount;

        if (currentExp >= expNeeded) {
            // Level up
            const newLevel = state.level + 1;
            const remainingExp = currentExp - expNeeded;
            
            this.gameState.update({
                level: newLevel,
                exp: remainingExp,
                bananas: state.bananas + (10 * newLevel),
                totalBananas: state.totalBananas + (10 * newLevel),
                stars: state.stars + Math.floor(newLevel / 2) + 1,
                totalStars: state.totalStars + Math.floor(newLevel / 2) + 1
            });

            this.uiManager.showLevelUpAnimation();
            
            if (newLevel >= 3 && state.taskProgress.task6 < 1) {
                this.gameState.update({
                    taskProgress: {
                        ...state.taskProgress,
                        task6: 1
                    }
                });
                this.completeTask(6);
            }
        } else {
            this.gameState.update({ exp: currentExp });
        }

        this.uiManager.updateLevelProgress();
    }

    completeTask(taskId) {
        const state = this.gameState.state;
        if (state.taskProgress[`task${taskId}`] >= 1) return;

        const reward = this.getTaskReward(taskId);
        if (!reward) return;

        this.gameState.update({
            taskProgress: {
                ...state.taskProgress,
                [`task${taskId}`]: 1
            },
            completedTasks: state.completedTasks + 1,
            ...this.calculateTaskReward(reward)
        });

        this.uiManager.showTaskCompletion(taskId, reward);
        this.resourceManager.playSound('task');
        if (window.gameSettings.vibrationEnabled) {
            navigator.vibrate([100, 30, 100, 30, 100]);
        }
        this.uiManager.createConfetti();
    }

    getTaskReward(taskId) {
        const rewards = {
            1: { type: 'bananas', amount: 100 },
            2: { type: 'bananas', amount: 50 },
            3: { type: 'bananas', amount: 20 },
            4: { type: 'stars', amount: 5 },
            5: { type: 'stars', amount: 10 },
            6: { type: 'stars', amount: 15 },
            7: { type: 'both', bananas: 50, stars: 5 },
            8: { type: 'stars', amount: 8 },
            9: { type: 'stars', amount: 10 },
            10: { type: 'bananas', amount: 150 }
        };
        return rewards[taskId];
    }

    calculateTaskReward(reward) {
        if (reward.type === 'bananas') {
            return {
                bananas: this.gameState.state.bananas + reward.amount,
                totalBananas: this.gameState.state.totalBananas + reward.amount
            };
        } else if (reward.type === 'stars') {
            return {
                stars: this.gameState.state.stars + reward.amount,
                totalStars: this.gameState.state.totalStars + reward.amount
            };
        } else if (reward.type === 'both') {
            return {
                bananas: this.gameState.state.bananas + reward.bananas,
                totalBananas: this.gameState.state.totalBananas + reward.bananas,
                stars: this.gameState.state.stars + reward.stars,
                totalStars: this.gameState.state.totalStars + reward.stars
            };
        }
        return {};
    }
}

// Initialize game components
let gameStateManager, resourceManager, uiManager, gameLogic;

// Initialize game
async function initializeGame() {
    try {
        // Show loading screen
        showLoadingScreen();

        // Initialize managers
        gameStateManager = new GameStateManager();
        resourceManager = new ResourceManager();
        uiManager = new UIManager(gameStateManager, resourceManager);
        gameLogic = new GameLogicManager(gameStateManager, resourceManager, uiManager);

        // Preload resources
        await resourceManager.preloadResources(
            updateLoadingProgress,
            () => {
                hideLoadingScreen();
                startGame();
            }
        );
    } catch (error) {
        console.error('Error initializing game:', error);
        showError('Ошибка при загрузке игры. Пожалуйста, попробуйте еще раз.');
    }
}

// Loading screen functions
function showLoadingScreen() {
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <img src="${CONFIG.IMAGES.MINION}" alt="Loading..." class="loading-minion">
            <div class="loading-text">Загрузка игры...</div>
            <div class="loading-progress">
                <div class="progress-bar"></div>
            </div>
        </div>
    `;
    document.body.appendChild(loadingScreen);
}

function updateLoadingProgress(progress) {
    const progressBar = document.querySelector('.loading-progress .progress-bar');
    if (progressBar) {
        progressBar.style.width = `${progress}%`;
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.querySelector('.loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('fade-out');
        setTimeout(() => loadingScreen.remove(), CONFIG.ANIMATION_DURATION);
    }
}

function showError(message) {
    const errorScreen = document.createElement('div');
    errorScreen.className = 'error-screen';
    errorScreen.innerHTML = `
        <div class="error-content">
            <img src="${CONFIG.IMAGES.MINION_SHOCKED}" alt="Error" class="error-minion">
            <div class="error-text">${message}</div>
            <button class="retry-button" onclick="location.reload()">Попробовать снова</button>
        </div>
    `;
    document.body.appendChild(errorScreen);
}

// Start game
function startGame() {
    try {
        // Initialize Telegram WebApp
        if (window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
        }

        // Set up auto-save
        setInterval(() => gameStateManager.save(), CONFIG.SAVE_INTERVAL);

        // Initialize UI
        uiManager.updateAchievements();
        uiManager.updateLevelProgress();

        // Check daily reward
        checkDailyReward();

        // Add event listeners for visibility change
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Show welcome message
        uiManager.showPopup('Добро пожаловать в игру с миньонами!');

        // Export for debugging
        window.gameState = gameStateManager;
        window.ui = uiManager;
        window.resources = resourceManager;
        window.logic = gameLogic;
    } catch (error) {
        console.error('Error starting game:', error);
        showError('Ошибка при запуске игры. Пожалуйста, попробуйте еще раз.');
    }
}

// Handle visibility change
function handleVisibilityChange() {
    if (document.hidden) {
        gameStateManager.save();
    } else {
        checkDailyReward();
    }
}

// Check daily reward
function checkDailyReward() {
    const lastReward = localStorage.getItem('lastDailyReward');
    const today = new Date().toDateString();

    if (lastReward !== today) {
        const state = gameStateManager.state;
        gameStateManager.update({
            bananas: state.bananas + 10,
            totalBananas: state.totalBananas + 10,
            stars: state.stars + 1,
            totalStars: state.totalStars + 1
        });

        localStorage.setItem('lastDailyReward', today);
        uiManager.showPopup('Ежедневная награда: 10 бананов и 1 звезда!');
        resourceManager.playSound('reward');
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', initializeGame);

// Handle errors
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Game error:', { message, source, lineno, colno, error });
    showError('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
    return false;
};

// Инициализация интерактивного миньона
function initInteractiveMinion() {
    try {
        const minion = document.getElementById('interactive-minion');
        if (!minion) return;

        let petCount = 0;
        const maxPets = 5;
        let lastPetTime = 0;
        const petCooldown = 500; // 500ms cooldown between pets

        minion.addEventListener('click', function(e) {
            const now = Date.now();
            if (now - lastPetTime < petCooldown) return;
            lastPetTime = now;

            petCount = (petCount + 1) % maxPets;
            
            // Increase pet count
            gameStateManager.update({
                petCount: gameStateManager.state.petCount + 1
            });
            
            // Give banana every 5 pets
            if (gameStateManager.state.petCount % 5 === 0) {
                gameStateManager.update({
                    bananas: gameStateManager.state.bananas + 1,
                    totalBananas: gameStateManager.state.totalBananas + 1
                });
                showPopup('+1 банан за заботу о миньоне!');
                uiManager.updateStats();
                
                // Check minion feeding task
                if (gameStateManager.state.petCount >= 25 && gameStateManager.state.taskProgress.task3 < 5) {
                    gameStateManager.update({
                        taskProgress: {
                            ...gameStateManager.state.taskProgress,
                            task3: Math.min(5, Math.floor(gameStateManager.state.petCount / 5))
                        }
                    });
                    uiManager.updateTaskProgress();
                    
                    if (gameStateManager.state.taskProgress.task3 >= 5) {
                        completeTask(3);
                    }
                }
            }

            // Animation
            minion.classList.add('pet-animation');
            setTimeout(() => minion.classList.remove('pet-animation'), 500);

            // Sound and vibration
            resourceManager.playSound('minionHappy');
            if (window.gameSettings.vibrationEnabled) {
                navigator.vibrate(50);
            }
        });
    } catch (error) {
        console.error('Error initializing interactive minion:', error);
    }
}

// Обновление достижений
function updateAchievements() {
    try {
        const achievementsList = document.getElementById('achievements-list');
        if (!achievementsList) return;

        achievementsList.innerHTML = '';
        
        // Display all achievements
        gameStateManager.state.achievements.forEach(achievement => {
            const item = document.createElement('div');
            item.className = 'achievement-item';
            item.textContent = achievement;
            achievementsList.appendChild(item);
        });

        // Check for 5 achievements task
        if (gameStateManager.state.achievements.length >= 5 && gameStateManager.state.taskProgress.task7 < 1) {
            gameStateManager.update({
                taskProgress: {
                    ...gameStateManager.state.taskProgress,
                    task7: 1
                }
            });
            completeTask(7);
        }

        // Define achievements
        const achievements = [
            { id: 'beginner', title: 'Начинающий миньоновод', condition: () => true },
            { id: 'collector', title: 'Банановый коллекционер', condition: () => gameStateManager.state.totalBananas >= 50 },
            { id: 'star_gatherer', title: 'Звездочёт', condition: () => gameStateManager.state.totalStars >= 15 },
            { id: 'box_opener', title: 'Распаковщик', condition: () => gameStateManager.state.openedBoxes >= 10 },
            { id: 'box_master', title: 'Мастер кейсов', condition: () => gameStateManager.state.openedBoxes >= 25 },
            { id: 'task_master', title: 'Исполнительный миньон', condition: () => gameStateManager.state.completedTasks >= 5 },
            { id: 'minion_friend', title: 'Друг миньонов', condition: () => gameStateManager.state.petCount >= 50 },
            { id: 'minion_lover', title: 'Заботливый хозяин', condition: () => gameStateManager.state.petCount >= 100 },
            { id: 'invite_king', title: 'Социальная бабочка', condition: () => gameStateManager.state.invitedFriends >= 5 },
            { id: 'daily_master', title: 'Постоянный игрок', condition: () => gameStateManager.state.activeDays >= 7 },
            { id: 'streak_master', title: 'Верный миньон', condition: () => gameStateManager.state.streak >= 3 },
            { id: 'high_level', title: 'Опытный миньоновод', condition: () => gameStateManager.state.level >= 5 }
        ];

        // Check and add new achievements
        achievements.forEach(achievement => {
            if (achievement.condition() && !gameStateManager.state.achievements.includes(achievement.title)) {
                gameStateManager.update({
                    achievements: [...gameStateManager.state.achievements, achievement.title]
                });
                
                // Show achievement notification
                showPopup(`Новое достижение: ${achievement.title}!`);
                resourceManager.playSound('achievement');
                if (window.gameSettings.vibrationEnabled) {
                    navigator.vibrate([100, 50, 100]);
                }
            }
        });
    } catch (error) {
        console.error('Error updating achievements:', error);
    }
}

// Функция приглашения друзей
function inviteFriend() {
    try {
        if (window.tg) {
            window.tg.share({
                text: 'Присоединяйся к игре с миньонами!',
                url: window.location.href
            });
            
            // Increase invited friends counter
            gameStateManager.update({
                invitedFriends: gameStateManager.state.invitedFriends + 1,
                taskProgress: {
                    ...gameStateManager.state.taskProgress,
                    task1: Math.min(10, gameStateManager.state.invitedFriends + 1)
                }
            });
            
            uiManager.updateTaskProgress();
            
            // Check task completion
            if (gameStateManager.state.invitedFriends >= 10 && gameStateManager.state.taskProgress.task1 < 1) {
                completeTask(1);
            }
            
            resourceManager.playSound('task');
            if (window.gameSettings.vibrationEnabled) {
                navigator.vibrate(50);
            }
        }
    } catch (error) {
        console.error('Error inviting friend:', error);
    }
}

// Функция кручения колеса фортуны
function spinWheel() {
    console.log("Кручение колеса фортуны");
    
    try {
        // Проверяем, достаточно ли звезд
        if (gameStateManager.state.stars < 3) {
            showPopup('Недостаточно звезд! Требуется 3 звезды.');
            resourceManager.playSound('minionShocked');
            return;
        }
        
        // Списываем звезды
        gameStateManager.update({
            stars: gameStateManager.state.stars - 3
        });
        
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
            resourceManager.playSound('wheel');
            if (window.gameSettings.vibrationEnabled) {
                navigator.vibrate([50, 50, 50, 50, 50, 50]);
            }
            
            // Выдаем награду после остановки колеса
            setTimeout(() => {
                processWheelReward(sector);
                
                // Скрываем колесо через 3 секунды
                setTimeout(() => {
                    wheelContainer.style.display = 'none';
                    const wheelResult = document.getElementById('wheel-result');
                    if (wheelResult) {
                        wheelResult.style.opacity = 0;
                    }
                    wheel.style.transition = 'none';
                }, 3000);
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
            case 1: // 5 бананов
                reward = { type: 'bananas', amount: 5, text: '+5 бананов' };
                break;
            case 2: // 10 бананов
                reward = { type: 'bananas', amount: 10, text: '+10 бананов' };
                break;
            case 3: // 20 бананов
                reward = { type: 'bananas', amount: 20, text: '+20 бананов' };
                break;
            case 4: // 1 звезда
                reward = { type: 'stars', amount: 1, text: '+1 звезда' };
                break;
            case 5: // 2 звезды
                reward = { type: 'stars', amount: 2, text: '+2 звезды' };
                break;
            case 6: // 5 опыта
                reward = { type: 'exp', amount: 5, text: '+5 опыта' };
                break;
            case 7: // 10 опыта
                reward = { type: 'exp', amount: 10, text: '+10 опыта' };
                break;
            case 8: // 50 бананов (джекпот)
                reward = { type: 'bananas', amount: 50, text: 'ДЖЕКПОТ! +50 бананов' };
                break;
        }
        
        // Применяем награду
        if (reward.type === 'bananas') {
            gameStateManager.update({
                bananas: gameStateManager.state.bananas + reward.amount,
                totalBananas: gameStateManager.state.totalBananas + reward.amount
            });
        } else if (reward.type === 'stars') {
            gameStateManager.update({
                stars: gameStateManager.state.stars + reward.amount,
                totalStars: gameStateManager.state.totalStars + reward.amount
            });
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
        resourceManager.playSound('reward');
        if (window.gameSettings.vibrationEnabled) {
            navigator.vibrate([200]);
        }
        
        // Создаем эффект конфетти
        createConfetti();
        
        // Обновляем статистику и сохраняем
        uiManager.updateStats();
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
});

// Функция для обработки ошибок без блокировки приложения
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

function preloadImages() {
    console.log('Начинаем предзагрузку изображений...');
    
    const fallbackImage = 'https://i.imgur.com/ZcukEsb.png'; // Общее fallback изображение
    
    for (const [key, src] of Object.entries(IMAGES)) {
        preloadedImages[key] = new Image();
        preloadedImages[key].src = src;
        preloadedImages[key].onerror = () => {
            console.warn(`Ошибка загрузки изображения ${key}. Использую fallback`);
            preloadedImages[key].src = fallbackImage;
        };
    }
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

// Серверный URL для синхронизации прогресса
const SERVER_URL = 'https://minions-game-server.glitch.me/api';

