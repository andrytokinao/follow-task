package com.kinga.followtask.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "message_app", indexes = {
        @Index(name = "idx_msg_ext", columnList = "external_message_id")
})
public class MessageApp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_message_id", unique = true, length = 255)
    private String externalMessageId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canall_id", nullable = false)
    private Canall canall;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime created;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String text;
    @Column(name = "media_type")
    private String mediaType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = true)
    private UserApp sender;

    @Column(name = "fallback_sender_name")
    private String fallbackSenderName;

    @Column(name = "is_processed")
    private boolean processed = false;
    @OneToMany(mappedBy = "message")
    private List<IssueMessageLink> messageLinks;

    public List<String> getUserReades() {
        return new ArrayList<>();
    }
}