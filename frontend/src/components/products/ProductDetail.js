import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Button, Image, Form, Alert } from 'react-bootstrap';
import api from '../../services/api';
import Loading from '../common/Loading';
import { AuthContext } from '../../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
        
        // Set default selected size and color if available
        if (response.data.variants && response.data.variants.length > 0) {
          if (response.data.variants[0].sizes && response.data.variants[0].sizes.length > 0) {
            setSelectedSize(response.data.variants[0].sizes[0]);
          }
          if (response.data.variants[0].colors && response.data.variants[0].colors.length > 0) {
            setSelectedColor(response.data.variants[0].colors[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);
  
  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    try {
      setAddingToCart(true);
      await api.post('/cart', {
        productId: product._id,
        quantity,
        size: selectedSize,
        color: selectedColor
      });
      
      setMessage('Product added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      setError('Failed to add product to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };
  
  if (loading) return <Loading />;
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }
  
  if (!product) {
    return <Alert variant="warning">Product not found</Alert>;
  }
  
  return (
    <div>
      <Row>
        <Col md={6}>
          <Image 
            src={product.images[0] || 'https://via.placeholder.com/400x400'} 
            alt={product.name} 
            fluid 
          />
          <Row className="mt-3">
            {product.images.slice(1).map((image, index) => (
              <Col key={index} xs={4} className="mb-3">
                <Image 
                  src={image} 
                  alt={`${product.name} view ${index + 2}`} 
                  thumbnail 
                />
              </Col>
            ))}
          </Row>
        </Col>
        <Col md={6}>
          <h2>{product.name}</h2>
          
          <h4 className="mt-3">
            ${product.price.toFixed(2)}
            {product.discount > 0 && (
              <>
                <span className="text-muted text-decoration-line-through ms-2">
                  ${(product.price / (1 - product.discount / 100)).toFixed(2)}
                </span>
                <span className="text-danger ms-2">
                  ({product.discount}% OFF)
                </span>
              </>
            )}
          </h4>
          
          <p className="mt-3">{product.description}</p>
          
          {product.variants && product.variants.length > 0 && (
            <>
              {product.variants[0].sizes && product.variants[0].sizes.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Size</Form.Label>
                  <Form.Select 
                    value={selectedSize} 
                    onChange={e => setSelectedSize(e.target.value)}
                  >
                    {product.variants[0].sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
              
              {product.variants[0].colors && product.variants[0].colors.length > 0 && (
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <Form.Select 
                    value={selectedColor} 
                    onChange={e => setSelectedColor(e.target.value)}
                  >
                    {product.variants[0].colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}
            </>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Quantity</Form.Label>
            <Form.Control 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={e => setQuantity(parseInt(e.target.value))}
            />
          </Form.Group>
          
          {message && (
            <Alert variant="success" className="mt-3">
              {message}
            </Alert>
          )}
          
          <div className="d-grid gap-2">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ProductDetail;