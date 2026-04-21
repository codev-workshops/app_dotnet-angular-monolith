package com.ordermanager.customer.service;

import com.ordermanager.customer.dto.CustomerDto;
import com.ordermanager.customer.model.Customer;
import com.ordermanager.customer.repository.CustomerRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Long id) {
        return customerRepository.findById(id);
    }

    public Customer createCustomer(CustomerDto dto) {
        Customer customer = new Customer(
                dto.getName(),
                dto.getEmail(),
                dto.getPhone(),
                dto.getAddress(),
                dto.getCity(),
                dto.getState(),
                dto.getZipCode()
        );
        return customerRepository.save(customer);
    }

    @Bean
    CommandLineRunner seedData() {
        return args -> {
            if (customerRepository.count() == 0) {
                customerRepository.saveAll(List.of(
                        new Customer("Acme Corp", "orders@acme.com", "555-0100",
                                "123 Main St", "Springfield", "IL", "62701"),
                        new Customer("Globex Inc", "purchasing@globex.com", "555-0200",
                                "456 Oak Ave", "Shelbyville", "IL", "62565"),
                        new Customer("Initech LLC", "supplies@initech.com", "555-0300",
                                "789 Pine Rd", "Capital City", "IL", "62702")
                ));
            }
        };
    }
}
