import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next"
import { CHAT_UI_PATH, VOICE_UI_PATH } from "../Routing";

export default function UISelector() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation()

    const isVoiceApp = location.pathname !== CHAT_UI_PATH;

    const handleToggle = () => {
        navigate(isVoiceApp ? CHAT_UI_PATH : VOICE_UI_PATH);
    };

    return (
        <button
            onClick={handleToggle}
            style={{
                background: "transparent",
                color: "#00a5cd",
                textShadow: "0 0 4px #818bff",
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
                marginLeft: "15px"
            }}
        >
            {isVoiceApp ? t("navigation.chat") : t("navigation.voice")}
        </button>
    );
}