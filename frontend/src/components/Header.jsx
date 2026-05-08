import logo from "../assets/samk-bubble.png";
import { useStateStore } from "../stores/useStateStore";

function Header() {
    const { isSpeaking } = useStateStore();

    return (
        <header className="chat-header">
            <div className="bot-info">
                <img
                    src={logo}
                    className="bot-header-logo"
                    alt="logo"
                />
                <h3>SAMK Bot</h3>
                <div className="speaking-indicator">
                    <div className={`glow-ball ${isSpeaking ? 'active' : 'inactive'}`}></div>
                </div>
            </div>
        </header>
    )
}

export default Header