import os
from dotenv import load_dotenv
import websockets

load_dotenv()
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

voice_id = 'Xb7hH8MSUJpSbSDYk0k2'

model_id = 'eleven_flash_v2_5'

async def text_to_speech_ws_streaming(voice_id, model_id):
    uri = f"wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={model_id}"

    async with websockets.connect(uri) as websocket:
    
    async def text_to_speech_ws_streaming(voice_id, model_id):
        async with websockets.connect(uri) as websocket:
            await websocket.send(json.dumps({
                "text": " ",
                "voice settings": {"stability" : 0.5, "similarity_boost": 0.8, "use_speaker_boost": False},
                "generation_config": {
                    "chunk_length_schedule": [120, 160, 250, 290]
                },
                "xi_api_key": ELEVENLABS_API_KEY,
            }))

            text = "The twilight sun cast its "
