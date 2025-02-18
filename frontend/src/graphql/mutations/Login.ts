import { gql } from "@apollo/client";

export const LOGIN_USER = gql`
    mutation LOGIN_USER($email: String!, $password: String!) {
        login(loginInput: {email: $email, password: $password}) {
            user {
                email
                id
                fullname
                avatarUrl
            }
        }
    }
`;
