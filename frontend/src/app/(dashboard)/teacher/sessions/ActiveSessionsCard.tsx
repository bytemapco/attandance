import React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, BookOpen, Square, QrCode } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import GlassBadge from "@/components/ui/GlassBadge";
import GlassButton from "@/components/ui/GlassButton";
import type { SessionResponse } from "@/types";

interface ActiveSessionsCardProps {
  sessions: SessionResponse[];
  onStop: (id: string) => void;
  onOpenQr?: (session: SessionResponse) => void;
}

export default function ActiveSessionsCard({
  sessions,
  onStop,
  onOpenQr,
}: ActiveSessionsCardProps): React.ReactElement {
  const router = useRouter();

  return (
    <GlassCard>
      <h3 className="text-base font-semibold text-foreground mb-4">Active Sessions</h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No active sessions</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-xl border border-border bg-card shadow-2xs flex items-center justify-between"
            >
              <div>
                <GlassBadge variant="success">Live</GlassBadge>
                <p className="text-xs font-mono text-muted-foreground mt-1">{session.id.slice(0, 8)}...</p>
                <p className="text-xs text-muted-foreground">
                  Ends: {new Date(session.endTime).toLocaleTimeString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onOpenQr && (
                  <GlassButton
                    variant="primary"
                    size="sm"
                    icon={<QrCode size={14} />}
                    onClick={() => onOpenQr(session)}
                  >
                    Smart Pass QR
                  </GlassButton>
                )}
                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<ClipboardList size={14} />}
                  onClick={() => router.push(`/teacher/sessions/${session.id}/roster`)}
                >
                  Roster
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<BookOpen size={14} />}
                  onClick={() => router.push(`/teacher/sessions/${session.id}/manual`)}
                >
                  Manual
                </GlassButton>
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={() => onStop(session.id)}
                  icon={<Square size={14} />}
                >
                  Stop
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
