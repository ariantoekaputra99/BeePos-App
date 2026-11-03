package com.bee.pos.service;

import com.bee.pos.dto.ReportDtos.*;
import com.bee.pos.dto.SaleDtos.SaleResponse;
import com.bee.pos.entity.Sale;
import com.bee.pos.entity.SaleItem;
import com.bee.pos.entity.SaleStatus;
import com.bee.pos.repository.ProductRepository;
import com.bee.pos.repository.PurchaseOrderRepository;
import com.bee.pos.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final SaleRepository sales;
    private final ProductRepository products;
    private final PurchaseOrderRepository purchaseOrders;
    private final ZoneId businessZone;

    @Transactional(readOnly = true)
    public DashboardSummary dashboard() {
        LocalDate today = LocalDate.now(businessZone);
        LocalDate weekStart = today.minusDays(6);
        List<Sale> week = completed(sales.findInRange(start(weekStart), start(today.plusDays(1))));
        List<Sale> todays = week.stream().filter(s -> localDate(s).equals(today)).toList();

        BigDecimal revenue = sales.totalRevenue();
        BigDecimal cost = sales.totalCost();
        // Collected tax belongs to the government, so it is excluded from gross profit.
        BigDecimal netRevenue = revenue.subtract(sales.totalTax());
        var lowStock = products.findLowStock();

        return new DashboardSummary(
            products.countActive(),
            lowStock.size(),
            revenue, cost, netRevenue.subtract(cost),
            sales.countCompleted(),
            purchaseOrders.totalReceivedValue(),
            sum(todays), todays.size(), profit(todays),
            daily(week, weekStart, today),
            topProducts(week, 5),
            lowStock.stream().limit(8).map(LowStockProduct::from).toList(),
            sales.findTop20ByOrderByCreatedAtDesc().stream().limit(8).map(SaleResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public SalesReport salesReport(LocalDate from, LocalDate to) {
        LocalDate end = to == null ? LocalDate.now(businessZone) : to;
        LocalDate begin = from == null ? end.minusDays(29) : from;
        if (begin.isAfter(end)) throw new IllegalArgumentException("Tanggal awal tidak boleh setelah tanggal akhir");
        if (begin.plusDays(366).isBefore(end)) throw new IllegalArgumentException("Rentang laporan maksimal 1 tahun");

        List<Sale> all = sales.findInRange(start(begin), start(end.plusDays(1)));
        List<Sale> done = completed(all);

        BigDecimal revenue = sum(done);
        BigDecimal tax = done.stream().map(Sale::getTax).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netRevenue = revenue.subtract(tax);
        BigDecimal cost = done.stream().map(ReportService::cost).reduce(BigDecimal.ZERO, BigDecimal::add);
        long items = done.stream().flatMap(s -> s.getItems().stream()).mapToLong(SaleItem::getQuantity).sum();
        BigDecimal average = done.isEmpty() ? BigDecimal.ZERO
            : revenue.divide(BigDecimal.valueOf(done.size()), 2, RoundingMode.HALF_UP);

        Map<String, List<Sale>> byMethod = done.stream()
            .collect(Collectors.groupingBy(s -> s.getPaymentMethod().name(), TreeMap::new, Collectors.toList()));
        List<PaymentBreakdown> payments = byMethod.entrySet().stream()
            .map(e -> new PaymentBreakdown(e.getKey(), sum(e.getValue()), e.getValue().size()))
            .toList();

        return new SalesReport(begin, end, revenue, netRevenue, cost, netRevenue.subtract(cost),
            done.stream().map(Sale::getDiscount).reduce(BigDecimal.ZERO, BigDecimal::add),
            tax,
            average, done.size(), items, all.size() - done.size(),
            daily(done, begin, end), payments, topProducts(done, 10),
            all.stream().map(SaleResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public String salesCsv(LocalDate from, LocalDate to) {
        SalesReport report = salesReport(from, to);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        StringBuilder csv = new StringBuilder("﻿"); // BOM so Excel opens UTF-8 correctly
        csv.append("Invoice,Tanggal,Status,Kasir,Pelanggan,Metode,Jumlah Item,Subtotal,Diskon,Pajak,Total\n");
        for (SaleResponse s : report.sales()) {
            csv.append(String.join(",",
                s.invoiceNumber(),
                s.createdAt().atZoneSameInstant(businessZone).format(fmt),
                s.status().name(),
                escape(s.cashier()),
                escape(s.customerName()),
                s.paymentMethod().name(),
                String.valueOf(s.totalItems()),
                s.subtotal().toPlainString(),
                s.discount().toPlainString(),
                s.tax().toPlainString(),
                s.total().toPlainString())).append('\n');
        }
        return csv.toString();
    }

    private List<DailySales> daily(List<Sale> list, LocalDate from, LocalDate to) {
        Map<LocalDate, List<Sale>> grouped = list.stream().collect(Collectors.groupingBy(this::localDate));
        List<DailySales> result = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<Sale> day = grouped.getOrDefault(d, List.of());
            result.add(new DailySales(d, sum(day), day.size()));
        }
        return result;
    }

    private static List<TopProduct> topProducts(List<Sale> list, int limit) {
        record Acc(Long id, String name, long qty, BigDecimal revenue) {}
        Map<Long, Acc> acc = new HashMap<>();
        list.stream().flatMap(s -> s.getItems().stream()).forEach(i -> {
            Long id = i.getProduct().getId();
            String name = i.getProductName() != null ? i.getProductName() : i.getProduct().getName();
            acc.merge(id, new Acc(id, name, i.getQuantity(), i.getLineTotal()),
                (a, b) -> new Acc(a.id(), a.name(), a.qty() + b.qty(), a.revenue().add(b.revenue())));
        });
        return acc.values().stream()
            .sorted(Comparator.comparingLong(Acc::qty).reversed().thenComparing(Acc::name))
            .limit(limit)
            .map(a -> new TopProduct(a.id(), a.name(), a.qty(), a.revenue()))
            .toList();
    }

    private static List<Sale> completed(List<Sale> list) {
        return list.stream().filter(s -> s.getStatus() != SaleStatus.VOIDED).toList();
    }

    private static BigDecimal sum(List<Sale> list) {
        return list.stream().map(Sale::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal profit(List<Sale> list) {
        return list.stream().map(s -> s.getTotal().subtract(s.getTax()).subtract(cost(s))).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal cost(Sale s) {
        return s.getItems().stream()
            .map(i -> (i.getUnitCost() == null ? BigDecimal.ZERO : i.getUnitCost()).multiply(BigDecimal.valueOf(i.getQuantity())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private LocalDate localDate(Sale s) {
        return s.getCreatedAt().atZoneSameInstant(businessZone).toLocalDate();
    }

    private OffsetDateTime start(LocalDate date) {
        return date.atStartOfDay(businessZone).toOffsetDateTime();
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.contains(",") || value.contains("\"") ? "\"" + value.replace("\"", "\"\"") + "\"" : value;
    }
}
