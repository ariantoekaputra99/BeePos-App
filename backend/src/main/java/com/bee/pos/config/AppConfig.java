package com.bee.pos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.ZoneId;

@Configuration
public class AppConfig {
    /** Business time zone used for "today" and daily report buckets. */
    @Bean
    public ZoneId businessZone(@Value("${app.timezone:Asia/Jakarta}") String zone) {
        return ZoneId.of(zone);
    }
}
