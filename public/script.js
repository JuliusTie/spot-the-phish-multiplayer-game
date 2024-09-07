document.addEventListener('DOMContentLoaded', function () {
    let player1Name = "";
    let player2Name = "";
    let currentImageIndex = 0;
    let startTime;
    let images = [];
    let scores = { player1: 0, player2: 0 };
    let times = { player1: 0, player2: 0 };
    let isGameActive = false;

    const startScreen = document.getElementById('start-screen');
    const nameScreen = document.getElementById('name-screen');
    const countdownScreen = document.getElementById('countdown-screen');
    const gameScreen = document.getElementById('game-screen');
    const scoreboardScreen = document.getElementById('scoreboard-screen');
    const gameImage = document.getElementById('game-image');
    const timerLabel = document.getElementById('timer');
    const countdownLabel = document.getElementById('countdown');
    const feedbackLabel = document.getElementById('feedback');
    const iconLabel = document.getElementById('icon');
    const scoreboard = document.getElementById('scoreboard');
    const imageCounter = document.getElementById('image-counter');

function showScreen(screen) {
    startScreen.classList.add('hidden');
    nameScreen.classList.add('hidden');
    countdownScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    scoreboardScreen.classList.add('hidden');
    
    scoreboardScreen.style.display = 'none';

    screen.classList.remove('hidden');

    if (screen === scoreboardScreen) {
        scoreboardScreen.style.display = 'flex'; 
    }
}



    function loadImages() {
        for (let i = 0; i < 16; i++) {
            images.push({ src: `Images/clean_${i}.png`, type: "Clean" });
        }
        for (let i = 0; i < 43; i++) {
            images.push({ src: `Images/phish_${i}.png`, type: "Phish" });
        }
        images = images.sort(() => Math.random() - 0.5);
    }

    function startGame() {
        gameImage.classList.add('hidden');
        showScreen(nameScreen);
        document.addEventListener('keydown', confirmNames);
    }

    function confirmNames(event) {
        if (["1", "3"].includes(event.key)) {
            player1Name = document.getElementById('player1').value;
            player2Name = document.getElementById('player2').value;
            if (player1Name && player2Name) {
                document.removeEventListener('keydown', confirmNames);
                startCountdown();
            }
        }
    }

    function startCountdown() {
        showScreen(countdownScreen);
        gameImage.classList.add('hidden');
        let count = 3;
        countdownLabel.textContent = count;
        const countdownInterval = setInterval(() => {
            count--;
            countdownLabel.textContent = count;
            if (count === 0) {
                clearInterval(countdownInterval);
                showNextImage();
            }
        }, 1000);
    }

function showNextImage() {
    if (currentImageIndex >= 10) {
        showScoreboard();
        return;
    }

    imageCounter.textContent = `${currentImageIndex + 1}/10`;
    imageCounter.classList.remove('hidden');

    const image = images[currentImageIndex];
    gameImage.src = image.src;
    feedbackLabel.textContent = "";
    iconLabel.innerHTML = "";
    startTime = Date.now();
    timerLabel.textContent = "0.00s";
    gameImage.classList.remove('hidden'); 
    isGameActive = true;

    showScreen(gameScreen); 
    document.addEventListener('keydown', checkAnswer);
    updateTimer();
}


    function updateTimer() {
        if (isGameActive) {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
            timerLabel.textContent = `${elapsed}s`;
            requestAnimationFrame(updateTimer);
        }
    }

    function checkAnswer(event) {
    if (["1", "2", "3", "4"].includes(event.key)) {
        isGameActive = false;
        document.removeEventListener('keydown', checkAnswer);

        const reactionTime = (Date.now() - startTime) / 1000;
        const player = event.key === "1" || event.key === "2" ? "player1" : "player2";
        const answer = event.key === "1" || event.key === "3" ? "Clean" : "Phish";
        const correctAnswer = images[currentImageIndex].type;
        let feedbackText = `${player === "player1" ? player1Name : player2Name} hit the Button. `;

        if (answer === correctAnswer) {
            scores[player]++;
            times[player] += reactionTime;
            feedbackText += `The answer was correct! It was a ${correctAnswer.toLowerCase()} mail.`;
            iconLabel.innerHTML = "&#10004;"; 
            iconLabel.style.color = "#00FF00";
        } else {
            feedbackText += `The answer was incorrect. It was a ${correctAnswer.toLowerCase()} mail.`;
            iconLabel.innerHTML = "&#10008;"; 
            iconLabel.style.color = "#FF0000";
        }

        feedbackLabel.textContent = feedbackText;
        currentImageIndex++;

        setTimeout(() => {
            if (currentImageIndex < 10) {
                startCountdown(); 
            } else {
                showScoreboard(); 
            }
        }, 3000); 
    }
}

async function showScoreboard() {
    gameImage.classList.add('hidden'); 
    imageCounter.classList.add('hidden'); 
    feedbackLabel.classList.add('hidden'); 
    iconLabel.classList.add('hidden');
    timerLabel.style.display = 'none'; 

    await saveScoreboardToServer(); 

    const historicalScores = await getHistoricalScores(); 

    const currentScores = [
        { name: player1Name, correct: scores.player1, time: times.player1.toFixed(2) },
        { name: player2Name, correct: scores.player2, time: times.player2.toFixed(2) }
    ];

    let combinedScores = [...historicalScores];

    combinedScores = combinedScores.filter(player => 
        !currentScores.some(current => current.name === player.name)
    );

    combinedScores = [...currentScores, ...combinedScores];

    combinedScores.sort((a, b) => b.correct - a.correct || a.time - b.time);

    let scoreboardHTML = '<h2>Scoreboard</h2>';
    scoreboardHTML += `<p>Rank | Name | Correct Answers | Time</p>`;
    combinedScores.forEach((player, index) => {
        const isCurrentPlayer = currentScores.some(current => current.name === player.name && current.correct === player.correct && current.time === player.time);
        scoreboardHTML += `<p class="${isCurrentPlayer ? 'current-player' : ''}">${index + 1}. ${player.name} - Correct Answers: ${player.correct}, Time: ${player.time}s</p>`;
    });

    scoreboard.innerHTML = scoreboardHTML;
    showScreen(scoreboardScreen); 
    document.addEventListener('keydown', () => location.reload());
}




async function getHistoricalScores() {
    const response = await fetch('/get_scoreboard', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
        const scores = await response.json();
        console.log('Fetched historical scores:', scores); 
        return scores.flatMap(score => [score.player1, score.player2]);
    } else {
        console.error('Failed to load historical scoreboard');
        return [];
    }
}


    async function saveScoreboardToServer() {
    const scoreboard = {
        player1: { name: player1Name, correct: scores.player1, time: times.player1.toFixed(2) },
        player2: { name: player2Name, correct: scores.player2, time: times.player2.toFixed(2) }
    };

    const response = await fetch('/save_scoreboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreboard)
    });

    if (!response.ok) {
        console.error('Failed to save scoreboard');
    }
}

   
    document.addEventListener('keydown', (event) => {
        if (["1", "2", "3", "4"].includes(event.key) && !isGameActive && currentImageIndex === 0) {
            startGame();
        }
    });

    
    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape") {
            location.reload(); 
        }
    });

    loadImages();
});
