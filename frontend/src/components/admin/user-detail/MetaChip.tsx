import React from "react";

interface MetaChipProps {
  icon: React.ElementType;
  children: React.ReactNode;
}

export default function MetaChip({ icon: Icon, children }: MetaChipProps): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 text-foreground border border-border/80">
      <Icon size={12} className="text-muted-foreground" />
      {children}
    </span>
  );
}
