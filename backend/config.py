import os
from decouple import config

# Flask settings
SECRET_KEY = config('SECRET_KEY', default='your-secret-key')
DEBUG = config('DEBUG', default=True, cast=bool)

# MongoDB settings
MONGO_URI = config('MONGO_URI', default='mongodb://localhost:27017/tshirt_store')

# JWT settings
JWT_SECRET_KEY = config('JWT_SECRET_KEY', default='jwt-secret-key')
JWT_ACCESS_TOKEN_EXPIRES = 3600 * 24  # 24 hours

# Razorpay settings
RAZORPAY_KEY_ID = config('RAZORPAY_KEY_ID', default='your-razorpay-key-id')
RAZORPAY_KEY_SECRET = config('RAZORPAY_KEY_SECRET', default='your-razorpay-key-secret')

# Upload folder
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload