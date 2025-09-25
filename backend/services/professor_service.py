
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
    
    def get_ratings_for_instructors(self, instructor_names: List[str]) -> Dict[str, dict]:
        if not instructor_names:
            return {}

        # Get all professors with ratings once
        try:
            professors = self.db.query(Professor).filter(Professor.avgRating > 0).all()
            if not professors:
                return {}
        except Exception:
            try:
                self.db.rollback()
            except:
                pass
            return {}

        # Build a list of professor names for fuzzy matching
        professor_names_list = [f"{prof.firstName} {prof.lastName}".strip() for prof in professors]
        professor_map = {f"{prof.firstName} {prof.lastName}".strip(): prof for prof in professors}

        instructor_ratings = {}
        unique_instructor_names = set(instructor_names)

        for name in unique_instructor_names:
            if not name or name.upper() == "TBA":
                continue
            
            # Clean and prepare name variations
            name_variations = self._generate_name_variations(name)

            best_prof = None
            highest_score = 0

            for name_variant in name_variations:
                # Use token sort ratio for better handling of name order variations
                best_match = process.extractOne(
                    name_variant,
                    professor_names_list,
                    scorer=fuzz.token_sort_ratio
                )

                if best_match and best_match[1] > highest_score:
                    highest_score = best_match[1]
                    if best_match[1] >= settings.fuzzy_match_threshold:
                        best_prof = professor_map.get(best_match[0])

            if best_prof:
                instructor_ratings[name] = self._format_professor_rating(best_prof)
            else:
                instructor_ratings[name] = self._empty_rating()

        return instructor_ratings

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

        # Normalize extra spaces first
        normalized_name = re.sub(r'\s+', ' ', name.strip())
        if normalized_name != name:
            variations.append(normalized_name)

        # Remove common titles and suffixes
        title_pattern = r'\b(Dr|Prof|Professor|Mr|Ms|Mrs|Jr|Sr|II|III|IV)\.?\b'
        title_removed = re.sub(title_pattern, '', name, flags=re.IGNORECASE).strip()
        title_removed = re.sub(r'\s+', ' ', title_removed)  # Clean up extra spaces
        if title_removed and title_removed != name:
            variations.append(title_removed)

        # Handle "Mc" names (e.g., "Mc Cann" vs "McCann")
        if 'Mc ' in name:
            mc_fixed = name.replace('Mc ', 'Mc')
            variations.append(mc_fixed)
        elif 'Mc' in name and 'Mc ' not in name:
            mc_spaced = re.sub(r'Mc([A-Z])', r'Mc \1', name)
            variations.append(mc_spaced)

        # Handle "Mac" names similarly
        if 'Mac ' in name:
            mac_fixed = name.replace('Mac ', 'Mac')
            variations.append(mac_fixed)
        elif 'Mac' in name and 'Mac ' not in name:
            mac_spaced = re.sub(r'Mac([A-Z])', r'Mac \1', name)
            variations.append(mac_spaced)

        # Handle "O'" names (e.g., "O Sullivan" vs "O'Sullivan")
        if 'O ' in name:
            o_apostrophe = re.sub(r'\bO ([A-Z])', r"O'\1", name)
            variations.append(o_apostrophe)
        elif "O'" in name:
            o_spaced = re.sub(r"\bO'([A-Z])", r'O \1', name)
            variations.append(o_spaced)

        # Handle "Last, First" format
        if ',' in name:
            parts = name.split(',', 1)
            if len(parts) == 2:
                last, first = parts[0].strip(), parts[1].strip()
                variations.append(f"{first} {last}")  # Convert to "First Last"
                variations.append(f"{last} {first}")  # Keep "Last First"

        # Handle hyphenated names (comprehensive)
        if '-' in name:
            # Version with spaces instead of hyphens
            space_version = name.replace('-', ' ')
            variations.append(space_version)

            # Version with no hyphens or spaces
            no_hyphen = name.replace('-', '')
            variations.append(no_hyphen)

            # Version with normalized hyphen spacing
            clean_hyphen = re.sub(r'\s*-\s*', '-', name)
            if clean_hyphen != name:
                variations.append(clean_hyphen)

        # Handle names with spaces that might be hyphenated in database
        elif ' ' in name and '-' not in name:
            # Try hyphenated version
            words = name.split()
            if len(words) >= 2:
                # Hyphenate the last two words (most common case)
                if len(words) >= 2:
                    hyphenated = ' '.join(words[:-2] + ['-'.join(words[-2:])])
                    variations.append(hyphenated)

        # Remove duplicates and empty strings, return unique variations
        unique_variations = []
        for var in variations:
            clean_var = var.strip()
            if clean_var and clean_var not in unique_variations:
                unique_variations.append(clean_var)

        return unique_variations
    
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
    
