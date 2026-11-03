package com.bee.pos.controller;

import com.bee.pos.entity.Supplier;
import com.bee.pos.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
public class SupplierController {
    private final SupplierService suppliers;

    @GetMapping
    public List<Supplier> list() {
        return suppliers.findAll();
    }

    @PostMapping
    public ResponseEntity<Supplier> create(@Valid @RequestBody Supplier supplier) {
        return ResponseEntity.status(HttpStatus.CREATED).body(suppliers.create(supplier));
    }

    @PutMapping("/{id}")
    public Supplier update(@PathVariable Long id, @Valid @RequestBody Supplier supplier) {
        return suppliers.update(id, supplier);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        suppliers.delete(id);
        return ResponseEntity.noContent().build();
    }
}
