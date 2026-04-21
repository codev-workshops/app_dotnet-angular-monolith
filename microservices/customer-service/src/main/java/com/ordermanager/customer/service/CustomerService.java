package com.ordermanager.customer.service;

import com.ordermanager.customer.dto.CustomerDto;
import com.ordermanager.customer.model.Customer;
import com.ordermanager.customer.repository.CustomerRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    @PostConstruct
    public void seedData() {
        if (customerRepository.count() == 0) {
            customerRepository.save(new Customer(
                    "Acme Corp", "orders@acme.com", "555-0100",
                    "123 Main St", "Springfield", "IL", "62701"));
            customerRepository.save(new Customer(
                    "Globex Inc", "purchasing@globex.com", "555-0200",
                    "456 Oak Ave", "Shelbyville", "IL", "62565"));
            customerRepository.save(new Customer(
                    "Initech LLC", "supplies@initech.com", "555-0300",
                    "789 Pine Rd", "Capital City", "IL", "62702"));
        }
    }

    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CustomerDto getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Customer not found with id: " + id));
        return toDtoWithOrders(customer);
    }

    public CustomerDto createCustomer(CustomerDto dto) {
        if (customerRepository.existsByEmail(dto.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Customer with email " + dto.getEmail() + " already exists");
        }
        Customer customer = new Customer();
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setCity(dto.getCity());
        customer.setState(dto.getState());
        customer.setZipCode(dto.getZipCode());
        customer.setCreatedAt(LocalDateTime.now());
        Customer saved = customerRepository.save(customer);
        return toDto(saved);
    }

    public CustomerDto updateCustomer(Long id, CustomerDto dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Customer not found with id: " + id));
        customer.setName(dto.getName());
        customer.setEmail(dto.getEmail());
        customer.setPhone(dto.getPhone());
        customer.setAddress(dto.getAddress());
        customer.setCity(dto.getCity());
        customer.setState(dto.getState());
        customer.setZipCode(dto.getZipCode());
        Customer saved = customerRepository.save(customer);
        return toDto(saved);
    }

    public void deleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
    }

    private CustomerDto toDto(Customer customer) {
        return new CustomerDto(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.getAddress(),
                customer.getCity(),
                customer.getState(),
                customer.getZipCode(),
                customer.getCreatedAt()
        );
    }

    private CustomerDto toDtoWithOrders(Customer customer) {
        CustomerDto dto = toDto(customer);
        dto.setOrders(List.of());
        return dto;
    }
}
