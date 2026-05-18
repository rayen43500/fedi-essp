package org.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_BYTES = 2 * 1024 * 1024;

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir:uploads}") String uploadDir) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public String storeAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier image requis");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new IllegalArgumentException("Image trop volumineuse (max 2 Mo)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Format accepte : JPEG, PNG ou WebP");
        }

        String extension = switch (contentType) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpg";
        };

        try {
            Path avatarDir = uploadRoot.resolve("avatars");
            Files.createDirectories(avatarDir);
            String filename = "user-" + userId + "-" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
            Path target = avatarDir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/avatars/" + filename;
        } catch (IOException ex) {
            throw new IllegalStateException("Impossible d'enregistrer l'image", ex);
        }
    }
}
