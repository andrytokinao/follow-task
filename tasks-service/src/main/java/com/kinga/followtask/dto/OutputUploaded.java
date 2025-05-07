package com.kinga.followtask.dto;

import com.kinga.followtask.entity.Document;
import com.kinga.followtask.entity.Uploaded;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OutputUploaded {
    private Long id;
    private String name;
    private String path;
    private Document document;
    public OutputUploaded(Uploaded uploaded) {
        this.setId(uploaded.getId());
        this.setName(uploaded.getName());
        this.setPath(uploaded.getPath());
        this.setDocument(uploaded.getDocument());
    }
    public void setDocument(Document document) {
        Document doc = new Document();
        doc.setId(document.getId());
        doc.setTitre(document.getTitre());
        this.document = doc;
    }
}
