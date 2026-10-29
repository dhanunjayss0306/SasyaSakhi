"""First Sarvam speech-to-text call (Telugu, Saaras v4).

Usage (from backend/):
    python sarvam_stt_test.py [audio.wav]

Reads SARVAM_API_KEY from the environment (backend/.env). Never prints it.
Default audio is sarvam_sample_te.wav, a short Telugu sample.
"""
import os
import sys

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:
    pass

from sarvamai import SarvamAI


def main() -> None:
    audio = sys.argv[1] if len(sys.argv) > 1 else "sarvam_sample_te.wav"
    key = os.environ.get("SARVAM_API_KEY")
    if not key:
        print("SARVAM_API_KEY is not set. Put it in backend/.env and run again.")
        raise SystemExit(1)
    client = SarvamAI(api_subscription_key=key)
    with open(audio, "rb") as f:
        res = client.speech_to_text.transcribe(
            file=f, model="saaras:v4", language_code="te-IN", mode="transcribe"
        )
    print(res.transcript)


if __name__ == "__main__":
    main()
