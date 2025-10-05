import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import { Layout, Menu, ConfigProvider, Button } from "antd";
import {
  DashboardOutlined,
  UnorderedListOutlined,
  DollarCircleOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import zhCN from "antd/locale/zh_CN";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DemandList from "./pages/DemandList";
import PriceConfig from "./pages/PriceConfig";
import UserList from "./pages/UserList";
import SystemConfig from "./pages/SystemConfig";
import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider, useAuth } from "./hooks/useAuth.jsx";
import "./App.css";

const { Header, Content, Sider } = Layout;

const App = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
};

const AppRoutes = () => {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={!isAdmin ? <Login /> : <Navigate to="/dashboard" />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>,
    },
    {
      key: "/demands",
      icon: <UnorderedListOutlined />,
      label: <Link to="/demands">需求列表</Link>,
    },
    {
      key: "/users",
      icon: <UserOutlined />,
      label: <Link to="/users">用户管理</Link>,
    },
    {
      key: "/prices",
      icon: <DollarCircleOutlined />,
      label: <Link to="/prices">价格配置</Link>,
    },
    {
      key: "/system",
      icon: <SettingOutlined />,
      label: <Link to="/system">系统配置</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider>
        <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', color: 'white', textAlign: 'center', lineHeight: '32px' }}>家教平台后台</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 16px", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </Header>
        <Content style={{ margin: "16px" }}>
          <div style={{ padding: 24, background: "#fff", minHeight: 360 }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/demands" element={<DemandList />} />
              <Route path="/users" element={<UserList />} />
              <Route path="/prices" element={<PriceConfig />} />
              <Route path="/system" element={<SystemConfig />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
