package com.bee.pos.controller;

import com.bee.pos.dto.SaleDtos.SaleRequest;
import com.bee.pos.dto.SaleDtos.SaleResponse;
import com.bee.pos.dto.SaleDtos.VoidRequest;
import com.bee.pos.service.SaleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
public class SaleController {
    private final SaleService sales;

    /** Without dates returns the 20 latest transactions; with dates returns all in the (inclusive) range. */
    @GetMapping
    public List<SaleResponse> list(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return sales.list(from, to);
    }

    @GetMapping("/{id}")
    public SaleResponse get(@PathVariable Long id) {
        return sales.get(id);
    }

    @PostMapping
    public ResponseEntity<SaleResponse> create(@Valid @RequestBody SaleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(sales.create(request));
    }

    @PostMapping("/{id}/void")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public SaleResponse voidSale(@PathVariable Long id, @Valid @RequestBody(required = false) VoidRequest request) {
        return sales.voidSale(id, request == null ? null : request.reason());
    }
}
