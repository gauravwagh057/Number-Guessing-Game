def calculate_score(attempts, max_attempts, elapsed_time):

    remaining = max_attempts - attempts

    score = 1000 + remaining * 100 - elapsed_time * 5

    return max(100, score)


def get_temperature(distance, max_number):

    if distance <= max(3, max_number // 20):
        return "🔥 Very Hot!"

    elif distance <= max(10, max_number // 8):
        return "🌡️ Warm!"

    return "🥶 Cold!"