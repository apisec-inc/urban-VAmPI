import os
from config import vuln_app
from waitress import serve

# Production configuration  
vuln = int(os.getenv('vulnerable', 0))
alive = int(os.getenv('tokentimetolive', 60))
port = int(os.environ.get('PORT', 5050))

# Disable debug in production - ACCESS FLASK APP VIA .app
vuln_app.app.config['DEBUG'] = False
vuln_app.app.config['ENV'] = 'production'

# Additional production hardening
vuln_app.app.config['TESTING'] = False
vuln_app.app.config['PROPAGATE_EXCEPTIONS'] = False

if __name__ == '__main__':
    print(f"🚀 Starting VAmPI in PRODUCTION mode on port {port}")
    print(f"🔒 Vulnerable mode: {'ENABLED' if vuln else 'DISABLED'}")
    print(f"⚡ Using Waitress WSGI server (production-ready)")
    print(f"🛡️  Debug mode: {vuln_app.app.config['DEBUG']}")
    serve(vuln_app, host='0.0.0.0', port=port)
