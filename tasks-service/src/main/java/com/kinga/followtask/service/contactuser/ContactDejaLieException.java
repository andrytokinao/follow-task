package com.kinga.followtask.service.contactuser;


/** Le contact (numéro) est déjà lié à un autre compte. */
public class ContactDejaLieException extends RuntimeException {
    public ContactDejaLieException() {
        super("Ce contact est déjà lié à un autre compte");
    }
}