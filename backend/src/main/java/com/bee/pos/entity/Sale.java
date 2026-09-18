package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

@Entity @Table(name="sales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Sale {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true) private String invoiceNumber;
    @Column(nullable=false, precision=19, scale=2) private BigDecimal subtotal;
    @Column(nullable=false, precision=19, scale=2) private BigDecimal tax = BigDecimal.ZERO;
    @Column(nullable=false, precision=19, scale=2) private BigDecimal discount = BigDecimal.ZERO;
    @Column(nullable=false, precision=19, scale=2) private BigDecimal total;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private PaymentMethod paymentMethod;
    @Column(nullable=false) private OffsetDateTime createdAt;
    @ManyToOne(fetch=FetchType.LAZY) private User cashier;
    @OneToMany(mappedBy="sale", cascade=CascadeType.ALL, orphanRemoval=true) @Builder.Default private List<SaleItem> items = new ArrayList<>();
    public void addItem(SaleItem item) { items.add(item); item.setSale(this); }
}
