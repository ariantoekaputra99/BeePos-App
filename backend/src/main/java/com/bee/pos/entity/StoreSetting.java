package com.bee.pos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** Single-row table (id = 1) holding store profile, receipt texts and tax configuration. */
@Entity
@Table(name = "store_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StoreSetting {
    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(nullable = false)
    private String storeName;

    private String address;
    private String phone;

    @Column(length = 500)
    private String receiptFooter;

    @Column(nullable = false)
    private boolean taxEnabled;

    /** Label printed on receipts, e.g. "PPN" or "PB1". */
    @Column(nullable = false)
    private String taxName;

    /** Percentage, e.g. 11.00 for 11%. */
    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal taxRate;

    /** true = selling prices already include tax; false = tax is added on top at checkout. */
    @Column(nullable = false)
    private boolean taxInclusive;

    private OffsetDateTime updatedAt;
    private String updatedBy;
}
