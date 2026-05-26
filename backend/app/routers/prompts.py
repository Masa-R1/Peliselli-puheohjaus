from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
from ..db.models import ChatPrompt
from ..db.agent import model_manager
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("", response_model=list[str])
def get_available_models():
    model_manager.refresh()
    return model_manager.get_model_names()


@router.post("/stream")
async def create_chat_stream(prompt: ChatPrompt):
    async def response_stream():
        chunks: list[str] = []

        try:
            async for token in crud.create_chat_stream(prompt):
                chunks.append(token)
                payload = json.dumps({"type": "token", "text": token}, ensure_ascii=False)
                yield f"{payload}\n"

            final_message = {"role": "assistant", "content": "".join(chunks)}
            payload = json.dumps({"type": "done", "message": final_message}, ensure_ascii=False)
            yield f"{payload}\n"
        except Exception as error:
            payload = json.dumps(
                {
                    "type": "done",
                    "message": "virje",
                    "streamError": str(error),
                },
                ensure_ascii=False,
            )
            yield f"{payload}\n"

    return StreamingResponse(response_stream(), media_type="application/x-ndjson")