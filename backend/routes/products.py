from flask import Blueprint, request, jsonify, current_app
from bson.objectid import ObjectId
from utils.db import get_db
from utils.auth_middleware import admin_required, token_required
import os
import json  # Add this import
from werkzeug.utils import secure_filename
import datetime

bp = Blueprint('products', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def ensure_upload_directory():
    """Ensure the uploads directory exists"""
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
    return upload_dir

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
    try:
        if request.content_type == 'application/json':
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Parse variants from string if present
            if 'variants' in data:
                try:
                    data['variants'] = eval(data['variants'])
                except:
                    data['variants'] = []

        # Validate required fields
        required_fields = ['name', 'description', 'price']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'Missing required field: {field}'}), 400

        product = {
            'name': data['name'],
            'description': data['description'],
            'price': float(data['price']),
            'discount': float(data.get('discount', 0)),
            'category': data.get('category', ''),
            'variants': data.get('variants', []),
            'featured': data.get('featured', False),
            'images': [],
            'createdAt': datetime.datetime.utcnow(),
            'updatedAt': datetime.datetime.utcnow()
        }

        # Handle image uploads
        if request.files and 'images' in request.files:
            files = request.files.getlist('images')
            upload_dir = ensure_upload_directory()
            
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    file.save(file_path)
                    product['images'].append(f"/uploads/{unique_filename}")

        result = get_db().products.insert_one(product)
        
        return jsonify({
            'message': 'Product created successfully!',
            'product_id': str(result.inserted_id),
            'product': {**product, '_id': str(result.inserted_id)}
        }), 201

    except Exception as e:
        print(f"Error creating product: {str(e)}")
        return jsonify({'message': 'Failed to create product', 'error': str(e)}), 400

@bp.route('/<product_id>', methods=['PUT'])
@admin_required
def update_product(current_user, product_id):
    try:
        # Get existing product
        existing_product = get_db().products.find_one({'_id': ObjectId(product_id)})
        if not existing_product:
            return jsonify({'message': 'Product not found!'}), 404

        # Get form data or JSON data
        if request.content_type == 'application/json':
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Parse variants from string if present
            if 'variants' in data:
                try:
                    data['variants'] = json.loads(data.get('variants', '[]'))
                except json.JSONDecodeError:
                    data['variants'] = []

        # Update product data
        product = {
            'name': data.get('name', existing_product['name']),
            'description': data.get('description', existing_product['description']),
            'price': float(data.get('price', existing_product['price'])),
            'discount': float(data.get('discount', existing_product.get('discount', 0))),
            'category': data.get('category', existing_product.get('category', '')),
            'featured': str(data.get('featured', existing_product.get('featured', False))).lower() == 'true',
            'variants': data.get('variants', existing_product.get('variants', [])),
            'images': existing_product.get('images', []),
            'updatedAt': datetime.datetime.utcnow()
        }

        # Handle image uploads
        if request.files and 'images' in request.files:
            files = request.files.getlist('images')
            replace_images = str(data.get('replace_images', '')).lower() == 'true'
            
            # Clear existing images if replace_images is true
            if replace_images:
                product['images'] = []
            
            # Process new images
            upload_dir = ensure_upload_directory()
            for file in files:
                if file and allowed_file(file.filename):
                    filename = secure_filename(file.filename)
                    unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                    file_path = os.path.join(upload_dir, unique_filename)
                    file.save(file_path)
                    product['images'].append(f"/uploads/{unique_filename}")

        # Update the product
        result = get_db().products.update_one(
            {'_id': ObjectId(product_id)},
            {'$set': product}
        )

        return jsonify({
            'message': 'Product updated successfully!',
            'product': {**product, '_id': str(product_id)}
        })

    except Exception as e:
        print(f"Error updating product: {str(e)}")
        return jsonify({'message': 'Failed to update product', 'error': str(e)}), 400

@bp.route('/<product_id>', methods=['DELETE'])
@admin_required
def delete_product(current_user, product_id):
    result = get_db().products.delete_one({'_id': ObjectId(product_id)})
    
    if result.deleted_count == 0:
        return jsonify({'message': 'Product not found!'}), 404
    
    return jsonify({'message': 'Product deleted successfully!'})

@bp.route('/<product_id>/images', methods=['POST'])
@admin_required
def upload_product_images(current_user, product_id):
    """Upload images for a product"""
    if 'images' not in request.files:
        return jsonify({'message': 'No images provided'}), 400

    product = get_db().products.find_one({'_id': ObjectId(product_id)})
    if not product:
        return jsonify({'message': 'Product not found'}), 404

    uploaded_images = []
    files = request.files.getlist('images')
    upload_dir = ensure_upload_directory()

    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            unique_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
            file_path = os.path.join(upload_dir, unique_filename)
            file.save(file_path)
            uploaded_images.append(f"/uploads/{unique_filename}")

    # Update product with new images
    get_db().products.update_one(
        {'_id': ObjectId(product_id)},
        {'$push': {'images': {'$each': uploaded_images}}}
    )

    return jsonify({
        'message': 'Images uploaded successfully',
        'images': uploaded_images
    })