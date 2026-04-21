import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';

const AboutPage: React.FC = () => {
  return (
    <>
      <h2 className="mb-4">About</h2>
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>OrderManager Microservices v1.0</Card.Title>
          <Card.Text>
            OrderManager is a modern e-commerce management system decomposed from a .NET monolith into
            a suite of independently deployable microservices. Each service owns its domain, data, and
            lifecycle, communicating through a centralized API Gateway.
          </Card.Text>
        </Card.Body>
      </Card>

      <Row>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Architecture</Card.Title>
              <ul className="mb-0">
                <li><strong>API Gateway</strong> &mdash; Spring Cloud Gateway routing all frontend requests to downstream services</li>
                <li><strong>Auth Service</strong> &mdash; JWT-based authentication with user and role management</li>
                <li><strong>Customer Service</strong> &mdash; Customer CRUD operations</li>
                <li><strong>Product Service</strong> &mdash; Product catalog and category management</li>
                <li><strong>Order Service</strong> &mdash; Order creation, status tracking, cross-service orchestration</li>
                <li><strong>Inventory Service</strong> &mdash; Stock management, restocking, and low-stock alerts</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} className="mb-3">
          <Card>
            <Card.Body>
              <Card.Title>Tech Stack</Card.Title>
              <ul className="mb-0">
                <li><strong>Frontend:</strong> React 18, Vite, TypeScript, React Router v6, React-Bootstrap</li>
                <li><strong>Backend:</strong> Java 17, Spring Boot 3, Spring Cloud Gateway</li>
                <li><strong>Auth:</strong> JWT with refresh tokens</li>
                <li><strong>Database:</strong> SQLite (per-service isolation)</li>
                <li><strong>Communication:</strong> REST (HTTP) between services</li>
                <li><strong>Containerization:</strong> Docker, Docker Compose</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default AboutPage;
