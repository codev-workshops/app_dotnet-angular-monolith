import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';

function Layout() {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    navigate('/');
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/dashboard">
            OrderManager
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/customers">Customers</Nav.Link>
              <Nav.Link as={Link} to="/products">Products</Nav.Link>
              <Nav.Link as={Link} to="/orders">Orders</Nav.Link>
              <Nav.Link as={Link} to="/inventory">Inventory</Nav.Link>
              <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
              <Nav.Link as={Link} to="/about">About</Nav.Link>
            </Nav>
            <Navbar.Text className="me-3">
              Signed in as: <strong>{username}</strong>
            </Navbar.Text>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container>
        <Outlet />
      </Container>
    </>
  );
}

export default Layout;
