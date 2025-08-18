"""
Router module for flowchart persistence endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import json
from datetime import datetime

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import User, UserFlowchart, create_engine_and_session

router = APIRouter(prefix="/api/flowchart", tags=["flowchart"])

# Database dependency
engine, SessionLocal = create_engine_and_session()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class FlowchartData(BaseModel):
    nodes: list
    edges: list


@router.get("/{github_id}/load")
async def load_flowchart(
    github_id: str,
    db: Session = Depends(get_db)
):
    """Load user's saved flowchart."""
    # Find user
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get flowchart
    flowchart = db.query(UserFlowchart).filter(UserFlowchart.user_id == user.id).first()
    
    if not flowchart:
        # Return empty flowchart if none exists
        return {
            "nodes": [],
            "edges": [],
            "updated_at": None
        }
    
    # Parse JSON strings
    nodes = json.loads(flowchart.nodes) if flowchart.nodes else []
    edges = json.loads(flowchart.edges) if flowchart.edges else []
    
    return {
        "nodes": nodes,
        "edges": edges,
        "updated_at": flowchart.updated_at.isoformat() if flowchart.updated_at else None
    }


@router.post("/{github_id}/save")
async def save_flowchart(
    github_id: str,
    data: FlowchartData,
    db: Session = Depends(get_db)
):
    """Save or update user's flowchart."""
    # Find user
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find or create flowchart
    flowchart = db.query(UserFlowchart).filter(UserFlowchart.user_id == user.id).first()
    
    if not flowchart:
        # Create new flowchart
        flowchart = UserFlowchart(user_id=user.id)
        db.add(flowchart)
    
    # Update flowchart data
    flowchart.nodes = json.dumps(data.nodes)
    flowchart.edges = json.dumps(data.edges)
    flowchart.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "success": True,
        "updated_at": flowchart.updated_at.isoformat()
    }


@router.delete("/{github_id}/clear")
async def clear_flowchart(
    github_id: str,
    db: Session = Depends(get_db)
):
    """Clear user's saved flowchart."""
    # Find user
    user = db.query(User).filter(User.github_id == github_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete flowchart if exists
    flowchart = db.query(UserFlowchart).filter(UserFlowchart.user_id == user.id).first()
    
    if flowchart:
        db.delete(flowchart)
        db.commit()
    
    return {"success": True}