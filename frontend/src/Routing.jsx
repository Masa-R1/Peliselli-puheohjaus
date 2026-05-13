import { BrowserRouter, Routes, Route } from "react-router"
import ChatbotApp from "./ChatbotApp";
import VoiceApp from "./VoiceApp";

export default function Routing() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<VoiceApp/>}/>
                <Route path="/chat_ui" element={<ChatbotApp/>}/>
            </Routes>
        </BrowserRouter>
    );
}