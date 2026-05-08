import "./App.css"
import Chat from "./components/Chat"
import Header from "./components/Header"
import Input from "./components/Input"

function App() {
  return (
    <div className="container">
      <Header />
      
      <Chat />
      
      <Input />
    </div>
  )
}

export default App