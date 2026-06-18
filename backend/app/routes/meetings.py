from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas import MeetingResponse, MeetingCreate, MeetingUpdate, MeetingTimeSlotResponse
from app.models import User, Meeting, MeetingTimeSlot, Workspace
from app.security import get_current_user

router = APIRouter(prefix="/workspaces", tags=["meetings"])


@router.get("/{workspace_id}/meetings", response_model=List[MeetingResponse])
def list_workspace_meetings(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all meetings in workspace"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    meetings = db.query(Meeting).filter(Meeting.workspace_id == workspace_id).all()
    return meetings


@router.post("/{workspace_id}/meetings", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    workspace_id: int,
    meeting_data: MeetingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new meeting poll"""
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    
    if current_user not in workspace.members and workspace.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Create meeting
    new_meeting = Meeting(
        workspace_id=workspace_id,
        title=meeting_data.title,
        agenda=meeting_data.agenda,
        voting_deadline=meeting_data.voting_deadline,
        creator_id=current_user.id
    )
    
    # Add time slots
    for slot_data in meeting_data.time_slots:
        slot = MeetingTimeSlot(
            start_time=slot_data.start_time,
            end_time=slot_data.end_time
        )
        new_meeting.time_slots.append(slot)
    
    # Add attendees
    if meeting_data.attendee_ids:
        attendees = db.query(User).filter(User.id.in_(meeting_data.attendee_ids)).all()
        new_meeting.attendees.extend(attendees)
    else:
        # Add all workspace members if no specific attendees provided
        new_meeting.attendees.extend(workspace.members)
    
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    
    return new_meeting


@router.get("/{workspace_id}/meetings/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    workspace_id: int,
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get meeting details"""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.workspace_id == workspace_id
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    if current_user not in meeting.attendees:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return meeting


@router.put("/{workspace_id}/meetings/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    workspace_id: int,
    meeting_id: int,
    update_data: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update meeting"""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.workspace_id == workspace_id
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    if meeting.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can update meeting"
        )
    
    # Update fields
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(meeting, field, value)
    
    db.commit()
    db.refresh(meeting)
    
    return meeting


@router.delete("/{workspace_id}/meetings/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    workspace_id: int,
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete meeting"""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.workspace_id == workspace_id
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    if meeting.creator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only creator can delete meeting"
        )
    
    db.delete(meeting)
    db.commit()


@router.post("/{workspace_id}/meetings/{meeting_id}/vote/{slot_id}", status_code=status.HTTP_200_OK)
def vote_for_slot(
    workspace_id: int,
    meeting_id: int,
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Vote for a meeting time slot"""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.workspace_id == workspace_id
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    if current_user not in meeting.attendees:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an attendee"
        )
    
    slot = db.query(MeetingTimeSlot).filter(
        MeetingTimeSlot.id == slot_id,
        MeetingTimeSlot.meeting_id == meeting_id
    ).first()
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Time slot not found"
        )
    
    # Check if user already voted for this slot
    existing_vote = db.query(MeetingTimeSlot).filter(
        MeetingTimeSlot.id == slot_id
    ).first()
    
    if current_user not in slot.votes:
        slot.votes.append(current_user)
        db.commit()
    
    return {"message": "Vote recorded"}


@router.get("/{workspace_id}/meetings/{meeting_id}/vote-stats", response_model=dict)
def get_vote_stats(
    workspace_id: int,
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get voting statistics for meeting"""
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.workspace_id == workspace_id
    ).first()
    
    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )
    
    if current_user not in meeting.attendees:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Calculate stats
    total_attendees = len(meeting.attendees)
    voted_users = set()
    slot_votes = []
    
    for slot in meeting.time_slots:
        votes_count = len(slot.votes)
        voted_users.update(slot.votes)
        slot_votes.append({
            "slot_id": slot.id,
            "start_time": slot.start_time,
            "end_time": slot.end_time,
            "votes": votes_count
        })
    
    return {
        "total_attendees": total_attendees,
        "voted_count": len(voted_users),
        "slot_votes": slot_votes
    }
