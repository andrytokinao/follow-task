package com.kinga.followtask.assistant.rag;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentIngestionService {

    private final VectorStore vectorStore;
    private final TokenTextSplitter splitter = new TokenTextSplitter();

    /** À appeler à chaque upload de fichier dans un projet. */
    public int ingest(Resource file, String projetId, String fileName, String uploadedBy) {
        if (projetId == null || projetId.isBlank()) {
            // Sans projetId, le filtre de sécurité ne protège plus rien
            throw new IllegalArgumentException("projetId obligatoire pour l'indexation");
        }

        // Tika gère DOCX, XLSX, PDF, PPTX, TXT...
        List<Document> docs = new TikaDocumentReader(file).get();
        List<Document> chunks = splitter.apply(docs);

        if (chunks.isEmpty()) {
            log.warn("Aucun texte extrait de {} (scan, image ou fichier vide ?)", fileName);
            return 0;
        }

        String indexedAt = Instant.now().toString();
        for (Document c : chunks) {
            c.getMetadata().put("projetId", projetId);   // clé du filtre de sécurité
            c.getMetadata().put("fichier", fileName);
            c.getMetadata().put("auteur", uploadedBy != null ? uploadedBy : "inconnu");
            c.getMetadata().put("indexeLe", indexedAt);
        }

        vectorStore.add(chunks);
        log.info("Indexé {} extraits de {} (projet {})", chunks.size(), fileName, projetId);
        return chunks.size();
    }

    /** À appeler à la suppression ou au remplacement d'un fichier. */
    public void remove(String projetId, String fileName) {
        FilterExpressionBuilder b = new FilterExpressionBuilder();
        vectorStore.delete(b.and(
                b.eq("projetId", projetId),
                b.eq("fichier", fileName)).build());
    }
}