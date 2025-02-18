declare namespace Express {
    export interface Request {
        user: {
            username: string;
            sub: number;
        };
    }
}

declare module 'graphql-upload' {
    export interface FileUpload {
        filename: string;
        mimetype: string;
        encoding: string;
        createReadStream: () => NodeJS.ReadableStream;
    }
    export const GraphQLUpload: any;
    export const graphqlUploadExpress: any;
}

declare module 'graphql-upload/Upload.mjs' {
    interface Upload {
        filename: string;
        mimetype: string;
        encoding: string;
        createReadStream: () => NodeJS.ReadableStream;
    }

    export default Upload;
}
