import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import api from '../../services/api';
import Loading from '../common/Loading';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = { 
        page: currentPage, 
        limit: 10 
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await api.get('/admin/orders', { params });
      
      setOrders(response.data.orders);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      
      // Update the order in the current list
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading && currentPage === 1 && !statusFilter) return <Loading />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <Form.Select 
          style={{ width: '200px' }}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Orders</option>
          <option value="created">Created</option>
          <option value="paid">Paid</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <Alert variant="info">No orders found.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{order._id.substring(order._id.length - 8)}</td>
                  <td>{order.userId}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>${order.totalAmount.toFixed(2)}</td>
                  <td>{getStatusBadge(order.status)}</td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleViewDetails(order)}
                    >
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center mt-4">
            <Button 
              variant="outline-primary" 
              className="mx-1"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
              Previous
            </Button>
            
            <span className="mx-3 align-self-center">
              Page {currentPage} of {totalPages}
            </span>
            
            <Button 
              variant="outline-primary" 
              className="mx-1"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
              Next
            </Button>
          </div>
        </>
      )}

      {/* Order Details Modal */}
      <Modal 
        show={showDetailsModal} 
        onHide={() => setShowDetailsModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Order Details - #{selectedOrder?._id.substring(selectedOrder?._id.length - 8)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <div className="d-flex justify-content-between mb-3">
                <div>
                  <p><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Customer ID:</strong> {selectedOrder.userId}</p>
                </div>
                <div>
                  <p><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                  <p><strong>Total Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>

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
                  {selectedOrder.items.map((item, index) => (
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
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td><strong>${selectedOrder.totalAmount.toFixed(2)}</strong></td>
                  </tr>
                </tfoot>
              </Table>

              {selectedOrder.shippingAddress && (
                <div className="mt-3">
                  <h5>Shipping Address</h5>
                  <p>
                    {selectedOrder.shippingAddress.name}<br />
                    {selectedOrder.shippingAddress.street}<br />
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}<br />
                    {selectedOrder.shippingAddress.country}
                  </p>
                </div>
              )}

              <h5 className="mt-3">Update Status</h5>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  disabled={selectedOrder.status === 'created' || updatingStatus}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'created')}
                >
                  Created
                </Button>
                <Button 
                  variant="outline-success" 
                  disabled={selectedOrder.status === 'paid' || updatingStatus}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'paid')}
                >
                  Paid
                </Button>
                <Button 
                  variant="outline-primary" 
                  disabled={selectedOrder.status === 'shipped' || updatingStatus}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'shipped')}
                >
                  Shipped
                </Button>
                <Button 
                  variant="outline-info" 
                  disabled={selectedOrder.status === 'delivered' || updatingStatus}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered')}
                >
                  Delivered
                </Button>
                <Button 
                  variant="outline-danger" 
                  disabled={selectedOrder.status === 'cancelled' || updatingStatus}
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'cancelled')}
                >
                  Cancelled
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderManagement;