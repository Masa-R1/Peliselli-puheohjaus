import { BrowserRouter, Routes, Route } from "react-router"
import ChatbotApp from "./ChatbotApp";
import VoiceApp from "./VoiceApp";

export const CHAT_UI_PATH = "/chatbotapp"
export const VOICE_UI_PATH = "/"

export default function Routing() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={VOICE_UI_PATH} element={<VoiceApp/>}/>
                <Route path={CHAT_UI_PATH} element={<ChatbotApp/>}/>
            </Routes>
        </BrowserRouter>
    );
}