import pytest
from app.utils.geofencing import GPSCoordinate, calculate_haversine_distance, is_within_geofence


@pytest.mark.unit
def test_haversine_identical_coordinates():
    point = GPSCoordinate(latitude=12.9716, longitude=77.5946)
    distance = calculate_haversine_distance(point, point)
    assert distance == 0.0


@pytest.mark.unit
def test_haversine_known_distance():
    # Distance between Bangalore (12.9716, 77.5946) and Mysore (12.2958, 76.6394) is ~128 km
    bangalore = GPSCoordinate(latitude=12.9716, longitude=77.5946)
    mysore = GPSCoordinate(latitude=12.2958, longitude=76.6394)
    distance_meters = calculate_haversine_distance(bangalore, mysore)
    assert 120000 < distance_meters < 140000


@pytest.mark.unit
def test_is_within_geofence_inside():
    classroom = GPSCoordinate(latitude=19.0760, longitude=72.8777)
    # 5 meters away
    student = GPSCoordinate(latitude=19.07604, longitude=72.8777)
    base_radius = 20.0
    accuracy = 5.0
    assert is_within_geofence(student, classroom, base_radius, accuracy) is True


@pytest.mark.unit
def test_is_within_geofence_outside():
    classroom = GPSCoordinate(latitude=19.0760, longitude=72.8777)
    # ~500 meters away
    student = GPSCoordinate(latitude=19.0805, longitude=72.8777)
    base_radius = 50.0
    accuracy = 10.0
    assert is_within_geofence(student, classroom, base_radius, accuracy) is False


@pytest.mark.unit
def test_is_within_geofence_boundary_with_accuracy():
    classroom = GPSCoordinate(latitude=28.7041, longitude=77.1025)
    # student is 30m away
    # base radius 25m, accuracy 10m -> effective radius 35m -> within geofence!
    student = GPSCoordinate(latitude=28.70435, longitude=77.1025)
    distance = calculate_haversine_distance(student, classroom)
    assert is_within_geofence(student, classroom, base_radius=distance - 2, student_accuracy=5.0) is True
    assert is_within_geofence(student, classroom, base_radius=distance - 5, student_accuracy=1.0) is False
