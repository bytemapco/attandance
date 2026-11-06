-- Assistant (agentic chat) tables. Reference copy: `prisma db push` builds them from schema.prisma.

CREATE TABLE "agent_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "events" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_tool_calls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "tool_name" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "outcome" TEXT NOT NULL,
    "detail" TEXT,
    "duration_ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_tool_calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agent_proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "tool_name" TEXT NOT NULL,
    "arguments" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "preview" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "decided_at" TIMESTAMP(3),
    CONSTRAINT "agent_proposals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "agent_conversations_tenant_id_user_id_updated_at_idx" ON "agent_conversations"("tenant_id", "user_id", "updated_at");
CREATE INDEX "agent_messages_conversation_id_created_at_idx" ON "agent_messages"("conversation_id", "created_at");
CREATE INDEX "agent_tool_calls_tenant_id_created_at_idx" ON "agent_tool_calls"("tenant_id", "created_at");
CREATE INDEX "agent_tool_calls_user_id_created_at_idx" ON "agent_tool_calls"("user_id", "created_at");
CREATE INDEX "agent_proposals_tenant_id_user_id_status_idx" ON "agent_proposals"("tenant_id", "user_id", "status");

ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_conversations" ADD CONSTRAINT "agent_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_messages" ADD CONSTRAINT "agent_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "agent_proposals" ADD CONSTRAINT "agent_proposals_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "agent_conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
