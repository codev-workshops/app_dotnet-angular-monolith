import React, { useEffect, useState } from 'react';
import { Tabs, Tab, Table, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/client';
import type { User, Role, CreateUserRequest, CreateRoleRequest } from '../types';

const SettingsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<CreateUserRequest>({ username: '', email: '', password: '', role: '' });

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<CreateRoleRequest>({ name: '', description: '' });

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiClient.get<User[]>('/api/users'),
        apiClient.get<Role[]>('/api/roles'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch {
      setError('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateUser = () => {
    setEditingUser(null);
    setUserForm({ username: '', email: '', password: '', role: '' });
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ username: user.username, email: user.email, password: '', role: user.role });
    setShowUserModal(true);
  };

  const saveUser = async () => {
    try {
      if (editingUser) {
        await apiClient.put(`/api/users/${editingUser.id}`, userForm);
      } else {
        await apiClient.post('/api/users', userForm);
      }
      setShowUserModal(false);
      fetchData();
    } catch {
      setError('Failed to save user');
    }
  };

  const deleteUser = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      fetchData();
    } catch {
      setError('Failed to delete user');
    }
  };

  const openCreateRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', description: '' });
    setShowRoleModal(true);
  };

  const openEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, description: role.description });
    setShowRoleModal(true);
  };

  const saveRole = async () => {
    try {
      if (editingRole) {
        await apiClient.put(`/api/roles/${editingRole.id}`, roleForm);
      } else {
        await apiClient.post('/api/roles', roleForm);
      }
      setShowRoleModal(false);
      fetchData();
    } catch {
      setError('Failed to save role');
    }
  };

  const deleteRole = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    try {
      await apiClient.delete(`/api/roles/${id}`);
      fetchData();
    } catch {
      setError('Failed to delete role');
    }
  };

  if (loading) {
    return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  }

  return (
    <>
      <h2 className="mb-3">Settings</h2>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <Tabs defaultActiveKey="users" className="mb-3">
        <Tab eventKey="users" title="User Management">
          <div className="d-flex justify-content-end mb-2">
            <Button variant="primary" size="sm" onClick={openCreateUser}>Add User</Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr><th>Username</th><th>Email</th><th>Role</th><th>Enabled</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.enabled ? 'Yes' : 'No'}</td>
                  <td>
                    <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => openEditUser(u)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteUser(u.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
        <Tab eventKey="roles" title="Role Management">
          <div className="d-flex justify-content-end mb-2">
            <Button variant="primary" size="sm" onClick={openCreateRole}>Add Role</Button>
          </div>
          <Table striped bordered hover responsive>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.description}</td>
                  <td>
                    <Button variant="outline-secondary" size="sm" className="me-1" onClick={() => openEditRole(r)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={() => deleteRole(r.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      <Modal show={showUserModal} onHide={() => setShowUserModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingUser ? 'Edit User' : 'Create User'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password{editingUser ? ' (leave blank to keep current)' : ''}</Form.Label>
            <Form.Control type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Role</Form.Label>
            <Form.Select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="">Select a role...</option>
              {roles.map((r) => (
                <option key={r.id} value={r.name}>{r.name}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveUser}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingRole ? 'Edit Role' : 'Create Role'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={2} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={saveRole}>Save</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SettingsPage;
