package com.kinga.followtask.web.graphql;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import org.springframework.graphql.execution.DataFetcherExceptionResolverAdapter;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.stereotype.Component;

@Component
public class MessagingGraphQLExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        ErrorType errorType;

        if (ex instanceof IllegalArgumentException) {
            errorType = ErrorType.BAD_REQUEST;
        } else if (ex instanceof IllegalStateException) {
            errorType = ErrorType.NOT_FOUND;
        } else if (ex instanceof UnsupportedOperationException) {
            errorType = ErrorType.NOT_FOUND;
        } else {
            errorType = ErrorType.INTERNAL_ERROR;
        }

        return GraphqlErrorBuilder.newError(env)
                .errorType(errorType)
                .message(ex.getMessage())
                .build();
    }
}