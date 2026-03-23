import itertools
from typing import AsyncGenerator, List

LEET_MAP = {
    "a": ["a", "4", "@"],
    "e": ["e", "3"],
    "i": ["i", "1", "!"],
    "o": ["o", "0"],
    "s": ["s", "$", "5"],
    "t": ["t", "7"],
    "l": ["l", "1"],
    "g": ["g", "9"],
}

COMMON_SUFFIXES = ["", "1", "12", "123", "1234", "!", "!1", "2024", "2025", "#1", "01"]
COMMON_PREFIXES = ["", "!", "123", "000"]


def apply_case_rules(word: str):
    yield word.lower()
    yield word.upper()
    yield word.capitalize()
    yield word.swapcase()
    # Title-case first letter of each segment
    yield "".join(p.capitalize() for p in word.replace("-", " ").replace("_", " ").split())


def apply_leet(word: str, depth: int = 1):
    """Generate leet-speak variants (limited depth to avoid explosion)."""
    word_lower = word.lower()
    variants = {word_lower}

    for char, replacements in LEET_MAP.items():
        if char in word_lower:
            new_variants = set()
            for v in variants:
                for r in replacements:
                    new_variants.add(v.replace(char, r, 1))
            variants = variants | new_variants
            if len(variants) > 200:  # Cap to prevent explosion
                break

    return variants


async def generate_wordlist(
    seeds: List[str],
    use_leet: bool = True,
    use_numbers: bool = True,
    use_years: bool = True,
    min_length: int = 6,
    max_length: int = 20,
    output_path: str = None,
) -> AsyncGenerator:
    yield {"type": "info", "message": f"Generating wordlist from {len(seeds)} seeds..."}

    generated = set()
    years = [str(y) for y in range(1990, 2026)] if use_years else []

    for seed in seeds:
        seed = seed.strip()
        if not seed:
            continue

        # Case variants
        case_variants = list(apply_case_rules(seed))

        # Leet variants
        leet_variants = list(apply_leet(seed)) if use_leet else [seed]

        all_variants = set(case_variants + leet_variants)

        # Append suffixes/prefixes
        with_affixes = set()
        for v in all_variants:
            with_affixes.add(v)
            if use_numbers:
                for suf in COMMON_SUFFIXES:
                    with_affixes.add(v + suf)
                for pre in COMMON_PREFIXES:
                    with_affixes.add(pre + v)
            if use_years:
                for year in years:
                    with_affixes.add(v + year)
                    with_affixes.add(year + v)

        for word in with_affixes:
            if min_length <= len(word) <= max_length and word not in generated:
                generated.add(word)

    count = 0
    lines = []
    for word in sorted(generated):
        lines.append(word)
        count += 1
        if count % 500 == 0:
            yield {"type": "progress", "count": count, "message": f"Generated {count} words..."}

    if output_path:
        with open(output_path, "w") as f:
            f.write("\n".join(lines))
        yield {"type": "info", "message": f"Saved to {output_path}"}

    # Stream sample of words
    for word in lines[:50]:
        yield {"type": "data", "word": word, "message": word}

    if len(lines) > 50:
        yield {"type": "info", "message": f"... and {len(lines) - 50} more words"}

    yield {"type": "done", "message": f"Wordlist generation complete. {count} unique words generated."}
