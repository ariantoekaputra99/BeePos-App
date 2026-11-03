package com.bee.pos.service;

import com.bee.pos.entity.Supplier;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.PurchaseOrderRepository;
import com.bee.pos.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private final SupplierRepository suppliers;
    private final PurchaseOrderRepository purchaseOrders;

    public List<Supplier> findAll() {
        return suppliers.findAllByOrderByNameAsc();
    }

    @Transactional
    public Supplier create(Supplier input) {
        input.setId(null);
        normalize(input);
        return suppliers.save(input);
    }

    @Transactional
    public Supplier update(Long id, Supplier data) {
        Supplier existing = suppliers.findById(id).orElseThrow(() -> NotFoundException.of("Supplier", id));
        normalize(data);
        existing.setName(data.getName());
        existing.setContactPerson(data.getContactPerson());
        existing.setPhone(data.getPhone());
        existing.setEmail(data.getEmail());
        existing.setAddress(data.getAddress());
        return suppliers.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        Supplier supplier = suppliers.findById(id).orElseThrow(() -> NotFoundException.of("Supplier", id));
        if (purchaseOrders.existsBySupplierId(id)) {
            throw new BusinessException("Supplier sudah punya purchase order dan tidak bisa dihapus");
        }
        suppliers.delete(supplier);
    }

    private static void normalize(Supplier s) {
        s.setName(s.getName().trim());
        s.setContactPerson(blankToNull(s.getContactPerson()));
        s.setPhone(blankToNull(s.getPhone()));
        s.setEmail(blankToNull(s.getEmail()));
        s.setAddress(blankToNull(s.getAddress()));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
