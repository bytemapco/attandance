import random
from typing import Any

FIRST_NAMES_MALE = [
    "Aarav", "Rohan", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh",
    "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Dhruv", "Kabir", "Aryan"
]

FIRST_NAMES_FEMALE = [
    "Aanya", "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Myra", "Avani",
    "Prisha", "Riya", "Anika", "Navya", "Meera", "Isha", "Tanvi", "Sneha"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Gupta", "Joshi", "Iyer", "Nair", "Reddy",
    "Kulkarni", "Deshmukh", "Choudhury", "Bose", "Mehta", "Singh", "Yadav"
]

INSTITUTIONS = [
    {
        "name": "Veermata Jijabai Technological Institute (VJTI)",
        "slug": "vjti-mumbai",
        "type": "COLLEGE",
        "domain": "vjti.ac.in",
        "lat": 19.0222,
        "lon": 72.8561,
    },
    {
        "name": "Delhi Technological University (DTU)",
        "slug": "dtu-delhi",
        "type": "COLLEGE",
        "domain": "dtu.ac.in",
        "lat": 28.7501,
        "lon": 77.1177,
    },
    {
        "name": "Pune Institute of Computer Technology (PICT)",
        "slug": "pict-pune",
        "type": "COLLEGE",
        "domain": "pict.edu",
        "lat": 18.4575,
        "lon": 73.8508,
    },
]

DEPARTMENTS = [
    {"name": "Computer Engineering", "code": "CE", "head": "Dr. Ramesh Kulkarni"},
    {"name": "Information Technology", "code": "IT", "head": "Dr. Sunita Sharma"},
    {"name": "Artificial Intelligence & Data Science", "code": "AIDS", "head": "Dr. Anand Iyer"},
    {"name": "Electronics & Telecommunication", "code": "EXTC", "head": "Dr. Rajesh Gupta"},
    {"name": "Mechanical Engineering", "code": "ME", "head": "Dr. Suresh Patil"},
    {"name": "Civil Engineering", "code": "CIVIL", "head": "Dr. Mohan Verma"},
]

DESIGNATIONS = [
    {"name": "Professor", "code": "PROF", "description": "Senior tenured professor"},
    {"name": "Associate Professor", "code": "ASSOC_PROF", "description": "Mid-level faculty"},
    {"name": "Assistant Professor", "code": "ASST_PROF", "description": "Junior faculty"},
    {"name": "Lecturer", "code": "LEC", "description": "Visiting lecturer"},
]

SUBJECTS = [
    {"name": "Data Structures & Algorithms", "code": "CS201", "dept_code": "CE"},
    {"name": "Database Management Systems", "code": "CS301", "dept_code": "CE"},
    {"name": "Operating Systems", "code": "CS302", "dept_code": "CE"},
    {"name": "Computer Networks", "code": "CS303", "dept_code": "CE"},
    {"name": "Deep Learning & Neural Networks", "code": "AI401", "dept_code": "AIDS"},
    {"name": "Computer Vision & Biometrics", "code": "AI402", "dept_code": "AIDS"},
    {"name": "Cloud Computing Architecture", "code": "IT401", "dept_code": "IT"},
    {"name": "Web Application Security", "code": "IT302", "dept_code": "IT"},
]

CLASSROOMS = [
    {"name": "LH-101 (Main Auditorium)", "building": "Academic Block A", "capacity": 120},
    {"name": "LH-204 (Smart Lecture Hall)", "building": "Academic Block B", "capacity": 80},
    {"name": "Lab-301 (AI & Vision Lab)", "building": "Tech Tower", "capacity": 45},
    {"name": "Lab-102 (Network & Systems Lab)", "building": "Computing Block", "capacity": 50},
]


def generate_person(role: str, index: int, tenant_slug: str) -> dict[str, Any]:
    gender = "Male" if index % 2 == 1 else "Female"
    first = FIRST_NAMES_MALE[(index - 1) % len(FIRST_NAMES_MALE)] if gender == "Male" else FIRST_NAMES_FEMALE[(index - 1) % len(FIRST_NAMES_FEMALE)]
    last = LAST_NAMES[(index - 1) % len(LAST_NAMES)]
    clean_tenant = tenant_slug.replace("-", "")
    email = f"{first.lower()}.{last.lower()}.{role[:3].lower()}{index}.{clean_tenant}@yopmail.com"
    phone = f"+9198{70000000 + index}"
    return {
        "first_name": first,
        "last_name": last,
        "gender": gender,
        "email": email,
        "phone": phone,
    }
