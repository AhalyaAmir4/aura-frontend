import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

type Msg = { role: 'user' | 'assistant'; content: string };

const WELCOME_MSG: Msg = {
  role: 'assistant',
  content: "Hi! I'm AURA AI 🎓 Ask me anything about your attendance — like:\n• \"How many classes can I bunk?\"\n• \"Which subject needs attention?\"\n• \"What is my attendance percentage?\"\n• \"How does OD work?\"\n• \"I have a device issue\""
};

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME_MSG]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, busy]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;

    const userMsg: Msg = { role: 'user', content: text };
    setMsgs(m => [...m, userMsg]);
    setInput('');
    setError('');
    setBusy(true);

    // Build message history for context (exclude welcome msg from history)
    const history = [...msgs.slice(1), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const { data } = await api.post('/chat', { messages: history });
      setMsgs(m => [...m, { role: 'assistant', content: data.reply || 'Sorry, I could not generate a reply.' }]);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Connection error. Please try again.';
      setError(msg);
      // Add error as assistant message so the conversation stays coherent
      setMsgs(m => [...m, {
        role: 'assistant',
        content: msg.includes('not configured') || msg.includes('API key')
          ? '⚠️ AI is not configured yet. Ask your admin to set the LOVABLE_API_KEY on the backend.'
          : `⚠️ ${msg}`
      }]);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setMsgs([WELCOME_MSG]);
    setError('');
    setInput('');
  };

  // Format message content — convert \n to <br> and **bold** markers
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i, arr) => (
      <span key={i}>
        {line}
        {i < arr.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-glow hover:scale-110 transition-transform z-40 p-0"
          title="AURA AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </Button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[370px] max-w-[calc(100vw-1.5rem)] h-[540px] max-h-[calc(100vh-2rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-40 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-primary p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AURA AI</div>
                <div className="text-[10px] text-white/80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-300 inline-block"></span>
                  Attendance Assistant
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" onClick={reset}
                className="text-white hover:bg-white/20 h-8 w-8" title="Clear chat">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 mr-2 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-gradient-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary rounded-bl-sm'
                }`}>
                  {formatContent(m.content)}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-gradient-primary flex items-center justify-center shrink-0 mr-2">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]"></div>
                    <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]"></div>
                    <div className="h-2 w-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick prompts — only show when few messages */}
          {msgs.length <= 2 && !busy && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {["My attendance %?", "Can I bunk more?", "OD status?", "Device issue"].map(q => (
                <button key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 shrink-0 bg-card">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your attendance…"
              className="flex-1 text-sm"
              disabled={busy}
            />
            <Button size="icon" onClick={send} disabled={busy || !input.trim()}
              className="bg-gradient-primary shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}