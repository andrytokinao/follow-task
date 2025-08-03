package com.kinga.utils;

import java.util.List;

public class MachineInfo {
    boolean isVM; // Nouveau champ pour indiquer si c'est une VM
    String systemUUID;
    String boardSerial;
    List<String> diskSerials;
    List<String> macAddresses;
    String processorIdentifier;
    int logicalProcessorCount;
    String generatedHash; // Le hash final
    String statusLog;     // Le journal de vérification complet

    // Constructeur mis à jour
    public MachineInfo(boolean isVM, String systemUUID, String boardSerial, List<String> diskSerials,
                       List<String> macAddresses, String processorIdentifier, int logicalProcessorCount,
                       String generatedHash, String statusLog) {
        this.isVM = isVM;
        this.systemUUID = systemUUID;
        this.boardSerial = boardSerial;
        this.diskSerials = diskSerials;
        this.macAddresses = macAddresses;
        this.processorIdentifier = processorIdentifier;
        this.logicalProcessorCount = logicalProcessorCount;
        this.generatedHash = generatedHash;
        this.statusLog = statusLog;
    }

    // Getters pour la sérialisation Gson (nécessaires si les champs ne sont pas publics)
    public boolean isVM() { return isVM; }
    public String getSystemUUID() { return systemUUID; }
    public String getBoardSerial() { return boardSerial; }
    public List<String> getDiskSerials() { return diskSerials; }
    public List<String> getMacAddresses() { return macAddresses; }
    public String getProcessorIdentifier() { return processorIdentifier; }
    public int getLogicalProcessorCount() { return logicalProcessorCount; }
    public String getGeneratedHash() { return generatedHash; }
    public String getStatusLog() { return statusLog; }

    public void setVM(boolean VM) {
        isVM = VM;
    }

    public void setSystemUUID(String systemUUID) {
        this.systemUUID = systemUUID;
    }

    public void setBoardSerial(String boardSerial) {
        this.boardSerial = boardSerial;
    }

    public void setDiskSerials(List<String> diskSerials) {
        this.diskSerials = diskSerials;
    }

    public void setMacAddresses(List<String> macAddresses) {
        this.macAddresses = macAddresses;
    }

    public void setProcessorIdentifier(String processorIdentifier) {
        this.processorIdentifier = processorIdentifier;
    }

    public void setLogicalProcessorCount(int logicalProcessorCount) {
        this.logicalProcessorCount = logicalProcessorCount;
    }

    public void setGeneratedHash(String generatedHash) {
        this.generatedHash = generatedHash;
    }

    public void setStatusLog(String statusLog) {
        this.statusLog = statusLog;
    }
}
