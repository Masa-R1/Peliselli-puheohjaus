import logo from "../assets/samk-bubble.png";
import ModelSelect from "./ModelSelect";
import { useStateStore } from "../stores/useStateStore";
import "../voiceIndicator.css"
import { useTranslation } from "react-i18next";

function Header() {
    const { isSpeaking } = useStateStore();
    const { i18n } = useTranslation();

    return (
        <header className="chat-header">
            <div className="bot-info">
                <img
                    src={logo}
                    className="bot-header-logo"
                    alt="logo"
                />
                <h3>SAMK Bot</h3>
                
                <ModelSelect />

                <div className="language-select">
                    <label
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#00a5cd",
                            textShadow: "0 0 4px #818bff",
                            fontSize: "14px"
                        }}
                    >
                        Language:

                        <select
                            value={i18n.language}
                            onChange={(e) => i18n.changeLanguage(e.target.value)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#00a5cd",
                                textShadow: "0 0 4px #818bff",
                                fontSize: "14px"
                            }}
                        >
                            <option value="en">EN</option>
                            <option value="fi">FI</option>
                        </select>
                    </label>
                </div>

                {/* <div className="speaking-indicator">
                    <div className={glow-ball }></div>
                </div> */}

            </div>
        </header>
    );
}

export default Header;
