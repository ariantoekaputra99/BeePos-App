package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String invoiceNumber;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal tax = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal discount = BigDecimal.ZERO;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal total;

    @Column(precision = 19, scale = 2)
    private BigDecimal amountPaid;

    @Column(precision = 19, scale = 2)
    private BigDecimal changeAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "varchar(20) default 'COMPLETED'")
    @Builder.Default
    private SaleStatus status = SaleStatus.COMPLETED;

    private String note;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    private OffsetDateTime voidedAt;
    private String voidReason;

    @ManyToOne(fetch = FetchType.LAZY)
    private User cashier;

    @ManyToOne(fetch = FetchType.LAZY)
    private Customer customer;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<SaleItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();

    public void addItem(SaleItem item) {
        items.add(item);
        item.setSale(this);
    }

    public void addPayment(Payment payment) {
        payments.add(payment);
        payment.setSale(this);
    }
}
