import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useEffect, useState } from "react"
import { useModelStore } from "./stores/useModelStore"

function ChatbotApp() {
	const { models } = useModelStore()
	const { setModels } = useModelStore()
	const { setSelectedModel } = useModelStore()

	const [language, setLanguage] = useState("en")

	// Hakee mallit sivun avaamisen yhteydessä
	useEffect(() => {
		fetch("http://localhost:8000/chat")
		.then((respose) => respose.json())
		.then(data => {
			setModels(data)
			setSelectedModel(data[0])
		})
		.catch((error) => {
			console.log(error)
        })
	}, [])

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