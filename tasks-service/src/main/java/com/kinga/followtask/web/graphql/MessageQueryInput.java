package com.kinga.followtask.web.graphql;

import java.time.LocalDateTime;

public record MessageQueryInput(
        Integer page,
        Integer size,
        LocalDateTime since,
        LocalDateTime until
) {}