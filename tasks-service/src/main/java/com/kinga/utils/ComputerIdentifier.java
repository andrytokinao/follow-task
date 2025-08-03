package com.kinga.utils;

import com.nimbusds.jose.shaded.gson.Gson;
import com.nimbusds.jose.shaded.gson.GsonBuilder;
import oshi.SystemInfo;
import oshi.hardware.ComputerSystem;
import oshi.hardware.HWDiskStore;
import oshi.hardware.HardwareAbstractionLayer;
import oshi.hardware.NetworkIF;
import oshi.hardware.CentralProcessor;


import java.net.SocketException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale; // Pour la comparaison de chaînes insensible à la casse
import java.util.stream.Collectors;

public class ComputerIdentifier {

    public static MachineInfo machineInfo;


    static {
        try {
            loadLocalIndentifier();
        } catch (SocketException e) {
            throw new RuntimeException(e);
        }
    }
    public static boolean isVirtualMachine() throws SocketException {
        SystemInfo si = new SystemInfo();
        HardwareAbstractionLayer hal = si.getHardware();

        // 1. Vérification du fabricant et du modèle du système
        ComputerSystem cs = hal.getComputerSystem();
        String manufacturer = cs.getManufacturer().toLowerCase(Locale.ROOT);
        String model = cs.getModel().toLowerCase(Locale.ROOT);

        if (manufacturer.contains("vmware") || model.contains("vmware")) {
            return true; // VMware
        }
        if (manufacturer.contains("virtualbox") || model.contains("virtualbox")) {
            return true; // VirtualBox
        }
        if (manufacturer.contains("microsoft") && model.contains("virtual machine")) {
            return true; // Hyper-V (Microsoft)
        }
        if (manufacturer.contains("qemu") || manufacturer.contains("kvm")) {
            return true; // QEMU/KVM
        }
        if (manufacturer.contains("parallels") || model.contains("parallels")) {
            return true; // Parallels
        }
        if (manufacturer.contains("amazon") && model.contains("ec2")) {
            return true; // AWS EC2 (et autres fournisseurs cloud comme Google Compute Engine, Alibaba Cloud, etc.)
        }
        if (manufacturer.contains("google") && model.contains("compute engine")) {
            return true;
        }
        if (manufacturer.contains("alibaba") && model.contains("cloud")) {
            return true;
        }
        // Vous pouvez ajouter d'autres vérifications spécifiques aux fournisseurs de cloud si nécessaire.


        // 2. Vérification des préfixes d'adresses MAC (OUI - Organizationally Unique Identifier)
        // Ces listes sont des exemples, Oshi en a des plus complètes en interne.
        // C'est une vérification très fiable pour de nombreuses VMs.
        List<String> vmMacPrefixes = List.of(
                "005056", // VMware
                "000C29", // VMware
                "001C14", // VMware
                "080027", // VirtualBox
                "00155D", // Hyper-V (Microsoft Corp)
                "0003FF", // Microsoft Virtual PC
                "525400"  // QEMU/KVM
        );
        for (NetworkIF netIF : hal.getNetworkIFs()) {
            byte[] macBytes = netIF.queryNetworkInterface().getHardwareAddress();
            if (macBytes != null && macBytes.length >= 3) {
                String macPrefix = String.format("%02X%02X%02X", macBytes[0], macBytes[1], macBytes[2]);
                if (vmMacPrefixes.contains(macPrefix.toUpperCase(Locale.ROOT))) {
                    return true;
                }
            }
        }

        // 3. Vérification du Vendor ID du CPU
        String cpuVendor = hal.getProcessor().getProcessorIdentifier().getVendor().toLowerCase(Locale.ROOT);
        if (cpuVendor.contains("vmware") || cpuVendor.contains("virtualbox") || cpuVendor.contains("microsoft hv")) {
            return true;
        }

        return false; // Si aucune des vérifications ci-dessus n'indique une VM
    }

    // Classe interne pour structurer les informations de la machine


