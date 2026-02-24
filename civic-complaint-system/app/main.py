from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.routes import auth, complaints, admin, officer

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

# Keep old databases compatible with the new AI priority field.
with engine.begin() as connection:
    inspector = inspect(connection)
    if "complaints" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("complaints")}
        if "priority" not in columns:
            connection.execute(
                text("ALTER TABLE complaints ADD COLUMN priority VARCHAR(20) DEFAULT 'Low'")
            )
        if "latitude" not in columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN latitude FLOAT NULL"))
        if "longitude" not in columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN longitude FLOAT NULL"))
        connection.execute(
            text(
                "UPDATE complaints "
                "SET location = 'Location not provided' "
                "WHERE location IS NULL OR TRIM(location) = ''"
            )
        )

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(admin.router)
app.include_router(officer.router)

# ✅ VERY IMPORTANT
app.mount("/media", StaticFiles(directory="uploads"), name="media")
