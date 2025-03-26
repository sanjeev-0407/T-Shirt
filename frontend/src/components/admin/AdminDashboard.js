import React, { useState, useEffect, useContext } from 'react';
import { Tab, Nav, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import UserManagement from './UserManagement';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is an admin
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>
      
      <Tab.Container id="admin-tabs" defaultActiveKey="products">
        <Nav variant="tabs" className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="products">Products</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="orders">Orders</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="users">Users</Nav.Link>
          </Nav.Item>
        </Nav>
        
        <Tab.Content>
          <Tab.Pane eventKey="products">
            <ProductManagement />
          </Tab.Pane>
          <Tab.Pane eventKey="orders">
            <OrderManagement />
          </Tab.Pane>
          <Tab.Pane eventKey="users">
            <UserManagement />
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

export default AdminDashboard;