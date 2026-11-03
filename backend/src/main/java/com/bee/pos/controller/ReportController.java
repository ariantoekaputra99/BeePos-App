package com.bee.pos.controller;

import com.bee.pos.dto.ReportDtos.DashboardSummary;
import com.bee.pos.dto.ReportDtos.SalesReport;
import com.bee.pos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reports;

    /** Cashiers see sales figures but not cost/profit data. */
    @GetMapping("/dashboard/summary")
    public DashboardSummary dashboard(Authentication auth) {
        DashboardSummary d = reports.dashboard();
        boolean manager = auth.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_MANAGER"));
        if (manager) return d;
        return new DashboardSummary(d.totalProducts(), d.lowStockProducts(), d.totalRevenue(), null, null,
            d.totalOrders(), null, d.todayRevenue(), d.todayOrders(), null,
            d.last7Days(), d.topProducts(), d.lowStock(), d.recentSales());
    }

    @GetMapping("/reports/sales")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public SalesReport sales(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return reports.salesReport(from, to);
    }

    @GetMapping("/reports/sales.csv")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<byte[]> salesCsv(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] body = reports.salesCsv(from, to).getBytes(StandardCharsets.UTF_8);
        String name = "laporan-penjualan-" + (from == null ? "30hari" : from) + (to == null ? "" : "_" + to) + ".csv";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(body);
    }
}
