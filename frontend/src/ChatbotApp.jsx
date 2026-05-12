import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useEffect, useState } from "react"

function ChatbotApp() {
	const [ listeningState, setListeningState ] = useState(false)

	const [language, setLanguage] = useState("en")

	// Hakee kuuntelun tilan
	useEffect(() => {
		const interval = setInterval(() => {
			fetch("http://localhost:8000/voice")
			.then((respose) => respose.json())
			.then(data => {
				setListeningState(data.enabled)
			})
			.catch((error) => {
				console.log(error)
			})
		}, 5000)

		return () => clearInterval(interval)
	})

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