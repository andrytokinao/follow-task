package com.kinga.followtask.assistant.whatsapp.dto;

public record DirectMessageReceivedEvent(String canalExternalId, String text, String senderName) {}