import json
import time
import os
import logging
import requests
from datetime import datetime

# Constants
GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"

# The exact query for detailed professor data
DETAILED_QUERY = '''
query TeacherRatingsPageQuery(
  $id: ID!
) {
  node(id: $id) {
    __typename
    ... on Teacher {
      id
      legacyId
      firstName
      lastName
      department
      school {
        legacyId
        name
        city
        state
        country
        id
      }
      lockStatus
      ...StickyHeaderContent_teacher
      ...MiniStickyHeader_teacher
      ...TeacherBookmark_teacher
      ...RatingDistributionWrapper_teacher
      ...TeacherInfo_teacher
      ...SimilarProfessors_teacher
      ...TeacherRatingTabs_teacher
    }
    id
  }
}

fragment CompareProfessorLink_teacher on Teacher {
  legacyId
}

fragment CourseMeta_rating on Rating {
  attendanceMandatory
  wouldTakeAgain
  grade
  textbookUse
  isForOnlineClass
  isForCredit
}

fragment HeaderDescription_teacher on Teacher {
  id
  legacyId
  firstName
  lastName
  department
  school {
    legacyId
    name
    city
    state
    id
  }
  ...TeacherTitles_teacher
  ...TeacherBookmark_teacher
  ...RateTeacherLink_teacher
  ...CompareProfessorLink_teacher
}

fragment HeaderRateButton_teacher on Teacher {
  ...RateTeacherLink_teacher
  ...CompareProfessorLink_teacher
}

fragment MiniStickyHeader_teacher on Teacher {
  id
  legacyId
  firstName
  lastName
  department
  departmentId
  school {
    legacyId
    name
    city
    state
    id
  }
  ...TeacherBookmark_teacher
  ...RateTeacherLink_teacher
  ...CompareProfessorLink_teacher
}

fragment NameLink_teacher on Teacher {
  isProfCurrentUser
  id
  legacyId
  firstName
  lastName
  school {
    name
    id
  }
}

fragment NameTitle_teacher on Teacher {
  id
  firstName
  lastName
  department
  school {
    legacyId
    name
    id
  }
  ...TeacherDepartment_teacher
  ...TeacherBookmark_teacher
}

fragment NoRatingsArea_teacher on Teacher {
  lastName
  ...RateTeacherLink_teacher
}

fragment NumRatingsLink_teacher on Teacher {
  numRatings
  ...RateTeacherLink_teacher
}

fragment ProfessorNoteEditor_rating on Rating {
  id
  legacyId
  class
  teacherNote {
    id
    teacherId
    comment
  }
}

fragment ProfessorNoteEditor_teacher on Teacher {
  id
}

fragment ProfessorNoteFooter_note on TeacherNotes {
  legacyId
  flagStatus
}

fragment ProfessorNoteFooter_teacher on Teacher {
  legacyId
  isProfCurrentUser
}

fragment ProfessorNoteHeader_note on TeacherNotes {
  createdAt
  updatedAt
}

fragment ProfessorNoteHeader_teacher on Teacher {
  lastName
}

fragment ProfessorNoteSection_rating on Rating {
  teacherNote {
    ...ProfessorNote_note
    id
  }
  ...ProfessorNoteEditor_rating
}

fragment ProfessorNoteSection_teacher on Teacher {
  ...ProfessorNote_teacher
  ...ProfessorNoteEditor_teacher
}

fragment ProfessorNote_note on TeacherNotes {
  comment
  ...ProfessorNoteHeader_note
  ...ProfessorNoteFooter_note
}

fragment ProfessorNote_teacher on Teacher {
  ...ProfessorNoteHeader_teacher
  ...ProfessorNoteFooter_teacher
}

fragment RateTeacherLink_teacher on Teacher {
  legacyId
  numRatings
  lockStatus
}

fragment RatingDistributionChart_ratingsDistribution on ratingsDistribution {
  r1
  r2
  r3
  r4
  r5
}

fragment RatingDistributionWrapper_teacher on Teacher {
  ...NoRatingsArea_teacher
  ratingsDistribution {
    total
    ...RatingDistributionChart_ratingsDistribution
  }
}

fragment RatingFooter_rating on Rating {
  id
  comment
  adminReviewedAt
  flagStatus
  legacyId
  thumbsUpTotal
  thumbsDownTotal
  thumbs {
    thumbsUp
    thumbsDown
    computerId
    id
  }
  teacherNote {
    id
  }
  ...Thumbs_rating
}

fragment RatingFooter_teacher on Teacher {
  id
  legacyId
  lockStatus
  isProfCurrentUser
  ...Thumbs_teacher
}

fragment RatingHeader_rating on Rating {
  legacyId
  date
  class
  helpfulRating
  clarityRating
  isForOnlineClass
}

fragment RatingSuperHeader_rating on Rating {
  legacyId
}

fragment RatingSuperHeader_teacher on Teacher {
  firstName
  lastName
  legacyId
  school {
    name
    id
  }
}

fragment RatingTags_rating on Rating {
  ratingTags
}

fragment RatingValue_teacher on Teacher {
  avgRating
  numRatings
  ...NumRatingsLink_teacher
}

fragment RatingValues_rating on Rating {
  helpfulRating
  clarityRating
  difficultyRating
}

fragment Rating_rating on Rating {
  comment
  flagStatus
  createdByUser
  teacherNote {
    id
  }
  ...RatingHeader_rating
  ...RatingSuperHeader_rating
  ...RatingValues_rating
  ...CourseMeta_rating
  ...RatingTags_rating
  ...RatingFooter_rating
  ...ProfessorNoteSection_rating
}

fragment Rating_teacher on Teacher {
  ...RatingFooter_teacher
  ...RatingSuperHeader_teacher
  ...ProfessorNoteSection_teacher
}

fragment RatingsFilter_teacher on Teacher {
  courseCodes {
    courseCount
    courseName
  }
}

fragment RatingsList_teacher on Teacher {
  id
  legacyId
  lastName
  numRatings
  school {
    id
    legacyId
    name
    city
    state
    avgRating
    numRatings
  }
  ...Rating_teacher
  ...NoRatingsArea_teacher
  ratings(first: 5) {
    edges {
      cursor
      node {
        ...Rating_rating
        id
        __typename
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}

fragment SimilarProfessorListItem_teacher on RelatedTeacher {
  legacyId
  firstName
  lastName
  avgRating
}

fragment SimilarProfessors_teacher on Teacher {
  department
  relatedTeachers {
    legacyId
    ...SimilarProfessorListItem_teacher
    id
  }
}

fragment StickyHeaderContent_teacher on Teacher {
  ...HeaderDescription_teacher
  ...HeaderRateButton_teacher
  ...MiniStickyHeader_teacher
}

fragment TeacherBookmark_teacher on Teacher {
  id
  isSaved
}

fragment TeacherDepartment_teacher on Teacher {
  department
  departmentId
  school {
    legacyId
    name
    isVisible
    id
  }
}

fragment TeacherFeedback_teacher on Teacher {
  numRatings
  avgDifficulty
  wouldTakeAgainPercent
}

fragment TeacherInfo_teacher on Teacher {
  id
  lastName
  numRatings
  ...RatingValue_teacher
  ...NameTitle_teacher
  ...TeacherTags_teacher
  ...NameLink_teacher
  ...TeacherFeedback_teacher
  ...RateTeacherLink_teacher
  ...CompareProfessorLink_teacher
}

fragment TeacherRatingTabs_teacher on Teacher {
  numRatings
  courseCodes {
    courseName
    courseCount
  }
  ...RatingsList_teacher
  ...RatingsFilter_teacher
}

fragment TeacherTags_teacher on Teacher {
  lastName
  teacherRatingTags {
    legacyId
    tagCount
    tagName
    id
  }
}

fragment TeacherTitles_teacher on Teacher {
  department
  school {
    legacyId
    name
    id
  }
}

fragment Thumbs_rating on Rating {
  id
  comment
  adminReviewedAt
  flagStatus
  legacyId
  thumbsUpTotal
  thumbsDownTotal
  thumbs {
    computerId
    thumbsUp
    thumbsDown
    id
  }
  teacherNote {
    id
  }
}

fragment Thumbs_teacher on Teacher {
  id
  legacyId
  lockStatus
  isProfCurrentUser
}
'''

