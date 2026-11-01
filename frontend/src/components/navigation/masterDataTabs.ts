import React from "react";
import { Building2, BookOpen, Users, DoorOpen } from "lucide-react";
import type { NavItem } from "./sidebarNav";

const MASTER_DATA_ROOT = "/admin/master-data";

export const masterDataTabs: NavItem[] = [
  { label: "Departments", href: `${MASTER_DATA_ROOT}/departments`, icon: React.createElement(Building2, { size: 15 }) },
  { label: "Subjects", href: `${MASTER_DATA_ROOT}/subjects`, icon: React.createElement(BookOpen, { size: 15 }) },
  { label: "Roles", href: `${MASTER_DATA_ROOT}/designations`, icon: React.createElement(Users, { size: 15 }) },
  { label: "Classrooms", href: `${MASTER_DATA_ROOT}/classrooms`, icon: React.createElement(DoorOpen, { size: 15 }) },
];
