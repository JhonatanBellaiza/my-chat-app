import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { LOGOUT_USER } from '../graphql/mutations/Logout';
import { useGeneralStore } from '../stores/generalStore';
import { useUserStore } from '../stores/userStore';
import { Layout, Menu, Tooltip, Button, Avatar, Space } from 'antd';
import {
  WechatOutlined,
  LoginOutlined,
  LogoutOutlined,
  UserOutlined,
  MessageTwoTone,
  MessageOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

function Sidebar() {
  const toggleProfileSettingsModal = useGeneralStore(
    (state) => state.toggleProfileSettingsModal
  );
  const [active, setActive] = useState('chatrooms');
  const userId = useUserStore((state) => state.id);
  const user = useUserStore((state) => state);
  const setUser = useUserStore((state) => state.setUser);
  const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);

  const [logoutUser] = useMutation(LOGOUT_USER, {
    onCompleted: () => {
      toggleLoginModal();
    },
  });

  const handleLogout = async () => {
    await logoutUser();
    setUser({
      id: undefined,
      fullname: '',
      avatarUrl: null,
      email: '',
    });
  };

  // Define menu items
  const menuItems = userId
    ? [
        {
          key: 'chatrooms',
          label: '',
          icon: <WechatOutlined />,
        },
      ]
    : [];

  return (
    <Sider
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
      width={100}
      theme="light"
    >
      {/* Top Section: Logo */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <TeamOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      </div>

      {/* Middle Section: Menu */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[active]}
          style={{ borderRight: 0 }}
          items={menuItems}
          onClick={({ key }) => setActive(key)}
        />
      </div>

      {/* Bottom Section: Profile and Logout/Login Buttons */}
      <div
        style={{
          textAlign: 'center',
    padding: '16px 0',
    borderTop: '1px solid #f0f0f0', // Optional: Add a border to separate the sections
    position: 'absolute', // Fix the position
    bottom: 0, // Stick to the bottom
    left: 0, // Align to the left
    right: 0, // Align to the right
    backgroundColor: '#fff', 
        }}
      >
        <Space direction="vertical" size="middle">
          {userId && (
            <Tooltip title={`Profile (${user.fullname})`} placement="right">
              <Button
                type="text"
                icon={<Avatar src={user.avatarUrl} icon={<UserOutlined />} />}
                onClick={toggleProfileSettingsModal}
                style={{ marginBottom: '8px' }}
              />
            </Tooltip>
          )}
          {userId ? (
            <Tooltip title="Logout" placement="right">
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              />
            </Tooltip>
          ) : (
            <Tooltip title="Login" placement="right">
              <Button
                type="text"
                icon={<LoginOutlined />}
                onClick={toggleLoginModal}
              />
            </Tooltip>
          )}
        </Space>
      </div>
    </Sider>
  );
}

export default Sidebar;