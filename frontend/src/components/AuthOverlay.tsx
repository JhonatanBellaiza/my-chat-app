import React, { useState } from "react";
import { useGeneralStore } from "../stores/generalStore";
import { useUserStore } from "../stores/userStore";
import { GraphQLErrorExtensions } from "graphql";
import { useMutation } from "@apollo/client";
import { Login_UserMutation, RegisterUserMutation } from "../gql/graphql";
import { REGISTER_USER } from "../graphql/mutations/Register";
import { LOGIN_USER } from "../graphql/mutations/Login";
import { Modal, Form, Input, Button, Typography, Row, Col } from "antd";

const { Text, Title } = Typography;

function AuthOverlay() {
  const isLoginModalOpen = useGeneralStore((state) => state.isLoginModalOpen);
  const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);
  const [isRegister, setIsRegister] = useState(true);
  const toggleForm = () => {
    setIsRegister(!isRegister);
  };

  const Register = () => {
    const [form] = Form.useForm();
    const setUser = useUserStore((state) => state.setUser);
    const setIsLoginOpen = useGeneralStore((state) => state.toggleLoginModal);
    const [errors, setErrors] = React.useState<GraphQLErrorExtensions>({});

    const [registerUser, { loading }] =
      useMutation<RegisterUserMutation>(REGISTER_USER);

    const handleRegister = async (values: {
      fullname: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      setErrors({});
      await registerUser({
        variables: {
          email: values.email,
          password: values.password,
          fullname: values.fullname,
          confirmPassword: values.confirmPassword,
        },
        onCompleted: (data) => {
          setErrors({});
          if (data?.register.user) {
            setUser({
              id: data?.register.user.id,
              email: data?.register.user.email,
              fullname: data?.register.user.fullname,
            });
            setIsLoginOpen();
          }
        },
      }).catch((err) => {
        console.log("Full error:", err);
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          setErrors(err.graphQLErrors[0].extensions);
        } else {
          setErrors({});
        }
        useGeneralStore.setState({ isLoginModalOpen: true });
      });
    };

    return (
      <Form form={form} onFinish={handleRegister} layout="vertical">
        <Title level={3} style={{ textAlign: "center" }}>
          Register
        </Title>

        <Form.Item
          label="Fullname"
          name="fullname"
          rules={[
            {
              required: true,
              message: "Username must be at least 3 characters",
              min: 3,
            },
          ]}
          validateStatus={errors?.fullname ? "error" : ""}
          help={errors?.fullname as string}
        >
          <Input placeholder="Choose a full name" />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            { required: true, message: "Invalid email", type: "email" },
          ]}
          validateStatus={errors?.email ? "error" : ""}
          help={errors?.email as string}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: "Password must be at least 3 characters",
              min: 3,
            },
          ]}
          validateStatus={errors?.password ? "error" : ""}
          help={errors?.password as string}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          rules={[
            {
              required: true,
              message: "Passwords do not match",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject("Passwords do not match");
              },
            }),
          ]}
          validateStatus={errors?.confirmPassword ? "error" : ""}
          help={errors?.confirmPassword as string}
        >
          <Input.Password placeholder="Confirm your password" />
        </Form.Item>

        <Text>
          Already registered?{" "}
          <Button type="link" onClick={toggleForm}>
            Login here
          </Button>
        </Text>

        <Row justify="center" style={{ marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ marginRight: 8 }}
          >
            Register
          </Button>
          <Button onClick={toggleLoginModal}>Cancel</Button>
        </Row>
      </Form>
    );
  };

  const Login = () => {
    const [form] = Form.useForm();
    const [loginUser, { loading }] = useMutation<Login_UserMutation>(LOGIN_USER);
    const setUser = useUserStore((state) => state.setUser);
    const setIsLoginOpen = useGeneralStore((state) => state.toggleLoginModal);
    const [errors, setErrors] = React.useState<GraphQLErrorExtensions>({});
    const [invalidCredentials, setInvalidCredentials] = React.useState("");

    const handleLogin = async (values: { email: string; password: string }) => {
      await loginUser({
        variables: {
          email: values.email,
          password: values.password,
        },
        onCompleted: (data) => {
          setErrors({});
          if (data?.login.user) {
            setUser({
              id: data?.login.user.id,
              email: data?.login.user.email,
              fullname: data?.login.user.fullname,
              avatarUrl: data?.login.user.avatarUrl,
            });
            setIsLoginOpen();
          }
        },
      }).catch((err) => {
        console.log("Full error:", err);
        if (err.graphQLErrors && err.graphQLErrors.length > 0) {
          setErrors(err.graphQLErrors[0].extensions);
          if (err.graphQLErrors[0].extensions?.invalidCredentials) {
            setInvalidCredentials(
              err.graphQLErrors[0].extensions.invalidCredentials
            );
          }
        } else {
          setErrors({});
        }
        useGeneralStore.setState({ isLoginModalOpen: true });
      });
    };

    return (
      <Form form={form} onFinish={handleLogin} layout="vertical">
        <Title level={3} style={{ textAlign: "center" }}>
          Login
        </Title>

        <Form.Item
          label="Email"
          name="email"
          rules={[{ required: true, message: "Invalid email", type: "email" }]}
          validateStatus={errors?.email ? "error" : ""}
          help={errors?.email as string}
        >
          <Input placeholder="Enter your email" />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[
            {
              required: true,
              message: "Password must be at least 3 characters",
              min: 3,
            },
          ]}
          validateStatus={errors?.password ? "error" : ""}
          help={errors?.password as string}
        >
          <Input.Password placeholder="Enter your password" />
        </Form.Item>

        {invalidCredentials && (
          <Text type="danger">{invalidCredentials}</Text>
        )}

        <Text>
          Not registered yet?{" "}
          <Button type="link" onClick={toggleForm}>
            Register here
          </Button>
        </Text>

        <Row justify="center" style={{ marginTop: 20 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ marginRight: 8 }}
          >
            Login
          </Button>
          <Button onClick={toggleLoginModal}>Cancel</Button>
        </Row>
      </Form>
    );
  };

  return (
    <Modal
      centered
      open={isLoginModalOpen}
      onCancel={toggleLoginModal}
      footer={null}
    >
      {isRegister ? <Register /> : <Login />}
    </Modal>
  );
}

export default AuthOverlay;