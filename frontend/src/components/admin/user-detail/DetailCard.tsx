import React from "react";
import GlassCard from "@/components/ui/GlassCard";

interface DetailCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function DetailCard({ icon: Icon, title, subtitle, children }: DetailCardProps): React.ReactElement {
  return (
    <GlassCard className="!p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2.5">
          <Icon size={17} className="text-[#526f78]" />
          {title}
        </h2>
        <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>
      </div>
      <div className="p-4 space-y-1">{children}</div>
    </GlassCard>
  );
}
