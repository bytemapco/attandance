import React from "react";
import { 
  Radio, Activity, ClipboardCheck, Calendar, Smartphone, 
  UserPlus, UserCheck, BookOpen, Cpu, ShieldCheck, 
  GraduationCap, Users, LayoutDashboard, Search, Sparkles,
  Building2, KeyRound, ScrollText, BarChart3
} from "lucide-react";

export function getCommandIcon(iconType?: string | null, category?: string): React.ReactElement {
  switch (iconType) {
    case "radio":
      return <Radio size={16} className="text-accent-strong" />;
    case "activity":
      return <Activity size={16} className="text-muted-foreground" />;
    case "clipboard-check":
      return <ClipboardCheck size={16} className="text-accent-strong" />;
    case "calendar":
      return <Calendar size={16} className="text-muted-foreground" />;
    case "smartphone":
      return <Smartphone size={16} className="text-muted-foreground" />;
    case "user-plus":
      return <UserPlus size={16} className="text-success" />;
    case "user-check":
      return <UserCheck size={16} className="text-muted-foreground" />;
    case "book-plus":
    case "book-open":
      return <BookOpen size={16} className="text-primary" />;
    case "cpu":
      return <Cpu size={16} className="text-accent-strong" />;
    case "shield-check":
      return <ShieldCheck size={16} className="text-success" />;
    case "graduation-cap":
      return <GraduationCap size={16} className="text-primary" />;
    case "users":
      return <Users size={16} className="text-muted-foreground" />;
    case "building":
      return <Building2 size={16} className="text-primary" />;
    case "key":
      return <KeyRound size={16} className="text-accent-strong" />;
    case "scroll-text":
      return <ScrollText size={16} className="text-muted-foreground" />;
    case "bar-chart":
      return <BarChart3 size={16} className="text-muted-foreground" />;
    case "dashboard":
      return <LayoutDashboard size={16} className="text-muted-foreground" />;
    default:
      if (category === "student") return <GraduationCap size={16} className="text-primary" />;
      if (category === "faculty") return <Users size={16} className="text-muted-foreground" />;
      if (category === "class") return <BookOpen size={16} className="text-primary" />;
      if (category === "session") return <Calendar size={16} className="text-muted-foreground" />;
      if (category === "tenant") return <Building2 size={16} className="text-primary" />;
      if (category === "action") return <Sparkles size={16} className="text-accent-strong" />;
      return <Search size={16} className="text-muted-foreground" />;
  }
}
