import requests
import json
import time
import logging
from typing import Dict, List, Optional, Any

class RateMyProfessorsAPIClient:
    """Client for RateMyProfessors GraphQL API with pagination support"""
    
    # The exact working query from browser
    QUERY_ALL_PROFESSORS = '''
query TeacherSearchResultsPageQuery(
  $query: TeacherSearchQuery!
  $schoolID: ID
  $includeSchoolFilter: Boolean!
) {
  search: newSearch {
    ...TeacherSearchPagination_search_2MvZSr
  }
  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {
    __typename
    ... on School {
      name
      ...StickyHeaderContent_school
    }
    id
  }
}

fragment CardFeedback_teacher on Teacher {
  wouldTakeAgainPercent
  avgDifficulty
}

fragment CardName_teacher on Teacher {
  firstName
  lastName
}

fragment CardRatings_teacher on Teacher {
  avgRating
  numRatings
  ...CardFeedback_teacher
}

fragment CardSchool_teacher on Teacher {
  department
  school {
    name
    id
  }
}

fragment CardTeacherInfo_teacher on Teacher {
  ...CardName_teacher
  ...CardRatings_teacher
  ...CardSchool_teacher
  ...TeacherBookmark_teacher
}

fragment StickyHeaderContent_school on School {
  name
}

fragment TeacherBookmark_teacher on Teacher {
  id
  isSaved
}

fragment TeacherSearchPagination_search_2MvZSr on newSearch {
  teachers(query: $query, first: 1000, after: "") {
    edges {
      cursor
      node {
        ...CardTeacherInfo_teacher
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
    resultCount
  }
}
'''
    
    def __init__(self):
        self.base_url = "https://www.ratemyprofessors.com/graphql"
        self.headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.logger = logging.getLogger(__name__)
    
    def fetch_all_professors(self, school_id: str = "U2Nob29sLTkyNA==") -> List[Dict[str, Any]]:
        """Fetch all professors from a school (default: OU)"""
        try:
            self.logger.info(f"Fetching all professors from school ID: {school_id}")
            
            variables = {
                "query": {
                    "text": "",
                    "schoolID": school_id,
                    "fallback": True,
                    "departmentID": None
                },
                "schoolID": school_id,
                "includeSchoolFilter": True
            }
            
            # Add authorization header for this endpoint
            headers = self.headers.copy()
            headers['Authorization'] = 'Basic dGVzdDp0ZXN0'
            
            response = requests.post(
                self.base_url,
                json={'query': self.QUERY_ALL_PROFESSORS, 'variables': variables},
                headers=headers
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Debug: Check response structure
            if data is None:
                self.logger.error("Response returned None")
                return []
            
            # Navigate to the teachers array
            if 'data' in data and data['data'] and 'search' in data['data']:
                teachers = data['data']['search']['teachers']['edges']
                self.logger.info(f"Successfully fetched {len(teachers)} professors")
                return teachers
            else:
                self.logger.error("Unexpected response structure from fetch_all_professors")
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching all professors: {e}")
            return []
    
    def fetch_professor_details(self, professor_id: str, num_ratings: int = 10) -> Optional[Dict[str, Any]]:
        """Fetch detailed professor data with configurable number of ratings"""
        try:
            # Determine how many ratings to fetch based on professor's total
            if num_ratings >= 15:
                ratings_to_fetch = 15
            elif num_ratings >= 10:
                ratings_to_fetch = 10
            else:
                ratings_to_fetch = 5
            
            query = self._build_professor_query(ratings_to_fetch)
            
            payload = {
                "query": query,
                "variables": {
                    "id": professor_id
                }
            }
            
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            # Debug: Print the response structure
            print(f"DEBUG: Response keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
            if 'data' in data:
                print(f"DEBUG: Data keys: {list(data['data'].keys()) if isinstance(data['data'], dict) else 'Not a dict'}")
            
            # Check for errors first
            if 'errors' in data and data['errors']:
                self.logger.error(f"GraphQL errors: {data['errors']}")
                return None
            
            if 'data' in data and 'node' in data['data']:
                professor_data = data['data']['node']
                
                # Debug: Print professor data structure
                print(f"DEBUG: Professor data keys: {list(professor_data.keys()) if isinstance(professor_data, dict) else 'Not a dict'}")
                
                # Check if we need to paginate for more ratings
                ratings = professor_data.get('ratings', {}).get('edges', [])
                page_info = professor_data.get('ratings', {}).get('pageInfo', {})
                
                # Debug: Print ratings structure
                print(f"DEBUG: Ratings type: {type(ratings)}, value: {ratings}")
                
                # Ensure ratings is a list
                if ratings is None:
                    ratings = []
                
                # If we have more pages and want more ratings, fetch them
                if page_info.get('hasNextPage') and len(ratings) < ratings_to_fetch:
                    additional_ratings = self._fetch_additional_ratings(
                        professor_id, ratings_to_fetch - len(ratings), page_info.get('endCursor')
                    )
                    if additional_ratings:
                        ratings.extend(additional_ratings)
                    professor_data['ratings']['edges'] = ratings
                
                return professor_data
            else:
                self.logger.error(f"No professor data found for ID: {professor_id}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error fetching professor details: {e}")
            return None
    
    def _fetch_additional_ratings(self, professor_id: str, num_additional: int, cursor: str) -> List[Dict[str, Any]]:
        """Fetch additional ratings using pagination"""
        try:
            query = self._build_ratings_query(num_additional)
            
            payload = {
                "query": query,
                "variables": {
                    "id": professor_id,
                    "cursor": cursor
                }
            }
            
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and 'node' in data['data']:
                return data['data']['node'].get('ratings', {}).get('edges', [])
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error fetching additional ratings: {e}")
            return []
    
    def _build_professor_query(self, num_ratings: int) -> str:
        """Build GraphQL query for professor details"""
        return f"""
query TeacherRatingsPageQuery($id: ID!) {{
  node(id: $id) {{
    __typename
    ... on Teacher {{
      id
      legacyId
      firstName
      lastName
      department
      departmentId
      lockStatus
      isSaved
      isProfCurrentUser
      
      school {{
        id
        legacyId
        name
        city
        state
        avgRating
        numRatings
      }}
      
      avgRating
      numRatings
      avgDifficulty
      wouldTakeAgainPercent
      
      ratingsDistribution {{
        total
        r1
        r2
        r3
        r4
        r5
      }}
      
      teacherRatingTags {{
        id
        legacyId
        tagCount
        tagName
      }}
      
      courseCodes {{
        courseName
        courseCount
      }}
      
      relatedTeachers {{
        id
        legacyId
        firstName
        lastName
        avgRating
      }}
      
      ratings(first: {num_ratings}) {{
        edges {{
          cursor
          node {{
            id
            legacyId
            comment
            date
            class
            difficultyRating
            clarityRating
            helpfulRating
            wouldTakeAgain
            grade
            attendanceMandatory
            textbookUse
            isForOnlineClass
            isForCredit
            ratingTags
            flagStatus
            createdByUser
            thumbsUpTotal
            thumbsDownTotal
            teacherNote {{
              id
            }}
          }}
        }}
        pageInfo {{
          hasNextPage
          endCursor
        }}
      }}
    }}
  }}
}}
"""
    
    def _build_ratings_query(self, num_ratings: int) -> str:
        """Build GraphQL query for additional ratings"""
        return f"""
query TeacherRatingsPageQuery($id: ID!, $cursor: String) {{
  node(id: $id) {{
    ratings(first: {num_ratings}, after: $cursor) {{
      edges {{
        cursor
        node {{
          id
          legacyId
          comment
          date
          class
          difficultyRating
          clarityRating
          helpfulRating
          wouldTakeAgain
          grade
          attendanceMandatory
          textbookUse
          isForOnlineClass
          isForCredit
          ratingTags
          flagStatus
          createdByUser
          thumbsUpTotal
          thumbsDownTotal
          teacherNote {{
            id
          }}
        }}
      }}
      pageInfo {{
        hasNextPage
        endCursor
      }}
    }}
  }}
}}
""" 