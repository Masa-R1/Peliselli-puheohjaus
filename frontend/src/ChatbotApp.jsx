import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useEffect, useState } from "react"
import { useStateStore } from "./stores/useStateStore"

function ChatbotApp() {
	const [ listeningState, setListeningState ] = useState(false)

	return (
		<div className="container">
			<Header />

			<Chat />

			<Input />
		</div>
	)
}

export default ChatbotApp