from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import admin_required, token_required
import os
from werkzeug.utils import secure_filename
import datetime

bp = Blueprint('products', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

@bp.route('', methods=['GET'])
def get_products():
    """Get all products with optional filtering"""
    query = {}
    
    # Filter by category
    category = request.args.get('category')
    if category:
        query['category'] = category
    
    # Filter by price range
    min_price = request.args.get('min_price')
    max_price = request.args.get('max_price')
    if min_price or max_price:
        query['price'] = {}
        if min_price:
            query['price']['$gte'] = float(min_price)
        if max_price:
            query['price']['$lte'] = float(max_price)
    
    # Search by name
    search = request.args.get('search')
    if search:
        query['name'] = {'$regex': search, '$options': 'i'}
    
    # Pagination
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    skip = (page - 1) * limit
    
    # Get products
    products = list(get_db().products.find(query).skip(skip).limit(limit))
    total = get_db().products.count_documents(query)
    
    # Convert ObjectId to string
    for product in products:
        product['_id'] = str(product['_id'])
    
    return jsonify({
        'products': products,
        'total': total,
        'page': page,
        'limit': limit,
        'pages': (total + limit - 1) // limit
    })

@bp.route('/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a product by ID"""
    product = get_db().products.find_one({'_id': ObjectId(product_id)})
    
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
    
    product['_id'] = str(product['_id'])
    
    return jsonify(product)

@bp.route('', methods=['POST'])
@admin_required
def create_product(current_user):
    print("Form Data:", request.form)
    print("JSON Data:", request.get_json())
    print("Content Type:", request.content_type)
    print("Files:", request.files)
    
    # Use request.get_json() instead of request.form.to_dict()
    if request.content_type == 'application/json':
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    product = {
        'name': data.get('name'),
        'description': data.get('description'),
        'price': float(data.get('price', 0)),
        'discount': float(data.get('discount', 0)),
        'category': data.get('category'),
        'variants': eval(data.get('variants', '[]')) if isinstance(data.get('variants'), str) else data.get('variants', []),
        'featured': data.get('featured', 'false').lower() == 'true' if isinstance(data.get('featured'), str) else data.get('featured', False),
        'images': [],
        'createdAt': datetime.datetime.utcnow(),
        'updatedAt': datetime.datetime.utcnow()
    }
    
    # Handle image uploads (when form-data is used)
    if 'images' in request.files:
        files = request.files.getlist('images')
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Generate unique filename
                unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                product['images'].append(f"/uploads/{unique_filename}")
    
    result = get_db().products.insert_one(product)
    
    return jsonify({
        'message': 'Product created successfully!',
        'product_id': str(result.inserted_id)
    }), 201

@bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    data = request.form.to_dict()
    
    # Get existing product
    existing_product = get_db().products.find_one({'_id': ObjectId(product_id)})
    
    if not existing_product:
        return jsonify({'message': 'Product not found!'}), 404
    
    # Update product data
    product = {
        'name': data.get('name', existing_product['name']),
        'description': data.get('description', existing_product['description']),
        'price': float(data.get('price', existing_product['price'])),
        'discount': float(data.get('discount', existing_product['discount'])),
        'category': data.get('category', existing_product['category']),
        'variants': eval(data.get('variants', str(existing_product.get('variants', [])))),
        'featured': data.get('featured', str(existing_product['featured'])).lower() == 'true',
        'images': existing_product.get('images', []),
        'updatedAt': datetime.datetime.utcnow()
    }
    
    # Handle image uploads
    if 'images' in request.files:
        files = request.files.getlist('images')
        
        # Remove old images if replace_images is true
        if data.get('replace_images', 'false').lower() == 'true':
            product['images'] = []
        
        for file in files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Generate unique filename
                unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
                file.save(file_path)
                product['images'].append(f"/uploads/{unique_filename}")
    
    get_db().products.update_one(
        {'_id': ObjectId(product_id)},
        {'$set': product}
    )
    
    return jsonify({'message': 'Product updated successfully!'})

@bp.route('/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, product_id):
    result = get_db().products.delete_one({'_id': ObjectId(product_id)})
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Product not found!'}), 404
    
    return jsonify({'message': 'Product deleted successfully!'})