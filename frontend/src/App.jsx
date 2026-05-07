import { useState, useRef, useEffect, useId } from "react";
import "./App.css";
import logo from "./assets/samk-bubble.png";
import { useMessageStore } from "./stores/useMessageStore";
import { useConversationStore } from "./stores/useConversationStore"
import { useStateStore } from "./stores/useStateStore";
import "./ellipsis-anim.css"
import Chat from "./components/Chat"

function App() {
  const [conversationMessages, setconversationMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  const { messages } = useMessageStore()
	const { addMessages } = useMessageStore()
  
  // Tallennetaan tilat storen listaan, 
  // josta ne ovat saatavilla globaalisti
  const { loading } = useStateStore()
  const { setLoading } = useStateStore()

  const { listening } = useStateStore()
  const { setListening } = useStateStore()

  const { voiceEnabled } = useStateStore()
  const { setVoiceEnabled } = useStateStore()

  const { addConversationMessages } = useConversationStore()

  const recognitionRef = useRef(null);
  const chatboxRef = useRef(null);

  const chatboxId = useId();

  // Auto-scroll
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [conversationMessages, loading]);

  function appendMessage(text, sender) {
    setconversationMessages((prev) => [
      ...prev,
      { text, sender }
    ]);
    addConversationMessages(text, sender)
  }

  function speak(text) {
    if (!voiceEnabled) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  function toggleVoice() {
    setVoiceEnabled((prev) => {
      if (prev) {
        window.speechSynthesis.cancel();
      }

      return !prev;
    });
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported."
      );
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.lang = "fi-FI";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults =false;

      recognitionRef.current.onstart = () => {
        setListening(true);
      };

      recognitionRef.current.onend = () => {
        setListening(false);
      };

      recognitionRef.current.onerror = () => {
        setListening(false);
      };

      recognitionRef.current.onresult = (
        event
      ) => {
        const transcript = event.results[0][0].transcript;

        setInputMessage(transcript);
      };
    }

    recognitionRef.current.start();
  }

  async function sendMessage() {
    const message = inputMessage.trim();

    const new_message = {role:"user", content:message};
    
    addMessages(new_message);

    if (!message || loading) return;

    appendMessage(message, "user");

    setInputMessage("");

    setLoading(true);

    const promptInfo = {
      model: "gemma3:latest",
      prompt: message,
      history: messages
    }

    let reply = ""

    fetch("http://localhost:8000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "Application/JSON",
    },
      body: JSON.stringify(promptInfo),
    })
    .then((respose) => respose.json())
    .then(data => {
      reply = data.content
      addMessages(data)
    })
    .then((newPrompt) => {
      appendMessage(reply, "bot");
      speak(reply);
      setLoading(false);
    })
    .catch((error) => {
      console.log(error);
    })
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="chat-header">
        <div className="bot-info">
          <img
            src={logo}
            className="bot-header-logo"
            alt="logo"
          />

          <h3>SAMK Bot</h3>
        </div>
      </header>
      
      <Chat />
      
      {/* Input */}
      <div className="input-area">
        {/* Mic */}
        <button
          id="micBtn"
          className={
            listening ? "listening" : ""
          }
          onClick={startListening}
          disabled={loading}
        >
          <i className="fa-solid fa-microphone"></i>
        </button>

        {/* Text Input */}
        <input
          type="text"
          id={chatboxId}
          value={inputMessage}
          placeholder="Message SAMK Bot..."
          onChange={(e) =>
            setInputMessage(
              e.target.value
            )
          }
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        {/* Voice */}
        <button onClick={toggleVoice}>
          <i
            className={
              voiceEnabled
                ? "fa-solid fa-volume-high"
                : "fa-solid fa-volume-xmark"
            }
          />
        </button>

        {/* Send */}
        <button
          onClick={sendMessage}
          disabled={loading}
        >
          <i className="fa-solid fa-arrow-up"></i>
        </button>
      </div>
    </div>
  );
}

export default App;