function VoiceAvatar({ style, loading, thinkText }) {
    return <div style={style}>{loading ? thinkText : "Assistant"}</div>
}

export default VoiceAvatar