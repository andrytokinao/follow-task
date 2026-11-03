package com.kinga.followtask.config;

import graphql.language.Definition;
import graphql.language.Document;
import graphql.language.Field;
import graphql.language.FragmentDefinition;
import graphql.language.InlineFragment;
import graphql.language.OperationDefinition;
import graphql.language.Selection;
import graphql.language.SelectionSet;
import graphql.parser.Parser;
import graphql.language.AstPrinter;
import graphql.schema.GraphQLFieldDefinition;
import graphql.schema.GraphQLFieldsContainer;
import graphql.schema.GraphQLSchema;
import graphql.schema.GraphQLType;
import graphql.schema.GraphQLTypeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.execution.GraphQlSource;
import org.springframework.graphql.server.WebGraphQlInterceptor;
import org.springframework.graphql.server.WebGraphQlRequest;
import org.springframework.graphql.server.WebGraphQlResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Retire de la requête les champs absents du schéma et les signale
 * dans extensions.warnings au lieu de rejeter toute la requête.
 */
@Component
public class UnknownFieldWarningInterceptor implements WebGraphQlInterceptor {

    private static final Logger log = LoggerFactory.getLogger(UnknownFieldWarningInterceptor.class);

    private final GraphQlSource graphQlSource;

    public UnknownFieldWarningInterceptor(GraphQlSource graphQlSource) {
        this.graphQlSource = graphQlSource;
    }

    @Override
    public Mono<WebGraphQlResponse> intercept(WebGraphQlRequest request, Chain chain) {
        Document document;
        try {
            document = Parser.parse(request.getDocument());
        } catch (Exception e) {
            // Syntaxe invalide : on laisse graphql-java renvoyer sa propre erreur
            return chain.next(request);
        }

        GraphQLSchema schema = graphQlSource.schema();
        Context ctx = new Context(schema);
        Document cleaned = cleanDocument(document, ctx);

        // Rien à retirer, ou requête devenue vide : on ne touche à rien
        if (ctx.warnings.isEmpty() || ctx.emptied) {
            return chain.next(request);
        }

        ctx.warnings.forEach(w -> log.warn("GraphQL : {}", w));

        String newQuery = AstPrinter.printAst(cleaned);
        request.configureExecutionInput((input, builder) -> builder.query(newQuery).build());

        return chain.next(request).map(response -> {
            Map<Object, Object> extensions = new LinkedHashMap<>();
            if (response.getExtensions() != null) {
                extensions.putAll(response.getExtensions());
            }
            extensions.put("warnings", ctx.warnings);
            return response.transform(builder -> builder.extensions(extensions));
        });
    }

    // ---------------------------------------------------------------- AST

    private Document cleanDocument(Document document, Context ctx) {
        List<Definition> definitions = new ArrayList<>();

        for (Definition<?> definition : document.getDefinitions()) {
            if (definition instanceof OperationDefinition op) {
                GraphQLType root = switch (op.getOperation()) {
                    case QUERY -> ctx.schema.getQueryType();
                    case MUTATION -> ctx.schema.getMutationType();
                    case SUBSCRIPTION -> ctx.schema.getSubscriptionType();
                };
                if (root == null) {
                    definitions.add(op);
                    continue;
                }
                SelectionSet cleaned = cleanSelectionSet(op.getSelectionSet(), root, ctx);
                if (cleaned.getSelections().isEmpty()) {
                    ctx.emptied = true;
                }
                definitions.add(op.transform(b -> b.selectionSet(cleaned)));

            } else if (definition instanceof FragmentDefinition fragment) {
                GraphQLType type = ctx.schema.getType(fragment.getTypeCondition().getName());
                if (type == null) {
                    definitions.add(fragment);
                    continue;
                }
                SelectionSet cleaned = cleanSelectionSet(fragment.getSelectionSet(), type, ctx);
                if (cleaned.getSelections().isEmpty()) {
                    ctx.emptied = true;
                }
                definitions.add(fragment.transform(b -> b.selectionSet(cleaned)));

            } else {
                definitions.add(definition);
            }
        }
        return document.transform(b -> b.definitions(definitions));
    }

    private SelectionSet cleanSelectionSet(SelectionSet set, GraphQLType parentType, Context ctx) {
        List<Selection> kept = new ArrayList<>();

        for (Selection<?> selection : set.getSelections()) {
            if (selection instanceof Field field) {
                Field cleaned = cleanField(field, parentType, ctx);
                if (cleaned != null) {
                    kept.add(cleaned);
                }

            } else if (selection instanceof InlineFragment inline) {
                GraphQLType type = parentType;
                if (inline.getTypeCondition() != null) {
                    GraphQLType conditionType = ctx.schema.getType(inline.getTypeCondition().getName());
                    if (conditionType != null) {
                        type = conditionType;
                    }
                }
                SelectionSet inner = cleanSelectionSet(inline.getSelectionSet(), type, ctx);
                if (!inner.getSelections().isEmpty()) {
                    kept.add(inline.transform(b -> b.selectionSet(inner)));
                }

            } else {
                kept.add(selection); // FragmentSpread : traité via sa FragmentDefinition
            }
        }
        return SelectionSet.newSelectionSet(kept).build();
    }

    private Field cleanField(Field field, GraphQLType parentType, Context ctx) {
        String name = field.getName();

        if (name.startsWith("__")) {
            return field; // __typename, __schema, __type
        }

        if (!(parentType instanceof GraphQLFieldsContainer container)) {
            ctx.warnings.add("Champ ignoré : '%s' (type parent sans champs)".formatted(name));
            return null;
        }

        GraphQLFieldDefinition definition = container.getFieldDefinition(name);
        if (definition == null) {
            ctx.warnings.add("Champ ignoré : '%s' n'existe pas sur le type '%s'"
                    .formatted(name, container.getName()));
            return null;
        }

        if (field.getSelectionSet() == null) {
            return field;
        }

        GraphQLType childType = GraphQLTypeUtil.unwrapAll(definition.getType());
        SelectionSet inner = cleanSelectionSet(field.getSelectionSet(), childType, ctx);

        if (inner.getSelections().isEmpty()) {
            ctx.warnings.add("Champ ignoré : '%s' (aucun sous-champ valide)".formatted(name));
            return null;
        }
        return field.transform(b -> b.selectionSet(inner));
    }

    private static final class Context {
        final GraphQLSchema schema;
        final List<String> warnings = new ArrayList<>();
        boolean emptied;

        Context(GraphQLSchema schema) {
            this.schema = schema;
        }
    }
}