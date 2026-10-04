package dev.entrelinhas.catalog;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
class EncryptedDatabaseConfigurationTest {
    private static final String MASTER = UUID.randomUUID().toString();
    @Container
    static final PostgreSQLContainer database = new PostgreSQLContainer("postgres:18.3");

    @DynamicPropertySource
    static void encryptedProperties(DynamicPropertyRegistry registry) {
        registry.add("jasypt.encryptor.password", () -> MASTER);
        registry.add("spring.datasource.url", () -> JasyptTestCipher.encrypt(database.getJdbcUrl(), MASTER));
        registry.add("spring.datasource.username", () -> JasyptTestCipher.encrypt(database.getUsername(), MASTER));
        registry.add("spring.datasource.password", () -> JasyptTestCipher.encrypt(database.getPassword(), MASTER));
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired Environment environment;

    @Test
    void encryptedCredentialsConnectToPostgresAndRunMigrations() {
        assertThat(jdbc.queryForObject("select count(*) from books", Long.class)).isZero();
        assertThat(jdbc.queryForObject("select current_user", String.class)).isEqualTo(database.getUsername());
        assertThat(environment.getProperty("spring.datasource.url")).isEqualTo(database.getJdbcUrl());
    }
}
