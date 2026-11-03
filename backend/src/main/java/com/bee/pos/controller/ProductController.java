package com.bee.pos.controller;

import com.bee.pos.entity.Product;
import com.bee.pos.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService products;

    @GetMapping
    public List<Product> list(@RequestParam(required = false) String q,
                              @RequestParam(required = false) String category,
                              @RequestParam(defaultValue = "false") boolean includeInactive,
                              @RequestParam(defaultValue = "false") boolean lowStock) {
        return products.search(q, category, includeInactive, lowStock);
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return products.get(id);
    }

    @GetMapping("/code/{code}")
    public Product byCode(@PathVariable String code) {
        return products.findByCode(code);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Product> create(@Valid @RequestBody Product product) {
        return ResponseEntity.status(HttpStatus.CREATED).body(products.create(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public Product update(@PathVariable Long id, @Valid @RequestBody Product product) {
        return products.update(id, product);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        products.delete(id);
        return ResponseEntity.noContent().build();
    }
}
