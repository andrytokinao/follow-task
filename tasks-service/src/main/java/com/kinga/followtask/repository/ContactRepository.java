package com.kinga.followtask.repository;

import com.kinga.followtask.entity.Contact;
import com.kinga.followtask.entity.enumapp.TypeContact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, String> {
    Optional<Contact> findByTypeContactAndValue(TypeContact typeContact, String value);
}