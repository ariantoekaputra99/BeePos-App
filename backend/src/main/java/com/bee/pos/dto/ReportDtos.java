package com.bee.pos.dto;

import com.bee.pos.entity.Product;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ReportDtos {
    private ReportDtos() {}

    public record DailySales(LocalDate date, BigDecimal revenue, long orders) {}

    public record TopProduct(Long productId, String name, long quantity, BigDecimal revenue) {}

    public record PaymentBreakdown(String method, BigDecimal amount, long orders) {}

    public record LowStockProduct(Long id, String name, String sku, int stock, int minStock) {
        public static LowStockProduct from(Product p) {
            return new LowStockProduct(p.getId(), p.getName(), p.getSku(), p.getStock(),
                p.getMinStock() == null ? 5 : p.getMinStock());
        }
    }

    public record DashboardSummary(long totalProducts, long lowStockProducts,
                                   BigDecimal totalRevenue, BigDecimal totalCost, BigDecimal grossProfit,
                                   long totalOrders, BigDecimal totalPurchaseValue,
                                   BigDecimal todayRevenue, long todayOrders, BigDecimal todayProfit,
                                   List<DailySales> last7Days, List<TopProduct> topProducts,
                                   List<LowStockProduct> lowStock,
                                   List<SaleDtos.SaleResponse> recentSales) {}

    /** totalRevenue includes tax; netRevenue = totalRevenue - totalTax; grossProfit = netRevenue - totalCost. */
    public record SalesReport(LocalDate from, LocalDate to,
                              BigDecimal totalRevenue, BigDecimal netRevenue, BigDecimal totalCost, BigDecimal grossProfit,
                              BigDecimal totalDiscount, BigDecimal totalTax, BigDecimal averageOrder,
                              long totalOrders, long totalItems, long voidedOrders,
                              List<DailySales> daily, List<PaymentBreakdown> byPaymentMethod,
                              List<TopProduct> topProducts, List<SaleDtos.SaleResponse> sales) {}
}
