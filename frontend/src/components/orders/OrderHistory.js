import React, { useState, useEffect, useContext } from 'react';
import { Table, Badge, Button, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../common/Loading';
import { AuthContext } from '../../context/AuthContext';

const OrderHistory = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
  }, [user, navigate]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load order history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'created':
        return <Badge bg="secondary">Created</Badge>;
      case 'paid':
        return <Badge bg="success">Paid</Badge>;
      case 'shipped':
        return <Badge bg="primary">Shipped</Badge>;
      case 'delivered':
        return <Badge bg="info">Delivered</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  if (loading) return <Loading />;
  
  if (error) return <div className="alert alert-danger">{error}</div>;
  
  return (
    <div>
      <h1>Order History</h1>
      
      {orders.length === 0 ? (
        <p>You have no orders yet.</p>
      ) : (
        <Accordion defaultActiveKey="0">
          {orders.map((order, index) => (
            <Accordion.Item key={order._id} eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <span>Order #{order._id.substring(order._id.length - 8)}</span>
                  <span className="me-3">{formatDate(order.createdAt)}</span>
                  <span className="me-3">${order.totalAmount.toFixed(2)}</span>
                  <span>{getStatusBadge(order.status)}</span>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <h5>Items</h5>
                <Table responsive>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, itemIndex) => (
                      <tr key={itemIndex}>
                        <td>
                          <div className="d-flex align-items-center">
                            {item.image && (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                style={{ width: '50px', marginRight: '10px' }} 
                              />
                            )}
                            <div>
                              <div>{item.name}</div>
                              <small>
                                {item.size && `Size: ${item.size}`}
                                {item.color && `, Color: ${item.color}`}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>${item.price.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                      <td><strong>${order.totalAmount.toFixed(2)}</strong></td>
                    </tr>
                  </tbody>
                </Table>
                
                {order.shippingAddress && (
                  <div>
                    <h5>Shipping Address</h5>
                    <p>
                      {order.shippingAddress.name}<br />
                      {order.shippingAddress.street}<br />
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                      {order.shippingAddress.country}
                    </p>
                  </div>
                )}
                
                {order.status === 'created' && (
                  <Button variant="primary">Complete Payment</Button>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default OrderHistory;