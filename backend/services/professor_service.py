"""
Professor service module for handling professor-related business logic.
Uses fuzzy matching for name resolution and includes caching for performance.
"""
from typing import Optional, Dict, List, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from rapidfuzz import fuzz, process
import re

import sys
sys.path.append('/home/highs/ou-class-manager')
from database.models import Professor, Rating
from backend.config import settings


class ProfessorService:
    """Service for managing professor data and ratings."""
    
    def __init__(self, db: Session):
        """
        Initialize the professor service.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
        self._cache: Dict[str, Tuple[dict, datetime]] = {}
        self._professor_name_cache: Optional[List[Tuple[Professor, str]]] = None
        self._cache_expiry = timedelta(minutes=settings.cache_ttl_minutes)
    
    def get_rating(self, class_id: str, instructor_name: str) -> dict:
        """
        Get professor rating information for a class.
        
        Args:
            class_id: The class ID
            instructor_name: The instructor's name
            
        Returns:
            Dictionary containing rating information
        """
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
        """Internal rating method with full error propagation."""
        # Return empty ratings for TBA or empty instructors
        if not instructor_name or instructor_name.upper() == "TBA":
            return self._empty_rating()
        
        # Check cache if enabled
        if settings.enable_professor_cache:
            cache_key = f"{class_id}:{instructor_name}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result is not None:
                return cached_result
        
        # Find professor and get rating
        professor = self._find_professor(class_id, instructor_name)
        result = self._format_professor_rating(professor) if professor else self._empty_rating()
        
        # Cache the result if caching is enabled
        if settings.enable_professor_cache:
            self._add_to_cache(cache_key, result)
        
        return result
    
    def search_professor(self, name: str) -> Optional[Dict[str, Any]]:
        """
        Search for a professor by name and return detailed information.
        
        Args:
            name: Professor name to search for
            
        Returns:
            Dictionary with professor details or None if not found
        """
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
        """
        Find a professor by name matching.
        
        Args:
            class_id: The class ID (unused but kept for compatibility)
            instructor_name: The instructor's name
            
        Returns:
            Professor object or None
        """
        # Only use name matching - no broken table lookups
        return self._find_professor_by_name(instructor_name)
    
    def _find_by_class_mapping(self, class_id: str) -> Optional[Professor]:
        """
        Find professor using class-professor mapping table.
        
        Args:
            class_id: The class ID
            
        Returns:
            Professor object or None
        """
        try:
            mapping = self.db.execute(text("""
                SELECT "professorId" FROM class_professor_mappings 
                WHERE "classId" = :class_id
            """), {"class_id": class_id}).first()
            
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
        """
        Find professor using fuzzy name matching.
        
        Args:
            name: Professor name to search for
            
        Returns:
            Professor object or None
        """
        # Build professor name cache if needed
        if self._professor_name_cache is None:
            self._build_professor_name_cache()
        
        if not self._professor_name_cache:
            return None
        
        # Clean and prepare name variations
        name_variations = self._generate_name_variations(name)
        
        # Try each name variation with fuzzy matching
        for name_variant in name_variations:
            # Extract just the names from the cache for fuzzy matching
            professor_names = [item[1] for item in self._professor_name_cache]
            
            # Use token sort ratio for better handling of name order variations
            best_match = process.extractOne(
                name_variant,
                professor_names,
                scorer=fuzz.token_sort_ratio
            )
            
            if best_match and best_match[1] >= settings.fuzzy_match_threshold:
                # Return the professor object corresponding to the best match
                return self._professor_name_cache[best_match[2]][0]
        
        # No fallback - if no exact match, return None
        return None
    
    def _generate_name_variations(self, name: str) -> List[str]:
        """
        Generate name variations for fuzzy matching.
        
        Args:
            name: Original name string
            
        Returns:
            List of name variations to try
        """
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
        """
        Fallback matching strategy using individual words.
        
        Args:
            name: Professor name
            
        Returns:
            Professor object or None
        """
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
    
    def _build_professor_name_cache(self):
        """Build cache of professor names for fuzzy matching."""
        try:
            professors = self.db.query(Professor).filter(
                Professor.avgRating > 0
            ).all()
            
            self._professor_name_cache = []
            for prof in professors:
                full_name = f"{prof.firstName} {prof.lastName}".strip()
                self._professor_name_cache.append((prof, full_name))
        except Exception as e:
            # If database query fails, initialize empty cache to prevent repeated failures
            pass  # Failed to build professor name cache
            self._professor_name_cache = []
            # Rollback any failed transaction
            try:
                self.db.rollback()
            except:
                pass
    
    def _format_professor_rating(self, professor: Professor) -> dict:
        """
        Format professor data into rating response.
        
        Args:
            professor: Professor object
            
        Returns:
            Dictionary with rating information
        """
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
        """
        Parse teacher tags from string.
        
        Args:
            tags_string: Comma-separated tags string
            
        Returns:
            List of tag strings
        """
        if not tags_string:
            return []
        
        return [tag.strip() for tag in tags_string.split(',') if tag.strip()]
    
    def _get_professor_comments(self, professor: Professor) -> List[str]:
        """
        Get student comments for a professor.
        
        Args:
            professor: Professor object
            
        Returns:
            List of comment strings
        """
        if professor.numRatings < 10:  # Only get comments for professors with enough data
            return []
        
        ratings = self.db.query(Rating).filter(
            Rating.professorId == professor.id,
            Rating.comment.isnot(None),
            Rating.comment != ""
        ).limit(5).all()
        
        return [r.comment for r in ratings if r.comment]
    
    def _empty_rating(self) -> dict:
        """
        Return empty rating structure.
        
        Returns:
            Dictionary with zeroed rating values
        """
        return {
            "rating": 0.0,
            "difficulty": 0.0,
            "wouldTakeAgain": 0.0,
            "ratingDistribution": [0, 0, 0, 0, 0],
            "tags": []
        }
    
    def _get_from_cache(self, key: str) -> Optional[dict]:
        """
        Get value from cache if not expired.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None if expired/not found
        """
        if key in self._cache:
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp < self._cache_expiry:
                return value
            else:
                del self._cache[key]
        return None
    
    def _add_to_cache(self, key: str, value: dict):
        """
        Add value to cache with timestamp.
        
        Args:
            key: Cache key
            value: Value to cache
        """
        self._cache[key] = (value, datetime.now())
        
        # Clean up old cache entries if cache gets too large
        if len(self._cache) > 1000:
            self._cleanup_cache()
    
    def _cleanup_cache(self):
        """Remove expired entries from cache."""
        now = datetime.now()
        expired_keys = [
            key for key, (_, timestamp) in self._cache.items()
            if now - timestamp >= self._cache_expiry
        ]
        for key in expired_keys:
            del self._cache[key]