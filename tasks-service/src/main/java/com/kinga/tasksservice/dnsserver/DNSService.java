package com.kinga.tasksservice.dnsserver;

import org.springframework.stereotype.Service;

@Service
public class DNSService {
    private Thread dnsThread;
    private DNSServer dnsServer;

    public void start() {
        if (dnsThread == null || !dnsThread.isAlive()) {
            dnsServer = new DNSServer();
            dnsThread = new Thread(dnsServer);
            dnsThread.start();
            System.out.println("DNS Service started.");
        }
    }

    public void stop() {
        if (dnsServer != null) {
            dnsServer.stop();
            try {
                dnsThread.join();
                System.out.println("DNS Service stopped.");
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
