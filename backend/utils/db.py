from pymongo import MongoClient
from flask import g, current_app

def get_db():
    """Get database connection"""
    if 'db' not in g:
        g.client = MongoClient(current_app.config['MONGO_URI'])
        g.db = g.client.get_default_database()
    return g.db

def close_db(e=None):
    """Close database connection"""
    client = g.pop('client', None)
    if client is not None:
        client.close()

def initialize_db(app):
    """Initialize database connection"""
    app.teardown_appcontext(close_db)
    return app