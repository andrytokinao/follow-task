package com.kinga.followtask.dto;

import com.kinga.followtask.entity.UserApp;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Une page de resultats.
 *
 * `totalElements` accompagne le contenu : sans lui le client ne peut ni
 * afficher « 21-40 sur 137 » ni savoir combien de pages proposer.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPageDTO {
    private List<UserApp> content;
    private Integer page;
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
}
