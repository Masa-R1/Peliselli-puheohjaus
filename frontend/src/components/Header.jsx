import logo from "../assets/samk-bubble.png";
import ModelSelect from "./ModelSelect";
import "../styles/ellipsis-anim.css";
import LanguageSelect from "./LanguageSelector";
import UISelector from "./UISelector";
import { useTranslation } from "react-i18next";

function Header() {
  const { t } = useTranslation();

  return (
    <header className="chat-header">
      <div className="bot-info">
        <img src={logo} className="bot-header-logo" alt={t("chat.logoAlt")} />
        <h3>{t("chat.title")}</h3>

        <ModelSelect />

        <LanguageSelect />

        <UISelector />
      </div>
    </header>
  );
}

export default Header;
