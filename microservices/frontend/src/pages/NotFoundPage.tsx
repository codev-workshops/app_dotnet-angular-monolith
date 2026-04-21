import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';

const NotFoundPage: React.FC = () => {
  return (
    <Container className="text-center mt-5">
      <h1>404</h1>
      <h3>Page not found</h3>
      <p className="text-muted">The page you are looking for does not exist.</p>
      <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
    </Container>
  );
};

export default NotFoundPage;
