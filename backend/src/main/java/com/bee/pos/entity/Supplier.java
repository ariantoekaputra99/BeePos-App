package com.bee.pos.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "suppliers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String contactPerson;
    private String phone;
    @Email
    private String email;
    private String address;
}
