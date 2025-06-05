from flask import Response

from models.user_model import *
from app import vuln

def populate_db():
    db.drop_all()
    db.create_all()
    User.init_db_users()
    response_text = '{ "message": "Database populated." }'
    response = Response(response_text, 200, mimetype='application/json')
    return response

def basic():
    response_text = '{ "message": "VAmPI the Vulnerable API", "help": "VAmPI is a vulnerable on purpose API. It was ' \
                    'created in order to evaluate the efficiency of third party tools in identifying vulnerabilities ' \
                    'in APIs but it can also be used in learning/teaching purposes.", "vulnerable":' + "{}".format(vuln) + "}"
    response = Response(response_text, 200, mimetype='application/json')
    return response

def deployment_test():
    """Test endpoint to verify auto-deployment functionality"""
    import os
    import datetime
    
    response_data = {
        'message': 'VAmPI Auto-Deploy Test - Sprint 9.1',
        'timestamp': datetime.datetime.now().isoformat(),
        'environment': os.getenv('RAILWAY_ENVIRONMENT', 'local'),
        'git_branch': 'develop',
        'deployment_status': 'SUCCESS'
    }
    
    response = Response(
        response=str(response_data).replace("'", '"'),
        status=200,
        mimetype='application/json'
    )
    return response
