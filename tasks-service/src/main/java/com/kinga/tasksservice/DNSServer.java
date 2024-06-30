package com.kinga.tasksservice;

import java.net.*;

public class DNSServer {
    private static final int DNS_PORT = 5353;

    public static void main(String[] args) {
        try (DatagramSocket socket = new DatagramSocket(DNS_PORT)) {
            System.out.println("DNS Server listening on port " + DNS_PORT + "...");

            while (true) {
                byte[] receiveData = new byte[1024];
                DatagramPacket receivePacket = new DatagramPacket(receiveData, receiveData.length);
                socket.receive(receivePacket);

                String dnsQuery = new String(receivePacket.getData(), 0, receivePacket.getLength());
                System.out.println("Received DNS query: " + dnsQuery);

                String domainName = extractDomainName(dnsQuery);

                // Resolve domain name to IP address
                String ipAddress = resolveDNS(domainName);

                if (ipAddress != null) {
                    byte[] responseData = createDNSResponse(receivePacket.getData(), ipAddress);
                    DatagramPacket responsePacket = new DatagramPacket(responseData, responseData.length, receivePacket.getAddress(), receivePacket.getPort());
                    socket.send(responsePacket);
                    System.out.println("DNS response sent with IP: " + ipAddress);
                } else {
                    System.out.println("No IP address found for domain: " + domainName);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String extractDomainName(String dnsQuery) {
        // Extract domain name from DNS query (simplified)
        int index = dnsQuery.indexOf("www.controle.com");
        return "www.controle.com";
    }

    private static String resolveDNS(String domainName) {
        // Mock DNS resolution logic (replace with actual logic)
        if (domainName.equals("www.controle.com")) {
            return "192.168.1.105";
        }
        return null; // Return null if domain not found
    }

    private static byte[] createDNSResponse(byte[] dnsQueryData, String ipAddress) {
        // Create DNS response (simplified)
        byte[] response = new byte[dnsQueryData.length];
        System.arraycopy(dnsQueryData, 0, response, 0, dnsQueryData.length);

        // Modify DNS response fields as needed
        response[2] |= (byte) 0x80; // Set Response flag
        response[3] |= (byte) 0x80; // Set RA flag
        response[7] = 1; // Response count
        response[9] = 1; // Answer count

        // Append IP address to response
        String[] parts = ipAddress.split("\\.");
        int index =0;
        for (String part : parts) {
            response[index++] = (byte) Integer.parseInt(part);
        }

        return response;
    }
}
