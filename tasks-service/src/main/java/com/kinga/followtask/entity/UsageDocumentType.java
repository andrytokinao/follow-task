package com.kinga.followtask.entity;

enum DocumentUsageType {

    COMMENT("Comment", "Document attached to a comment"),
    MEDIA("Media", "Image, video, or media file"),
    SOURCE("Source", "Source file used in development"),
    DATA("Data", "Data file or dataset"),
    MESSAGE("Message", "Document attached to a message"),
    WIKI("Wiki", "Documentation or wiki content"),
    ISSUE("Issue", "Document related to an issue"),
    EXCHANGE("Exchange", "Document exchanged between users"),
    RESPONSE("Response", "Response or reply document");

    private final String label;
    private final String description;

    DocumentUsageType(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getLabel() {
        return label;
    }

    public String getDescription() {
        return description;
    }
}
