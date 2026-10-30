"use client";

import { useEffect, useRef, useState } from "react";
import { SUGGESTED_QUESTIONS, SUGGESTED_QUESTIONS_TE, mockChatReply } from "@/lib/mock-data";
import { BACKEND_CONFIGURED, chatWithAssistant } from "@/lib/api-client";
import { store } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bot, Eraser, Mic, MicOff, Send, Sprout, User, Volume2, VolumeX } from "lucide-react";

interface ChatWindowProps {
  initialLang: "en" | "te";
}

// Telugu script range. If the message itself is Telugu, it is Telugu no matter
// which way the EN/తెలుగు toggle is set — this is what lets Telugu speech be
// understood even when the toggle was left on English.
const TELUGU_RE = /[\u0C00-\u0C7F]/;

// Minimal typing for the browser Web Speech API (Chrome/Edge). It is not in
// the standard TS DOM lib under the webkit name, so we type only what we use.
interface SpeechRecognitionResultItem {
  transcript: string;
  isFinal: boolean;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultItem>>;
  resultIndex: number;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
}

let nextId = 1;

function greeting(lang: "en" | "te"): string {
  return lang === "te"
    ? "నమస్కారం! నేను మీ మట్టి సహాయకుడిని. మీ నేల నివేదిక గురించి ఏదైనా అడగండి."
    : "Namaste! I'm your soil assistant. Ask me anything about your soil report.";
}

