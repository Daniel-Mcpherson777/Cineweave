import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data


def test_health_check_structure():
    """Test health check returns proper structure"""
    response = client.get("/health")
    data = response.json()
    assert "status" in data
    assert "environment" in data
    assert "version" in data
