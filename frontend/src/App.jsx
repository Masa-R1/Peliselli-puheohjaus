import { useState, useRef } from "react";
import "./App.css";
import logo from "./assets/logo4.png";

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef(null);

  function appendMessage(text, sender) {
    setMessages((prev) => [...prev, { text, sender }]);
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
      if (prev) window.speechSynthesis.cancel();
      return !prev;
    });
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported.");
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setListening(true);
      recognitionRef.current.onend = () => setListening(false);
      recognitionRef.current.onerror = () => setListening(false);

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };
    }

    recognitionRef.current.start();
  }

  async function sendMessage() {
    const message = inputMessage.trim();

    if (!message || loading) return;

    appendMessage(message, "user");
    setInputMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: message
        })
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const reply = await response.json();

      appendMessage(reply, "bot");
      speak(reply);

    } catch (error) {
      appendMessage("Error: Could not reach server.", "bot");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  }

  return (
    <div className="container">
      <header className="chat-header">
        <div className="bot-info">
          <img src={logo} className="bot-header-logo" alt="logo" />
          <h3>SAMK Bot</h3>
        </div>
      </header>

      <div className="chatbox">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.sender === "bot" && (
              <img src={logo} className="bot-chat-logo" alt="logo" />
            )}

            <span className="text-bubble">{msg.text}</span>
          </div>
        ))}

        {loading && (
          <div className="message bot">
            <img src={logo} className="bot-chat-logo" alt="logo" />
            <span className="text-bubble">Typing...</span>
          </div>
        )}
      </div>

      <div className="input-area">
        <button
          id="micBtn"
          className={listening ? "listening" : ""}
          onClick={startListening}
          disabled={loading}
        >
          <i className="fa-solid fa-microphone"></i>
        </button>

        <input
          type="text"
          value={inputMessage}
          placeholder="Type a message..."
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />

        <button onClick={toggleVoice}>
          <i
            className={
              voiceEnabled
                ? "fa-solid fa-volume-high"
                : "fa-solid fa-volume-xmark"
            }
          />
        </button>

        <button onClick={sendMessage} disabled={loading}>
          <i className="fa-solid fa-paper-plane" />
        </button>
      </div>
    </div>
  );
}

export default App;