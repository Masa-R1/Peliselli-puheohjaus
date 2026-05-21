from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs
from elevenlabs.play import play
import os
os.environ['PATH'] += os.pathsep + 'C:/Users/Juha/Downloads/ffmpeg-8.1.1-full_build/ffmpeg-8.1.1-full_build/bin'

load_dotenv()

elevenlabs = ElevenLabs(
    api_key=os.getenv("ELEVENLABS_API_KEY"),
)

audio = elevenlabs.text_to_speech.convert(
    text="Lorem ipsum dolor sit amet. Myrky on minun lempi väri ja se on aina hyvä valinta.",
    voice_id="CwhRBWXzGAHq8TQ4Fs17",
    model_id="eleven_flash_v2_5",
    output_format="mp3_44100_128",
)

play(audio)