from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from rapidfuzz import fuzz, process
import re
import logging

from database.models import Professor
from backend.config import settings
from backend.core.exceptions import NotFoundException

class ProfessorService:
    def __init__(self):
        pass

    def search_professor(self, db: Session, name: str) -> Dict[str, Any]:
        if not name or len(name.strip()) < 2:
            raise NotFoundException("Name must be at least 2 characters")

        professor = self._find_professor_by_name(db, name.strip())

        if not professor:
            raise NotFoundException(f"Professor '{name}' not found")

        tags = self._parse_tags(professor.teacherTags)
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
            "tags": tags
        }

    def _find_professor_by_name(self, db: Session, name: str) -> Optional[Professor]:
        try:
            name_variations = self._generate_name_variations(name)
            search_terms = list(set([term for variation in name_variations for term in variation.split()]))

            query = db.query(Professor).filter(Professor.avgRating > 0)
            conditions = []
            for term in search_terms:
                conditions.append(Professor.lastName.ilike(f"%{term}%"))
                conditions.append(Professor.firstName.ilike(f"%{term}%"))
            professors = query.filter(or_(*conditions)).limit(100).all()

            if not professors:
                return None

            professor_names = []
            professor_map = {}
            for i, prof in enumerate(professors):
                full_name = f"{prof.firstName} {prof.lastName}".strip()
                professor_names.append(full_name)
                professor_map[i] = prof

        except Exception as e:
            logging.getLogger(__name__).error(f"Error finding professor by name '{name}': {e}")
            try:
                db.rollback()
            except Exception as rollback_e:
                logging.getLogger(__name__).error(f"Error during rollback: {rollback_e}")
            return None

        for name_variant in name_variations:
            best_match = process.extractOne(
                name_variant,
                professor_names,
                scorer=fuzz.token_sort_ratio
            )

            if best_match and best_match[1] >= settings.fuzzy_match_threshold:
                return professor_map[best_match[2]]

        return None

    def _generate_name_variations(self, name: str) -> List[str]:
        variations = [name]

        normalized_name = re.sub(r'\s+', ' ', name.strip())
        if normalized_name != name:
            variations.append(normalized_name)

        title_pattern = r'\b(Dr|Prof|Professor|Mr|Ms|Mrs|Jr|Sr|II|III|IV)\.?\b'
        title_removed = re.sub(title_pattern, '', name, flags=re.IGNORECASE).strip()
        title_removed = re.sub(r'\s+', ' ', title_removed)
        if title_removed and title_removed != name:
            variations.append(title_removed)

        if 'Mc ' in name:
            variations.append(name.replace('Mc ', 'Mc'))
        elif 'Mc' in name and 'Mc ' not in name:
            variations.append(re.sub(r'Mc([A-Z])', r'Mc \1', name))

        if 'Mac ' in name:
            variations.append(name.replace('Mac ', 'Mac'))
        elif 'Mac' in name and 'Mac ' not in name:
            variations.append(re.sub(r'Mac([A-Z])', r'Mac \1', name))

        if 'O ' in name:
            variations.append(re.sub(r'\bO ([A-Z])', r"O'\1", name))
        elif "O'" in name:
            variations.append(re.sub(r"\bO'([A-Z])", r'O \1', name))

        if ',' in name:
            parts = name.split(',', 1)
            if len(parts) == 2:
                last, first = parts[0].strip(), parts[1].strip()
                variations.append(f"{first} {last}")
                variations.append(f"{last} {first}")

        if '-' in name:
            variations.append(name.replace('-', ' '))
            variations.append(name.replace('-', ''))
            clean_hyphen = re.sub(r'\s*-\s*', '-', name)
            if clean_hyphen != name:
                variations.append(clean_hyphen)
        elif ' ' in name and '-' not in name:
            words = name.split()
            if len(words) >= 2:
                hyphenated = ' '.join(words[:-2] + ['-'.join(words[-2:])])
                variations.append(hyphenated)

        unique_variations = []
        for var in variations:
            clean_var = var.strip()
            if clean_var and clean_var not in unique_variations:
                unique_variations.append(clean_var)

        return unique_variations

    def _parse_tags(self, tags_string: Optional[str]) -> List[str]:
        if not tags_string:
            return []
        return [tag.strip() for tag in tags_string.split(',') if tag.strip()]
