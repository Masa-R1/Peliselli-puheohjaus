import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useEffect, useState } from "react"
import { useStateStore } from "./stores/useStateStore"

function ChatbotApp() {
	const [ listeningState, setListeningState ] = useState(false)

	const [language, setLanguage] = useState("en")

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