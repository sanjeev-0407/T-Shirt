import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Loading from '../common/Loading';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const defaultProductImage = '/static/images/placeholder.jpg';  // Update this path based on your static files setup

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: {
          page: currentPage,
          limit: 8,
          search: searchTerm || undefined
        }
      });
      
      setProducts(response.data.products);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };
  
  if (loading && currentPage === 1) return <Loading />;
  
  return (
    <div>
      <h1 className="mb-4">Products</h1>
      
      <Form onSubmit={handleSearch} className="mb-4">
        <InputGroup>
          <Form.Control
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" variant="primary">Search</Button>
        </InputGroup>
      </Form>
      
      {error && <p className="text-danger">{error}</p>}
      
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <>
          <Row>
            {products.map(product => (
              <Col key={product._id} md={3} className="mb-4">
                <Card>
                  <Card.Img 
                    variant="top" 
                    src={product.images?.[0] || defaultProductImage} 
                    alt={product.name}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;  // Prevent infinite loop
                      e.target.src = defaultProductImage;
                    }}
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
    </div>
  );
};

export default ProductList;