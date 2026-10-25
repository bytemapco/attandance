import React from "react";
import { 
  Radio, Activity, ClipboardCheck, Calendar, Smartphone, 
  UserPlus, UserCheck, BookOpen, Cpu, ShieldCheck, 
  GraduationCap, Users, LayoutDashboard, Search, Sparkles
} from "lucide-react";

export function getCommandIcon(iconType?: string | null, category?: string): React.ReactElement {
  switch (iconType) {
    case "radio":
      return <Radio size={16} className="text-emerald-500" />;
    case "activity":
      return <Activity size={16} className="text-sky-500" />;
    case "clipboard-check":
      return <ClipboardCheck size={16} className="text-amber-500" />;
    case "calendar":
      return <Calendar size={16} className="text-indigo-400" />;
    case "smartphone":
      return <Smartphone size={16} className="text-purple-400" />;
    case "user-plus":
      return <UserPlus size={16} className="text-emerald-500" />;
    case "user-check":
      return <UserCheck size={16} className="text-blue-500" />;
    case "book-plus":
    case "book-open":
      return <BookOpen size={16} className="text-teal-400" />;
    case "cpu":
      return <Cpu size={16} className="text-amber-500" />;
    case "shield-check":
      return <ShieldCheck size={16} className="text-emerald-400" />;
    case "graduation-cap":
      return <GraduationCap size={16} className="text-sky-400" />;
    case "users":
      return <Users size={16} className="text-indigo-400" />;
    case "dashboard":
      return <LayoutDashboard size={16} className="text-slate-400" />;
    default:
      if (category === "student") return <GraduationCap size={16} className="text-sky-400" />;
      if (category === "faculty") return <Users size={16} className="text-indigo-400" />;
      if (category === "class") return <BookOpen size={16} className="text-teal-400" />;
      if (category === "session") return <Calendar size={16} className="text-emerald-400" />;
      if (category === "action") return <Sparkles size={16} className="text-amber-400" />;
      return <Search size={16} className="text-muted-foreground" />;
  }
}
