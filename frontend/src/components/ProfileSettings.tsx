import React, { useState } from "react";
import { useGeneralStore } from "../stores/generalStore";
import { useUserStore } from "../stores/userStore";
import { useForm } from "@mantine/form";
import { useMutation } from "@apollo/client";
import { UPDATE_PROFILE } from "../graphql/mutations/UpdateUserProfile";
import {
  Avatar,
  Button,
  Flex,
  Group,
  Modal,
  TextInput,
} from "@mantine/core";
import { IconEditCircle } from "@tabler/icons-react";
import { UpdateProfileMutationVariables } from "../gql/graphql";

function ProfileSettings() {
  const isProfileSettingsModalOpen = useGeneralStore(
    (state) => state.isProfileSettingsModalOpen
  );
  const toggleProfileSettingsModal = useGeneralStore(
    (state) => state.toggleProfileSettingsModal
  );
  const profileImage = useUserStore((state) => state.avatarUrl);
  const updateProfileImage = useUserStore((state) => state.updateProfileImage);
  const fullname = useUserStore((state) => state.fullname);
  const updateUsername = useUserStore((state) => state.updateUsername);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm({
    initialValues: {
      fullname: fullname,
    },
    validate: {
      fullname: (value: string) =>
        value.trim().length >= 3
          ? null
          : "Username must be at least 3 characters",
    },
  });

  const [updateProfile] = useMutation(UPDATE_PROFILE, {
    onError: (error) => {
      console.error("Update profile error:", error);
      console.error("GraphQL Errors:", error.graphQLErrors);
      console.error("Network Error:", error.networkError);
    },
    onCompleted: (data) => {
      console.log("Data: " + data.updateProfile.avatarUrl);
      console.log("Image File: " + data.updateProfile.fullname);
      updateProfileImage(data.updateProfile.avatarUrl);
      updateUsername(data.updateProfile.fullname);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (form.validate().hasErrors) {
      console.log("Errors: " + form.errors.fullname);
      return;
    }

    await updateProfile({
      variables: {
        fullname: form.values.fullname,
        imageBase64: imageBase64, // Send the Base64 string
      } as UpdateProfileMutationVariables,
    });
  };

  return (
    <Modal
      opened={isProfileSettingsModalOpen}
      onClose={toggleProfileSettingsModal}
      title="Profile Settings"
    >
      <form onSubmit={form.onSubmit(() => handleSave())}>
        <Group
          pos="relative"
          w={100}
          h={100}
          style={{ cursor: "pointer" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar
            src={imageBase64 || profileImage || null}
            alt="Profile"
            h={100}
            w={100}
            radius={100}
          />
          <IconEditCircle
            color="black"
            size={20}
            style={{
              position: "absolute",
              top: 50,
              right: -10,
              background: "white",
              border: "1px solid black",
              padding: 5,
              borderRadius: 100,
            }}
          />
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </Group>
        <TextInput
          style={{ marginTop: 20 }}
          label="Username"
          {...form.getInputProps("fullname")}
          onChange={(event) => {
            form.setFieldValue("fullname", event.currentTarget.value);
          }}
          error={form.errors.fullname}
        />
        <Flex gap="md" mt="sm">
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={toggleProfileSettingsModal} variant="link">
            Cancel
          </Button>
        </Flex>
      </form>
    </Modal>
  );
}

export default ProfileSettings;