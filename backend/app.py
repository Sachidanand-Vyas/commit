import os
from datetime import timedelta
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from dotenv import load_dotenv
from models import db

load_dotenv()


def create_app():
    app = Flask(
        __name__,
        static_folder='../frontend/dist',
        static_url_path=''
    )

    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///commit.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.environ.get(
        'JWT_SECRET_KEY', 'dev-secret-change-in-production'
    )
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

    # Initialize extensions
    db.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    JWTManager(app)
    Migrate(app, db)

    # Register blueprints
    from auth import auth_bp
    from habits import habits_bp
    from stats import stats_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(habits_bp, url_prefix='/api/habits')
    app.register_blueprint(stats_bp, url_prefix='/api/stats')

    # Create tables
    with app.app_context():
        db.create_all()

    # Serve React frontend
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        return send_from_directory(
            app.static_folder,
            'index.html'
        )

    return app


app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000)