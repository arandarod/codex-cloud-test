package dev.entrelinhas.catalog;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
class WebConfiguration implements WebMvcConfigurer {
    private final String[] origins;

    WebConfiguration(@Value("${catalog.cors-origins}") String[] origins) { this.origins = origins; }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**").allowedOrigins(origins)
                .allowedMethods("GET", "POST", "PUT", "DELETE").allowedHeaders("Content-Type");
    }
}
