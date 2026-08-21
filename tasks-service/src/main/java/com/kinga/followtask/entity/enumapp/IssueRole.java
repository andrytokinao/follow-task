package com.kinga.followtask.entity.enumapp;

public enum IssueRole {
    ADMIN(3), ASSIGNEE(2), OBSERVER(1);

    private final int level;
    IssueRole(int level) { this.level = level; }

    public boolean atLeast(IssueRole minimum) {
        return this.level >= minimum.level;
    }
}