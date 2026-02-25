import asyncio

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.models import complaint, complaint_update, notification, user
from app.routes import admin, auth, complaints, notifications, officer
from app.utils.pmo_escalation import pmo_escalation_worker

app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

# Keep old databases compatible with newer fields.
with engine.begin() as connection:
    inspector = inspect(connection)

    if "complaints" in inspector.get_table_names():
        complaint_columns = {column["name"] for column in inspector.get_columns("complaints")}
        if "priority" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN priority VARCHAR(20) DEFAULT 'Low'"))
        if "latitude" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN latitude FLOAT NULL"))
        if "longitude" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN longitude FLOAT NULL"))
        if "tracking_id" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN tracking_id VARCHAR(40) NULL"))
        if "officer_remark" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN officer_remark TEXT NULL"))
        if "created_at" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN created_at DATETIME NULL"))
        if "pmo_escalated" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN pmo_escalated BOOLEAN DEFAULT 0"))
        if "pmo_escalated_at" not in complaint_columns:
            connection.execute(text("ALTER TABLE complaints ADD COLUMN pmo_escalated_at DATETIME NULL"))

        connection.execute(
            text(
                "UPDATE complaints "
                "SET location = 'Location not provided' "
                "WHERE location IS NULL OR TRIM(location) = ''"
            )
        )
        connection.execute(
            text(
                "UPDATE complaints "
                "SET tracking_id = CONCAT('CMP-', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 10))) "
                "WHERE tracking_id IS NULL OR TRIM(tracking_id) = ''"
            )
        )

    if "users" in inspector.get_table_names():
        user_columns = {column["name"] for column in inspector.get_columns("users")}
        if "phone" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL"))
        if "sms_notifications" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN sms_notifications BOOLEAN DEFAULT 1"))
        if "email_notifications" not in user_columns:
            connection.execute(text("ALTER TABLE users ADD COLUMN email_notifications BOOLEAN DEFAULT 1"))

    if "complaint_updates" in inspector.get_table_names() and "complaints" in inspector.get_table_names():
        connection.execute(
            text(
                "INSERT INTO complaint_updates (complaint_id, status, remark, updated_by, created_at) "
                "SELECT c.id, COALESCE(c.status, 'Pending'), 'Complaint timeline initialized', c.citizen_id, COALESCE(c.created_at, NOW()) "
                "FROM complaints c "
                "LEFT JOIN complaint_updates cu ON cu.complaint_id = c.id "
                "WHERE cu.id IS NULL"
            )
        )


@app.on_event("startup")
async def startup_events():
    app.state.pmo_stop_event = asyncio.Event()
    app.state.pmo_task = asyncio.create_task(pmo_escalation_worker(app.state.pmo_stop_event))


@app.on_event("shutdown")
async def shutdown_events():
    stop_event = getattr(app.state, "pmo_stop_event", None)
    worker_task = getattr(app.state, "pmo_task", None)

    if stop_event:
        stop_event.set()
    if worker_task:
        await worker_task


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
app.include_router(notifications.router)

app.mount("/media", StaticFiles(directory="uploads"), name="media")
