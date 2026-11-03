package com.bee.pos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    @NotBlank
    @Column(nullable = false, unique = true)
    private String sku;

    @Column(unique = true)
    private String barcode;

    @NotNull @DecimalMin("0")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @NotNull @DecimalMin("0")
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal costPrice;

    @NotNull @Min(0)
    @Column(nullable = false)
    private Integer stock;

    @Min(0)
    @Column(columnDefinition = "integer default 5")
    @Builder.Default
    private Integer minStock = 5;

    private String unit;

    private String category;

    @Column(length = 1000)
    private String description;

    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean active = true;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
        if (active == null) active = true;
        if (minStock == null) minStock = 5;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public boolean isLowStock() {
        return stock != null && stock <= (minStock == null ? 5 : minStock);
    }
}
