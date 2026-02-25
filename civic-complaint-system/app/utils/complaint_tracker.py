from app.models.complaint_update import ComplaintUpdate


def add_complaint_update(db, complaint_id: int, status: str, remark: str | None = None, updated_by: int | None = None):
    update = ComplaintUpdate(
        complaint_id=complaint_id,
        status=status,
        remark=remark,
        updated_by=updated_by,
    )
    db.add(update)
    return update
