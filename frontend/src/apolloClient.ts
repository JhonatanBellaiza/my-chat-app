import { 
    ApolloClient, 
    InMemoryCache, 
    NormalizedCacheObject, 
    gql, 
    Observable, 
    ApolloLink, 
    split,
    HttpLink } from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { WebSocketLink } from "@apollo/client/link/ws";
import { onError } from "@apollo/client/link/error";
import { useUserStore } from "./stores/userStore";

loadErrorMessages()
loadDevMessages()
async function refreshToken(client: ApolloClient<NormalizedCacheObject>) {
    try {
        const { data } = await client.mutate({
            mutation: gql`
                mutation RefreshToken {
                    refreshToken
                }
            `
        })
        const newAccessToken = data?.refreshToken;
        if (!newAccessToken) {
            throw new Error("No access token returned");
        }

        return `Bearer ${newAccessToken}`;
        
        
        
        
    } catch (error) {
        throw new Error("Failed to refresh token");
    }
}

let retryCount = 0;
const maxRetries = 3;

const wsLink = new WebSocketLink({
    uri: "ws://localhost:3000/graphql",
    options: {
        reconnect: true,
        connectionParams: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        }
    }
})

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
    if (!graphQLErrors) return;
    
    for (const error of graphQLErrors) {
        if(error.extensions?.code === "UNAUTHENTICATED" && retryCount < maxRetries) {
            retryCount++;
            return new Observable(observer => {
                refreshToken(client)
                .then(token => {
                    console.log("Token refreshed", token);
                    operation.setContext((previousContext: any) => ({
                        headers: {
                            ...previousContext.headers,
                            Authorization: `Bearer ${token}`,
                        },
                    }));
                    const forward$ = forward(operation);
                    forward$.subscribe(observer);
                })
                .catch(error => {
                    observer.error(error);
                    observer.complete();
                })
            })

            }
            if( error.message === "Refresh token not found") {
                console.log("Refresh token not found");
                useUserStore.setState({
                    id: undefined,
                    fullname: "",
                    email: "",
                })
            }
        
    }
})

const uploadLink = new HttpLink({
    uri: "http://localhost:3000/graphql",
    credentials: 'include',
    headers: {
        "apollo-require-preflight": "true",
    }
});

const link = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === "OperationDefinition" &&
            definition.operation === "subscription"
        );
    },
    wsLink,
    errorLink
)

export const client = new ApolloClient({
    uri: "http://localhost:3000/graphql",
    cache: new InMemoryCache({
        typePolicies: {
            Message: {
              fields: {
                createdAt: {
                  read(value) {
                    return value ? new Date(value).toISOString() : null;
                  },
                },
              },
            },
          },
    }),
    credentials: "include",
    link: ApolloLink.from([link, uploadLink]),

})

    
