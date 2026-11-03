package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "sale_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SaleItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Sale sale;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private Product product;

    /** Snapshot of product name at the time of sale, so reports stay correct after renames. */
    private String productName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal unitPrice;

    /** Snapshot of cost price for gross-profit reporting. */
    @Column(precision = 19, scale = 2)
    private BigDecimal unitCost;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal lineTotal;
}
