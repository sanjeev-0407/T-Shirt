import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Alert, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../common/Loading';
import { AuthContext } from '../../context/AuthContext';

const Cart = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  });
  const [creatingOrder, setCreatingOrder] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchCart();
  }, [user, navigate]);
  
  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      setError('Failed to load cart. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const updateQuantity = async (productId, size, color, quantity) => {
    try {
      setUpdating(true);
      await api.put('/cart/update', {
        productId,
        size,
        color,
        quantity
      });
      await fetchCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      setError('Failed to update cart. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const removeItem = async (productId, size, color) => {
    try {
      setUpdating(true);
      await api.delete('/cart/remove', {
        data: {
          productId,
          size,
          color
        }
      });
      await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
      setError('Failed to remove item. Please try again.');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleCheckout = async () => {
    try {
      setCreatingOrder(true);
      const response = await api.post('/orders/create', {
        shippingAddress
      });
      
      // Redirect to payment or order confirmation page
      navigate(`/checkout/payment?orderId=${response.data.orderId}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please try again.');
    } finally {
      setCreatingOrder(false);
    }
  };
  
  if (loading) return <Loading />;
  
  if (!cart.items.length) {
    return (
      <div>
        <h1>Your Cart</h1>
        <Alert variant="info">
          Your cart is empty. <Link to="/products">Continue shopping</Link>
        </Alert>
      </div>
    );
  }
  
  return (
    <div>
      <h1>Your Cart</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Table responsive>
        <thead>
          <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Size</th>
            <th>Color</th>
            <th>Quantity</th>
            <th>Subtotal</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {cart.items.map((item, index) => (
            <tr key={index}>
              <td>
                <div className="d-flex align-items-center">
                  {item.image && (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      style={{ width: '50px', marginRight: '10px' }} 
                    />
                  )}
                  {item.name}
                </div>
              </td>
              <td>${(item.price || 0).toFixed(2)}</td>
              <td>{item.size || 'N/A'}</td>
              <td>{item.color || 'N/A'}</td>
              <td>
                <Form.Control 
                  type="number" 
                  min="1" 
                  style={{ width: '80px' }}
                  value={item.quantity || 1} 
                  onChange={(e) => updateQuantity(
                    item.productId, 
                    item.size, 
                    item.color, 
                    parseInt(e.target.value)
                  )}
                  disabled={updating}
                />
              </td>
              <td>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
              <td>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => removeItem(item.productId, item.size, item.color)}
                  disabled={updating}
                >
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="5" className="text-end"><strong>Total:</strong></td>
            <td colSpan="2"><strong>${(cart.total || 0).toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </Table>
      
      <h3 className="mt-4">Shipping Information</h3>
      <Form className="mb-4">
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control 
                type="text" 
                value={shippingAddress.name}
                onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control 
                type="text" 
                value={shippingAddress.street}
                onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control 
                type="text" 
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>State/Province</Form.Label>
              <Form.Control 
                type="text" 
                value={shippingAddress.state}
                onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Postal Code</Form.Label>
              <Form.Control 
                type="text" 
                value={shippingAddress.postalCode}
                onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
        </Row>
        
        <Form.Group className="mb-3">
          <Form.Label>Country</Form.Label>
          <Form.Control 
            type="text" 
            value={shippingAddress.country}
            onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
            required
          />
        </Form.Group>
      </Form>
      
      <div className="d-flex justify-content-between">
        <Button as={Link} to="/products" variant="secondary">
          Continue Shopping
        </Button>
        <Button 
          variant="primary" 
          onClick={handleCheckout}
          disabled={creatingOrder || 
            !shippingAddress.name || 
            !shippingAddress.street || 
            !shippingAddress.city || 
            !shippingAddress.state || 
            !shippingAddress.postalCode ||
            !shippingAddress.country}
        >
          {creatingOrder ? 'Processing...' : 'Proceed to Checkout'}
        </Button>
      </div>
    </div>
  );
};

export default Cart;