import { gql } from "@apollo/client"

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($fullname: String!, $imageBase64: String!) {
    updateProfile(fullname: $fullname, imageBase64: $imageBase64) {
      id
      fullname
      avatarUrl
    }
  }
`