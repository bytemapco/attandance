import { BulkImportEntityType } from "./bulkTypes";

export function getSampleCsv(entityType: BulkImportEntityType): string {
  if (entityType === "students") {
    return (
      "email,enrollment_number,first_name,last_name,department_code,batch_code\n" +
      "alex.carter@example.com,STU2026001,Alex,Carter,CSE,CSE-A-1\n" +
      "brooke.hayes@example.com,STU2026002,Brooke,Hayes,CSE,CSE-A-1\n" +
      "connor.reed@example.com,STU2026003,Connor,Reed,CSE,CSE-A-2"
    );
  }
  if (entityType === "teachers") {
    return (
      "email,employee_id,first_name,last_name,department_code,designation_code,name_initials\n" +
      "alan.turing@example.com,FAC2026001,Alan,Turing,CSE,PROF,amt\n" +
      "ada.lovelace@example.com,FAC2026002,Ada,Lovelace,IT,ASSOC_PROF,anl\n" +
      "grace.hopper@example.com,FAC2026003,Grace,Hopper,CSE,ASST_PROF,gmh"
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

