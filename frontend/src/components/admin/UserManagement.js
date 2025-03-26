import React, { useState, useEffect } from 'react';
import { Table, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import api from '../../services/api';
import Loading from '../common/Loading';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users', {
        params: { page: currentPage, limit: 10 }
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getRoleBadge = (role) => {
    return role === 'admin' ? 
      <Badge bg="danger">Admin</Badge> : 
      <Badge bg="primary">User</Badge>;
  };

  const handleChangeRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const handleRoleUpdate = async () => {
    if (!selectedUser || newRole === selectedUser.role) {
      setShowRoleModal(false);
      return;
    }
    
    try {
      setUpdatingRole(true);
      await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole });
      
      // Update user in the list
      setUsers(users.map(user => 
        user._id === selectedUser._id ? { ...user, role: newRole } : user
      ));
      
      setShowRoleModal(false);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    } finally {
      setUpdatingRole(false);
    }
  };

  if (loading && currentPage === 1) return <Loading />;

  return (
    <div>
      <h2 className="mb-4">User Management</h2>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Loading />
      ) : users.length === 0 ? (
        <Alert variant="info">No users found.</Alert>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user._id.substring(user._id.length - 6)}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <Button 
                      variant="warning" 
                      size="sm"
                      onClick={() => handleChangeRole(user)}
                    >
                      Change Role
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

      {/* Change Role Modal */}
      <Modal 
        show={showRoleModal} 
        onHide={() => setShowRoleModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>
                <strong>Username:</strong> {selectedUser.username}<br />
                <strong>Email:</strong> {selectedUser.email}<br />
                <strong>Current Role:</strong> {getRoleBadge(selectedUser.role)}
              </p>
              
              <Form.Group className="mb-3">
                <Form.Label>New Role</Form.Label>
                <Form.Select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRoleUpdate}
            disabled={updatingRole || (selectedUser && newRole === selectedUser.role)}
          >
            {updatingRole ? 'Updating...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;