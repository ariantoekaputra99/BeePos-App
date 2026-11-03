package com.bee.pos.service;

import com.bee.pos.dto.SettingsDtos.StoreSettingRequest;
import com.bee.pos.dto.SettingsDtos.StoreSettingResponse;
import com.bee.pos.entity.StoreSetting;
import com.bee.pos.repository.StoreSettingRepository;
import com.bee.pos.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {
    private final StoreSettingRepository settings;

    @Value("${app.store.name:BeePos Store}")
    private String defaultStoreName;

    @Value("${app.store.address:}")
    private String defaultAddress;

    /** Returns the settings row, creating it with defaults (tax disabled, PPN 11%) on first use. */
    @Transactional
    public StoreSetting current() {
        return settings.findById(StoreSetting.SINGLETON_ID).orElseGet(() -> settings.save(StoreSetting.builder()
            .id(StoreSetting.SINGLETON_ID)
            .storeName(defaultStoreName)
            .address(defaultAddress == null || defaultAddress.isBlank() ? null : defaultAddress)
            .receiptFooter("Terima kasih atas kunjungan Anda")
            .taxEnabled(false)
            .taxName("PPN")
            .taxRate(BigDecimal.valueOf(11).setScale(2))
            .taxInclusive(false)
            .updatedAt(OffsetDateTime.now())
            .updatedBy("system")
            .build()));
    }

    @Transactional
    public StoreSettingResponse get() {
        return StoreSettingResponse.from(current());
    }

    @Transactional
    public StoreSettingResponse update(StoreSettingRequest request) {
        StoreSetting s = current();
        s.setStoreName(request.storeName().trim());
        s.setAddress(blankToNull(request.address()));
        s.setPhone(blankToNull(request.phone()));
        s.setReceiptFooter(blankToNull(request.receiptFooter()));
        s.setTaxEnabled(request.taxEnabled());
        s.setTaxName(request.taxName().trim());
        s.setTaxRate(request.taxRate().setScale(2, RoundingMode.HALF_UP));
        s.setTaxInclusive(request.taxInclusive());
        s.setUpdatedAt(OffsetDateTime.now());
        s.setUpdatedBy(CurrentUser.username());
        return StoreSettingResponse.from(settings.save(s));
    }

    private static String blankToNull(String v) {
        return v == null || v.isBlank() ? null : v.trim();
    }
}
