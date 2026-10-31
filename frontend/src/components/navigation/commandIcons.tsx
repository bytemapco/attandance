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
      return <Radio size={16} className="text-[#c98260]" />;
    case "activity":
      return <Activity size={16} className="text-[#526f78]" />;
    case "clipboard-check":
      return <ClipboardCheck size={16} className="text-[#c98260]" />;
    case "calendar":
      return <Calendar size={16} className="text-[#526f78]" />;
    case "smartphone":
      return <Smartphone size={16} className="text-[#526f78]" />;
    case "user-plus":
      return <UserPlus size={16} className="text-[#247653]" />;
    case "user-check":
      return <UserCheck size={16} className="text-[#526f78]" />;
    case "book-plus":
    case "book-open":
      return <BookOpen size={16} className="text-[#28363b]" />;
    case "cpu":
      return <Cpu size={16} className="text-[#c98260]" />;
    case "shield-check":
      return <ShieldCheck size={16} className="text-[#247653]" />;
    case "graduation-cap":
      return <GraduationCap size={16} className="text-[#28363b]" />;
    case "users":
      return <Users size={16} className="text-[#526f78]" />;
    case "building":
      return <Building2 size={16} className="text-[#28363b]" />;
    case "key":
      return <KeyRound size={16} className="text-[#c98260]" />;
    case "scroll-text":
      return <ScrollText size={16} className="text-[#526f78]" />;
    case "bar-chart":
      return <BarChart3 size={16} className="text-[#526f78]" />;
    case "dashboard":
      return <LayoutDashboard size={16} className="text-[#526f78]" />;
    default:
      if (category === "student") return <GraduationCap size={16} className="text-[#28363b]" />;
      if (category === "faculty") return <Users size={16} className="text-[#526f78]" />;
      if (category === "class") return <BookOpen size={16} className="text-[#28363b]" />;
      if (category === "session") return <Calendar size={16} className="text-[#526f78]" />;
      if (category === "tenant") return <Building2 size={16} className="text-[#28363b]" />;
      if (category === "action") return <Sparkles size={16} className="text-[#c98260]" />;
      return <Search size={16} className="text-[#526f78]" />;
  }
}
