"""Hand-written demo data: a fictional engineering college in Pune.

Every e-mail address is `<name>.vit@yopmail.com`. Yopmail inboxes are public, so the `.vit` suffix keeps
the local parts distinctive and nothing private is ever sent to them.
"""
from typing import TypedDict

DOMAIN = "yopmail.com"


def email_for(first: str, last: str) -> str:
    return f"{first}.{last}.vit@{DOMAIN}".lower()

TENANT_SLUG = "vidyasagar-pune"
TENANT_NAME = "Vidyasagar Institute of Technology, Pune"
LICENSE_SEATS = 40
EXTRA_LICENSE_SEATS = 20

# Campus gate of the fictional college (Pune, Maharashtra).
CAMPUS = {"campusLatitude": 18.4636, "campusLongitude": 73.8680, "geofenceRadiusMeters": 150}

ADMINS = [
    {"name": "Dr. Rajeshwari Kulkarni", "email": email_for("rajeshwari", "kulkarni"), "role": "TENANT_ADMIN"},
    {"name": "Manoj Gaikwad", "email": email_for("manoj", "gaikwad"), "role": "ADMIN"},
]

DEPARTMENTS = [
    ("Computer Science and Engineering", "CSE", "Dr. Anjali Deshpande", "Undergraduate programme in software, data and systems."),
    ("Electronics and Communication Engineering", "ECE", "Dr. Farhan Sheikh", "Signals, embedded systems and communication networks."),
    ("Mechanical Engineering", "ME", "Dr. Prakash Kamat", "Design, thermal sciences and manufacturing."),
    ("Civil Engineering", "CE", "Dr. Neelam Ghorpade", "Structures, surveying and environmental engineering."),
    ("Applied Sciences and Humanities", "ASH", "Dr. Suresh Nambiar", "First-year science and mathematics for all branches."),
]
BULK_DEPARTMENTS = 3

DESIGNATIONS = [
    ("Professor and Head of Department", "HOD", "Leads a department and chairs its academic board."),
    ("Professor", "PROF", "Senior faculty with research guidance responsibilities."),
    ("Associate Professor", "ASSOC_PROF", "Mid-career faculty teaching core subjects."),
    ("Assistant Professor", "ASST_PROF", "Entry-level teaching faculty."),
    ("Laboratory Instructor", "LAB_INSTR", "Runs practical sessions and maintains equipment."),
]

CLASSROOMS = [
    ("A-101", "Main Academic Block"), ("A-102", "Main Academic Block"), ("A-103", "Main Academic Block"),
    ("A-104", "Main Academic Block"), ("B-201", "Electronics Block"), ("B-202", "Electronics Block"),
    ("C-301", "Mechanical Block"), ("C-302", "Mechanical Block"), ("Seminar Hall", "Library Building"),
    ("Computer Lab 1", "Main Academic Block"), ("Computer Lab 2", "Main Academic Block"),
    ("Drawing Hall", "Mechanical Block"),
]
BULK_CLASSROOMS = 8

# (name, code, department code, description)
SUBJECTS = [
    ("Data Structures", "CS201", "CSE", "Arrays, linked lists, trees, graphs and their analysis."),
    ("Discrete Mathematics", "MA201", "ASH", "Logic, sets, relations, graph theory and combinatorics."),
    ("Database Management Systems", "CS203", "CSE", "Relational model, SQL, normalisation and transactions."),
    ("Computer Organization", "CS204", "CSE", "Processor design, memory hierarchy and I/O."),
    ("Operating Systems", "CS301", "CSE", "Processes, scheduling, memory and file systems."),
    ("Computer Networks", "CS302", "CSE", "Layered protocols, routing and congestion control."),
    ("Digital Signal Processing", "EC301", "ECE", "Discrete transforms, FIR and IIR filter design."),
    ("Analog Communication", "EC302", "ECE", "AM, FM and noise performance of analog links."),
    ("Microcontrollers and Embedded Systems", "EC303", "ECE", "ARM Cortex programming and peripheral interfacing."),
    ("Electromagnetic Field Theory", "EC304", "ECE", "Maxwell equations, waveguides and antennas."),
    ("Engineering Mathematics I", "MA101", "ASH", "Calculus, matrices and ordinary differential equations."),
    ("Engineering Physics", "PH101", "ASH", "Optics, lasers, semiconductors and quantum basics."),
    ("Basic Mechanical Engineering", "ME101", "ME", "Thermodynamics, power cycles and manufacturing overview."),
    ("Engineering Graphics", "ME102", "ME", "Orthographic projection and CAD drafting."),
    ("Strength of Materials", "CE201", "CE", "Stress, strain, bending and torsion of members."),
    ("Surveying", "CE202", "CE", "Levelling, theodolite work and total station."),
]
BULK_SUBJECTS = 11


class Teacher(TypedDict):
    employee_id: str
    first: str
    last: str
    initials: str
    department: str
    designation: str
    gender: str


