-- CreateIndex
CREATE INDEX "llm_messages_conversationId_createdAt_idx" ON "llm_messages"("conversationId", "createdAt");
