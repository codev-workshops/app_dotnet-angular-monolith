import { Card, Table } from 'react-bootstrap';

const services = [
  { name: 'API Gateway', port: 8080, description: 'Routes requests to microservices, handles auth' },
  { name: 'Auth Service', port: 8081, description: 'Authentication and authorization (JWT)' },
  { name: 'Customer Service', port: 8082, description: 'Customer management' },
  { name: 'Product Service', port: 8083, description: 'Product catalog management' },
  { name: 'Order Service', port: 8084, description: 'Order processing and management' },
  { name: 'Inventory Service', port: 8085, description: 'Inventory tracking and restocking' },
  { name: 'Frontend', port: 5173, description: 'React SPA (this application)' },
];

function AboutPage() {
  return (
    <>
      <h2 className="mb-4">About OrderManager</h2>

      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Microservices Architecture</Card.Title>
          <Card.Text>
            OrderManager has been decomposed from a monolithic .NET + Angular application into a
            microservices architecture. Each domain (customers, products, orders, inventory) is now
            served by its own independent service, communicating through a centralized API Gateway.
          </Card.Text>
          <Card.Text>
            The frontend is a React SPA that communicates exclusively with the API Gateway on port
            8080. The gateway handles routing, authentication, and load balancing across the
            backend services.
          </Card.Text>
          <Card.Text>
            All services are containerized with Docker and orchestrated using Docker Compose for
            local development. Each service owns its own database and can be deployed, scaled, and
            updated independently.
          </Card.Text>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          <Card.Title>Services</Card.Title>
          <Table striped bordered hover responsive className="mt-3">
            <thead>
              <tr>
                <th>Service</th>
                <th>Port</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.name}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.port}</td>
                  <td>{s.description}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </>
  );
}

export default AboutPage;
