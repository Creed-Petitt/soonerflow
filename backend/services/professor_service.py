
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from rapidfuzz import fuzz, process
import re

from database.models import Professor, Rating
from backend.config import settings

class ProfessorService:

    def __init__(self, db: Session):

        self.db = db
    
    def get_rating(self, class_id: str, instructor_name: str) -> dict:
        
        try:
            return self._get_rating_internal(class_id, instructor_name)
        except Exception as e:
            # If professor rating fails, rollback and return empty ratings
            pass  # Professor rating failed
            try:
                self.db.rollback()
            except:
                pass
            return self._empty_rating()
    
    def _get_rating_internal(self, class_id: str, instructor_name: str) -> dict:

        # Return empty ratings for TBA or empty instructors
        if not instructor_name or instructor_name.upper() == "TBA":
            return self._empty_rating()

        # Find professor and get rating
        professor = self._find_professor(class_id, instructor_name)
        result = self._format_professor_rating(professor) if professor else self._empty_rating()

        return result
    
    def search_professor(self, name: str) -> Optional[Dict[str, Any]]:
        
        if not name or len(name.strip()) < 2:
            return None
        
        professor = self._find_professor_by_name(name.strip())
        
        if not professor:
            return None
        
        # Get student comments
        comments = self._get_professor_comments(professor)
        
        # Parse tags
        tags = self._parse_tags(professor.teacherTags)
        
        # Build rating distribution
        rating_distribution = [
            professor.ratingR1 or 0,
            professor.ratingR2 or 0,
            professor.ratingR3 or 0,
            professor.ratingR4 or 0,
            professor.ratingR5 or 0
        ]
        
        return {
            "id": professor.id,
            "firstName": professor.firstName or "",
            "lastName": professor.lastName or "",
            "name": f"{professor.firstName or ''} {professor.lastName or ''}".strip(),
            "avgRating": professor.avgRating or 0.0,
            "avgDifficulty": professor.avgDifficulty or 0.0,
            "wouldTakeAgainPercent": professor.wouldTakeAgainPercent or 0.0,
            "numRatings": professor.numRatings or 0,
            "department": professor.department or "",
            "ratingDistribution": rating_distribution,
            "tags": tags,
            "comments": comments
        }
    
    def _find_professor(self, class_id: str, instructor_name: str) -> Optional[Professor]:
        
        # Only use name matching - no broken table lookups
        return self._find_professor_by_name(instructor_name)
    
    def _find_by_class_mapping(self, class_id: str) -> Optional[Professor]:
        
        try:
            mapping = self.db.execute(text(), {"class_id": class_id}).first()
            
            if mapping:
                try:
                    return self.db.query(Professor).filter(
                        Professor.id == mapping[0]
                    ).first()
                except Exception as e:
                    pass  # Failed to query professor by ID
                    try:
                        self.db.rollback()
                    except:
                        pass
        except Exception:
            pass
        
        return None
    
    def _find_professor_by_name(self, name: str) -> Optional[Professor]:

        # Get all professors with ratings
        try:
            professors = self.db.query(Professor).filter(
                Professor.avgRating > 0
            ).all()

            if not professors:
                return None

            # Build list of professor names for fuzzy matching
            professor_names = []
            professor_map = {}
            for i, prof in enumerate(professors):
                full_name = f"{prof.firstName} {prof.lastName}".strip()
                professor_names.append(full_name)
                professor_map[i] = prof

        except Exception as e:
            # If database query fails, return None
            try:
                self.db.rollback()
            except:
                pass
            return None

        # Clean and prepare name variations
        name_variations = self._generate_name_variations(name)

        # Try each name variation with fuzzy matching
        for name_variant in name_variations:
            # Use token sort ratio for better handling of name order variations
            best_match = process.extractOne(
                name_variant,
                professor_names,
                scorer=fuzz.token_sort_ratio
            )

            if best_match and best_match[1] >= settings.fuzzy_match_threshold:
                # Return the professor object corresponding to the best match
                return professor_map[best_match[2]]

        # No fallback - if no exact match, return None
        return None
    
    def _generate_name_variations(self, name: str) -> List[str]:
        
        variations = [name]
        
        # Handle "Mc" names (e.g., "Mc Cann" vs "McCann")
        if 'Mc ' in name:
            variations.append(name.replace('Mc ', 'Mc'))
        elif 'Mc' in name and 'Mc ' not in name:
            variations.append(re.sub(r'Mc([A-Z])', r'Mc \1', name))
        
        # Handle "Last, First" format
        if ',' in name:
            parts = name.split(',', 1)
            if len(parts) == 2:
                last, first = parts[0].strip(), parts[1].strip()
                variations.append(f"{first} {last}")  # Convert to "First Last"
                variations.append(f"{last} {first}")  # Keep "Last First"
        
        # Handle hyphenated names
        if '-' in name:
            variations.append(name.replace('-', ' '))
            variations.append(name.replace('-', ''))
        
        return variations
    
    def _fallback_word_matching(self, name: str) -> Optional[Professor]:
        
        words = name.replace(',', ' ').split()
        significant_words = [w for w in words if len(w) > 2]
        
        for word in significant_words:
            try:
                professors = self.db.query(Professor).filter(
                    (Professor.lastName.ilike(f"%{word}%")) |
                    (Professor.firstName.ilike(f"%{word}%"))
                ).filter(Professor.avgRating > 0).all()
            except Exception as e:
                pass  # Failed to query professors by name
                try:
                    self.db.rollback()
                except:
                    pass
                continue
            
            if professors:
                # Return the professor with the highest number of ratings
                return max(professors, key=lambda p: p.numRatings or 0)
        
        return None
    
    
    def _format_professor_rating(self, professor: Professor) -> dict:
        
        tags = self._parse_tags(professor.teacherTags)
        
        return {
            "rating": professor.avgRating or 0.0,
            "difficulty": professor.avgDifficulty or 0.0,
            "wouldTakeAgain": professor.wouldTakeAgainPercent or 0.0,
            "ratingDistribution": [
                professor.ratingR1 or 0,
                professor.ratingR2 or 0,
                professor.ratingR3 or 0,
                professor.ratingR4 or 0,
                professor.ratingR5 or 0
            ],
            "tags": tags
        }
    
    def _parse_tags(self, tags_string: Optional[str]) -> List[str]:
        
        if not tags_string:
            return []
        
        return [tag.strip() for tag in tags_string.split(',') if tag.strip()]
    
    def _get_professor_comments(self, professor: Professor) -> List[str]:
        
        if professor.numRatings < 10:  # Only get comments for professors with enough data
            return []
        
        ratings = self.db.query(Rating).filter(
            Rating.professorId == professor.id,
            Rating.comment.isnot(None),
            Rating.comment != ""
        ).limit(5).all()
        
        return [r.comment for r in ratings if r.comment]
    
    def _empty_rating(self) -> dict:
        
        return {
            "rating": 0.0,
            "difficulty": 0.0,
            "wouldTakeAgain": 0.0,
            "ratingDistribution": [0, 0, 0, 0, 0],
            "tags": []
        }
    
