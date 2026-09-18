package com.bee.pos.service;

import com.bee.pos.entity.Customer;
import com.bee.pos.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customerRepository;

    public List<Customer> findAll() { return customerRepository.findAll(); }
    public Customer create(Customer customer) { return customerRepository.save(customer); }
    public Customer update(Long id, Customer data) {
        Customer existing = customerRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Customer not found: " + id));
        existing.setName(data.getName());
        existing.setPhone(data.getPhone());
        existing.setEmail(data.getEmail());
        existing.setAddress(data.getAddress());
        return customerRepository.save(existing);
    }
    public void delete(Long id) { customerRepository.deleteById(id); }
}
