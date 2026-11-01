import React from "react";
import { Building2, BookOpen, Users, DoorOpen, CalendarRange } from "lucide-react";
import type { NavItem } from "./sidebarNav";

export const MASTER_DATA_ROOT = "/admin/master-data";

export const masterDataTabs: NavItem[] = [
  { label: "Departments", href: `${MASTER_DATA_ROOT}/departments`, icon: React.createElement(Building2, { size: 15 }) },
  { label: "Subjects", href: `${MASTER_DATA_ROOT}/subjects`, icon: React.createElement(BookOpen, { size: 15 }) },
  { label: "Roles", href: `${MASTER_DATA_ROOT}/designations`, icon: React.createElement(Users, { size: 15 }) },
  { label: "Classrooms", href: `${MASTER_DATA_ROOT}/classrooms`, icon: React.createElement(DoorOpen, { size: 15 }) },
  { label: "Academic Calendar", href: `${MASTER_DATA_ROOT}/academic-years`, icon: React.createElement(CalendarRange, { size: 15 }) },
];
