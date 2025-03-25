from flask import Flask
from flask_cors import CORS
from routes import auth, products, cart, order, admin
from utils.db import initialize_db

app = Flask(__name__)
CORS(app)

# Load configuration
app.config.from_pyfile('config.py')

# Initialize database
initialize_db(app)

# Register blueprints
app.register_blueprint(auth.bp, url_prefix='/api/auth')
app.register_blueprint(products.bp, url_prefix='/api/products')
app.register_blueprint(cart.bp, url_prefix='/api/cart')
app.register_blueprint(order.bp, url_prefix='/api/orders')
app.register_blueprint(admin.bp, url_prefix='/api/admin')

@app.route('/')
def hello():
    return {"message": "Welcome to T-Shirt Design API"}

if __name__ == '__main__':
    app.run(debug=True)