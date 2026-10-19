from flask import Flask, render_template, request, jsonify
import random
import json
import os
import time

app = Flask(__name__)

scores_file = "scores.json"
history_file = "history.json"

games = {}


def load_data(filename):
    if not os.path.exists(filename):
        return []

    try:
        with open(filename, "r") as file:
            return json.load(file)
    except:
        return []


def save_data(filename, data):
    with open(filename, "w") as file:
        json.dump(data, file, indent=4)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/start", methods=["POST"])
def start_game():

    data = request.json

    name = data.get("name", "Player")
    difficulty = data.get("difficulty", "medium")

    settings = {
        "easy": {
            "max_number": 50,
            "attempts": 10
        },
        "medium": {
            "max_number": 100,
            "attempts": 7
        },
        "hard": {
            "max_number": 500,
            "attempts": 5
        }
    }

    config = settings.get(difficulty, settings["medium"])

    game_id = str(random.randint(100000, 999999))

    games[game_id] = {
        "name": name,
        "difficulty": difficulty,
        "number": random.randint(1, config["max_number"]),
        "max_number": config["max_number"],
        "max_attempts": config["attempts"],
        "attempts": 0,
        "low": 1,
        "high": config["max_number"],
        "start_time": time.time(),
        "finished": False
    }

    return jsonify({
        "game_id": game_id,
        "max_number": config["max_number"],
        "attempts": config["attempts"]
    })


@app.route("/guess", methods=["POST"])
def guess():

    data = request.json

    game_id = data.get("game_id")
    user_guess = data.get("guess")

    if game_id not in games:
        return jsonify({
            "error": "Game not found"
        }), 404

    game = games[game_id]

    if game["finished"]:
        return jsonify({
            "error": "Game already finished"
        })

    try:
        user_guess = int(user_guess)
    except:
        return jsonify({
            "error": "Invalid number"
        }), 400

    game["attempts"] += 1

    number = game["number"]

    if user_guess == number:

        game["finished"] = True

        elapsed = int(time.time() - game["start_time"])

        remaining = game["max_attempts"] - game["attempts"]

        score = max(
            100,
            1000 + remaining * 100 - elapsed * 5
        )

        history = load_data(history_file)

        result = {
            "name": game["name"],
            "difficulty": game["difficulty"],
            "attempts": game["attempts"],
            "score": score,
            "time": elapsed,
            "result": "Won"
        }

        history.append(result)
        save_data(history_file, history)

        scores = load_data(scores_file)
        scores.append(result)
        scores = sorted(
            scores,
            key=lambda x: x["score"],
            reverse=True
        )[:10]

        save_data(scores_file, scores)

        return jsonify({
            "status": "correct",
            "message": "🎉 Correct! You guessed the number!",
            "score": score,
            "attempts": game["attempts"],
            "time": elapsed,
            "number": number
        })

    if user_guess < number:
        game["low"] = max(game["low"], user_guess + 1)
        direction = "Too Low! 📉"
    else:
        game["high"] = min(game["high"], user_guess - 1)
        direction = "Too High! 📈"

    remaining_attempts = (
        game["max_attempts"] - game["attempts"]
    )

    if remaining_attempts <= 0:

        game["finished"] = True

        elapsed = int(time.time() - game["start_time"])

        history = load_data(history_file)

        result = {
            "name": game["name"],
            "difficulty": game["difficulty"],
            "attempts": game["attempts"],
            "score": 0,
            "time": elapsed,
            "result": "Lost"
        }

        history.append(result)
        save_data(history_file, history)

        return jsonify({
            "status": "lost",
            "message": "💀 Game Over!",
            "number": number,
            "attempts": game["attempts"]
        })

    distance = abs(user_guess - number)

    if distance <= max(3, game["max_number"] // 20):
        hint = "🔥 Very Hot!"
    elif distance <= max(10, game["max_number"] // 8):
        hint = "🌡️ Warm!"
    else:
        hint = "🥶 Cold!"

    return jsonify({
        "status": "wrong",
        "message": direction,
        "hint": hint,
        "low": game["low"],
        "high": game["high"],
        "remaining": remaining_attempts
    })


@app.route("/scores")
def scores():

    scores = load_data(scores_file)

    scores = sorted(
        scores,
        key=lambda x: x["score"],
        reverse=True
    )[:10]

    return jsonify(scores)


@app.route("/history")
def history():

    history = load_data(history_file)

    return jsonify(history[-20:][::-1])


if __name__ == "__main__":
    app.run(debug=True)