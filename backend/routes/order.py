from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import token_required, admin_required
import datetime
import razorpay

bp = Blueprint('orders', __name__)

# Initialize Razorpay client lazily to avoid application context issues
razorpay_client = None

def get_razorpay_client():
    global razorpay_client
    if razorpay_client is None:
        razorpay_client = razorpay.Client(
            auth=(current_app.config['RAZORPAY_KEY_ID'], current_app.config['RAZORPAY_KEY_SECRET'])
        )
    return razorpay_client

@bp.route('/create', methods=['POST'])
@token_required
def create_order(current_user):
    data = request.get_json()
    shipping_address = data.get('shippingAddress')
    
    # Get user's cart
    cart = get_db().carts.find_one({'userId': str(current_user['_id'])})
    
    if not cart or not cart.get('items'):
        return jsonify({'message': 'Cart is empty!'}), 400
    
    # Process items and calculate total
    order_items = []
    total_amount = 0
    
    for item in cart['items']:
        product = get_db().products.find_one({'_id': ObjectId(item['productId'])})
        if not product:
            continue
        
        # Calculate price with discount
        price = product['price']
        if product.get('discount'):
            price = price - (price * product['discount'] / 100)
        
        order_items.append({
            'productId': str(product['_id']),
            'name': product['name'],
            'price': price,
            'quantity': item['quantity'],
            'size': item.get('size'),
            'color': item.get('color'),
            'image': product.get('images', [])[0] if product.get('images') else None
        })
        
        total_amount += price * item['quantity']
    
    # Create Razorpay order
    client = get_razorpay_client()
    razorpay_order = client.order.create({
        'amount': int(total_amount * 100),  # Amount in paise
        'currency': 'INR',
        'receipt': f"receipt_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
    })
    
    # Create order in database
    order = {
        'userId': str(current_user['_id']),
        'items': order_items,
        'totalAmount': total_amount,
        'shippingAddress': shipping_address,
        'paymentId': None,
        'razorpayOrderId': razorpay_order['id'],
        'status': 'created',
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    
    result = get_db().orders.insert_one(order)
    
    # Return order details and Razorpay order ID
    return jsonify({
        'orderId': str(result.inserted_id),
        'razorpayOrderId': razorpay_order['id'],
        'amount': total_amount,
        'key': current_app.config['RAZORPAY_KEY_ID']
    })

@bp.route('/verify', methods=['POST'])
@token_required
def verify_payment(current_user):
    data = request.get_json()
    
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_signature = data.get('razorpay_signature')
    
    # Verify signature
    client = get_razorpay_client()
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
    except Exception as e:
        return jsonify({'message': 'Invalid payment signature!', 'error': str(e)}), 400
    
    # Update order status
    order = get_db().orders.find_one({'razorpayOrderId': razorpay_order_id})
    
    if not order:
        return jsonify({'message': 'Order not found!'}), 404
    
    get_db().orders.update_one(
        {'_id': order['_id']},
        {
            '$set': {
                'status': 'paid',
                'paymentId': razorpay_payment_id,
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    # Clear cart
    get_db().carts.update_one(
        {'userId': str(current_user['_id'])},
        {
            '$set': {
                'items': [],
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    return jsonify({
        'message': 'Payment successful!',
        'orderId': str(order['_id'])
    })

@bp.route('', methods=['GET'])
@token_required
def get_orders(current_user):
    # Pagination
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    
    # Get user's orders
    orders = list(get_db().orders
        .find({'userId': str(current_user['_id'])})
        .sort('createdAt', -1)
        .skip(skip)
        .limit(limit))
    
    total = get_db().orders.count_documents({'userId': str(current_user['_id'])})
    
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

@bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    # Get order
    order = get_db().orders.find_one({'_id': ObjectId(order_id)})
    
    if not order:
        return jsonify({'message': 'Order not found!'}), 404
    
    # Check if order belongs to user or user is admin
    if order['userId'] != str(current_user['_id']) and current_user['role'] != 'admin':
        return jsonify({'message': 'Unauthorized!'}), 403
    
    order['_id'] = str(order['_id'])
    
    return jsonify(order)