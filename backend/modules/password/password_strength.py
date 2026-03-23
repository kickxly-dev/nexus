import re
import math

async def password_strength(password: str):
    yield {"type": "info", "message": f"Analyzing password strength ({len(password)} chars)..."}

    score = 0
    feedback = []

    # Length
    if len(password) >= 16:
        score += 30
        feedback.append(("found", "Excellent length (16+ chars)"))
    elif len(password) >= 12:
        score += 20
        feedback.append(("found", "Good length (12+ chars)"))
    elif len(password) >= 8:
        score += 10
        feedback.append(("warn", "Minimum length (8+ chars)"))
    else:
        score += 0
        feedback.append(("vuln", f"Too short ({len(password)} chars, need 8+)"))

    # Character classes
    has_lower = bool(re.search(r'[a-z]', password))
    has_upper = bool(re.search(r'[A-Z]', password))
    has_digit = bool(re.search(r'[0-9]', password))
    has_special = bool(re.search(r'[^a-zA-Z0-9]', password))
    classes = sum([has_lower, has_upper, has_digit, has_special])

    score += classes * 10
    if classes == 4:
        feedback.append(("found", "All character classes present"))
    elif classes == 3:
        feedback.append(("warn", f"Missing {'special chars' if not has_special else 'digits' if not has_digit else 'uppercase' if not has_upper else 'lowercase'}"))
    else:
        feedback.append(("vuln", f"Only {classes}/4 character classes used"))

    # Entropy
    charset = 0
    if has_lower: charset += 26
    if has_upper: charset += 26
    if has_digit: charset += 10
    if has_special: charset += 32
    entropy = len(password) * math.log2(charset) if charset > 0 else 0
    score += min(int(entropy / 2), 30)
    feedback.append(("info", f"Entropy: {entropy:.1f} bits"))

    # Patterns
    if re.search(r'(.)\1{2,}', password):
        score -= 10
        feedback.append(("vuln", "Contains repeated characters (aaa, 111)"))
    if re.search(r'(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)', password.lower()):
        score -= 10
        feedback.append(("vuln", "Contains sequential patterns"))

    common = ['password', '123456', 'qwerty', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master']
    if password.lower() in common:
        score = 0
        feedback.append(("vuln", "Password is in common password list!"))

    score = max(0, min(score, 100))

    # Rating
    if score >= 80:
        rating = "STRONG"
        rtype = "found"
    elif score >= 50:
        rating = "MODERATE"
        rtype = "warn"
    else:
        rating = "WEAK"
        rtype = "vuln"

    yield {"type": rtype, "message": f"Rating: {rating} ({score}/100)"}
    for ftype, msg in feedback:
        yield {"type": ftype, "message": msg}

    # Crack time estimate
    guesses_per_sec = 10_000_000_000  # 10B/s (GPU)
    combinations = charset ** len(password) if charset > 0 else 1
    seconds = combinations / guesses_per_sec
    if seconds < 1:
        time_str = "Instantly"
    elif seconds < 60:
        time_str = f"{seconds:.0f} seconds"
    elif seconds < 3600:
        time_str = f"{seconds/60:.0f} minutes"
    elif seconds < 86400:
        time_str = f"{seconds/3600:.0f} hours"
    elif seconds < 86400 * 365:
        time_str = f"{seconds/86400:.0f} days"
    elif seconds < 86400 * 365 * 1000:
        time_str = f"{seconds/(86400*365):.0f} years"
    else:
        time_str = "Centuries+"

    yield {"type": "result", "message": f"Estimated crack time (10B guesses/sec): {time_str}"}
