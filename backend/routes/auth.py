from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import token_required

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if user already exists
    if get_db().users.find_one({'email': data['email']}):
        return jsonify({'message': 'User already exists!'}), 409
    
    # Hash the password
    hashed_password = generate_password_hash(data['password'])
    
    # Create new user
    user = {
        'username': data['username'],
        'email': data['email'],
        'password': hashed_password,
        'role': 'user',  # Default role
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    
    result = get_db().users.insert_one(user)
    
    return jsonify({'message': 'User created successfully!', 'user_id': str(result.inserted_id)}), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = get_db().users.find_one({'email': data['email']})
    
    if not user or not check_password_hash(user['password'], data['password']):
        return jsonify({'message': 'Invalid credentials!'}), 401
    
    # Generate token
    token = jwt.encode({
        'user_id': str(user['_id']),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, current_app.config['JWT_SECRET_KEY'])
    
    return jsonify({
        'message': 'Login successful!',
        'token': token,
        'user': {
            'id': str(user['_id']),
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    })

@bp.route('/profile', methods=['GET'])
@token_required
def profile(current_user):
    return jsonify({
        'id': str(current_user['_id']),
        'username': current_user['username'],
        'email': current_user['email'],
        'role': current_user['role']
    })