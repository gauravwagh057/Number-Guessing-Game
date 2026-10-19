let gameId = null;
let timerInterval = null;
let seconds = 0;
let maxAttempts = 7;
let currentAttempts = 0;


async function startGame() {

    const name =
        document.getElementById("playerName").value
        || "Player";

    const difficulty =
        document.getElementById("difficulty").value;


    const response = await fetch("/start", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            name: name,
            difficulty: difficulty
        })
    });


    const data = await response.json();


    gameId = data.game_id;

    maxAttempts = data.attempts;

    currentAttempts = 0;

    seconds = 0;


    document.getElementById("setup")
        .classList.add("hidden");

    document.getElementById("result")
        .classList.add("hidden");

    document.getElementById("game")
        .classList.remove("hidden");


    document.getElementById("displayName")
        .textContent = name;

    document.getElementById("attempts")
        .textContent = "0";

    document.getElementById("timer")
        .textContent = "0";

    document.getElementById("rangeText")
        .textContent =
        `1 - ${data.max_number}`;


    document.getElementById("message")
        .textContent =
        "Good luck! 🍀";

    document.getElementById("hint")
        .textContent =
        "💡 Make your first guess!";


    document.getElementById("progressBar")
        .style.width = "0%";


    document.getElementById("guessInput")
        .value = "";

    document.getElementById("guessInput")
        .focus();


    startTimer();
}


async function makeGuess() {

    const input =
        document.getElementById("guessInput");

    const guess = input.value;


    if (!guess) {

        document.getElementById("message")
            .textContent =
            "⚠️ Enter a number first!";

        return;
    }


    const response = await fetch("/guess", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            game_id: gameId,
            guess: guess
        })
    });


    const data = await response.json();


    if (data.status === "correct") {

        stopTimer();

        showResult(
            true,
            data
        );

        return;
    }


    if (data.status === "lost") {

        stopTimer();

        showResult(
            false,
            data
        );

        return;
    }


    currentAttempts++;


    document.getElementById("attempts")
        .textContent =
        currentAttempts;


    document.getElementById("message")
        .textContent =
        data.message;


    document.getElementById("hint")
        .textContent =
        data.hint;


    document.getElementById("rangeText")
        .textContent =
        `${data.low} - ${data.high}`;


    const used =
        (currentAttempts / maxAttempts) * 100;


    document.getElementById("progressBar")
        .style.width =
        used + "%";


    input.value = "";

    input.focus();
}


function showResult(won, data) {

    document.getElementById("game")
        .classList.add("hidden");

    document.getElementById("result")
        .classList.remove("hidden");


    if (won) {

        document.getElementById("resultTitle")
            .textContent =
            "🎉 YOU WON!";

        document.getElementById("finalScore")
            .textContent =
            data.score;

        document.getElementById("finalAttempts")
            .textContent =
            data.attempts;

        document.getElementById("finalTime")
            .textContent =
            data.time + "s";

        document.getElementById("secretNumber")
            .textContent =
            "You found the secret number: "
            + data.number;

    } else {

        document.getElementById("resultTitle")
            .textContent =
            "💀 GAME OVER";

        document.getElementById("finalScore")
            .textContent =
            "0";

        document.getElementById("finalAttempts")
            .textContent =
            data.attempts;

        document.getElementById("finalTime")
            .textContent =
            seconds + "s";

        document.getElementById("secretNumber")
            .textContent =
            "The secret number was: "
            + data.number;
    }


    loadLeaderboard();

    loadHistory();
}


function startTimer() {

    clearInterval(timerInterval);

    timerInterval =
        setInterval(() => {

            seconds++;

            document.getElementById("timer")
                .textContent =
                seconds;

        }, 1000);
}


function stopTimer() {

    clearInterval(timerInterval);
}


function restartGame() {

    stopTimer();

    document.getElementById("game")
        .classList.add("hidden");

    document.getElementById("result")
        .classList.add("hidden");

    document.getElementById("setup")
        .classList.remove("hidden");
}


function handleEnter(event) {

    if (event.key === "Enter") {
        makeGuess();
    }
}


async function loadLeaderboard() {

    const response =
        await fetch("/scores");

    const scores =
        await response.json();


    const board =
        document.getElementById("leaderboard");


    if (scores.length === 0) {

        board.innerHTML =
            "<p>No scores yet.</p>";

        return;
    }


    board.innerHTML = scores.map(
        (item, index) => `

        <div>
            <span>
                ${index + 1}. ${item.name}
            </span>

            <strong>
                ${item.score}
            </strong>
        </div>

    `).join("");
}


async function loadHistory() {

    const response =
        await fetch("/history");

    const history =
        await response.json();


    const container =
        document.getElementById("history");


    if (history.length === 0) {

        container.innerHTML =
            "<p>No game history.</p>";

        return;
    }


    container.innerHTML = history.map(
        item => `

        <div>

            <span>
                ${item.name}
                (${item.difficulty})
            </span>

            <strong>
                ${item.result} -
                ${item.score}
            </strong>

        </div>

    `).join("");
}


loadLeaderboard();
loadHistory();