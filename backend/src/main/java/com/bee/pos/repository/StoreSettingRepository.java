package com.bee.pos.repository;

import com.bee.pos.entity.StoreSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreSettingRepository extends JpaRepository<StoreSetting, Long> {
}
