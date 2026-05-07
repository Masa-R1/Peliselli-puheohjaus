import { useState, useRef, useEffect } from "react";
import "./App.css";
import logo from "./assets/logo4.png";
import { useMessageStore } from "./stores/useMessageStore";

function App() {

  const [userMessages, setuserMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const { messages } = useMessageStore()
	const { addMessages } = useMessageStore()

  const recognitionRef = useRef(null);
  const chatboxRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [userMessages, loading]);

  function appendMessage(text, sender) {
    setuserMessages((prev) => [
      ...prev,
      { text, sender }
    ]);
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

    console.log(message)

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
      console.log(data)
      console.log(reply)
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

      {/* Chat */}
      <div
        className="chatbox"
        ref={chatboxRef}
      >
        {userMessages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender}`}
          >
            {msg.sender === "bot" && (
              <img
                src={logo}
                className="bot-chat-logo"
                alt="logo"
              />
            )}

            <span className="text-bubble">
              {msg.text}
            </span>
          </div>
        ))}

        {loading && (
          <div className="message bot typing">
            <img
              src={logo}
              className="bot-chat-logo"
              alt="logo"
            />

            <span className="text-bubble">
              Typing...
            </span>
          </div>
        )}
      </div>

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