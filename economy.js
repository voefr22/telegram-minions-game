// Экономические константы для более сбалансированной игры
const ECONOMY = {
    // Основные множители
    BANANA_VALUE: 1,       // Базовая ценность банана
    STAR_VALUE: 50,        // Ценность звезды в бананах
    
    // Стоимость миньонов для фермы (базовая + прирост за каждого)
    MINION_BASE_COST: 50,
    MINION_COST_INCREASE: 15,  // Было 10, увеличиваем для баланса
    
    // Производительность миньонов
    MINION_PRODUCTION: 1,      // Бананов в час на миньона
    EFFICIENCY_BOOST: 0.2,     // +20% к производству за уровень эффективности
    
    // Опыт
    EXP_PER_LEVEL: 100,       // Базовый опыт для первого уровня
    EXP_LEVEL_MULTIPLIER: 1.5, // Множитель опыта для каждого следующего уровня
    
    // Награды за уровень
    LEVEL_BANANA_REWARD: 10,   // Бананы за уровень (умножается на номер уровня)
    LEVEL_STAR_REWARD: 0.5,    // Звезды за уровень (целая часть от уровень * множитель)
    
    // Задания
    TASK_COMPLETION_EXP: 15,   // Опыт за выполнение задания
    
    // Клики по миньону
    CLICKS_PER_BANANA: 5,      // Количество кликов для получения банана
    CLICK_BANANA_REWARD: 1,    // Сколько бананов дается за каждые N кликов
    
    // Ежедневный вход
    DAILY_BASE_BANANA: 5,      // Базовая награда бананами за ежедневный вход
    DAILY_STREAK_BONUS: 2,     // Дополнительные бананы за каждый день подряд
    DAILY_BASE_STAR: 1,        // Базовая награда звездами
    DAILY_STAR_BONUS: 0.3      // Дополнительные звезды (целая часть от streak * бонус)
};

// Обновленные формулы для расчета стоимости и наград

// Стоимость найма нового миньона
function getMinionCost(currentMinions) {
    return Math.floor(ECONOMY.MINION_BASE_COST + (currentMinions * ECONOMY.MINION_COST_INCREASE));
}

// Опыт, необходимый для следующего уровня
function getExpForNextLevel(currentLevel) {
    return Math.floor(ECONOMY.EXP_PER_LEVEL * Math.pow(ECONOMY.EXP_LEVEL_MULTIPLIER, currentLevel - 1));
}

// Обновление функции награды за уровень
function calculateLevelReward(level) {
    const bananas = level * ECONOMY.LEVEL_BANANA_REWARD;
    const stars = Math.floor(level * ECONOMY.LEVEL_STAR_REWARD) + 1;
    
    return { bananas, stars };
}

// Награда за ежедневный вход с учетом серии входов
function calculateDailyReward(streak) {
    const bananas = ECONOMY.DAILY_BASE_BANANA + (streak * ECONOMY.DAILY_STREAK_BONUS);
    const stars = ECONOMY.DAILY_BASE_STAR + Math.floor(streak * ECONOMY.DAILY_STAR_BONUS);
    
    return { bananas, stars };
}

// Экспортируем константы и функции
window.ECONOMY = ECONOMY;
window.getMinionCost = getMinionCost;
window.getExpForNextLevel = getExpForNextLevel;
window.calculateLevelReward = calculateLevelReward;
window.calculateDailyReward = calculateDailyReward; 
