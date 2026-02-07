-- RLS Policies for Conversations and Messages Tables
-- Run this in Supabase SQL Editor

-- ========================================
-- CONVERSATIONS TABLE POLICIES
-- ========================================

-- Allow users to view conversations where they are buyer or seller
DROP POLICY IF EXISTS "allow_view_own_conversations" ON conversations;
CREATE POLICY "allow_view_own_conversations" ON conversations
FOR SELECT TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Allow users to create conversations as buyer
DROP POLICY IF EXISTS "allow_create_conversations" ON conversations;
CREATE POLICY "allow_create_conversations" ON conversations
FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

-- Allow users to update conversations where they are participants
DROP POLICY IF EXISTS "allow_update_own_conversations" ON conversations;
CREATE POLICY "allow_update_own_conversations" ON conversations
FOR UPDATE TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid())
WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ========================================
-- MESSAGES TABLE POLICIES
-- ========================================

-- Allow users to view messages in their conversations
DROP POLICY IF EXISTS "allow_view_own_messages" ON messages;
CREATE POLICY "allow_view_own_messages" ON messages
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);

-- Allow users to send messages in their conversations
DROP POLICY IF EXISTS "allow_send_messages" ON messages;
CREATE POLICY "allow_send_messages" ON messages
FOR INSERT TO authenticated
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);

-- Allow users to update their own messages (mark as read, etc)
DROP POLICY IF EXISTS "allow_update_messages" ON messages;
CREATE POLICY "allow_update_messages" ON messages
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations
        WHERE conversations.id = messages.conversation_id
        AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
);
