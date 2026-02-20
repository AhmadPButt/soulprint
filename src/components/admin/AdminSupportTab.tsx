import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { HeadphonesIcon, Send, User, Clock, CheckCircle, Paperclip, FileImage, X } from "lucide-react";
import fingerprintImg from "@/assets/fingerprint.png";

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
  traveler_name?: string;
  destination_name?: string;
}

interface Message {
  id: string;
  sender: string;
  message_text: string;
  created_at: string;
  metadata?: { attachment_url?: string; attachment_name?: string } | null;
}

export function AdminSupportTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => { loadConversations(); }, []);

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

      const convs = (data as any[]) || [];
      const enriched: Conversation[] = [];

      for (const conv of convs) {
        let trip_name = '';
        let destination_name = '';
        let user_email = '';
        let traveler_name = '';

        const { data: trip } = await supabase
          .from('trips')
          .select('trip_name, destination_id')
          .eq('id', conv.trip_id)
          .single();

        if (trip) {
          trip_name = (trip as any).trip_name;
          if ((trip as any).destination_id) {
            const { data: dest } = await supabase
              .from('echoprint_destinations')
              .select('name')
              .eq('id', (trip as any).destination_id)
              .single();
            destination_name = (dest as any)?.name || '';
          }
        }

        // Get traveler info from respondents linked to this user
        if (conv.user_id) {
          const { data: respondent } = await supabase
            .from('respondents')
            .select('name, email')
            .eq('user_id', conv.user_id)
            .maybeSingle();
          if (respondent) {
            traveler_name = (respondent as any).name || '';
            user_email = (respondent as any).email || '';
          }
        }

        enriched.push({ ...conv, trip_name, destination_name, user_email, traveler_name });
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

  const uploadAttachment = async (file: File): Promise<{ url: string; name: string } | null> => {
    setUploadingAttachment(true);
    try {
      const path = `chat-attachments/admin/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from("trip-documents").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("trip-documents").getPublicUrl(data.path);
      return { url: urlData.publicUrl, name: file.name };
    } catch {
      toast({ title: "Attachment upload failed", variant: "destructive" });
      return null;
    } finally {
      setUploadingAttachment(false);
    }
  };

  const sendReply = async () => {
    if ((!replyText.trim() && !attachedFile) || !selectedConv) return;
    setSending(true);
    try {
      let attachment: { url: string; name: string } | null = null;
      if (attachedFile) {
        attachment = await uploadAttachment(attachedFile);
        setAttachedFile(null);
      }

      const { error } = await supabase
        .from('ai_messages' as any)
        .insert({
          conversation_id: selectedConv.id,
          sender: 'human_agent',
          message_text: replyText.trim() || `📎 ${attachment?.name}`,
          metadata: attachment ? { attachment_url: attachment.url, attachment_name: attachment.name } : null,
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

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading support conversations...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Conversation List */}
      <div className="md:col-span-1 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Conversations ({conversations.length})
          </h3>
          {escalatedConvs.length > 0 && (
            <span className="text-xs text-amber-500 font-medium">🔔 {escalatedConvs.length} escalated</span>
          )}
        </div>

        <ScrollArea className="h-[520px]">
          <div className="space-y-2 pr-2">
            {conversations.length === 0 && (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-3">
                  <img src={fingerprintImg} alt="Support" className="w-7 h-7 object-contain opacity-40" />
                </div>
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            )}
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedConv?.id === conv.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30 hover:bg-accent/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    {/* Traveler name — prominent */}
                    {conv.traveler_name ? (
                      <p className="text-sm font-semibold text-foreground truncate">{conv.traveler_name}</p>
                    ) : (
                      <p className="text-sm font-semibold text-muted-foreground truncate">Unknown Traveler</p>
                    )}
                    {conv.user_email && (
                      <p className="text-[11px] text-muted-foreground truncate">{conv.user_email}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {conv.escalated_to_human && !conv.ended_at && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">Escalated</Badge>
                    )}
                    {conv.ended_at && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Resolved</Badge>
                    )}
                  </div>
                </div>
                {/* Trip info */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-medium text-primary/70 bg-accent px-2 py-0.5 rounded-full truncate max-w-[140px]">
                    {conv.trip_name || 'Unknown Trip'}
                  </span>
                  {conv.destination_name && (
                    <span className="text-[10px] text-muted-foreground truncate">→ {conv.destination_name}</span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
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
          <Card className="flex flex-col h-full">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Traveler avatar */}
                    <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {selectedConv.traveler_name || selectedConv.user_email || 'Unknown Traveler'}
                      </CardTitle>
                      {selectedConv.user_email && selectedConv.traveler_name && (
                        <p className="text-xs text-muted-foreground">{selectedConv.user_email}</p>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs mt-1.5 flex flex-wrap gap-x-2">
                    <span className="font-medium text-foreground/70">{selectedConv.trip_name}</span>
                    {selectedConv.destination_name && <span>→ {selectedConv.destination_name}</span>}
                    <span className="text-muted-foreground">• {new Date(selectedConv.started_at).toLocaleString()}</span>
                    {selectedConv.escalation_reason && (
                      <span className="text-amber-600">• {selectedConv.escalation_reason}</span>
                    )}
                  </CardDescription>
                </div>
                {!selectedConv.ended_at && (
                  <Button variant="outline" size="sm" onClick={markResolved} className="gap-1.5 shrink-0">
                    <CheckCircle className="h-3.5 w-3.5" /> Resolve
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 space-y-3">
              <ScrollArea className="flex-1 h-[340px]">
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
                          {msg.sender === 'user' && <User className="h-3 w-3 text-muted-foreground" />}
                          {msg.sender === 'ai' && (
                            <img src={fingerprintImg} alt="AI" className="h-3 w-3 object-contain opacity-70" />
                          )}
                          {msg.sender === 'human_agent' && <HeadphonesIcon className="h-3 w-3 text-amber-500" />}
                          <span className="text-[10px] font-medium opacity-60">
                            {msg.sender === 'user'
                              ? (selectedConv.traveler_name || 'Traveler')
                              : msg.sender === 'ai' ? 'AI Assistant' : 'Erranza Team'}
                          </span>
                          <span className="text-[10px] opacity-40 ml-auto">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap">{msg.message_text}</p>
                        {msg.metadata?.attachment_url && (
                          <a
                            href={msg.metadata.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center gap-1.5 text-xs underline opacity-80 hover:opacity-100"
                          >
                            <FileImage className="h-3.5 w-3.5 shrink-0" />
                            {msg.metadata.attachment_name || "Attachment"}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Attachment preview */}
              {attachedFile && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/40 border border-border text-xs">
                  <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate font-medium">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="ml-auto shrink-0 text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Reply input */}
              {!selectedConv.ended_at && (
                <div className="flex gap-2 pt-2 border-t border-border shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={e => setAttachedFile(e.target.files?.[0] || null)}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0"
                    title="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <Input
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedConv.traveler_name || 'traveler'} as Erranza team...`}
                    onKeyDown={e => e.key === 'Enter' && sendReply()}
                    disabled={sending || uploadingAttachment}
                    className="rounded-full"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={sending || uploadingAttachment || (!replyText.trim() && !attachedFile)}
                    size="icon"
                    className="rounded-full shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {selectedConv.ended_at && (
                <p className="text-center text-xs text-muted-foreground py-2 border-t border-border">
                  ✓ Conversation resolved
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                <img src={fingerprintImg} alt="Support" className="w-9 h-9 object-contain opacity-40" />
              </div>
              <p className="text-muted-foreground">Select a conversation to view</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
