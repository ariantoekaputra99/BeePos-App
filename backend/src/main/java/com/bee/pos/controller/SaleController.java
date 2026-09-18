package com.bee.pos.controller;

import com.bee.pos.dto.SaleRequest;
import com.bee.pos.entity.*;
import com.bee.pos.repository.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@RestController @RequestMapping("/api/sales") @RequiredArgsConstructor
public class SaleController {
    private final SaleRepository sales; private final ProductRepository products; private final UserRepository users;
    @GetMapping public List<Sale> recent(){return sales.findTop20ByOrderByCreatedAtDesc();}
    @PostMapping public ResponseEntity<Sale> create(@Valid @RequestBody SaleRequest request, Authentication authentication){
        Sale sale=Sale.builder().invoiceNumber("INV-"+System.currentTimeMillis()).paymentMethod(request.paymentMethod()).createdAt(OffsetDateTime.now()).tax(BigDecimal.valueOf(request.tax())).discount(BigDecimal.valueOf(request.discount())).build();
        BigDecimal subtotal=BigDecimal.ZERO;
        for(var line:request.items()) { Product p=products.findById(line.productId()).orElseThrow(); if(p.getStock()<line.quantity()) throw new IllegalArgumentException("Insufficient stock for "+p.getName()); BigDecimal price=BigDecimal.valueOf(p.getPrice()); var item=SaleItem.builder().product(p).quantity(line.quantity()).unitPrice(price).lineTotal(price.multiply(BigDecimal.valueOf(line.quantity()))).build(); sale.addItem(item); p.setStock(p.getStock()-line.quantity()); products.save(p); subtotal=subtotal.add(item.getLineTotal()); }
        sale.setSubtotal(subtotal); sale.setTotal(subtotal.add(sale.getTax()).subtract(sale.getDiscount())); sale.setCashier(users.findByUsername(authentication.getName()).orElse(null)); return ResponseEntity.status(HttpStatus.CREATED).body(sales.save(sale));
    }
}
