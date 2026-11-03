package com.bee.pos.service;

import com.bee.pos.entity.Customer;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.CustomerRepository;
import com.bee.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerService {
    private final CustomerRepository customers;
    private final SaleRepository sales;

    public List<Customer> findAll() {
        return customers.findAllByOrderByNameAsc();
    }

    @Transactional
    public Customer create(Customer input) {
        input.setId(null);
        normalize(input);
        return customers.save(input);
    }

    @Transactional
    public Customer update(Long id, Customer data) {
        Customer existing = customers.findById(id).orElseThrow(() -> NotFoundException.of("Pelanggan", id));
        normalize(data);
        existing.setName(data.getName());
        existing.setPhone(data.getPhone());
        existing.setEmail(data.getEmail());
        existing.setAddress(data.getAddress());
        return customers.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Customer customer = customers.findById(id).orElseThrow(() -> NotFoundException.of("Pelanggan", id));
        if (sales.existsByCustomerId(id)) {
            throw new BusinessException("Pelanggan sudah punya riwayat transaksi dan tidak bisa dihapus");
        }
        customers.delete(customer);
    }

    private static void normalize(Customer c) {
        c.setName(c.getName().trim());
        c.setPhone(blankToNull(c.getPhone()));
        c.setEmail(blankToNull(c.getEmail()));
        c.setAddress(blankToNull(c.getAddress()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
