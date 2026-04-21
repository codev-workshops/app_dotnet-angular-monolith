import { useState, useEffect, useCallback } from 'react';
import { Tabs, Tab, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import { User, Role, CreateUserRequest, CreateRoleRequest } from '../types';

function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<CreateUserRequest>({ username: '', email: '', password: '', role: '' });
  const [submittingUser, setSubmittingUser] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleForm, setRoleForm] = useState<CreateRoleRequest>({ name: '', description: '' });
  const [submittingRole, setSubmittingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get<User[]>('/api/users');
      setUsers(res.data);
    } catch {
      setError('Failed to load users');
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await apiClient.get<Role[]>('/api/roles');
      setRoles(res.data);
    } catch {
      setError('Failed to load roles');
    }
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      await Promise.all([fetchUsers(), fetchRoles()]);
      setLoading(false);
    };
    fetchAll();
  }, [fetchUsers, fetchRoles]);

  const handleCreateUser = async () => {
    setSubmittingUser(true);
    try {
      await apiClient.post('/api/users', userForm);
      setShowUserModal(false);
      setUserForm({ username: '', email: '', password: '', role: '' });
      await fetchUsers();
    } catch {
      setError('Failed to create user');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      await fetchUsers();
    } catch {
      setError('Failed to delete user');
    }
  };

  const handleCreateRole = async () => {
    setSubmittingRole(true);
    try {
      await apiClient.post('/api/roles', roleForm);
      setShowRoleModal(false);
      setRoleForm({ name: '', description: '' });
      await fetchRoles();
    } catch {
      setError('Failed to create role');
    } finally {
      setSubmittingRole(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await apiClient.delete(`/api/roles/${id}`);
      await fetchRoles();
    } catch {
      setError('Failed to delete role');
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <h2 className="mb-4">Settings</h2>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

      <Tabs defaultActiveKey="users" className="mb-3">
        <Tab eventKey="users" title="Users">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Users</h5>
            <Button variant="primary" size="sm" onClick={() => setShowUserModal(true)}>
              Create User
            </Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role || '-'}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">No users found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="roles" title="Roles">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Roles</h5>
            <Button variant="primary" size="sm" onClick={() => setShowRoleModal(true)}>
              Create Role
            </Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.name}</td>
                  <td>{r.description || '-'}</td>
                  <td>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRole(r.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">No roles found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={userForm.email} onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control value={userForm.role} onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))} required />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateUser} disabled={submittingUser}>
            {submittingUser ? 'Creating...' : 'Create User'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateRole} disabled={submittingRole}>
            {submittingRole ? 'Creating...' : 'Create Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default SettingsPage;
