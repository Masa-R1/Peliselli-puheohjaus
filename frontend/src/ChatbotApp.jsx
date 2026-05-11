import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"
import { useEffect } from "react"
import { useModelStore } from "./stores/useModelStore"

function ChatbotApp() {
	const { models } = useModelStore()
	const { setModels } = useModelStore()
	const { setSelectedModel } = useModelStore()

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
			<Header />
			<Chat />
			<Input />
    	</div>
  	)
}

export default ChatbotApp