export function ChatWindow({ initialLang }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    { id: nextId++, role: "assistant", text: greeting(initialLang) },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // Tracks what the last reply actually came from, for the honest header label.
  const [lastSource, setLastSource] = useState<"live" | "mock" | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  // Which assistant message is being read aloud right now, if any.
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  // Voice replies: the browser reads the answer aloud — no server, no key.
  // The reply's own script picks the voice: Telugu text gets a Telugu
  // voice even if the toggle is on English, mirroring the input rule.
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  };

  // Reads one reply aloud. Voice follows the reply's own script, so a
  // Telugu answer speaks in Telugu even if the toggle is on English.
  // Auto-play uses this silently (no error popup); the Listen button
  // reports the error when tapped.
  const speakMessage = (id: number, text: string): boolean => {
    if (!("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = TELUGU_RE.test(text) ? "te-IN" : initialLang === "te" ? "te-IN" : "en-IN";
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find((v) => v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()));
    if (match) utterance.voice = match;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
    return true;
  };

  const toggleSpeak = (id: number, text: string) => {
    if (speakingId === id) {
      stopSpeaking();
      return;
    }
    if (!speakMessage(id, text)) {
      setVoiceError(
        initialLang === "te"
          ? "వాయిస్ ప్లేబ్యాక్ ఈ బ్రౌజర్‌లో పనిచేయదు. Chrome వాడండి."
          : "Voice playback is not supported in this browser. Please use Chrome."
      );
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    stopSpeaking();
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    void (async () => {
      // Backend first when configured; any failure falls back to mock replies.
      if (BACKEND_CONFIGURED) {
        try {
          const report = store.getReport();
          const confirmed: Record<string, number> = {};
          if (report) {
            const MAP = { ph: "pH", ec: "EC", oc: "OC", n: "N", p: "P", k: "K" } as const;
            for (const p of report.parameters) {
              if (p.value !== null) confirmed[MAP[p.key]] = p.value;
            }
          }
          const res = await chatWithAssistant(trimmed, {
            // Telugu text wins over the toggle, so Telugu speech is answered
            // in Telugu even if the page toggle is still on English.
            language: TELUGU_RE.test(trimmed) ? "te" : initialLang,
            report_id: report?.id,
            context:
              Object.keys(confirmed).length > 0
                ? { confirmed_values: confirmed }
                : undefined,
          });
          const replyId = nextId++;
          setMessages((prev) => [...prev, { id: replyId, role: "assistant", text: res.answer }]);
          setLastSource("live");
          setTyping(false);
          // Answer in text AND voice: the reply shows on screen and speaks.
          speakMessage(replyId, res.answer);
          return;
        } catch {
          console.debug("SasyaSakhi: backend chat unavailable, using mock reply.");
        }
      }
      timerRef.current = setTimeout(() => {
        const reply = mockChatReply(trimmed, initialLang);
        const replyId = nextId++;
        setMessages((prev) => [...prev, { id: replyId, role: "assistant", text: reply }]);
        setLastSource("mock");
        setTyping(false);
        // Answer in text AND voice: the reply shows on screen and speaks.
        speakMessage(replyId, reply);
      }, 800);
    })();
  };

  const clearChat = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    stopSpeaking();
    setTyping(false);
    setLastSource(null);
    setMessages([{ id: nextId++, role: "assistant", text: greeting(initialLang) }]);
  };

  // Voice input: the browser converts speech to text (no server needed for
  // this step). The recogniser language follows the EN/తెలుగు toggle, so set
  // the toggle to తెలుగు before speaking Telugu.
  const toggleVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setVoiceError(
        initialLang === "te"
          ? "వాయిస్ ఈ బ్రౌజర్‌లో పనిచేయదు. Chrome వాడండి."
          : "Voice is not supported in this browser. Please use Chrome."
      );
      return;
    }
    setVoiceError(null);
    finalTranscriptRef.current = "";
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = initialLang === "te" ? "te-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j += 1) {
          const part = result[j];
          if (part.isFinal) finalText += part.transcript;
          else interim += part.transcript;
        }
      }
      if (finalText) finalTranscriptRef.current += finalText;
      setInput((finalTranscriptRef.current + interim).trimStart());
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError(
          initialLang === "te"
            ? "మైక్ అనుమతి ఇవ్వలేదు. బ్రౌజర్ సెట్టింగ్స్‌లో మైక్ అనుమతించండి."
            : "Microphone permission was denied. Allow the mic in browser settings."
        );
      } else if (event.error === "no-speech") {
        setVoiceError(
          initialLang === "te" ? "ఏమీ వినిపించలేదు. మళ్లీ ప్రయత్నించండి." : "Didn't hear anything. Try again."
        );
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
      const spoken = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = "";
      if (spoken) send(spoken);
    };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return (
    <div className="flex h-[70vh] min-h-[480px] flex-col overflow-hidden rounded-2xl border border-sage bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sage bg-ivory px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-ivory">
            <Sprout className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-display text-base font-semibold text-charcoal">SasyaSakhi Assistant</p>
            <p className="text-xs text-charcoal/60">
              {lastSource === "live"
                ? initialLang === "te"
                  ? "ప్రత్యక్ష సమాధానాలు"
                  : "Live answers"
                : lastSource === "mock"
                  ? initialLang === "te"
                    ? "మాక్ AI — డెమో సమాధానాలు"
                    : "Mock AI — demo responses"
                  : initialLang === "te"
                    ? "మీ నేల నివేదిక గురించి అడగండి"
                    : "Ask about your soil report"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={clearChat} aria-label={initialLang === "te" ? "చాట్ తొలగించండి" : "Clear chat"}>
          <Eraser className="h-4 w-4" aria-hidden />
          {initialLang === "te" ? "తొలగించండి" : "Clear"}
        </Button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto px-4 py-5"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 1 && (
          <div className="rounded-xl border border-dashed border-sage bg-ivory p-4 text-center">
            <p className="text-sm text-charcoal/65">
              {initialLang === "te"
                ? "కింద ప్రశ్నతో ప్రారంభించండి, లేదా సూచనలలో ఒకదాన్ని నొక్కండి."
                : "Start with a question below, or tap one of the suggestions."}
            </p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                m.role === "assistant" ? "bg-forest text-ivory" : "bg-sage text-forest"
              )}
              aria-hidden
            >
              {m.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </span>
            <div className="max-w-[80%]">
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "assistant"
                    ? "rounded-tl-sm bg-ivory text-charcoal"
                    : "rounded-tr-sm bg-forest text-ivory"
                )}
              >
                {m.text}
              </div>
              {m.role === "assistant" && (
                <button
                  type="button"
                  onClick={() => toggleSpeak(m.id, m.text)}
                  aria-label={
                    speakingId === m.id
                      ? initialLang === "te"
                        ? "చదవడం ఆపండి"
                        : "Stop reading"
                      : initialLang === "te"
                        ? "సమాధానం వినండి"
                        : "Listen to answer"
                  }
                  className="mt-1 ml-1 flex items-center gap-1 text-xs font-medium text-forest/70 hover:text-forest"
                >
                  {speakingId === m.id ? (
                    <VolumeX className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {speakingId === m.id
                    ? initialLang === "te"
                      ? "ఆపండి"
                      : "Stop"
                    : initialLang === "te"
                      ? "వినండి"
                      : "Listen"}
                </button>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2.5" aria-label="Assistant is typing">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-ivory" aria-hidden>
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-ivory px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-bounce rounded-full bg-forest/60"
                  style={{ animationDelay: `${i * 150}ms` }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestion chips */}
      <div className="border-t border-sage px-4 pt-3">
        <div className="flex flex-wrap gap-2" aria-label={initialLang === "te" ? "సూచించిన ప్రశ్నలు" : "Suggested questions"}>
          {(initialLang === "te" ? SUGGESTED_QUESTIONS_TE : SUGGESTED_QUESTIONS).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              disabled={typing}
              className="rounded-full border border-sage bg-ivory px-3 py-1.5 text-xs font-medium text-forest transition-colors hover:bg-sage disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-2 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          {initialLang === "te" ? "నేల సహాయకుడిని అడగండి" : "Ask the soil assistant"}
        </label>
        <input
          id="assistant-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={initialLang === "te" ? "మీ ప్రశ్న ఇక్కడ టైప్ చేయండి…" : "Type your question…"}
          className="h-10 flex-1 rounded-xl border border-sage bg-ivory px-4 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-forest focus:outline-none"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={toggleVoice}
          disabled={typing}
          aria-label={listening ? (initialLang === "te" ? "వినడం ఆపండి" : "Stop listening") : initialLang === "te" ? "మీ ప్రశ్న మాట్లాడండి" : "Speak your question"}
          title={listening ? (initialLang === "te" ? "వినడం ఆపండి" : "Stop listening") : initialLang === "te" ? "మీ ప్రశ్న మాట్లాడండి" : "Speak your question"}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50",
            listening
              ? "animate-pulse border-red-600 bg-red-600 text-white"
              : "border-sage bg-ivory text-forest hover:bg-sage"
          )}
        >
          {listening ? <MicOff className="h-4 w-4" aria-hidden /> : <Mic className="h-4 w-4" aria-hidden />}
        </button>
        <Button type="submit" disabled={!input.trim() || typing} aria-label={initialLang === "te" ? "సందేశం పంపండి" : "Send message"}>
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
      {(listening || voiceError) && (
        <p className="px-4 pb-3 text-xs text-charcoal/60" role="status">
          {listening
            ? initialLang === "te"
              ? "వింటున్నాను… మాట్లాడండి."
              : "Listening… speak now."
            : voiceError}
        </p>
      )}
    </div>
  );
}
