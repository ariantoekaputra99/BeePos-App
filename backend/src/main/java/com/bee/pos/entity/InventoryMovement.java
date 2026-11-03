package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "inventory_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InventoryMovement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    /** Positive number of units moved. Direction is given by {@link #type}. */
    @Column(nullable = false)
    private Integer quantity;

    /** IN, OUT, SALE, VOID, PURCHASE, ADJUST */
    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String note;

    private Integer stockAfter;

    private String createdBy;

    @Column(nullable = false)
    private OffsetDateTime createdAt;
}
