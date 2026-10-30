"""Indian Institutions and Master Data Dataset."""

INSTITUTIONS = [
    {
        "name": "Indian Institute of Technology Bombay",
        "slug": "iit-bombay",
        "type": "COLLEGE",
        "domain": "iitb.ac.in",
        "license_count": 500,
        "admin_name": "Prof. Aravind Swaminathan",
        "admin_email": "aravind.admin.iitb@yopmail.com",
        "admin_password": "Admin@IITB2026!",
        "admin_role": "ADMIN",
    },
    {
        "name": "Veermata Jijabai Technological Institute",
        "slug": "vjti-mumbai",
        "type": "COLLEGE",
        "domain": "vjti.ac.in",
        "license_count": 500,
        "admin_name": "Dr. Meenakshi Sundaram",
        "admin_email": "meenakshi.admin.vjti@yopmail.com",
        "admin_password": "Admin@VJTI2026!",
        "admin_role": "ADMIN",
    },
]

DEPARTMENTS = [
    {"name": "Computer Science & Engineering", "code": "CSE", "head": "Dr. Vikram Sarabhai"},
    {"name": "Information Technology", "code": "IT", "head": "Dr. APJ Abdul Kalam"},
    {"name": "Artificial Intelligence & Data Science", "code": "AIDS", "head": "Dr. Satish Dhawan"},
    {"name": "Electronics & Telecommunication", "code": "EXTC", "head": "Dr. Homi Bhabha"},
]

DESIGNATIONS = [
    {"name": "Professor & Head of Department", "code": "PROF_HOD", "description": "Department Head"},
    {"name": "Associate Professor", "code": "ASSOC_PROF", "description": "Senior Faculty"},
    {"name": "Assistant Professor", "code": "ASST_PROF", "description": "Faculty Member"},
    {"name": "Lecturer", "code": "LEC", "description": "Academic Lecturer"},
]

CLASSROOMS = [
    {"name": "Aryabhata Lecture Theatre 101", "building": "Ramanujan Academic Complex"},
    {"name": "CV Raman Seminar Hall 202", "building": "Science & Technology Block"},
    {"name": "Turing Computing Lab 301", "building": "Computer Engineering Block"},
    {"name": "Kalam Advanced AI Lab 405", "building": "Innovation & Research Center"},
]

SUBJECTS = [
    {"name": "Data Structures & Algorithms", "code": "CS201", "dept_code": "CSE"},
    {"name": "Database Management Systems", "code": "CS202", "dept_code": "CSE"},
    {"name": "Machine Learning & Pattern Recognition", "code": "AI301", "dept_code": "AIDS"},
    {"name": "Computer Networks & Security", "code": "IT302", "dept_code": "IT"},
]
