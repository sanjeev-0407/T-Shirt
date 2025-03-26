// src/components/common/Footer.js
import React from 'react';
import { Container } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-auto">
      <Container>
        <div className="row">
          <div className="col-md-6">
            <h5>T-Shirt Store</h5>
            <p>Your one-stop shop for custom t-shirts</p>
          </div>
          <div className="col-md-3">
            <h5>Links</h5>
            <ul className="list-unstyled">
              <li><a href="/" className="text-white">Home</a></li>
              <li><a href="/products" className="text-white">Products</a></li>
              <li><a href="/cart" className="text-white">Cart</a></li>
            </ul>
          </div>
          <div className="col-md-3">
            <h5>Contact</h5>
            <address className="mb-0">
              <p>Email: contact@tshirtstore.com</p>
              <p>Phone: (123) 456-7890</p>
            </address>
          </div>
        </div>
        <div className="text-center mt-3">
          <p>&copy; {new Date().getFullYear()} T-Shirt Store. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;