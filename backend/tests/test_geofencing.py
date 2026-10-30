import pytest
from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence


def test_haversine_distance_same_location() -> None:
    coord = GPSCoordinate(latitude=19.0222, longitude=72.8561)
    distance = calculate_haversine_distance(coord, coord)
    assert distance == pytest.approx(0.0, abs=1e-3)


def test_haversine_distance_known_points() -> None:
    # VJTI Mumbai to DTU Delhi (~1150 km)
    vjti = GPSCoordinate(latitude=19.0222, longitude=72.8561)
    dtu = GPSCoordinate(latitude=28.7495, longitude=77.1170)
    distance = calculate_haversine_distance(vjti, dtu)
    assert 1_100_000 < distance < 1_200_000


def test_is_within_geofence_inside() -> None:
    classroom = GPSCoordinate(latitude=19.022200, longitude=72.856100)
    student = GPSCoordinate(latitude=19.022250, longitude=72.856120)  # ~6-8 meters away
    assert is_within_geofence(student, classroom, base_radius=50.0, student_accuracy=10.0) is True


def test_is_within_geofence_outside() -> None:
    classroom = GPSCoordinate(latitude=19.022200, longitude=72.856100)
    student = GPSCoordinate(latitude=19.030000, longitude=72.860000)  # ~900 meters away
    assert is_within_geofence(student, classroom, base_radius=50.0, student_accuracy=10.0) is False
