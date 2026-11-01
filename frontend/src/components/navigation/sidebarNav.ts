import React from "react";
import {
  LayoutDashboard, Users, GraduationCap, Building2, ScanSearch,
  ScrollText, Radio, ClipboardCheck, BarChart3,
  FileText, Smartphone, User, Activity, Bell, KeyRound, School,
  Database, CalendarCheck, Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const superAdminLinks: NavItem[] = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Institutions", href: "/super-admin/tenants", icon: React.createElement(Building2, { size: 17 }) },
  { label: "License Requests", href: "/super-admin/licenses", icon: React.createElement(KeyRound, { size: 17 }) },
  { label: "System Status", href: "/super-admin/system", icon: React.createElement(Activity, { size: 17 }) },
  { label: "Audit Logs", href: "/super-admin/audit", icon: React.createElement(ScrollText, { size: 17 }) },
  { label: "Announcements", href: "/super-admin/broadcasts", icon: React.createElement(Radio, { size: 17 }) },
  { label: "Notifications", href: "/super-admin/notifications", icon: React.createElement(Bell, { size: 17 }) },
];

export const adminLinks: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Students", href: "/admin/users/students", icon: React.createElement(GraduationCap, { size: 17 }) },
  { label: "Teachers", href: "/admin/users/teachers", icon: React.createElement(Users, { size: 17 }) },
  { label: "Classes", href: "/admin/class-management", icon: React.createElement(School, { size: 17 }) },
  { label: "Master Data", href: "/admin/master-data", icon: React.createElement(Database, { size: 17 }) },
  { label: "Attendance Scanner", href: "/admin/scanner", icon: React.createElement(ScanSearch, { size: 17 }) },
  { label: "Licenses", href: "/admin/licenses", icon: React.createElement(KeyRound, { size: 17 }) },
  { label: "Notifications", href: "/admin/notifications", icon: React.createElement(Bell, { size: 17 }) },
  { label: "Settings", href: "/admin/settings", icon: React.createElement(Settings, { size: 17 }) },
];

export const teacherLinks: NavItem[] = [
  { label: "My Classes", href: "/teacher/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Timetable", href: "/teacher/today", icon: React.createElement(CalendarCheck, { size: 17 }) },
  { label: "Pending Reviews", href: "/teacher/review", icon: React.createElement(ClipboardCheck, { size: 17 }) },
  { label: "Leave Requests", href: "/teacher/leaves", icon: React.createElement(FileText, { size: 17 }) },
  { label: "Device Updates", href: "/teacher/device-changes", icon: React.createElement(Smartphone, { size: 17 }) },
  { label: "Notifications", href: "/teacher/notifications", icon: React.createElement(Bell, { size: 17 }) },
];

export const teacherReportLinks: NavItem[] = [
  { label: "Class Analytics", href: "/teacher/analytics", icon: React.createElement(BarChart3, { size: 17 }) },
  { label: "Attendance History", href: "/teacher/history", icon: React.createElement(ScrollText, { size: 17 }) },
  { label: "Profile & Security", href: "/teacher/profile", icon: React.createElement(User, { size: 17 }) },
];
