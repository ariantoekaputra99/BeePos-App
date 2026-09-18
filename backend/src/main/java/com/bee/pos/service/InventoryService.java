package com.bee.pos.service;

import com.bee.pos.entity.InventoryMovement;
import com.bee.pos.entity.Product;
import com.bee.pos.repository.InventoryMovementRepository;
import com.bee.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final ProductRepository products;
    private final InventoryMovementRepository inventoryMovements;

    public List<InventoryMovement> findAll() {
        return inventoryMovements.findAll();
    }

    public void addStock(Long productId, Integer quantity, String note) {
        Product product = products.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        product.setStock(product.getStock() + quantity);
        products.save(product);
        inventoryMovements.save(InventoryMovement.builder()
            .product(product)
            .quantity(quantity)
            .type("IN")
            .note(note)
            .createdAt(OffsetDateTime.now())
            .build());
    }

    public void reduceStock(Long productId, Integer quantity, String note) {
        Product product = products.findById(productId)
            .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
        if (product.getStock() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for " + product.getName());
        }
        product.setStock(product.getStock() - quantity);
        products.save(product);
        inventoryMovements.save(InventoryMovement.builder()
            .product(product)
            .quantity(quantity)
            .type("OUT")
            .note(note)
            .createdAt(OffsetDateTime.now())
            .build());
    }
}