# The last teacher is created one at a time (the single-create endpoint) and has no timetable.
TEACHERS: list[Teacher] = [
    {"employee_id": "VIT-T-1001", "first": "Anjali", "last": "Deshpande", "initials": "adp", "department": "CSE", "designation": "HOD", "gender": "F"},
    {"employee_id": "VIT-T-1002", "first": "Rohit", "last": "Kulkarni", "initials": "rkk", "department": "CSE", "designation": "ASSOC_PROF", "gender": "M"},
    {"employee_id": "VIT-T-1003", "first": "Meenakshi", "last": "Iyer", "initials": "mi", "department": "CSE", "designation": "ASST_PROF", "gender": "F"},
    {"employee_id": "VIT-T-1004", "first": "Farhan", "last": "Sheikh", "initials": "fs", "department": "ECE", "designation": "ASSOC_PROF", "gender": "M"},
    {"employee_id": "VIT-T-1005", "first": "Pooja", "last": "Bhandari", "initials": "pb", "department": "ECE", "designation": "ASST_PROF", "gender": "F"},
    {"employee_id": "VIT-T-1006", "first": "Vikram", "last": "Chauhan", "initials": "vsc", "department": "ME", "designation": "ASSOC_PROF", "gender": "M"},
    {"employee_id": "VIT-T-1007", "first": "Suresh", "last": "Nambiar", "initials": "scn", "department": "ASH", "designation": "PROF", "gender": "M"},
    {"employee_id": "VIT-T-1008", "first": "Kavita", "last": "Joshi", "initials": "kj", "department": "ASH", "designation": "ASST_PROF", "gender": "F"},
    {"employee_id": "VIT-T-1009", "first": "Hemant", "last": "Salunkhe", "initials": "hrs", "department": "ME", "designation": "LAB_INSTR", "gender": "M"},
]
SINGLE_CREATE_TEACHERS = 1

SUBJECT_TEACHER = {
    "CS201": "VIT-T-1001", "MA201": "VIT-T-1007", "CS203": "VIT-T-1002", "CS204": "VIT-T-1003",
    "EC301": "VIT-T-1004", "EC302": "VIT-T-1004", "EC303": "VIT-T-1005", "EC304": "VIT-T-1005",
    "MA101": "VIT-T-1007", "PH101": "VIT-T-1008", "ME101": "VIT-T-1006", "ME102": "VIT-T-1006",
}


class Student(TypedDict):
    enrollment: str
    first: str
    last: str
    gender: str
    attendance: str  # high, mid or low: how regularly the student attends in the history


# class key -> (department, section letter, semester, default room, students)
CLASSES: dict[str, tuple[str, str, int, str, list[Student]]] = {
    "CSE-A-1": ("CSE", "A", 3, "A-101", [
        {"enrollment": "VIT24CS001", "first": "Aarav", "last": "Sharma", "gender": "M", "attendance": "high"},
        {"enrollment": "VIT24CS002", "first": "Ananya", "last": "Iyer", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT24CS003", "first": "Rohan", "last": "Patil", "gender": "M", "attendance": "mid"},
        {"enrollment": "VIT24CS004", "first": "Priya", "last": "Nair", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT24CS005", "first": "Karthik", "last": "Reddy", "gender": "M", "attendance": "low"},
        {"enrollment": "VIT24CS006", "first": "Sneha", "last": "Kulkarni", "gender": "F", "attendance": "mid"},
        {"enrollment": "VIT24CS007", "first": "Imran", "last": "Qureshi", "gender": "M", "attendance": "mid"},
        {"enrollment": "VIT24CS008", "first": "Diya", "last": "Mehta", "gender": "F", "attendance": "high"},
    ]),
    "CSE-B-1": ("CSE", "B", 3, "A-102", [
        {"enrollment": "VIT24CS009", "first": "Aditya", "last": "Joshi", "gender": "M", "attendance": "high"},
        {"enrollment": "VIT24CS010", "first": "Ishita", "last": "Banerjee", "gender": "F", "attendance": "mid"},
        {"enrollment": "VIT24CS011", "first": "Vihaan", "last": "Gupta", "gender": "M", "attendance": "low"},
        {"enrollment": "VIT24CS012", "first": "Riya", "last": "Chatterjee", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT24CS013", "first": "Siddharth", "last": "Menon", "gender": "M", "attendance": "mid"},
        {"enrollment": "VIT24CS014", "first": "Fatima", "last": "Shaikh", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT24CS015", "first": "Harsh", "last": "Vora", "gender": "M", "attendance": "mid"},
    ]),
    "ECE-A-1": ("ECE", "A", 5, "B-201", [
        {"enrollment": "VIT22EC001", "first": "Neha", "last": "Deshmukh", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT22EC002", "first": "Arjun", "last": "Pillai", "gender": "M", "attendance": "mid"},
        {"enrollment": "VIT22EC003", "first": "Tanvi", "last": "Bhosale", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT22EC004", "first": "Yash", "last": "Agarwal", "gender": "M", "attendance": "low"},
        {"enrollment": "VIT22EC005", "first": "Meera", "last": "Krishnan", "gender": "F", "attendance": "mid"},
        {"enrollment": "VIT22EC006", "first": "Zoya", "last": "Ansari", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT22EC007", "first": "Pranav", "last": "Saxena", "gender": "M", "attendance": "mid"},
    ]),
    "ME-A-1": ("ME", "A", 1, "C-301", [
        {"enrollment": "VIT25ME001", "first": "Omkar", "last": "Jadhav", "gender": "M", "attendance": "high"},
        {"enrollment": "VIT25ME002", "first": "Shruti", "last": "Rao", "gender": "F", "attendance": "mid"},
        {"enrollment": "VIT25ME003", "first": "Devansh", "last": "Malhotra", "gender": "M", "attendance": "low"},
        {"enrollment": "VIT25ME004", "first": "Lakshmi", "last": "Venkatesh", "gender": "F", "attendance": "high"},
        {"enrollment": "VIT25ME005", "first": "Gurpreet", "last": "Singh", "gender": "M", "attendance": "mid"},
        {"enrollment": "VIT25ME006", "first": "Nikhil", "last": "Thorat", "gender": "M", "attendance": "high"},
    ]),
}
SINGLE_CREATE_STUDENTS = 2  # the last two students of ME-A-1
