package com.bee.pos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    /** Whether store tax applies to this product (e.g. some staple goods are tax-exempt). */
    @Column(columnDefinition = "boolean default true")
    @Builder.Default
    private Boolean taxable = true;

    /** Stored file name of the product image inside the upload directory (never exposed directly). */
    @JsonIgnore
    private String imageFile;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
        if (active == null) active = true;
        if (minStock == null) minStock = 5;
        if (taxable == null) taxable = true;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    /** Relative to the API base URL, e.g. /products/12/image?v=ab12cd; null when there is no image. */
    public String getImageUrl() {
        if (imageFile == null || id == null) return null;
        return "/products/" + id + "/image?v=" + Integer.toHexString(imageFile.hashCode());
    }

    public boolean isLowStock() {
        return stock != null && stock <= (minStock == null ? 5 : minStock);
    }
}