def fetch_professor_details(professor_id):
    """Fetch detailed data for a specific professor"""
    
    # Headers that match my working browser request
    headers = {
        'authority': 'www.ratemyprofessors.com',
        'accept': '*/*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-US,en;q=0.9',
        'authorization': 'null',
        'content-type': 'application/json',
        'origin': 'https://www.ratemyprofessors.com',
        'referer': 'https://www.ratemyprofessors.com/search/professors/1596?q=*&did=1',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Microsoft Edge";v="138"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
        'x-rmp-comp-id': 'DyzSUAEQZ5-20250728',
        'cookie': 'userSchoolId=U2Nob29sLTE1OTY=; userSchoolLegacyId=1596; userSchoolName=University%20of%20Oklahoma'
    }
    
    try:
        # Variables for this request
        variables = {
            "id": professor_id
        }
        
        payload = {
            'query': DETAILED_QUERY,
            'variables': variables
        }
        
        response = requests.post(GRAPHQL_URL, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            
            # Check for GraphQL errors
            if 'errors' in data:
                return None
            
            # Extract professor data
            node_data = data.get('data', {}).get('node', {})
            
            if node_data and node_data.get('__typename') == 'Teacher':
                return node_data
            else:
                return None
        else:
            return None
        
    except Exception as e:
        return None

def setup_logging():
    """Set up logging for the detailed professor fetcher"""
    # Create logs directory structure
    if not os.path.exists('logs'):
        os.makedirs('logs')
    if not os.path.exists('logs/detailed_professor_fetcher'):
        os.makedirs('logs/detailed_professor_fetcher')
    
    log_filename = f'logs/detailed_professor_fetcher/detailed_professor_fetcher_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_filename),
            logging.StreamHandler()
        ]
    )
    
    return logging.getLogger(__name__)

