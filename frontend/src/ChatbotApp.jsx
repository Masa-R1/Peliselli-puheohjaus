import "./styles/app.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"

function ChatbotApp() {
	return (
		<div className="container">
			<Header />

			<Chat />

			<Input />
		</div>
	)
}

export default ChatbotApp