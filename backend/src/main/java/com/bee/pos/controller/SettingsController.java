package com.bee.pos.controller;

import com.bee.pos.dto.SettingsDtos.StoreSettingRequest;
import com.bee.pos.dto.SettingsDtos.StoreSettingResponse;
import com.bee.pos.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {
    private final SettingsService settings;

    /** All roles need this: the POS screen uses it for the tax preview and receipt header. */
    @GetMapping
    public StoreSettingResponse get() {
        return settings.get();
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public StoreSettingResponse update(@Valid @RequestBody StoreSettingRequest request) {
        return settings.update(request);
    }
}
