import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { MessageCircleQuestion, RotateCcw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const SUGGESTIONS = ["Como funcionam os cursos?", "Qual curso combina com quem quer mudar de carreira?", "Quanto custa?"];

function ChatPanel({ userId, initial, onClose }: { userId: string | null; initial: UIMessage[]; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const t = data.session?.access_token;
          return t ? { Authorization: `Bearer ${t}` } : {};
        },
      }),
    [],
  );
  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: userId ?? "visitor",
    messages: initial,
    transport,
    onError: (e) => setError(e.message?.startsWith("{") ? (JSON.parse(e.message).error ?? "Erro") : "Não consegui responder agora. Tente de novo."),
  });
  const busy = status === "submitted" || status === "streaming";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (!busy) textareaRef.current?.focus(); }, [busy]);

  const send = (text: string) => {
    if (!text.trim() || busy) return;
    setError(null);
    sendMessage({ text });
  };

  const reset = async () => {
    if (userId) await supabase.from("assistant_messages").delete().eq("user_id", userId);
    setMessages([]);
  };

  return (
    <div role="dialog" aria-label="Assistente da Outro Ângulo" className="fixed inset-x-3 bottom-20 z-50 flex h-[min(560px,75vh)] flex-col overflow-hidden rounded-md border bg-background shadow-xl md:inset-x-auto md:bottom-24 md:right-6 md:w-[400px]">
      <header className="flex items-center justify-between border-b bg-ink px-4 py-3 text-ink-foreground">
        <div className="flex items-center gap-2">
          <span aria-hidden className="relative block h-4 w-4 border-l-2 border-t-2 border-ink-foreground"><span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 bg-highlight" /></span>
          <div>
            <p className="font-heading text-sm font-semibold">Tire suas dúvidas</p>
            <p className="text-xs text-ink-foreground/60">Sobre a plataforma e os cursos</p>
          </div>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={reset} aria-label="Começar nova conversa" className="rounded p-1.5 hover:bg-ink-foreground/10"><RotateCcw className="h-4 w-4" /></button>
          )}
          <button type="button" onClick={onClose} aria-label="Fechar assistente" className="rounded p-1.5 hover:bg-ink-foreground/10"><X className="h-4 w-4" /></button>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="gap-5 px-4 py-4">
          {messages.length === 0 ? (
            <ConversationEmptyState title="Olá! Como posso ajudar?" description="Pergunte sobre cursos, preços, aula aberta ou como a plataforma funciona.">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="font-heading text-base font-semibold">Olá! Como posso ajudar?</p>
                <p className="text-sm text-muted-foreground">Pergunte sobre cursos, preços, aula aberta ou como a plataforma funciona.</p>
                <div className="mt-2 flex flex-col gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded border px-3 py-2 text-left text-sm hover:border-primary">{s}</button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                  {m.parts.map((p, i) => (p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null))}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && <Shimmer className="text-sm">Pensando...</Shimmer>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t p-3">
        <PromptInput onSubmit={(msg) => send(msg.text ?? "")}>
          <PromptInputTextarea ref={textareaRef} placeholder="Escreva sua dúvida..." maxLength={2000} />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
        {!userId && <p className="mt-2 text-[11px] text-muted-foreground">Sem conta, você pode fazer algumas perguntas por dia.</p>}
      </div>
    </div>
  );
}

export function AssistantWidget() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!open || loading) return;
    let alive = true;
    setInitial(null);
    if (!userId) { setInitial([]); return; }
    supabase.from("assistant_messages").select("message").eq("user_id", userId).order("created_at").limit(200)
      .then(({ data }) => { if (alive) setInitial((data ?? []).map((r) => r.message as unknown as UIMessage)); });
    return () => { alive = false; };
  }, [open, userId, loading]);

  return (
    <>
      {open && initial && <ChatPanel key={userId ?? "visitor"} userId={userId} initial={initial} onClose={() => setOpen(false)} />}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Fechar assistente" : "Abrir assistente de dúvidas"}
        aria-expanded={open}
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-ink text-ink-foreground shadow-lg ring-2 ring-highlight/0 transition hover:-translate-y-0.5 hover:ring-highlight focus-visible:outline-none focus-visible:ring-highlight md:bottom-6 md:right-6 md:h-14 md:w-14"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-6 w-6" />}
      </button>
    </>
  );
}
