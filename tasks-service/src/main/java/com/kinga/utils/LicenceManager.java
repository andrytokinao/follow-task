package com.kinga.utils;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.List;

public class LicenceManager {

    public static void mains(String[] args) {
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();

            if (networkInterfaces == null) {
                System.out.println("Aucune interface réseau trouvée.");
                return;
            }

            while (networkInterfaces.hasMoreElements()) {
                NetworkInterface ni = networkInterfaces.nextElement();

                System.out.println("-------------------------------------");
                System.out.println("Nom de l'interface : " + ni.getDisplayName());
                System.out.println("Nom interne : " + ni.getName());

                // Récupérer l'adresse MAC
                byte[] mac = ni.getHardwareAddress();
                if (mac != null) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? "-" : ""));
                    }
                    System.out.println("Adresse MAC : " + sb.toString());
                } else {
                    System.out.println("Adresse MAC : Non disponible (peut être une interface logicielle ou sans adresse MAC)");
                }

                // Récupérer toutes les adresses IP associées à cette interface
                Enumeration<InetAddress> inetAddresses = ni.getInetAddresses();
                System.out.println("Adresses IP :");
                boolean hasIpAddress = false;
                while (inetAddresses.hasMoreElements()) {
                    InetAddress ip = inetAddresses.nextElement();
                    System.out.println("  - " + ip.getHostAddress());
                    hasIpAddress = true;
                }
                if (!hasIpAddress) {
                    System.out.println("  Aucune adresse IP trouvée pour cette interface.");
                }

                // Informations supplémentaires (optionnel)
                System.out.println("Est-ce en ligne ? " + ni.isUp());
                System.out.println("Est une boucle locale ? " + ni.isLoopback());
                System.out.println("Est virtuelle ? " + ni.isVirtual());
                System.out.println("MTU : " + ni.getMTU());
            }

        } catch (SocketException e) {
            System.err.println("Erreur lors de l'accès aux interfaces réseau : " + e.getMessage());
        }
    }
    public static String getMacAddress() {
        try {
            Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();

            if (networkInterfaces == null) {
                System.out.println("Aucune interface réseau trouvée.");
                return "";
            }

            while (networkInterfaces.hasMoreElements()) {
                NetworkInterface ni = networkInterfaces.nextElement();

                System.out.println("-------------------------------------");
                System.out.println("Nom de l'interface : " + ni.getDisplayName());
                System.out.println("Nom interne : " + ni.getName());

                // Récupérer l'adresse MAC
                byte[] mac = ni.getHardwareAddress();
                if (mac != null) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < mac.length; i++) {
                        sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? "-" : ""));
                    }
                    System.out.println("Adresse MAC : " + sb.toString());
                } else {
                    System.out.println("Adresse MAC : Non disponible (peut être une interface logicielle ou sans adresse MAC)");
                }

                // Récupérer toutes les adresses IP associées à cette interface
                Enumeration<InetAddress> inetAddresses = ni.getInetAddresses();
                System.out.println("Adresses IP :");
                boolean hasIpAddress = false;
                while (inetAddresses.hasMoreElements()) {
                    InetAddress ip = inetAddresses.nextElement();
                    System.out.println("  - " + ip.getHostAddress());
                    hasIpAddress = true;
                }
                if (!hasIpAddress) {
                    System.out.println("  Aucune adresse IP trouvée pour cette interface.");
                }

                // Informations supplémentaires (optionnel)
                System.out.println("*****************");
                System.out.println("Est-ce en ligne ? " + ni.isUp());
                System.out.println("Est une boucle locale ? " + ni.isLoopback());
                System.out.println("Est virtuelle ? " + ni.isVirtual());
                System.out.println("MTU : " + ni.getMTU());

            }

        } catch (SocketException e) {
            System.err.println("Erreur lors de l'accès aux interfaces réseau : " + e.getMessage());
        }
        return "";
    }
    public static void main(String[] args) {
        try {
            Process p = Runtime.getRuntime().exec("wmic diskdrive get serialnumber");
            BufferedReader input = new BufferedReader(new InputStreamReader(p.getInputStream()));
            String line;
            StringBuilder serialNumber = new StringBuilder();
            boolean firstLine = true; // Pour sauter l'en-tête "SerialNumber"

            while ((line = input.readLine()) != null) {
                if (firstLine) {
                    firstLine = false;
                    continue;
                }
                line = line.trim();
                if (!line.isEmpty()) {
                    serialNumber.append(line);
                    break;
                }
            }
            input.close();

            if (serialNumber.length() > 0) {
                System.out.println("Numéro de série du disque dur (Windows) : " + serialNumber.toString());
            } else {
                System.out.println("Impossible de récupérer le numéro de série du disque dur.");
            }

        } catch (Exception e) {
            System.err.println("Erreur lors de la récupération du numéro de série : " + e.getMessage());
            e.printStackTrace();
        }
    }

}
