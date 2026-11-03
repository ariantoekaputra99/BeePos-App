package com.bee.pos.dto;

import com.bee.pos.entity.StoreSetting;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public final class SettingsDtos {
    private SettingsDtos() {}

    public record StoreSettingRequest(@NotBlank @Size(max = 100) String storeName,
                                      @Size(max = 255) String address,
                                      @Size(max = 50) String phone,
                                      @Size(max = 500) String receiptFooter,
                                      boolean taxEnabled,
                                      @NotBlank @Size(max = 20) String taxName,
                                      @NotNull @DecimalMin("0") @DecimalMax("100") BigDecimal taxRate,
                                      boolean taxInclusive) {}

    public record StoreSettingResponse(String storeName, String address, String phone, String receiptFooter,
                                       boolean taxEnabled, String taxName, BigDecimal taxRate, boolean taxInclusive,
                                       OffsetDateTime updatedAt, String updatedBy) {
        public static StoreSettingResponse from(StoreSetting s) {
            return new StoreSettingResponse(s.getStoreName(), s.getAddress(), s.getPhone(), s.getReceiptFooter(),
                s.isTaxEnabled(), s.getTaxName(), s.getTaxRate(), s.isTaxInclusive(), s.getUpdatedAt(), s.getUpdatedBy());
        }
    }
}
