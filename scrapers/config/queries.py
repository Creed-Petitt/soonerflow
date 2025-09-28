import os

class QueryTemplates:

    @staticmethod
    def get_professors_search_query() -> str:
        return os.getenv("PROFESSORS_SEARCH_QUERY", "")

    @staticmethod
    def get_professor_details_query(num_ratings: int = 10) -> str:
        query = os.getenv("PROFESSOR_DETAILS_QUERY", "")
        if query:
            return query.replace("{num_ratings}", str(num_ratings))
        return ""

    @staticmethod
    def get_ratings_pagination_query(num_ratings: int = 10) -> str:
        query = os.getenv("RATINGS_PAGINATION_QUERY", "")
        if query:
            return query.replace("{num_ratings}", str(num_ratings))
        return ""

    @staticmethod
    def get_search_variables(school_id: str, query_text: str = "") -> dict:
        return {
            "query": {
                "text": query_text,
                "schoolID": school_id,
                "fallback": True,
                "departmentID": None
            },
            "schoolID": school_id,
            "includeSchoolFilter": True
        }
