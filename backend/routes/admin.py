from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import admin_required
import datetime

bp = Blueprint('admin', __name__)

@bp.route('/orders', methods=['GET'])
@admin_required
def admin_get_orders(current_user):
    # Pagination
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    
    # Filter by status
    status = request.args.get('status')
    query = {}
    if status:
        query['status'] = status
    
    # Get all orders
    orders = list(get_db().orders
        .find(query)
        .sort('createdAt', -1)
        .skip(skip)
        .limit(limit))
    
    total = get_db().orders.count_documents(query)
    
    # Convert ObjectId to string
    for order in orders:
        order['_id'] = str(order['_id'])
    
    return jsonify({
        'orders': orders,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    })

@bp.route('/orders/<order_id>/status', methods=['PUT'])
@admin_required
def update_order_status(current_user, order_id):
    data = request.get_json()
    status = data.get('status')
    
    if not status:
        return jsonify({'message': 'Status is required!'}), 400
    
    # Update order status
    result = get_db().orders.update_one(
        {'_id': ObjectId(order_id)},
        {
            '$set': {
                'status': status,
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        return jsonify({'message': 'Order not found!'}), 404
    
    return jsonify({'message': 'Order status updated!'})

@bp.route('/users', methods=['GET'])
@admin_required
def admin_get_users(current_user):
    # Pagination
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    
    # Get all users
    users = list(get_db().users
        .find({}, {'password': 0})  # Exclude password
        .skip(skip)
        .limit(limit))
    
    total = get_db().users.count_documents({})
    
    # Convert ObjectId to string
    for user in users:
        user['_id'] = str(user['_id'])
    
    return jsonify({
        'users': users,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    })

@bp.route('/users/<user_id>/role', methods=['PUT'])
@admin_required
def update_user_role(current_user, user_id):
    data = request.get_json()
    role = data.get('role')
    
    if not role or role not in ['user', 'admin']:
        return jsonify({'message': 'Invalid role!'}), 400
    
    # Update user role
    result = get_db().users.update_one(
        {'_id': ObjectId(user_id)},
        {
            '$set': {
                'role': role,
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        return jsonify({'message': 'User not found!'}), 404
    
    return jsonify({'message': 'User role updated!'})

@bp.route('/dashboard', methods=['GET'])
@admin_required
def admin_dashboard(current_user):
    # Get basic stats
    total_products = get_db().products.count_documents({})
    total_users = get_db().users.count_documents({})
    total_orders = get_db().orders.count_documents({})
    
    # Get revenue stats
    paid_orders = list(get_db().orders.find({'status': 'paid'}))
    total_revenue = sum(order.get('totalAmount', 0) for order in paid_orders)
    
    # Get recent orders
    recent_orders = list(get_db().orders
        .find({})
        .sort('createdAt', -1)
        .limit(5))
    
    # Convert ObjectId to string
    for order in recent_orders:
        order['_id'] = str(order['_id'])
    
    # Get order status distribution
    status_counts = {}
    for status in ['created', 'paid', 'shipped', 'delivered', 'cancelled']:
        status_counts[status] = get_db().orders.count_documents({'status': status})
    
    return jsonify({
        'totalProducts': total_products,
        'totalUsers': total_users,
        'totalOrders': total_orders,
        'totalRevenue': total_revenue,
        'recentOrders': recentOrders,
        'orderStatusCounts': status_counts
    })