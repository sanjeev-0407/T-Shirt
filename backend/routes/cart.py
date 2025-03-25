from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import token_required
import datetime

bp = Blueprint('cart', __name__)

@bp.route('', methods=['GET'])
@token_required
def get_cart(current_user):
    cart = get_db().carts.find_one({'userId': str(current_user['_id'])})
    
    if not cart:
        return jsonify({'items': [], 'total': 0})
    
    cart['_id'] = str(cart['_id'])
    
    # Calculate total
    total = 0
    for item in cart.get('items', []):
        product = get_db().products.find_one({'_id': ObjectId(item['productId'])})
        if product:
            # Apply discount if available
            price = product['price']
            if product.get('discount'):
                price = price - (price * product['discount'] / 100)
            total += price * item['quantity']
    
    cart['total'] = total
    
    return jsonify(cart)

@bp.route('', methods=['POST'])  # Instead of '/add'
@token_required
def add_to_cart(current_user):
    data = request.get_json()
    
    product_id = data.get('productId')
    quantity = int(data.get('quantity', 1))
    size = data.get('size')
    color = data.get('color')
    
    # Validate product
    product = get_db().products.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
    
    # Check if user has a cart
    cart = get_db().carts.find_one({'userId': str(current_user['_id'])})
    
    if not cart:
        # Create new cart
        cart = {
            'userId': str(current_user['_id']),
            'items': [{
                'productId': product_id,
                'quantity': quantity,
                'size': size,
                'color': color
            }],
            'createdAt': datetime.datetime.utcnow(),
            'updatedAt': datetime.datetime.utcnow()
        }
        get_db().carts.insert_one(cart)
    else:
        # Check if product already in cart
        item_exists = False
        for item in cart.get('items', []):
            if (item['productId'] == product_id and 
                item.get('size') == size and 
                item.get('color') == color):
                item['quantity'] += quantity
                item_exists = True
                break
        
        if not item_exists:
            if 'items' not in cart:
                cart['items'] = []
            cart['items'].append({
                'productId': product_id,
                'quantity': quantity,
                'size': size,
                'color': color
            })
        
        # Update cart
        get_db().carts.update_one(
            {'_id': cart['_id']},
            {
                '$set': {
                    'items': cart['items'],
                    'updatedAt': datetime.datetime.utcnow()
                }
            }
        )
    
    return jsonify({'message': 'Product added to cart!'})

@bp.route('/update', methods=['PUT'])
@token_required
def update_cart(current_user):
    data = request.get_json()
    
    product_id = data.get('productId')
    quantity = int(data.get('quantity', 1))
    size = data.get('size')
    color = data.get('color')
    
    # Get cart
    cart = get_db().carts.find_one({'userId': str(current_user['_id'])})
    
    if not cart:
        return jsonify({'message': 'Cart not found!'}), 404
    
    # Update or remove item
    updated_items = []
    for item in cart.get('items', []):
        if (item['productId'] == product_id and 
            item.get('size') == size and 
            item.get('color') == color):
            if quantity > 0:
                item['quantity'] = quantity
                updated_items.append(item)
        else:
            updated_items.append(item)
    
    # Update cart
    get_db().carts.update_one(
        {'_id': cart['_id']},
        {
            '$set': {
                'items': updated_items,
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    return jsonify({'message': 'Cart updated!'})

@bp.route('/remove', methods=['DELETE'])
@token_required
def remove_from_cart(current_user):
    data = request.get_json()
    
    product_id = data.get('productId')
    size = data.get('size')
    color = data.get('color')
    
    # Get cart
    cart = get_db().carts.find_one({'userId': str(current_user['_id'])})
    
    if not cart:
        return jsonify({'message': 'Cart not found!'}), 404
    
    # Remove item
    updated_items = [item for item in cart.get('items', []) 
                    if not (item['productId'] == product_id and 
                            item.get('size') == size and 
                            item.get('color') == color)]
    
    # Update cart
    get_db().carts.update_one(
        {'_id': cart['_id']},
        {
            '$set': {
                'items': updated_items,
                'updatedAt': datetime.datetime.utcnow()
            }
        }
    )
    
    return jsonify({'message': 'Item removed from cart!'})

@bp.route('/clear', methods=['DELETE'])
@token_required
def clear_cart(current_user):
    # Clear the cart
    get_db().carts.update_one(
        {'userId': str(current_user['_id'])},
        {
            '$set': {
                'items': [],
                'updatedAt': datetime.datetime.utcnow()
            }
        },
        upsert=True
    )
    
    return jsonify({'message': 'Cart cleared!'})