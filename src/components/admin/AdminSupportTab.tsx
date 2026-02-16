import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { HeadphonesIcon, Send, MessageCircle, User, Bot, Clock, CheckCircle } from "lucide-react";

interface Conversation {
  id: string;
  trip_id: string;
  user_id: string;
  started_at: string;
  escalated_to_human: boolean;
  escalation_reason: string | null;
  escalated_at: string | null;
  ended_at: string | null;
  trip_name?: string;
  user_email?: string;
  destination_name?: string;
}

interface Message {
  id: string;
  sender: string;
  message_text: string;
  created_at: string;
}

export function AdminSupportTab() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!selectedConv) return;
    loadMessages(selectedConv.id);

    const channel = supabase
      .channel(`admin-messages-${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ai_messages',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, () => loadMessages(selectedConv.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConv?.id]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations' as any)
        .select('*')
        .order('started_at', { ascending: false });

      if (error) throw error;

      // Enrich with trip/user data
      const convs = (data as any[]) || [];
      const enriched: Conversation[] = [];

      for (const conv of convs) {
        let trip_name = '';
        let destination_name = '';
        let user_email = '';

        const { data: trip } = await supabase.from('trips').select('trip_name, destination_id').eq('id', conv.trip_id).single();
        if (trip) {
          trip_name = (trip as any).trip_name;
          if ((trip as any).destination_id) {
            const { data: dest } = await supabase.from('echoprint_destinations').select('name').eq('id', (trip as any).destination_id).single();
            destination_name = (dest as any)?.name || '';
          }
        }

        enriched.push({ ...conv, trip_name, destination_name, user_email });
      }

      setConversations(enriched);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('ai_messages' as any)
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data as any[]) || []);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      const { error } = await supabase
        .from('ai_messages' as any)
        .insert({
          conversation_id: selectedConv.id,
          sender: 'human_agent',
          message_text: replyText.trim(),
        });
      if (error) throw error;
      setReplyText("");
      toast({ title: "Reply sent" });
      loadMessages(selectedConv.id);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const markResolved = async () => {
    if (!selectedConv) return;
    await supabase
      .from('ai_conversations' as any)
      .update({ ended_at: new Date().toISOString() })
      .eq('id', selectedConv.id);
    toast({ title: "Conversation marked as resolved" });
    loadConversations();
    setSelectedConv(null);
  };

  const escalatedConvs = conversations.filter(c => c.escalated_to_human);
  const allConvs = conversations;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading support conversations...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Conversation List */}
      <div className="md:col-span-1 space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Conversations ({allConvs.length})
        </h3>
        {escalatedConvs.length > 0 && (
          <p className="text-xs text-amber-500 font-medium">
            🔔 {escalatedConvs.length} escalated
          </p>
        )}
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-2">
            {allConvs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p>
            )}
            {allConvs.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedConv?.id === conv.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium truncate">{conv.trip_name || 'Unknown Trip'}</span>
                  {conv.escalated_to_human && !conv.ended_at && (
                    <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Escalated</Badge>
                  )}
                  {conv.ended_at && (
                    <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">Resolved</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{conv.destination_name || ''}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(conv.started_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Message Thread */}
      <div className="md:col-span-2">
        {selectedConv ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{selectedConv.trip_name} — {selectedConv.destination_name}</CardTitle>
                  <CardDescription className="text-xs">
                    Started {new Date(selectedConv.started_at).toLocaleString()}
                    {selectedConv.escalation_reason && ` • Reason: ${selectedConv.escalation_reason}`}
                  </CardDescription>
                </div>
                {!selectedConv.ended_at && (
                  <Button variant="outline" size="sm" onClick={markResolved} className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-2">
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === 'user'
                          ? 'bg-primary/10 text-foreground rounded-br-md'
                          : msg.sender === 'human_agent'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-foreground rounded-bl-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {msg.sender === 'user' && <User className="h-3 w-3" />}
                          {msg.sender === 'ai' && <Bot className="h-3 w-3 text-primary" />}
                          {msg.sender === 'human_agent' && <HeadphonesIcon className="h-3 w-3 text-amber-500" />}
                          <span className="text-[10px] font-medium opacity-60">
                            {msg.sender === 'user' ? 'Traveler' : msg.sender === 'ai' ? 'AI' : 'Agent'}
                          </span>
                          <span className="text-[10px] opacity-40 ml-auto">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.message_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply input */}
              {!selectedConv.ended_at && (
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Reply as Erranza team..."
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                  />
                  <Button onClick={sendReply} disabled={sending || !replyText.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center py-16">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Select a conversation to view</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
