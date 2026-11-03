"""Static data for the IIT Bombay demo institution. People are fictional; departments, buildings and codes are real."""

PASSWORD = "Sahaj@1234"
SUPER_EMAIL = "super@yopmail.com"
ADMIN_EMAIL = "admin.iitb@yopmail.com"

# Powai campus, and a radius that covers the academic area.
CAMPUS = {"lat": 19.1334, "lng": 72.9132, "radius_m": 600}

# Autumn 2026 teaching starts here. Class history runs from HISTORY_START up to yesterday.
SEMESTER_START = (2026, 7, 27)
HISTORY_START = (2026, 9, 28)
HOLIDAYS = {(2026, 10, 2): "Gandhi Jayanti", (2026, 10, 20): "Dussehra"}

# code, name, head (index into TEACHERS), roll prefix of the 2024 entry batch
DEPARTMENTS = [
    ("CSE", "Computer Science and Engineering", "05"),
    ("EE", "Electrical Engineering", "07"),
    ("ME", "Mechanical Engineering", "10"),
    ("CE", "Civil Engineering", "03"),
    ("MA", "Mathematics", None),
]

DESIGNATIONS = [("PROF", "Professor"), ("ASOC", "Associate Professor"), ("ASST", "Assistant Professor")]

# name, building, capacity
CLASSROOMS = [
    ("LH 101", "Lecture Hall Complex", 120),
    ("LH 102", "Lecture Hall Complex", 120),
    ("LH 201", "Lecture Hall Complex", 90),
    ("LH 202", "Lecture Hall Complex", 90),
    ("CC 103", "Computer Centre", 60),
]
DEPT_ROOM = {"CSE": "LH 101", "EE": "LH 102", "ME": "LH 201", "CE": "LH 202"}

# first, last, department, designation. The first teacher of a department is its head.
TEACHERS = [
    ("Sunita", "Deshpande", "CSE", "PROF"), ("Arvind", "Kulkarni", "CSE", "ASOC"),
    ("Neha", "Joshi", "CSE", "ASST"), ("Rahul", "Bhatt", "CSE", "ASST"),
    ("Vikram", "Rao", "EE", "PROF"), ("Anita", "Nair", "EE", "ASOC"),
    ("Sanjay", "Patil", "EE", "ASST"), ("Pooja", "Verma", "EE", "ASST"),
    ("Mahesh", "Iyer", "ME", "PROF"), ("Kavita", "Shetty", "ME", "ASOC"),
    ("Amit", "Chauhan", "ME", "ASST"), ("Deepa", "Pillai", "ME", "ASST"),
    ("Ramesh", "Gokhale", "CE", "PROF"), ("Shalini", "Mehta", "CE", "ASOC"),
    ("Nitin", "Sawant", "CE", "ASST"), ("Farah", "Khan", "CE", "ASST"),
    ("Harish", "Agarwal", "MA", "PROF"),
]

# code, name, department. Each department's subjects are taught by its teachers in order.
SUBJECTS = {
    "CSE": [("CS 301", "Operating Systems"), ("CS 305", "Database and Information Systems"),
            ("CS 309", "Computer Networks"), ("CS 315", "Design and Analysis of Algorithms")],
    "EE": [("EE 301", "Electromagnetic Waves"), ("EE 303", "Digital Signal Processing"),
           ("EE 305", "Control Systems"), ("EE 309", "Microprocessors")],
    "ME": [("ME 301", "Heat Transfer"), ("ME 303", "Machine Design"),
           ("ME 305", "Fluid Machinery"), ("ME 309", "Manufacturing Processes")],
    "CE": [("CE 301", "Structural Analysis"), ("CE 303", "Geotechnical Engineering"),
           ("CE 305", "Transportation Engineering"), ("CE 309", "Environmental Engineering")],
}
SHARED_SUBJECT = ("MA 301", "Probability and Statistics", "MA")  # taught to CSE and EE

# 1-hour periods. Each class uses two of them; the pair keeps the shared teacher clash-free.
PERIODS = ["09:00", "10:00", "11:00", "14:00", "15:00"]
CLASS_PERIODS = {"CSE": (0, 1), "EE": (2, 3), "ME": (0, 1), "CE": (2, 3)}

# first name, last name, gender. Twelve per class, in roll order.
STUDENTS = {
    "CSE": [("Aarav", "Sharma", "M"), ("Diya", "Patel", "F"), ("Rohan", "Nair", "M"), ("Ananya", "Reddy", "F"),
            ("Kabir", "Singh", "M"), ("Meera", "Iyer", "F"), ("Arjun", "Gupta", "M"), ("Ishita", "Das", "F"),
            ("Vihaan", "Mehta", "M"), ("Saanvi", "Rao", "F"), ("Aditya", "Joshi", "M"), ("Tara", "Menon", "F")],
    "EE": [("Karthik", "Subramanian", "M"), ("Riya", "Kapoor", "F"), ("Dev", "Malhotra", "M"), ("Nisha", "Bose", "F"),
           ("Yash", "Chopra", "M"), ("Pranavi", "Naidu", "F"), ("Harsh", "Vardhan", "M"), ("Sneha", "Kulkarni", "F"),
           ("Ayaan", "Khan", "M"), ("Lavanya", "Pillai", "F"), ("Siddharth", "Jain", "M"), ("Tanvi", "Desai", "F")],
    "ME": [("Manav", "Thakur", "M"), ("Aisha", "Siddiqui", "F"), ("Rudra", "Pratap", "M"), ("Kritika", "Sen", "F"),
           ("Neil", "Fernandes", "M"), ("Bhavya", "Agarwal", "F"), ("Omkar", "Patil", "M"), ("Zoya", "Ansari", "F"),
           ("Parth", "Shah", "M"), ("Ritika", "Banerjee", "F"), ("Samar", "Bhatia", "M"), ("Ira", "Chaudhary", "F")],
    "CE": [("Lakshya", "Verma", "M"), ("Mahika", "Saxena", "F"), ("Veer", "Solanki", "M"), ("Anvi", "Mishra", "F"),
           ("Tejas", "Gaikwad", "M"), ("Navya", "Krishnan", "F"), ("Atharv", "Pandey", "M"), ("Jiya", "Lobo", "F"),
           ("Reyansh", "Dubey", "M"), ("Kiara", "Dsouza", "F"), ("Ved", "Rathore", "M"), ("Myra", "Hegde", "F")],
}
# Attendance propensity by roll position: mostly regular, a few near or below the 75% line.
PROPENSITY = [0.97, 0.94, 0.92, 0.9, 0.95, 0.88, 0.93, 0.85, 0.82, 0.79, 0.71, 0.6]
