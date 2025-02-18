declare module 'apollo-upload-client' {
    import { ApolloLink } from '@apollo/client';
    
    export function createUploadLink(options: any): ApolloLink;
} 