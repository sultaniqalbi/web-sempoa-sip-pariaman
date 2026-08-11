import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db, get_database_url
from app.core.security import create_access_token
from app.models.users import User, UserRole

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(get_database_url())
    connection = engine.connect()
    transaction = connection.begin()
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    db = SessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture(scope="session")
def admin_token():
    return create_access_token(subject="admin@sempoasippariaman.com")

@pytest.fixture(scope="session")
def owner_token():
    return create_access_token(subject="owner@sempoasippariaman.com")

@pytest.fixture(scope="session")
def guru_token():
    return create_access_token(subject="budi@guru.sempoasip.com")

@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture(scope="session")
def owner_headers(owner_token):
    return {"Authorization": f"Bearer {owner_token}"}

@pytest.fixture(scope="session")
def guru_headers(guru_token):
    return {"Authorization": f"Bearer {guru_token}"}
