// Lets any button on the site open the "Talk to our AI" demo panel
// (src/components/VoiceDemoWidget.tsx, mounted once in the root layout).

export const VOICE_DEMO_EVENT = "pillora:open-voice-demo";

// True when the voice server is configured, i.e. the widget is visible.
export const VOICE_DEMO_ENABLED = Boolean(process.env.NEXT_PUBLIC_VOICE_DEMO_URL);

export function openVoiceDemo() {
    window.dispatchEvent(new Event(VOICE_DEMO_EVENT));
}
