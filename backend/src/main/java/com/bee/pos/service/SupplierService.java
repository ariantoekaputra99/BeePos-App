package com.bee.pos.service;

import com.bee.pos.entity.Supplier;
import com.bee.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public List<Supplier> findAll() { return supplierRepository.findAll(); }
    public Supplier create(Supplier supplier) { return supplierRepository.save(supplier); }
    public Supplier update(Long id, Supplier data) {
        Supplier existing = supplierRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Supplier not found: " + id));
        existing.setName(data.getName());
        existing.setContactPerson(data.getContactPerson());
        existing.setPhone(data.getPhone());
        existing.setEmail(data.getEmail());
        existing.setAddress(data.getAddress());
        return supplierRepository.save(existing);
    }
    public void delete(Long id) { supplierRepository.deleteById(id); }
}
