package com.kinga.followtask.web;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.context.WebServerInitializedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.*;

@RestController
public class InfoController {

    @Value("${spring.application.name}")
    private String appName;

    @Value("${app.version}")
    private String version;

    private final Environment environment;

    public InfoController(Environment environment) {
        this.environment = environment;
    }

    private int port;

    @EventListener
    public void onWebServerReady(WebServerInitializedEvent event) {
        this.port = event.getWebServer().getPort();
    }

    @GetMapping("/info")
    public Map<String, Object> getInfo() {
        Map<String, Object> info = new HashMap<>();

        info.put("name", appName);
        info.put("version", version);
        info.put("port", port);
        info.put("ipAddress", getRealIpAddress());
        info.put("hostname", getHostname());
        info.put("os", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("profiles", Arrays.asList(environment.getActiveProfiles()));
        info.put("uptime", getUptimeSeconds() + " seconds");

        return info;
    }

    private String getRealIpAddress() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();

            while (interfaces.hasMoreElements()) {
                NetworkInterface iface = interfaces.nextElement();

                if (iface.isLoopback() || !iface.isUp()) continue;

                Enumeration<java.net.InetAddress> addresses = iface.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (addr instanceof java.net.Inet4Address) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception ignored) {}

        return "unknown";
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private long getUptimeSeconds() {
        return ManagementFactory.getRuntimeMXBean().getUptime() / 1000;
    }
}
