"""
Generate audio pelafalan ke folder audio/:
  - audio/<romaji>.mp3        satu file per suku kata (Character Practice)
  - audio/words/<key>.mp3     satu file per kata (Word Practice)

Hanya dipakai saat development — hasilnya di-commit bersama website,
sehingga pengguna tidak perlu memasang suara apa pun di perangkatnya.

Kebutuhan:  Node.js (untuk membaca data di js/) dan  `pip install edge-tts`
Pemakaian:  python tools/generate-audio.py [--force]
            (tanpa --force hanya membuat file yang belum ada)
"""

import asyncio
import json
import pathlib
import subprocess
import sys

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "audio"
VOICE = "ja-JP-NanamiNeural"
RATE = "-10%"

# Ambil daftar langsung dari data aplikasi (satu sumber kebenaran).
NODE_SCRIPT = """
const root = process.argv[1];
Promise.all([import(root + 'js/data/kana.js'), import(root + 'js/data/words.js'), import(root + 'js/words.js')])
  .then(([{ KANA_GROUPS }, { WORDS }, { wordAudioKey }]) => {
    const syllables = {};
    for (const g of KANA_GROUPS) for (const [, kata, romaji] of g.kana) syllables[romaji] ??= kata;
    const words = {};
    for (const list of Object.values(WORDS)) for (const w of list) words[wordAudioKey(w)] ??= w.kana;
    console.log(JSON.stringify({ syllables, words }));
  });
"""


def load_items() -> dict[str, str]:
    """key (path relatif ke audio/, tanpa .mp3) -> teks yang diucapkan."""
    out = subprocess.run(
        ["node", "-e", NODE_SCRIPT, ROOT.as_uri() + "/"],
        capture_output=True, text=True, encoding="utf-8", check=True,
    )
    data = json.loads(out.stdout)
    # Suku kata disintesis dari Katakana: menghindari pembacaan partikel (は→wa, へ→e).
    return {**data["syllables"], **data["words"]}


async def main(force: bool) -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    items = load_items()
    created = 0
    for key, text in items.items():
        target = OUT / f"{key}.mp3"
        if target.exists() and not force:
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(target))
        created += 1
        print(f"{text}  -> {target.relative_to(OUT)}")
    print(f"{created} file dibuat, {len(items)} total. Folder: {OUT}")


if __name__ == "__main__":
    asyncio.run(main("--force" in sys.argv))
