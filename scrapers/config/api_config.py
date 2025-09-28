import os
from typing import Dict, Any

class APIConfig:

    @staticmethod
    def get_browser_headers() -> Dict[str, str]:
        return {
            'Content-Type': 'application/json',
            'User-Agent': os.getenv("BROWSER_USER_AGENT", "Academic-Bot/1.0"),
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
        }

    @staticmethod
    def get_form_headers() -> Dict[str, str]:
        return {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': os.getenv("FORM_USER_AGENT", "Academic-Bot/1.0")
        }

    @staticmethod
    def get_pagination_params(start: int = 0, length: int = 1000) -> Dict[str, Any]:
        base_params = {
            'sEcho': 1,
            'iColumns': 18,
            'sColumns': '',
            'iDisplayStart': start,
            'iDisplayLength': length,
            'sSearch': '',
            'bRegex': False,
            'iSortingCols': 0
        }

        # Add column properties
        for i in range(18):
            base_params.update({
                f'mDataProp_{i}': i,
                f'sSearch_{i}': '',
                f'bRegex_{i}': False,
                f'bSearchable_{i}': True,
                f'bSortable_{i}': True
            })

        return base_params

    @staticmethod
    def get_search_params(semester: str = '202510') -> Dict[str, Any]:
        return {
            'semester': semester,
            'subject_code': '',
            'subject': 'all',
            'schedule': 'all',
            'delivery': 'all',
            'gened': '',
            'term': 'all',
            'available': True,
            'waitlist': True,
        }

class EndpointConfig:
    CLASSNAV_API = os.getenv("CLASSNAV_API_URL")
    RATING_API = os.getenv("RATING_API_URL")
    SCHOOL_ID = os.getenv("SCHOOL_ID")