import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Container className="text-center mt-5">
      <h1 className="display-1">404</h1>
      <h2 className="mb-4">Page Not Found</h2>
      <p className="text-muted mb-4">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        Return to Dashboard
      </Link>
    </Container>
  );
}

export default NotFoundPage;
