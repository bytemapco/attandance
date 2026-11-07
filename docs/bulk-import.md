# Bulk import

An administrator can import students, teachers, departments, subjects, classrooms and designations from a CSV file. The web screens are under Users and Master data. The assistant can import students and teachers from rows the admin pastes.

## The file

- The first row is the header. Columns are matched by header name, in any order and in any case. "Download Sample CSV" shows every column.
- A column the import does not use is ignored, and the preview lists it. A missing required column stops the import and is named.
- A cell with a comma or a line break must be in double quotes. A blank cell means "not given".
- Excel can save a CSV ("CSV UTF-8" is fine). `.xlsx` files are not read.

| Import | Required columns | Optional columns |
|---|---|---|
| Students | `email`, `enrollment_number`, `first_name`, `last_name`, `department_code` | `batch_code`, `gender`, `phone`, `date_of_birth` |
| Teachers | `email`, `employee_id`, `first_name`, `last_name` | `department_code`, `designation_code`, `name_initials`, `phone` |
| Departments | `name`, `code` | none |
| Subjects | `name`, `code` | `department_code` |
| Classrooms | `name` | none |
| Designations | `name`, `code` | none |

Departments, subjects, classrooms and designations have no head, description or building. A file that still has those columns is imported without them, and the preview lists them as ignored. Sent to the API, such a column refuses its row.

A department or designation can be named by its code, its name or its id, in any case. A student's `batch_code` must be an active batch of that department.

`gender` is `M`, `F` or `O` (or Male, Female, Other). `date_of_birth` is `YYYY-MM-DD` or `DD/MM/YYYY`; the day comes first. A teacher with no department or designation gets the institution's first one, or a default ("General Academics", "Lecturer") that is created once.

## Rules

- **Each row stands alone.** A row with a problem is skipped and reported with its reason. The other rows are imported.
- **Repeats are refused.** Inside one file, and against what the institution already has: an email, an enrollment number or employee ID, a department, subject or designation code (any case), and a classroom with the same name (any case). Importing the same file twice adds nothing the second time.
- **Unknown references are refused.** A department, designation or batch that does not exist is an error on that row. A subject is never saved without the department the file named.
- **Licences.** Students and teachers use seats. An import that would pass the licence limit is refused as a whole.
- **Invitations.** Students and teachers get an invitation e-mail unless the admin switches it off. A failed e-mail is reported, and the account stays.
- **Audit.** An import that adds something writes one audit entry with the count.

## The web screen

The browser checks every row against the same rules before it sends anything. A row that fails is shown with its reason and is not sent. Rows go in batches of 10. At the end, "Download Error Report" gives a CSV with every column and an `error_reason` column. Fix it and upload it again; the extra column is ignored.

## The API

`POST /admin/users/students/bulk`, `/admin/users/teachers/bulk`, `/admin/departments/bulk`, `/admin/subjects/bulk`, `/admin/classrooms/bulk`, `/admin/designations/bulk`.

The body holds a list of up to 200 rows under `students`, `teachers`, `departments`, `subjects`, `classrooms` or `designations`. Students and teachers also take `send_invite`. A row with a field the import does not know is refused.

The answer is always 200 when the request itself is valid:

```json
{
  "imported_count": 8,
  "failed_count": 2,
  "invitations_sent": 8,
  "errors": ["Row 3: last name is required", "Row 7: Department 'ZZ' not found."],
  "failures": [
    {"row": 3, "message": "last name is required"},
    {"row": 7, "message": "Department 'ZZ' not found."}
  ]
}
```

`row` counts from 1 within the request. `errors` also lists an invitation that could not be sent, for a row that was imported.

Other answers: 400 when the licence limit would be passed, 422 for an empty list or more than 200 rows.

## Not built

The PRD also lists Excel files, enrollment and timetable imports, and a dry run before saving. Those are not done.
