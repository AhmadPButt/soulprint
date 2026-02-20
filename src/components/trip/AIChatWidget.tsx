import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, X, Send, Loader2, UserRound, Bot, HeadphonesIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
}

export function AIChatWidget({ tripId, destinationName, externalOpen, onClose }: AIChatWidgetProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Sync external open state
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Subscribe to realtime messages when conversation exists
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
        // Only add human_agent messages via realtime (user/ai are added optimistically)
        if (msg.sender === 'human_agent') {
          setMessages(prev => [...prev, { id: msg.id, sender: msg.sender, text: msg.message_text, created_at: msg.created_at }]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Load existing conversation on open
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
          id: m.id, sender: m.sender, text: m.message_text, created_at: m.created_at
        })));
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { conversation_id: conversationId, user_message: userMsg, trip_id: tripId }
      });

      if (error) throw error;

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err: any) {
      console.error('Chat error:', err);
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // When externalOpen prop controls visibility, don't render the default floating button
  if (!isOpen) {
    if (externalOpen !== undefined) return null; // controlled externally
    return (
      <button
        id="ai-chat-open-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">Need help? 💬</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-4rem)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <div>
            <h3 className="text-sm font-semibold">Erranza Travel Assistant</h3>
            {destinationName && <p className="text-xs opacity-80">{destinationName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!escalated && conversationId && (
            <button
              onClick={escalateToHuman}
              className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
              title="Talk to a human"
            >
              <HeadphonesIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => { setIsOpen(false); onClose?.(); }}
            className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground/40" />
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
                    <Bot className="h-3 w-3 text-primary" />
                  )}
                  <span className="text-[10px] font-medium opacity-70">
                    {msg.sender === 'human_agent' ? 'Erranza Team' : 'AI Assistant'}
                  </span>
                </div>
              )}
              <div className="prose prose-sm max-w-none [&>p]:mb-1 [&>p:last-child]:mb-0">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
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

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your trip..."
            className="flex-1 rounded-full"
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="rounded-full shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
