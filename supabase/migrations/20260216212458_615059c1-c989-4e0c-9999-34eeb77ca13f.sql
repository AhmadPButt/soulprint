
-- AI Conversations table
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  escalated_to_human BOOLEAN DEFAULT false,
  human_agent_id UUID,
  escalation_reason TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE
);

-- AI Messages table
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) NOT NULL,
  sender VARCHAR(50) NOT NULL, -- 'user', 'ai', 'human_agent'
  message_text TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_conversations_trip ON ai_conversations(trip_id);
CREATE INDEX idx_ai_conversations_escalated ON ai_conversations(escalated_to_human) WHERE escalated_to_human = true;
CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);

-- Enable RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- RLS for ai_conversations
CREATE POLICY "Users can view their own conversations" ON ai_conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations for their trips" ON ai_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid() AND user_is_trip_member(auth.uid(), trip_id));

CREATE POLICY "Users can update their own conversations" ON ai_conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations" ON ai_conversations
  FOR SELECT USING (true);

CREATE POLICY "Admins can update conversations" ON ai_conversations
  FOR UPDATE USING (true);

-- RLS for ai_messages
CREATE POLICY "Users can view messages in their conversations" ON ai_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON ai_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM ai_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert messages" ON ai_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all messages" ON ai_messages
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert messages" ON ai_messages
  FOR INSERT WITH CHECK (true);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
