import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { X, Send, Loader2, UserRound, HeadphonesIcon, Paperclip, FileImage } from "lucide-react";
import ReactMarkdown from "react-markdown";
import fingerprintImg from "@/assets/fingerprint.png";

interface AIChatWidgetProps {
  tripId: string;
  destinationName?: string;
  externalOpen?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  created_at?: string;
  attachment_url?: string;
  attachment_name?: string;
}

export function AIChatWidget({ tripId, destinationName, externalOpen, onClose }: AIChatWidgetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== isOpen) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`ai-messages-${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload: any) => {
        const msg = payload.new;
        if (msg.sender === 'human_agent') {
          setMessages(prev => [...prev, {
            id: msg.id,
            sender: msg.sender,
            text: msg.message_text,
            created_at: msg.created_at,
            attachment_url: msg.metadata?.attachment_url,
            attachment_name: msg.metadata?.attachment_name,
          }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  useEffect(() => {
    if (!isOpen) return;
    loadExistingConversation();
  }, [isOpen]);

  const loadExistingConversation = async () => {
    const { data } = await supabase
      .from('ai_conversations' as any)
      .select('id, escalated_to_human')
      .eq('trip_id', tripId)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setConversationId((data as any).id);
      setEscalated((data as any).escalated_to_human || false);
      const { data: msgs } = await supabase
        .from('ai_messages' as any)
        .select('*')
        .eq('conversation_id', (data as any).id)
        .order('created_at', { ascending: true });

      if (msgs) {
        setMessages((msgs as any[]).map(m => ({
          id: m.id,
          sender: m.sender,
          text: m.message_text,
          created_at: m.created_at,
          attachment_url: m.metadata?.attachment_url,
          attachment_name: m.metadata?.attachment_name,
        })));
      }
    }
  };

  const uploadAttachment = async (file: File): Promise<{ url: string; name: string } | null> => {
    setUploadingAttachment(true);
    try {
      const path = `chat-attachments/${tripId}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("trip-documents").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("trip-documents").getPublicUrl(data.path);
      return { url: urlData.publicUrl, name: file.name };
    } catch (err) {
      toast({ title: "Attachment failed", variant: "destructive" });
      return null;
    } finally {
      setUploadingAttachment(false);
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedFile) || loading) return;
    const userMsg = input.trim();
    setInput("");

    let attachment: { url: string; name: string } | null = null;
    if (attachedFile) {
      attachment = await uploadAttachment(attachedFile);
      setAttachedFile(null);
    }

    setMessages(prev => [...prev, {
      sender: 'user',
      text: userMsg || (attachment ? `📎 ${attachment.name}` : ""),
      attachment_url: attachment?.url,
      attachment_name: attachment?.name,
    }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          conversation_id: conversationId,
          user_message: userMsg || `[Attachment: ${attachment?.name}]`,
          trip_id: tripId,
          attachment_url: attachment?.url,
        }
      });

      if (error) throw error;
      if (data.conversation_id && !conversationId) setConversationId(data.conversation_id);
      setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I'm having trouble right now. Please try again or talk to a human." }]);
    } finally {
      setLoading(false);
    }
  };

  const escalateToHuman = async () => {
    if (!conversationId) return;
    try {
      await supabase
        .from('ai_conversations' as any)
        .update({
          escalated_to_human: true,
          escalation_reason: 'User requested human assistance',
          escalated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
      setEscalated(true);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: "I've notified the Erranza team. Someone will respond shortly. For urgent matters, email hello@erranza.com."
      }]);
      toast({ title: "Support notified", description: "A team member will respond soon." });
    } catch (err) {
      console.error('Escalation error:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) {
    if (externalOpen !== undefined) return null;
    return (
      <button
        id="ai-chat-open-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <img src={fingerprintImg} alt="AI" className="h-5 w-5 object-contain brightness-0 invert" />
        <span className="text-sm font-medium">Need help? 💬</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-4rem)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center shrink-0">
            <img src={fingerprintImg} alt="AI" className="w-5 h-5 object-contain brightness-0 invert" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Erranza Travel Assistant</h3>
            {destinationName && <p className="text-xs opacity-80">{destinationName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!escalated && conversationId && (
            <button onClick={escalateToHuman} className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors" title="Talk to a human">
              <HeadphonesIcon className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => { setIsOpen(false); onClose?.(); }} className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto">
              <img src={fingerprintImg} alt="AI" className="w-9 h-9 object-contain opacity-60" />
            </div>
            <p className="text-sm text-muted-foreground">
              Hi! I'm your Erranza travel assistant. Ask me anything about your trip{destinationName ? ` to ${destinationName}` : ''} — itinerary, local tips, bookings, or emergencies.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.sender === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : msg.sender === 'human_agent'
                ? 'bg-amber-500/10 border border-amber-500/30 text-foreground rounded-bl-md'
                : 'bg-muted text-foreground rounded-bl-md'
            }`}>
              {msg.sender !== 'user' && (
                <div className="flex items-center gap-1.5 mb-1">
                  {msg.sender === 'human_agent' ? (
                    <UserRound className="h-3 w-3 text-amber-500" />
                  ) : (
                    <img src={fingerprintImg} alt="AI" className="h-3 w-3 object-contain opacity-70" />
                  )}
                  <span className="text-[10px] font-medium opacity-70">
                    {msg.sender === 'human_agent' ? 'Erranza Team' : 'AI Assistant'}
                  </span>
                </div>
              )}
              {msg.text && (
                <div className="prose prose-sm max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              )}
              {msg.attachment_url && (
                <a
                  href={msg.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 flex items-center gap-1.5 text-xs underline opacity-80 hover:opacity-100"
                >
                  <FileImage className="h-3.5 w-3.5 shrink-0" />
                  {msg.attachment_name || "Attachment"}
                </a>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Escalation banner */}
      {escalated && (
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-xs text-center text-amber-700">
          🟡 Escalated to human support — a team member will reply here
        </div>
      )}

      {/* Attached file preview */}
      {attachedFile && (
        <div className="px-3 py-2 border-t border-border bg-accent/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <Paperclip className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-foreground font-medium">{attachedFile.name}</span>
          </div>
          <button onClick={() => setAttachedFile(null)} className="shrink-0 ml-2 text-muted-foreground hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            onChange={e => setAttachedFile(e.target.files?.[0] || null)}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your trip..."
            className="flex-1 rounded-full"
            disabled={loading || uploadingAttachment}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || uploadingAttachment || (!input.trim() && !attachedFile)}
            size="icon"
            className="rounded-full shrink-0"
          >
            {loading || uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
