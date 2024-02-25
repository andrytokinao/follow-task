package com.kinga.tasksservice.config;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;

public class Autorities {
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('CAN_DELETE_USER')")
    public @interface CanDelete {
    }
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('CAN_VIEW_LIST')")
    public @interface CanViewList {
    }
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('CAN_CREATE_USER')")
    public @interface CanCreateUser {
    }
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('CAN_VISITE_PAGE')")
    public @interface CanVisitePage {
    }
    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('CAN_UPDATE_USER')")
    public @interface CanUpdateUser {

    }

    @Retention(RetentionPolicy.RUNTIME)
    @PreAuthorize("hasAuthority('LOGED')")
    public @interface Loged {
    }
}
