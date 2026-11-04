"""Weekly timetable for the four classes. Day 1 is Monday.

Checked by hand so that no teacher, room or class is double-booked: each class has its own room, and a
teacher who takes several classes (Data Structures, Discrete Mathematics, Mathematics I) has a free period for each.
"""
PERIODS = {
    "A": ("09:00", "09:55"),
    "B": ("10:00", "10:55"),
    "C": ("11:15", "12:10"),
    "D": ("12:15", "13:10"),
    "E": ("14:00", "14:55"),
}

# class code -> [(subject code, day, period)]
SLOTS: dict[str, list[tuple[str, int, str]]] = {
    "CSE-A-1": [
        ("CS201", 1, "A"), ("CS201", 4, "A"), ("MA201", 1, "B"), ("MA201", 3, "A"),
        ("CS203", 2, "A"), ("CS203", 5, "A"), ("CS204", 2, "B"), ("CS204", 4, "B"),
    ],
    "CSE-B-1": [
        ("CS201", 1, "C"), ("CS201", 4, "C"), ("MA201", 2, "C"), ("MA201", 5, "C"),
        ("CS203", 3, "B"), ("CS203", 5, "B"), ("CS204", 1, "D"), ("CS204", 3, "C"),
    ],
    "ECE-A-1": [
        ("EC301", 1, "A"), ("EC301", 3, "A"), ("EC302", 2, "B"), ("EC302", 4, "B"),
        ("EC303", 1, "B"), ("EC303", 5, "A"), ("EC304", 2, "A"), ("EC304", 4, "A"),
    ],
    "ME-A-1": [
        ("MA101", 1, "E"), ("MA101", 4, "E"), ("PH101", 2, "D"), ("PH101", 5, "D"),
        ("ME101", 1, "A"), ("ME101", 3, "B"), ("ME102", 2, "E"), ("ME102", 4, "D"),
    ],
}
