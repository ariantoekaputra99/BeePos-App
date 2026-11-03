package com.bee.pos.service;

import com.bee.pos.dto.SaleDtos.SaleRequest;
import com.bee.pos.dto.SaleDtos.SaleResponse;
import com.bee.pos.entity.*;
import com.bee.pos.exception.BusinessException;
import com.bee.pos.exception.NotFoundException;
import com.bee.pos.repository.CustomerRepository;
import com.bee.pos.repository.SaleRepository;
import com.bee.pos.repository.UserRepository;
import com.bee.pos.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class SaleService {
    private static final DateTimeFormatter INVOICE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final SaleRepository sales;
    private final CustomerRepository customers;
    private final UserRepository users;
    private final InventoryService inventory;
    private final SettingsService settings;
    private final ZoneId businessZone;

    @Transactional
    public SaleResponse create(SaleRequest request) {
        // Merge duplicate lines for the same product so stock is validated against the real total.
        Map<Long, Integer> quantities = new LinkedHashMap<>();
        request.items().forEach(line -> quantities.merge(line.productId(), line.quantity(), Integer::sum));

        OffsetDateTime now = OffsetDateTime.now(businessZone);
        Sale sale = Sale.builder()
            .invoiceNumber("INV-" + now.format(INVOICE_FORMAT) + "-" + ThreadLocalRandom.current().nextInt(100, 1000))
            .paymentMethod(request.paymentMethod())
            .status(SaleStatus.COMPLETED)
            .createdAt(now)
            .discount(money(request.discount()))
            .note(request.note() == null || request.note().isBlank() ? null : request.note().trim())
            .cashier(users.findByUsername(CurrentUser.username()).orElse(null))
            .build();

        if (request.customerId() != null) {
            sale.setCustomer(customers.findById(request.customerId())
                .orElseThrow(() -> NotFoundException.of("Pelanggan", request.customerId())));
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (Map.Entry<Long, Integer> line : quantities.entrySet()) {
            Product product = inventory.lock(line.getKey());
            if (Boolean.FALSE.equals(product.getActive())) {
                throw new BusinessException("Produk " + product.getName() + " sudah tidak aktif");
            }
            BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(line.getValue()));
            sale.addItem(SaleItem.builder()
                .product(product)
                .productName(product.getName())
                .quantity(line.getValue())
                .unitPrice(product.getPrice())
                .unitCost(product.getCostPrice())
                .lineTotal(lineTotal)
                .build());
            subtotal = subtotal.add(lineTotal);
        }

        if (sale.getDiscount().compareTo(subtotal) > 0) {
            throw new BusinessException("Diskon tidak boleh melebihi subtotal");
        }

        StoreSetting store = settings.current();
        TaxCalculator.Result calc = TaxCalculator.calculate(
            sale.getItems().stream()
                .map(i -> new TaxCalculator.Line(i.getLineTotal(), !Boolean.FALSE.equals(i.getProduct().getTaxable())))
                .toList(),
            sale.getDiscount(), store.isTaxEnabled(), store.getTaxRate(), store.isTaxInclusive());
        sale.setTax(calc.tax());
        if (store.isTaxEnabled()) {
            sale.setTaxName(store.getTaxName());
            sale.setTaxRate(store.getTaxRate());
            sale.setTaxInclusive(store.isTaxInclusive());
        }
        BigDecimal total = calc.total();
        BigDecimal paid = request.amountPaid() == null ? total : money(request.amountPaid());
        if (paid.compareTo(total) < 0) {
            throw new BusinessException("Uang yang dibayar kurang dari total belanja");
        }
        sale.setSubtotal(calc.subtotal());
        sale.setTotal(total);
        sale.setAmountPaid(paid);
        sale.setChangeAmount(paid.subtract(total));
        sale.addPayment(Payment.builder()
            .paymentMethod(request.paymentMethod())
            .amount(total)
            .paidAt(now)
            .status("PAID")
            .build());

        Sale saved = sales.save(sale);
        for (SaleItem item : saved.getItems()) {
            inventory.record(item.getProduct(), "SALE", item.getQuantity(), "Penjualan " + saved.getInvoiceNumber());
        }
        return SaleResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<SaleResponse> list(LocalDate from, LocalDate to) {
        List<Sale> result = (from == null && to == null)
            ? sales.findTop20ByOrderByCreatedAtDesc()
            : sales.findInRange(startOf(from == null ? to : from), startOf((to == null ? from : to).plusDays(1)));
        return result.stream().map(SaleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public SaleResponse get(Long id) {
        return SaleResponse.from(find(id));
    }

    /** Cancels a completed sale and returns the sold items to stock. */
    @Transactional
    public SaleResponse voidSale(Long id, String reason) {
        Sale sale = find(id);
        if (sale.getStatus() == SaleStatus.VOIDED) throw new BusinessException("Transaksi sudah dibatalkan");
        for (SaleItem item : sale.getItems()) {
            Product product = inventory.lock(item.getProduct().getId());
            inventory.record(product, "VOID", item.getQuantity(), "Pembatalan " + sale.getInvoiceNumber());
        }
        sale.setStatus(SaleStatus.VOIDED);
        sale.setVoidedAt(OffsetDateTime.now(businessZone));
        sale.setVoidReason(reason == null || reason.isBlank() ? "Dibatalkan oleh " + CurrentUser.username() : reason.trim());
        sale.getPayments().forEach(p -> p.setStatus("REFUNDED"));
        return SaleResponse.from(sales.save(sale));
    }

    private Sale find(Long id) {
        return sales.findById(id).orElseThrow(() -> NotFoundException.of("Transaksi", id));
    }

    private OffsetDateTime startOf(LocalDate date) {
        return date.atStartOfDay(businessZone).toOffsetDateTime();
    }

    private static BigDecimal money(BigDecimal value) {
        return value == null ? BigDecimal.ZERO.setScale(2) : value.setScale(2, RoundingMode.HALF_UP);
    }
}