def fetch_top_professor_details(min_ratings=10, max_professors=None):
    """Fetch detailed data for professors with at least min_ratings ratings"""
    
    logger = setup_logging()
    
    # Load the complete professor data
    with open('data/ou_professors_complete.json', 'r') as f:
        all_professors = json.load(f)
    
    # Filter professors with minimum ratings and sort by number of ratings
    rated_professors = [p for p in all_professors if p['num_ratings'] >= min_ratings]
    top_professors = sorted(rated_professors, key=lambda x: x['num_ratings'], reverse=True)
    
    # Limit if max_professors is specified
    if max_professors:
        top_professors = top_professors[:max_professors]
    
    logger.info(f"Starting to fetch detailed data for {len(top_professors)} professors")
    logger.info(f"Minimum ratings threshold: {min_ratings}")
    logger.info(f"Total professors with {min_ratings}+ ratings: {len(rated_professors)}")
    
    detailed_data = []
    
    for i, professor in enumerate(top_professors, 1):
        logger.info(f"\n=== Processing {i}/{len(top_professors)} ===")
        logger.info(f"Professor: {professor['name']}")
        logger.info(f"Department: {professor['department']}")
        logger.info(f"Ratings: {professor['num_ratings']}")
        logger.info(f"Average Rating: {professor['rating']}/5.0")
        
        # Fetch detailed data
        detailed_prof = fetch_professor_details(professor['id'])
        
        if detailed_prof:
            # Add the basic data we already had
            detailed_prof['basic_data'] = professor
            detailed_data.append(detailed_prof)
            logger.info(f"Successfully fetched detailed data for {professor['name']}")
        else:
            logger.error(f"Failed to fetch detailed data for {professor['name']}")
        
        # Add delay to be respectful to the API
        time.sleep(1)
    
    # Save all detailed data to data folder
    if not os.path.exists('data'):
        os.makedirs('data')
    
    output_filename = f'data/professors_{min_ratings}+_ratings_detailed.json'
    with open(output_filename, 'w') as f:
        json.dump(detailed_data, f, indent=2)
    
    logger.info(f"\n=== COMPLETED ===")
    logger.info(f"Successfully fetched detailed data for {len(detailed_data)} professors")
    logger.info(f"Saved to: {output_filename}")
    
    # Create a summary
    summary = {
        'total_fetched': len(detailed_data),
        'min_ratings': min_ratings,
        'max_professors': max_professors,
        'date_fetched': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'professors': [
            {
                'name': prof['basic_data']['name'],
                'department': prof['basic_data']['department'],
                'num_ratings': prof['basic_data']['num_ratings'],
                'avg_rating': prof['basic_data']['rating'],
                'id': prof['basic_data']['id']
            }
            for prof in detailed_data
        ]
    }
    
    summary_filename = f'data/professors_{min_ratings}+_ratings_summary.json'
    with open(summary_filename, 'w') as f:
        json.dump(summary, f, indent=2)
    
    logger.info(f"Saved summary to: {summary_filename}")
    
    return detailed_data

if __name__ == "__main__":
    # Fetch ALL professors with 5+ ratings
    fetch_top_professor_details(min_ratings=5, max_professors=None) 