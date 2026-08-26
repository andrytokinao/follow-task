package com.kinga.followtask.repository.criteria;

import com.kinga.followtask.entity.CustomFieldValue;
import com.kinga.followtask.entity.Issue;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class IssueSpecification implements Specification<Issue> {
    private IssueSearchCriteria criteria;

    public IssueSpecification(IssueSearchCriteria criteria) {
        this.criteria = criteria;
    }
    @Override
    public Specification<Issue> and (Specification<Issue> other) {
        return Specification.super.and (other);
    }

    @Override
    public Specification<Issue> or (Specification<Issue> other) {
        return Specification.super.or (other);
    }

    @Override
    public Predicate toPredicate (Root<Issue> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) {
        List<Predicate> predicates = new ArrayList<> ();
        if (criteria.getKey() != null) {
            predicates.add(criteriaBuilder.equal(root.get("issueKey"), criteria.getKey()));
        }

        if (criteria.getParentId() != null) {
            predicates.add(root.get("parent").get("id").in(criteria.getParentId()));
        }
        if (criteria.getSummary() != null) {
            predicates.add(criteriaBuilder.like(root.get("summary"), "%" + criteria.getSummary() + "%"));
        }
        if (criteria.getSummary() != null) {
            predicates.add(criteriaBuilder.like(root.get("summary"), "%" + criteria.getSummary() + "%"));
        }

        // -----------------------------------------------------------------
        // Recherche libre (autocomplétion) : OR sur issueKey / summary / description
        // Champ indépendant de key/summary ci-dessus, pour ne pas toucher
        // leur comportement existant (recherche exacte sur key, etc.).
        // -----------------------------------------------------------------
        if (StringUtils.hasText(criteria.getTextSearch())) {
            String pattern = "%" + criteria.getTextSearch().toLowerCase() + "%";
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("issueKey")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("summary")), pattern)
            ));
        }

        if (criteria.getDateFrom() != null && criteria.getDateTo() != null) {
            predicates.add (criteriaBuilder.between (root.get ("dateCreation"), criteria.getDateFrom (), criteria.getDateTo ()));
        } else if (criteria.getDateFrom() != null) {
            predicates.add (criteriaBuilder.greaterThanOrEqualTo(root.get("dateCreation"),criteria.getDateFrom ()));
        } else if (criteria.getDateTo () != null) {
            predicates.add (criteriaBuilder.lessThanOrEqualTo(root.get("dateCreation"),criteria.getDateTo ()));
        }
        if (criteria.getStatusIds() != null && !criteria.getStatusIds().isEmpty()) {
            predicates.add(root.get("status").get("id").in(criteria.getStatusIds()));
        }
        if (criteria.getIssueTypeIds () != null && !criteria.getIssueTypeIds().isEmpty()) {
            predicates.add(root.get("issueType").get("id").in(criteria.getIssueTypeIds()));
        }
        if (!CollectionUtils.isEmpty(criteria.getIssueTypeLevels())) {
            predicates.add(root.get("issueType").get("level").in(criteria.getIssueTypeLevels()));
        }
        if (criteria.getIssueTypeIds () != null && !criteria.getIssueTypeIds().isEmpty()) {
            predicates.add(root.get("issueType").get("id").in(criteria.getIssueTypeIds()));
        }
        if (criteria.getAssigneUsernames() != null && !criteria.getAssigneUsernames().isEmpty()) {
            predicates.add(root.join("assigne").get("username").in(criteria.getAssigneUsernames()));
        }
        if (criteria.getAssigneUsernames() != null && !criteria.getAssigneUsernames().isEmpty()) {
            predicates.add(root.join("assigne").get("username").in(criteria.getAssigneUsernames()));
        }
        if (criteria.getProjectId() != null ) {
            predicates.add(root.join("project").get("id").in(criteria.getProjectId()));
        }  if (criteria.getProjectPrefix() != null ) {
            predicates.add(root.join("project").get("prefix").in(criteria.getProjectPrefix()));
        }
        Join<Issue, CustomFieldValue> customFieldJoin = root.join("values", JoinType.LEFT);
        if (criteria.getCustomFieldStringValues() != null) {
            criteria.getCustomFieldStringValues().forEach((fieldId, values) -> {
                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.equal(customFieldJoin.get("customField").get("id"), fieldId),
                        customFieldJoin.get("stringValue").in(values)
                ));
            });
        }
        if (criteria.getCustomFieldDateValues() != null) {
            criteria.getCustomFieldDateValues().forEach((fieldId, dates) -> {
                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.equal(customFieldJoin.get("customField").get("id"), fieldId),
                        customFieldJoin.get("date").in(dates)
                ));
            });
        }
        if (criteria.getCustomFieldUserIds() != null) {
            criteria.getCustomFieldUserIds().forEach((fieldId, userIds) -> {
                predicates.add(criteriaBuilder.and(
                        criteriaBuilder.equal(customFieldJoin.get("customField").get("id"), fieldId),
                        customFieldJoin.get("userValue").get("id").in(userIds)
                ));
            });
        }
        if (criteria.getCustomFieldDateValueFrom() != null || criteria.getCustomFieldDateValueTo() != null) {
            criteria.getCustomFieldDateValueFrom().forEach((fieldId, fromDate) -> {
                Predicate dateFromPredicate = criteriaBuilder.greaterThanOrEqualTo(
                        customFieldJoin.get("date"),
                        fromDate
                );
                Predicate fieldIdPredicate = criteriaBuilder.equal(customFieldJoin.get("customField").get("id"), fieldId);
                predicates.add(criteriaBuilder.and(dateFromPredicate, fieldIdPredicate));
            });

            criteria.getCustomFieldDateValueTo().forEach((fieldId, toDate) -> {
                Predicate dateToPredicate = criteriaBuilder.lessThanOrEqualTo(
                        customFieldJoin.get("date"),
                        toDate
                );
                Predicate fieldIdPredicate = criteriaBuilder.equal(customFieldJoin.get("customField").get("id"), fieldId);
                predicates.add(criteriaBuilder.and(dateToPredicate, fieldIdPredicate));
            });
        }
        return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    }
}