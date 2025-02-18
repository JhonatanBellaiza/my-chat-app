import { gql } from "@apollo/client"

export const SEND_MESSAGE = gql`
  mutation SendMessage($chatroomId: Float!, $content: String!, $imageBase64: String) {
    sendMessage(chatroomId: $chatroomId, content: $content, imageBase64: $imageBase64) {
      id
      content
      imageUrl
      user {
        id
        fullname
        email
      }
    }
  }
`