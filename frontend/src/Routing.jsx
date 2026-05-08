import { BrowserRouter, Route, Routes } from "react-router"
import ChatbotApp from "./ChatbotApp";
import VoiceApp from "./VoiceApp";
import ChatbotAppCopy from "./ChatbotAppCopy";

export default function Routing() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ChatbotApp/>}/>
                <Route path="/voiceapp" element={<VoiceApp/>}/>
                <Route path="/ChatbotAppCopy" element={<ChatbotAppCopy/>}/>
            </Routes>
        </BrowserRouter>
    );
}