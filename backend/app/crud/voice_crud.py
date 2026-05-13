__voice_enabled = True

def is_voice_enabled():
    return __voice_enabled;

def set_voice_enabled(enabled: bool):
    global __voice_enabled
    __voice_enabled = enabled