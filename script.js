// Card flip functionality
const card = document.querySelector('.card');
const cardContainer = document.querySelector('.card-container');

cardContainer.addEventListener('click', () => {
    card.classList.toggle('opened');
});

// Snow animation
function createSnowflake() {
    const snowContainer = document.getElementById('snowContainer');
    const snowflake = document.createElement('div');
    snowflake.classList.add('snowflake');
    snowflake.innerHTML = '❄';
    snowflake.style.left = Math.random() * 100 + '%';
    snowflake.style.animationDuration = Math.random() * 3 + 5 + 's';
    snowflake.style.opacity = Math.random();
    snowflake.style.fontSize = Math.random() * 10 + 10 + 'px';

    snowContainer.appendChild(snowflake);

    setTimeout(() => {
        snowflake.remove();
    }, 8000);
}

// Create snowflakes continuously
setInterval(createSnowflake, 200);

// Music functionality
const musicBtn = document.getElementById('musicBtn');
let isPlaying = false;

// Simple audio context for beep sounds (since we can't embed actual music files)
let audioContext;
let oscillator;

musicBtn.addEventListener('click', () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (!isPlaying) {
        playChristmasJingle();
        musicBtn.textContent = '🎵 Stop Music';
        isPlaying = true;
    } else {
        stopMusic();
        musicBtn.textContent = '🎵 Play Music';
        isPlaying = false;
    }
});

function playChristmasJingle() {
    // Simple Christmas jingle using Web Audio API
    const notes = [
        { freq: 523.25, duration: 0.3 }, // C
        { freq: 659.25, duration: 0.3 }, // E
        { freq: 783.99, duration: 0.3 }, // G
        { freq: 659.25, duration: 0.3 }, // E
        { freq: 523.25, duration: 0.6 }, // C
    ];

    let currentTime = audioContext.currentTime;

    function playNotes() {
        notes.forEach((note, index) => {
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);

            osc.frequency.value = note.freq;
            osc.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration);

            osc.start(currentTime);
            osc.stop(currentTime + note.duration);

            currentTime += note.duration;
        });

        if (isPlaying) {
            setTimeout(playNotes, notes.reduce((sum, n) => sum + n.duration, 0) * 1000 + 500);
        }
    }

    playNotes();
}

function stopMusic() {
    isPlaying = false;
    if (oscillator) {
        oscillator.stop();
        oscillator = null;
    }
}

// Add sparkle effect on hover
cardContainer.addEventListener('mouseenter', () => {
    if (!card.classList.contains('opened')) {
        card.style.transform = 'scale(1.05)';
    }
});

cardContainer.addEventListener('mouseleave', () => {
    if (!card.classList.contains('opened')) {
        card.style.transform = 'scale(1)';
    }
});

// Initialize
console.log('🎄 Merry Christmas! Card is ready! 🎄');
