import logo from "../assets/samk-bubble.png";

function Header() {
    return (
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
    )
}

export default Header