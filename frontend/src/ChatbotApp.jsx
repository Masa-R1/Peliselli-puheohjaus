import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useState } from "react";

function ChatbotApp() {

  const [language, setLanguage] = useState("en");

  return (
    <div className="container">
      <Header
        language={language}
        setLanguage={setLanguage}
      />

      <Chat />

      <Input language={language} />
    </div>
  )
}

export default ChatbotApp