// Create snowflakes
function createSnowflakes() {
    const snowContainer = document.getElementById('snowContainer');
    const snowflakeCount = 50;

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.innerHTML = '❄';
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = Math.random() * 3 + 2 + 's';
        snowflake.style.opacity = Math.random();
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowContainer.appendChild(snowflake);
    }
}

// Initialize
createSnowflakes();

// Add click sound effect (optional)
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        // You can add hover sound effects here if needed
    });
});
