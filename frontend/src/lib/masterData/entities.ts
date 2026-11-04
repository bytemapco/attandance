import type { z } from "zod";
import {
  classroomSchema,
  departmentSchema,
  designationSchema,
  subjectSchema,
} from "@/lib/validations/masterData";

export const MASTER_DATA_ROOT = "/admin/master-data";

export type MasterDataSlug = "departments" | "designations" | "subjects" | "classrooms";

export interface MasterDataRecord {
  id: string;
  name: string;
  code?: string;
  building?: string | null;
}

export interface MasterDataFormValues {
  name: string;
  code?: string;
}

interface FieldText {
  label: string;
  placeholder: string;
}

export interface MasterDataEntity {
  slug: MasterDataSlug;
  singular: string;
  plural: string;
  schema: z.ZodType<MasterDataFormValues, z.ZodTypeDef, MasterDataFormValues>;
  list: {
    title: string;
    description: string;
    nameHeader: string;
    /** Absent for entities without a code. */
    codeHeader?: string;
    /** Whether the name opens a detail page. */
    nameOpensDetail: boolean;
    searchText: (record: MasterDataRecord) => Array<string | null | undefined>;
  };
  form: {
    name: FieldText;
    /** Absent for entities without a code. */
    code?: FieldText;
  };
}

export const DEPARTMENTS: MasterDataEntity = {
  slug: "departments",
  singular: "Department",
  plural: "Departments",
  schema: departmentSchema,
  list: {
    title: "Departments",
    description: "The academic departments of your institution. Open one to manage its batches.",
    nameHeader: "Name",
    codeHeader: "Code",
    nameOpensDetail: true,
    searchText: (record) => [record.name, record.code],
  },
  form: {
    name: { label: "Department Name", placeholder: "e.g. Computer Science" },
    code: { label: "Code", placeholder: "e.g. CSE" },
  },
};

export const DESIGNATIONS: MasterDataEntity = {
  slug: "designations",
  singular: "Designation",
  plural: "Designations",
  schema: designationSchema,
  list: {
    title: "Roles",
    description: "Job roles for teaching staff, such as Professor or Assistant Professor.",
    nameHeader: "Designation Name",
    codeHeader: "Designation Code",
    nameOpensDetail: false,
    searchText: (record) => [record.name, record.code],
  },
  form: {
    name: { label: "Designation Name", placeholder: "e.g. Associate Professor" },
    code: { label: "Designation Code", placeholder: "e.g. ASSOC_PROF" },
  },
};

export const SUBJECTS: MasterDataEntity = {
  slug: "subjects",
  singular: "Subject",
  plural: "Subjects",
  schema: subjectSchema,
  list: {
    title: "Subjects",
    description: "Courses taught at your institution, optionally linked to a department.",
    nameHeader: "Subject Name",
    codeHeader: "Subject Code",
    nameOpensDetail: false,
    searchText: (record) => [record.name, record.code],
  },
  form: {
    name: { label: "Subject Name", placeholder: "e.g. Machine Learning" },
    code: { label: "Subject Code", placeholder: "e.g. CS-402" },
  },
};

export const CLASSROOMS: MasterDataEntity = {
  slug: "classrooms",
  singular: "Classroom",
  plural: "Classrooms",
  schema: classroomSchema,
  list: {
    title: "Classrooms",
    description: "Rooms and buildings where classes are held.",
    nameHeader: "Classroom Name",
    nameOpensDetail: false,
    searchText: (record) => [record.name, record.building],
  },
  form: {
    name: { label: "Classroom Name / Room Number", placeholder: "e.g. Room 301, Lab B" },
  },
};

export function entityRoute(entity: MasterDataEntity): string {
  return `${MASTER_DATA_ROOT}/${entity.slug}`;
}

export function entityEndpoint(entity: MasterDataEntity): string {
  return `/admin/${entity.slug}`;
}

/** Every master-data page links "Master Data" back to the first tab, departments. */
export function entityBreadcrumb(entity: MasterDataEntity): Array<{ label: string; href: string }> {
  return [
    { label: "Admin", href: "/admin/dashboard" },
    { label: "Master Data", href: `${MASTER_DATA_ROOT}/departments` },
    { label: entity.plural, href: entityRoute(entity) },
  ];
}
