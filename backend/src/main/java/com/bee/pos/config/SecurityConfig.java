server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/bee_pos
    username: beeuser
    password: bee123
    driver-class-name: org.postgresql.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect

  security:
    user:
      name: admin
      password: admin123

springdoc:
  api-docs:
    path: /v3/api-docs
  swagger-ui:
    path: /swagger-ui.html
