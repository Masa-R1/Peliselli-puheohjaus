import { BrowserRouter, Routes, Route } from "react-router"
import ChatbotApp from "./ChatbotApp";
import VoiceApp from "./VoiceApp";

export default function Routing() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ChatbotApp/>}/>
                <Route path="/voiceapp" element={<VoiceApp/>}/>
            </Routes>
        </BrowserRouter>
    );
}