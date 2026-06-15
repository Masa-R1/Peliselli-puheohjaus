import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next"

export default function UISelector() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation()

    const isVoiceApp = location.pathname !== "/chatbotapp";

    const handleToggle = () => {
        navigate(isVoiceApp ? "/chatbotapp" : "/");
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