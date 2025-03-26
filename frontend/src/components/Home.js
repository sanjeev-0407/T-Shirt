// src/components/Home.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loading from './common/Loading';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await api.get('/products?featured=true&limit=4');
        setFeaturedProducts(response.data.products);
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <div className="jumbotron bg-light p-5 rounded mb-4">
        <h1>Welcome to T-Shirt Store</h1>
        <p className="lead">Find the perfect custom t-shirt for any occasion</p>
        <Button as={Link} to="/products" variant="primary">Shop Now</Button>
      </div>

      <h2 className="text-center mb-4">Featured Products</h2>
      <Row>
        {featuredProducts.map(product => (
          <Col key={product._id} md={3} className="mb-4">
            <Card>
              <Card.Img 
                variant="top" 
                src={product.images[0] || 'https://via.placeholder.com/150'} 
                alt={product.name}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{product.name}</Card.Title>
                <Card.Text>
                  ${product.price.toFixed(2)}
                </Card.Text>
                <Button 
                  as={Link}
                  to={`/products/${product._id}`} 
                  variant="primary"
                >
                  View Details
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Home;