    public static void loadLocalIndentifier() throws SocketException {
        SystemInfo si = new SystemInfo();
        HardwareAbstractionLayer hal = si.getHardware();

        StringBuilder rawIdBuilder = new StringBuilder();
        StringBuilder verificationLog = new StringBuilder();
        boolean detectedVM = isVirtualMachine();
        String systemUuidCollected = "N/A";
        String boardSerialCollected = "N/A";
        List<String> diskSerialsCollected = new ArrayList<>();
        List<String> macAddressesCollected = new ArrayList<>();
        String processorIdCollected = "N/A";
        int logicalCoresCollected = 0;
        String finalGeneratedHash = "UNKNOWN_MACHINE";

        verificationLog.append("--- Début de la collecte des identifiants machine ---\n");
        verificationLog.append("  [INFO] Machine détectée comme VM: ").append(detectedVM).append("\n");

        // --- 1. Collecte de l'UUID du système / Numéro de série de la carte mère ---
        try {
            ComputerSystem computerSystem = hal.getComputerSystem();
            String uuid = computerSystem.getHardwareUUID();
            String boardSerial = computerSystem.getBaseboard().getSerialNumber();

            if (uuid != null && !uuid.isEmpty() && !isGenericUUID(uuid)) {
                systemUuidCollected = uuid;
                verificationLog.append("  [OK] UUID du système trouvé: ").append(uuid).append("\n");
            } else if (boardSerial != null && !boardSerial.isEmpty() && !isGenericSerial(boardSerial)) {
                boardSerialCollected = boardSerial;
                verificationLog.append("  [OK] Numéro de série de la carte mère trouvé: ").append(boardSerial).append("\n");
            } else {
                verificationLog.append("  [WARN] UUID du système et numéro de série de la carte mère non trouvés ou génériques.\n");
            }
        } catch (Exception e) {
            verificationLog.append("  [ERROR] Erreur lors de la récupération de l'UUID/Carte Mère: ").append(e.getMessage()).append("\n");
        }
        rawIdBuilder.append("SYSID:").append(systemUuidCollected.equals("N/A") ? boardSerialCollected : systemUuidCollected).append(";");


        // --- 2. Collecte des numéros de série des disques durs ---
        try {
            List<HWDiskStore> diskStores = hal.getDiskStores();
            if (diskStores.isEmpty()) {
                verificationLog.append("  [WARN] Aucun disque dur physique trouvé.\n");
            } else {
                for (HWDiskStore disk : diskStores) {
                    String serial = disk.getSerial();
                    if (serial != null && !serial.isEmpty() && !isGenericSerial(serial)) {
                        diskSerialsCollected.add(serial);
                        verificationLog.append("  [INFO] Disque '").append(disk.getName()).append("' (Modèle: ").append(disk.getModel()).append(") - Série: ").append(serial).append("\n");
                    } else {
                        verificationLog.append("  [WARN] Disque '").append(disk.getName()).append("' (Modèle: ").append(disk.getModel()).append(") - Numéro de série non valide ou générique (").append(serial).append(").\n");
                    }
                }
                if (diskSerialsCollected.isEmpty()) {
                    verificationLog.append("  [WARN] Aucun numéro de série de disque dur valide trouvé.\n");
                } else {
                    verificationLog.append("  [OK] Total de ").append(diskSerialsCollected.size()).append(" numéros de série de disques durs valides collectés.\n");
                }
            }
        } catch (Exception e) {
            verificationLog.append("  [ERROR] Erreur lors de la récupération des disques durs: ").append(e.getMessage()).append("\n");
        }
        rawIdBuilder.append("DISKSER:").append(diskSerialsCollected.stream().sorted().collect(Collectors.joining(","))).append(";");


        // --- 3. Collecte des adresses MAC des interfaces réseau physiques et UP ---
        try {
            List<NetworkIF> networkIFs = hal.getNetworkIFs();
            if (networkIFs.isEmpty()) {
                verificationLog.append("  [WARN] Aucune interface réseau trouvée.\n");
            } else {
                for (NetworkIF netIF : networkIFs) {
                    byte[] macBytes = netIF.queryNetworkInterface().getHardwareAddress();
                    String macHex = (macBytes != null) ? bytesToHex(macBytes) : "N/A";

                    verificationLog.append("  [INFO] Interface '").append(netIF.getDisplayName()).append("' (MAC: ").append(macHex)
                            .append(", Up: ").append(netIF.getIfOperStatus().equals(NetworkIF.IfOperStatus.UP))
                            .append(", Virtual: ").append(netIF.queryNetworkInterface().isVirtual())
                            .append(", Loopback: ").append(netIF.queryNetworkInterface().isLoopback()).append(")\n");

                    if (macBytes != null && !netIF.queryNetworkInterface().isVirtual() && !netIF.queryNetworkInterface().isLoopback() &&
                            !macHex.isEmpty() && !macHex.equals("000000000000")) {
                        macAddressesCollected.add(macHex);
                    }
                }
                if (macAddressesCollected.isEmpty()) {
                    verificationLog.append("  [WARN] Aucune adresse MAC physique et valide trouvée.\n");
                } else {
                    verificationLog.append("  [OK] Total de ").append(macAddressesCollected.size()).append(" adresses MAC valides collectées.\n");
                }
            }
        } catch (Exception e) {
            verificationLog.append("  [ERROR] Erreur lors de la récupération des interfaces réseau: ").append(e.getMessage()).append("\n");
        }
        rawIdBuilder.append("MACS:").append(macAddressesCollected.stream().sorted().collect(Collectors.joining(","))).append(";");


        // --- 4. Collecte des informations du processeur ---
        try {
            CentralProcessor processor = hal.getProcessor();
            String processorIdentifier = processor.getProcessorIdentifier().getIdentifier();
            int logicalProcessorCount = processor.getLogicalProcessorCount();

            if (processorIdentifier != null && !processorIdentifier.isEmpty()) {
                processorIdCollected = processorIdentifier;
                logicalCoresCollected = logicalProcessorCount;
                verificationLog.append("  [OK] Informations du processeur collectées: ").append(processorIdentifier).append(" (Cœurs logiques: ").append(logicalProcessorCount).append(")\n");
            } else {
                verificationLog.append("  [WARN] Identifiant du processeur non trouvé ou vide.\n");
            }
        } catch (Exception e) {
            verificationLog.append("  [ERROR] Erreur lors de la récupération des infos processeur: ").append(e.getMessage()).append("\n");
        }
        rawIdBuilder.append("CPUINFO:").append(processorIdCollected).append("_").append(logicalCoresCollected).append(";");


        // --- Génération de l'identifiant final (Hash) ---
        String rawIdForHash = rawIdBuilder.toString();
        String statusMessage;

        if (rawIdForHash.replaceAll("N/A", "").replaceAll(";", "").isEmpty()) {
            finalGeneratedHash = "UNKNOWN_MACHINE";
            statusMessage = "AUCUNE_INFO_COLLECTEE";
            verificationLog.append("\n--- Résumé de la collecte ---\n");
            verificationLog.append("[CRITICAL] Aucune information matérielle significative n'a pu être collectée. L'identifiant est " + finalGeneratedHash + ".\n");
        } else {
            try {
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                byte[] hash = digest.digest(rawIdForHash.getBytes("UTF-8"));
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                finalGeneratedHash = hexString.toString();
                statusMessage = "SUCCES";
                verificationLog.append("\n--- Résumé de la collecte ---\n");
                verificationLog.append("[OK] Identifiant matériel brut collecté: ").append(rawIdForHash).append("\n");
                verificationLog.append("[OK] Hash SHA-256 généré avec succès.\n");
            } catch (Exception e) {
                finalGeneratedHash = "ERROR_HASHING_" + rawIdForHash.hashCode();
                statusMessage = "ERREUR_HASHAGE";
                verificationLog.append("\n--- Résumé de la collecte ---\n");
                verificationLog.append("[ERROR] Erreur lors du hachage de l'identifiant: ").append(e.getMessage()).append("\n");
                verificationLog.append("[WARN] Identifiant brut utilisé pour le hashage échoué: ").append(rawIdForHash).append("\n");
            }
        }

        verificationLog.append("--- Fin de la collecte des identifiants machine ---\n");

        // Afficher le journal de vérification
        System.out.println(verificationLog.toString());

        // Créer l'objet MachineInfo avec toutes les données, incluant le statut VM
        MachineInfo info = new MachineInfo(
                detectedVM, // Le nouveau champ
                systemUuidCollected,
                boardSerialCollected,
                diskSerialsCollected,
                macAddressesCollected,
                processorIdCollected,
                logicalCoresCollected,
                finalGeneratedHash,
                verificationLog.toString() // Inclure le journal complet
        );
        info.setBoardSerial(boardSerialCollected);
        info.setDiskSerials(diskSerialsCollected);
        info.setProcessorIdentifier(processorIdCollected);
        info.setVM(detectedVM);
        info.setMacAddresses(macAddressesCollected);
        info.setLogicalProcessorCount(logicalCoresCollected);

        ComputerIdentifier.machineInfo = info;

    }

    // --- Méthodes utilitaires (inchangées) ---

    private static String bytesToHex(byte[] bytes) {
        if (bytes == null) return "N/A";
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return sb.toString();
    }

    private static boolean isGenericUUID(String uuid) {
        return uuid.equals("03000200-0400-0500-0006-000700080009") ||
                uuid.equals("FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF") ||
                uuid.equals("00000000-0000-0000-0000-000000000000");
    }

    private static boolean isGenericSerial(String serial) {
        return serial.contains("To Be Filled By O.E.M.") ||
                serial.contains("Default string") ||
                serial.equals("000000000000") ||
                serial.equals("None") ||
                serial.equals("N/A");
    }


}
