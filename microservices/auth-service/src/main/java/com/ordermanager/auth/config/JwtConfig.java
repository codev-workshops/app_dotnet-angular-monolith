package com.ordermanager.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private String secret;
    private long expiration;
    private long refreshExpiration;

    public String getSecret() {
        if (secret == null || secret.isBlank()) {
            return loadDefaultSecret();
        }
        return secret;
    }

    private String loadDefaultSecret() {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("jwt-defaults.properties")) {
            if (is != null) {
                Properties props = new Properties();
                props.load(is);
                return props.getProperty("jwt.default-secret");
            }
        } catch (IOException ignored) {
        }
        return "change-me";
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getExpiration() {
        return expiration;
    }

    public void setExpiration(long expiration) {
        this.expiration = expiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public void setRefreshExpiration(long refreshExpiration) {
        this.refreshExpiration = refreshExpiration;
    }
}
