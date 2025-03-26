import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Modal, Alert, Row, Col } from 'react-bootstrap';
import api from '../../services/api';
import Loading from '../common/Loading';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount: '0',
    category: '',
    featured: false,
    variants: [{ sizes: [], colors: [] }],
    images: []
  });
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products', {
        params: { page: currentPage, limit: 10 }
      });
      
      setProducts(response.data.products);
      setTotalPages(response.data.pages || 1);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleVariantChange = (index, field, value) => {
    const updatedVariants = [...formData.variants];
    if (!updatedVariants[index]) {
      updatedVariants[index] = { sizes: [], colors: [] };
    }
    updatedVariants[index][field] = value.split(',').map(item => item.trim()).filter(item => item !== '');
    setFormData({
      ...formData,
      variants: updatedVariants
    });
  };

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      discount: '0',
      category: '',
      featured: false,
      variants: [{ sizes: [], colors: [] }],
      images: []
    });
    setImageFiles([]);
    setEditMode(false);
    setCurrentProductId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount || '0'),
        category: formData.category,
        featured: formData.featured,
        variants: formData.variants
      };

      let response;
      
      // Always use FormData for consistency
      const formDataObj = new FormData();
      
      // Add product data
      Object.keys(productData).forEach(key => {
        if (key === 'variants') {
          formDataObj.append(key, JSON.stringify(productData[key]));
        } else {
          formDataObj.append(key, String(productData[key]));
        }
      });
      
      // Add images if any
      if (imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formDataObj.append('images', file);
        });
      }

      // Add a flag to indicate whether to replace existing images
      formDataObj.append('replace_images', imageFiles.length > 0 ? 'true' : 'false');

      if (editMode) {
        response = await api.put(`/products/${currentProductId}`, formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/products', formDataObj, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      await fetchProducts();
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      if (err.response?.data?.message) {
        setError(`Failed to save product: ${err.response.data.message}`);
      } else {
        setError('Failed to save product. Please check your input and try again.');
      }
    }
  };

  const handleEdit = (product) => {
    setEditMode(true);
    setCurrentProductId(product._id);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      discount: (product.discount || 0).toString(),
      category: product.category || '',
      featured: product.featured || false,
      variants: product.variants || [{ sizes: [], colors: [] }],
      images: product.images || []
    });
    setShowModal(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${productId}`);
        await fetchProducts();  // Refresh the product list after deletion
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  if (loading && currentPage === 1) return <Loading />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Product Management</h2>
        <Button variant="primary" onClick={() => {
          resetForm();
          setShowModal(true);
        }}>
          Add New Product
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Category</th>
            <th>Featured</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product._id}>
              <td>
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name} 
                    style={{ height: '50px', width: '50px', objectFit: 'cover' }} 
                  />
                ) : (
                  <span>No image</span>
                )}
              </td>
              <td>{product.name}</td>
              <td>${product.price.toFixed(2)}</td>
              <td>{product.discount || 0}%</td>
              <td>{product.category || 'N/A'}</td>
              <td>{product.featured ? 'Yes' : 'No'}</td>
              <td>
                <Button 
                  variant="info" 
                  size="sm" 
                  className="me-2"
                  onClick={() => handleEdit(product)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
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

      {/* Product Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Product' : 'Add New Product'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Product Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="0.01"
                    min="0"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Discount (%)</Form.Label>
                  <Form.Control 
                    type="number" 
                    step="1"
                    min="0"
                    max="100"
                    name="discount"
                    value={formData.discount}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category</Form.Label>
              <Form.Control 
                type="text" 
                name="category"
                value={formData.category}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Featured Product" 
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
            </Form.Group>

            <h5 className="mt-4">Variants</h5>
            <Form.Group className="mb-3">
              <Form.Label>Sizes (comma separated)</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.variants[0]?.sizes?.join(', ') || ''}
                onChange={(e) => handleVariantChange(0, 'sizes', e.target.value)}
                placeholder="S, M, L, XL"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Colors (comma separated)</Form.Label>
              <Form.Control 
                type="text" 
                value={formData.variants[0]?.colors?.join(', ') || ''}
                onChange={(e) => handleVariantChange(0, 'colors', e.target.value)}
                placeholder="Red, Blue, Green"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Images</Form.Label>
              <Form.Control 
                type="file" 
                multiple
                onChange={handleImageChange}
              />
              <Form.Text className="text-muted">
                You can select multiple images.
              </Form.Text>
            </Form.Group>

            {editMode && formData.images.length > 0 && (
              <div className="mb-3">
                <p>Current Images:</p>
                <div className="d-flex flex-wrap">
                  {formData.images.map((image, index) => (
                    <div key={index} className="me-2 mb-2">
                      <img 
                        src={image} 
                        alt={`Product ${index}`} 
                        style={{ height: '50px', width: '50px', objectFit: 'cover' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editMode ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductManagement;