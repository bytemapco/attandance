"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface GlassBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function GlassBreadcrumb({ items, className = "" }: GlassBreadcrumbProps): React.ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4 flex items-center text-xs text-muted-foreground", className)}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={12} className="text-muted-foreground/60 shrink-0" />}
            <li>
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground font-medium transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="font-semibold text-foreground">{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}
