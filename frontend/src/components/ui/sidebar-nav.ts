import React from "react";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Building2, ScanSearch,
  ScrollText, Radio, ClipboardCheck, BarChart3, Sliders,
  FileText, Smartphone, User, Activity, Bell, KeyRound
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const superAdminLinks: NavItem[] = [
  { label: "Dashboard", href: "/super-admin/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Schools", href: "/super-admin/tenants", icon: React.createElement(Building2, { size: 17 }) },
  { label: "License Requests", href: "/super-admin/licenses", icon: React.createElement(KeyRound, { size: 17 }) },
  { label: "System Status", href: "/super-admin/system", icon: React.createElement(Activity, { size: 17 }) },
  { label: "Security & Audits", href: "/super-admin/audit", icon: React.createElement(ScrollText, { size: 17 }) },
  { label: "Announcements", href: "/super-admin/broadcasts", icon: React.createElement(Radio, { size: 17 }) },
  { label: "Notifications", href: "/super-admin/notifications", icon: React.createElement(Bell, { size: 17 }) },
];

export const adminLinks: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Students", href: "/admin/users/students", icon: React.createElement(GraduationCap, { size: 17 }) },
  { label: "Teachers", href: "/admin/users/teachers", icon: React.createElement(Users, { size: 17 }) },
  { label: "Classes", href: "/admin/classes", icon: React.createElement(BookOpen, { size: 17 }) },
  { label: "Attendance Scanner", href: "/admin/scanner", icon: React.createElement(ScanSearch, { size: 17 }) },
  { label: "Licenses", href: "/admin/licenses", icon: React.createElement(KeyRound, { size: 17 }) },
  { label: "Notifications", href: "/admin/notifications", icon: React.createElement(Bell, { size: 17 }) },
  { label: "Activity Log", href: "/admin/audit", icon: React.createElement(ScrollText, { size: 17 }) },
];

export const setupLinks: NavItem[] = [
  { label: "Departments", href: "/admin/setup/departments", icon: React.createElement(Building2, { size: 15 }) },
  { label: "Subjects", href: "/admin/setup/subjects", icon: React.createElement(BookOpen, { size: 15 }) },
  { label: "Classrooms", href: "/admin/setup/classrooms", icon: React.createElement(Sliders, { size: 15 }) },
  { label: "Roles", href: "/admin/setup/designations", icon: React.createElement(Users, { size: 15 }) },
  { label: "Verification Settings", href: "/admin/setup/verification-settings", icon: React.createElement(Sliders, { size: 15 }) },
];

export const teacherLinks: NavItem[] = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: React.createElement(LayoutDashboard, { size: 17 }) },
  { label: "Class Sessions", href: "/teacher/sessions", icon: React.createElement(Radio, { size: 17 }) },
  { label: "My Classes", href: "/teacher/classes", icon: React.createElement(BookOpen, { size: 17 }) },
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
