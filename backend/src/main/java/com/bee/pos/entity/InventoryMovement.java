package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String note;

    @Column(nullable = false)
    private java.time.OffsetDateTime createdAt;
}
