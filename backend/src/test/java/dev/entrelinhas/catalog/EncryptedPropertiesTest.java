package dev.entrelinhas.catalog;

import com.ulisesbocchio.jasyptspringboot.annotation.EnableEncryptableProperties;
import com.ulisesbocchio.jasyptspringboot.exception.DecryptionException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.SystemEnvironmentPropertySource;
import java.util.UUID;
import java.util.Properties;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;

class EncryptedPropertiesTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
            .withUserConfiguration(EncryptionOnly.class)
            .withPropertyValues("jasypt.encryptor.algorithm=PBEWITHHMACSHA512ANDAES_256",
                    "jasypt.encryptor.key-obtention-iterations=1000");

    @Configuration(proxyBeanMethods = false)
    @EnableEncryptableProperties
    static class EncryptionOnly {}

    @Test
    void decryptsEncryptedValuesAndLeavesPlainValuesUnchanged() {
        var master = UUID.randomUUID().toString();
        context.withPropertyValues("jasypt.encryptor.password=" + master,
                "example.secret=" + JasyptTestCipher.encrypt("fictitious-value", master), "example.plain=demo")
                .run(app -> {
                    assertThat(app.getEnvironment().getProperty("example.secret")).isEqualTo("fictitious-value");
                    assertThat(app.getEnvironment().getProperty("example.plain")).isEqualTo("demo");
                });
    }

    @Test
    void wrongMasterCannotDecryptCiphertext() {
        context.withPropertyValues("jasypt.encryptor.password=" + UUID.randomUUID(),
                "example.secret=" + JasyptTestCipher.encrypt("fictitious-value", UUID.randomUUID().toString()))
                .run(app -> assertThatThrownBy(() -> app.getEnvironment().getProperty("example.secret"))
                        .isInstanceOf(DecryptionException.class));
    }

    @Test
    void missingMasterCannotDecryptCiphertext() {
        context.withPropertyValues("example.secret=" + JasyptTestCipher.encrypt("fictitious-value", UUID.randomUUID().toString()))
                .run(app -> assertThatThrownBy(() -> app.getEnvironment().getProperty("example.secret"))
                        .isInstanceOf(IllegalStateException.class)
                        .hasMessageContaining("jasypt.encryptor.password"));
    }

    @Test
    void decryptsCiphertextGeneratedByTheExistingJasyptTool() throws Exception {
        var fixture = new Properties();
        try (var input = getClass().getResourceAsStream("/jasypt-tool-fixture.properties")) {
            fixture.load(input);
        }
        context.withPropertyValues("jasypt.encryptor.password=" + fixture.getProperty("master"),
                "example.secret=" + fixture.getProperty("value"))
                .run(app -> assertThat(app.getEnvironment().getProperty("example.secret"))
                        .isEqualTo("fictitious-value-from-existing-tool"));
    }

    @Test
    void readsMasterFromTheStandardEnvironmentVariable() {
        var master = UUID.randomUUID().toString();
        context.withInitializer(app -> app.getEnvironment().getPropertySources().replace("systemEnvironment",
                        new SystemEnvironmentPropertySource("systemEnvironment", Map.of("JASYPT_ENCRYPTOR_PASSWORD", master))))
                .withPropertyValues("example.secret=" + JasyptTestCipher.encrypt("fictitious-value", master))
                .run(app -> assertThat(app.getEnvironment().getProperty("example.secret")).isEqualTo("fictitious-value"));
    }

    @Test
    void plaintextConfigurationDoesNotRequireMaster() {
        context.withPropertyValues("example.plain=demo")
                .run(app -> assertThat(app.getEnvironment().getProperty("example.plain")).isEqualTo("demo"));
    }

    @Test
    void encryptionUsesFreshSaltAndIv() {
        var master = UUID.randomUUID().toString();
        assertThat(JasyptTestCipher.encrypt("fictitious-value", master))
                .isNotEqualTo(JasyptTestCipher.encrypt("fictitious-value", master));
    }
}
