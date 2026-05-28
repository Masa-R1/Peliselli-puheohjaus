import logo from "../assets/samk-bubble.png";
import ModelSelect from "./ModelSelect";
import { useStateStore } from "../stores/useStateStore";
import "../styles/ellipsis-anim.css"
import LanguageSelect from "./LanguageSelector";
import UISelector from "./UISelector";

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
                
                <ModelSelect />

                <LanguageSelect />

                <UISelector />

                {/* <div className="speaking-indicator">
                    <div className={glow-ball }></div>
                </div> */}

            </div>
        </header>
    );
}

export default Header;
