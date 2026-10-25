import { BulkImportEntityType } from "./bulk-types";

export function getSampleCsv(entityType: BulkImportEntityType): string {
  if (entityType === "students") {
    return (
      "email,enrollment_number,first_name,last_name,department_code,semester,branch,gender\n" +
      "alex.carter@yopmail.com,STU2026001,Alex,Carter,CSE,5,CE,Male\n" +
      "brooke.hayes@yopmail.com,STU2026002,Brooke,Hayes,IT,5,IT,Female\n" +
      "connor.reed@yopmail.com,STU2026003,Connor,Reed,ECE,3,EC,Male"
    );
  }
  if (entityType === "teachers") {
    return (
      "email,employee_id,first_name,last_name,department_code,designation_code,name_initials\n" +
      "alan.turing@yopmail.com,FAC2026001,Alan,Turing,CSE,PROF,amt\n" +
      "ada.lovelace@yopmail.com,FAC2026002,Ada,Lovelace,IT,ASSOC_PROF,anl\n" +
      "grace.hopper@yopmail.com,FAC2026003,Grace,Hopper,CSE,ASST_PROF,gmh"
    );
  }
  if (entityType === "classes") {
    return (
      "class_name,subject_code,teacher_email,classroom_name,semester,batch\n" +
      "CS-101-A,CS101,alan.turing@yopmail.com,A-101,1,2022-2026\n" +
      "MATH-201,MTH201,ada.lovelace@yopmail.com,B-204,3,2021-2025"
    );
  }
  if (entityType === "departments") {
    return (
      "name,code,head,description\n" +
      "Computer Science & Engineering,CSE,Dr. Alan Turing,Department of Computing and AI\n" +
      "Electronics & Communication,ECE,Dr. Claude Shannon,Department of Electronics and Signal Processing\n" +
      "Mechanical Engineering,MECH,Dr. James Watt,Department of Mechanical Sciences"
    );
  }
  if (entityType === "subjects") {
    return (
      "name,code,department_code,description\n" +
      "Data Structures & Algorithms,CS201,CSE,Core Computer Science Subject\n" +
      "Database Management Systems,CS301,CSE,Relational and NoSQL Databases\n" +
      "Digital Communication,EC201,ECE,Signal Modulation and Digital Transmission"
    );
  }
  if (entityType === "classrooms") {
    return (
      "name,building\n" +
      "Room 101,Block A\n" +
      "CS Lab 204,Technology Block\n" +
      "Main Auditorium,Central Campus"
    );
  }
  return (
    "name,code,description\n" +
    "Assistant Professor,ASST_PROF,Entry level faculty role\n" +
    "Associate Professor,ASSOC_PROF,Senior research and teaching faculty\n" +
    "Professor,PROF,Department Chair and Senior Professor"
  );
}

