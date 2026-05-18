package org.example.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = PathHolder.toFileUri(uploadDir);
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }

    private static final class PathHolder {
        static String toFileUri(String dir) {
            return "file:" + java.nio.file.Path.of(dir).toAbsolutePath().normalize() + "/";
        }
    }
}
