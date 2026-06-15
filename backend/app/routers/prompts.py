from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import json
from ..agent.models import ChatPrompt
from ..agent.agent import model_manager
from ..crud.frontend_language_crud import get_frontend_language
from ..crud import prompt_crud as crud

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=dict[str,str])
def create_chat(prompt: ChatPrompt):
    return crud.create_chat(prompt)


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
            ui_language = get_frontend_language()
            done_payload = {
                "type": "done",
                "message": final_message,
            }
            if ui_language:
                done_payload["uiLanguage"] = ui_language

            payload = json.dumps(
                done_payload,
                ensure_ascii=False,
            )
            yield f"{payload}\n"
        except Exception as error:
            ui_language = get_frontend_language()
            error_payload = {
                "type": "done",
                "message": "virje",
                "streamError": str(error),
            }
            if ui_language:
                error_payload["uiLanguage"] = ui_language

            payload = json.dumps(
                error_payload,
                ensure_ascii=False,
            )
            yield f"{payload}\n"

    return StreamingResponse(response_stream(), media_type="application/x-ndjson")