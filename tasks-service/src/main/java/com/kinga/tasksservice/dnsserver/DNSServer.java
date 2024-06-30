package com.kinga.tasksservice.dnsserver;

import java.net.DatagramPacket;
import java.net.DatagramSocket;

public class DNSServer implements Runnable {
    private volatile boolean running = true;

    @Override
    public void run() {

        try (DatagramSocket socket = new DatagramSocket(5353)) { // Port DNS standard
            byte[] buffer = new byte[512];

            while (running) {
                DatagramPacket request = new DatagramPacket(buffer, buffer.length);
                socket.receive(request);

                String domainName = extractDomainName(request.getData());
                System.out.println("Requête pour le domaine : " + domainName);

                if (domainName.equals("www.controle.com.")) {
                    System.out.println("ip of 192.168.1.105 ");
                    byte[] response = createDNSResponse(request.getData(), "192.168.1.105");
                    DatagramPacket responsePacket = new DatagramPacket(response, response.length, request.getAddress(), request.getPort());
                    socket.send(responsePacket);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void stop() {
        running = false;
    }

    private String extractDomainName(byte[] request) {
        StringBuilder domainName = new StringBuilder();
        int position = 12; // Début du nom de domaine dans le paquet DNS

        while (request[position] != 0) {
            int length = request[position++];
            for (int i = 0; i < length; i++) {
                domainName.append((char) request[position++]);
            }
            domainName.append('.');
        }

        return domainName.toString();
    }

    private byte[] createDNSResponse(byte[] request, String ipAddress) {
        byte[] response = new byte[1024];
        System.arraycopy(request, 0, response, 0, request.length);

        response[2] = (byte) 0x81;
        response[3] = (byte) 0x80;
        response[7] = 1;
        response[9] = 1;

        int position = request.length;
        response[position++] = (byte) 0xc0;
        response[position++] = (byte) 0x0c;
        response[position++] = 0x00;
        response[position++] = 0x01;
        response[position++] = 0x00;
        response[position++] = 0x01;
        response[position++] = 0x00;
        response[position++] = 0x00;
        response[position++] = 0x00;
        response[position++] = 0x3c;
        response[position++] = 0x00;
        response[position++] = 0x04;

        String[] parts = ipAddress.split("\\.");
        for (String part : parts) {
            response[position++] = (byte) Integer.parseInt(part);
        }

        return response;
    }
}
