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
    
    # Initialize database tables and populate with default data
    print("🗄️  Initializing database...")
    with vuln_app.app.app_context():
        from config import db
        from models.user_model import User
        
        # Create all tables
        db.create_all()
        print("✅ Database tables created")
        
        # Populate with initial data if empty
        if not User.query.first():
            User.init_db_users()
            print("✅ Database populated with initial user data")
        else:
            print("ℹ️  Database already contains data, skipping initialization")
    
    print("🌐 Starting server...")
    serve(vuln_app, host='0.0.0.0', port=port)
