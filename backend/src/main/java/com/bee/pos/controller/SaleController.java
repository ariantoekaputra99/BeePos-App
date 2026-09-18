package com.bee.pos.controller;

import com.bee.pos.dto.SaleRequest;
import com.bee.pos.entity.Sale;
import com.bee.pos.repository.SaleRepository;
import com.bee.pos.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {
    private final SaleRepository sales;
    private final SaleService saleService;

    @GetMapping
    public List<Sale> recent() {
        return sales.findTop20ByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<Sale> create(
        @Valid @RequestBody SaleRequest request,
        Authentication authentication
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(saleService.create(request, authentication));
    }
}
