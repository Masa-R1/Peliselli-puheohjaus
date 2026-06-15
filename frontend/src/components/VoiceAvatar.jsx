import { useTranslation } from "react-i18next"

function VoiceAvatar({ style, loading, thinkText }) {
    const { t } = useTranslation()

    return <div style={style}>{loading ? thinkText : t("common.assistant")}</div>
}

export default VoiceAvatar