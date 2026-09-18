package com.bee.pos.service;

import com.bee.pos.dto.SaleRequest;
import com.bee.pos.entity.*;
import com.bee.pos.repository.ProductRepository;
import com.bee.pos.repository.SaleRepository;
import com.bee.pos.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class SaleService {
    private final SaleRepository sales;
    private final ProductRepository products;
    private final UserRepository users;

    @Transactional
    public Sale create(SaleRequest request, Authentication authentication) {
        Sale sale = Sale.builder()
            .invoiceNumber("INV-" + System.currentTimeMillis())
            .paymentMethod(request.paymentMethod())
            .createdAt(OffsetDateTime.now())
            .tax(BigDecimal.valueOf(request.tax()))
            .discount(BigDecimal.valueOf(request.discount()))
            .build();

        BigDecimal subtotal = BigDecimal.ZERO;
        for (SaleRequest.Item line : request.items()) {
            Product product = products.findById(line.productId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + line.productId()));

            if (product.getStock() < line.quantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + product.getName());
            }

            BigDecimal price = BigDecimal.valueOf(product.getPrice());
            SaleItem item = SaleItem.builder()
                .product(product)
                .quantity(line.quantity())
                .unitPrice(price)
                .lineTotal(price.multiply(BigDecimal.valueOf(line.quantity())))
                .build();

            sale.addItem(item);
            product.setStock(product.getStock() - line.quantity());
            subtotal = subtotal.add(item.getLineTotal());
        }

        sale.setSubtotal(subtotal);
        sale.setTotal(subtotal.add(sale.getTax()).subtract(sale.getDiscount()));
        sale.setCashier(users.findByUsername(authentication.getName()).orElse(null));
        return sales.save(sale);
    }
}
