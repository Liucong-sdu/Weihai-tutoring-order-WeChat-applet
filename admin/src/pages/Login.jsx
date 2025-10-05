import React, { useEffect } from 'react'; // <-- 引入 useEffect
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAdmin } = useAuth(); // <-- 从 useAuth 中获取 isAdmin 状态

    // 使用 useEffect 监听 isAdmin 状态的变化
    useEffect(() => {
        if (isAdmin) {
            message.success('登录成功!', 1.5);
            navigate('/dashboard', { replace: true }); // 跳转到仪表盘
        }
    }, [isAdmin, navigate]); // 依赖项数组，当 isAdmin 或 navigate 变化时执行

    const onFinish = async (values) => {
        await login(values.username, values.password);
        // 不再在这里直接跳转，也不再需要判断返回值
        // 也不在这里显示 message，交给 useEffect 处理
    };

    const onFinishFailed = () => {
        message.error('登录失败，请检查用户名和密码!');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Form
                name="login"
                onFinish={onFinish}
                onFinishFailed={onFinishFailed} // 添加失败处理
                style={{ width: 300, padding: 20, border: '1px solid #d9d9d9', borderRadius: 8 }}
                initialValues={{ username: 'admin', password: 'admin123' }}
            >
                <h2 style={{ textAlign: 'center' }}>后台管理登录</h2>
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名!' }]}
                >
                    <Input placeholder="用户名 (admin)" />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码!' }]}
                >
                    <Input.Password placeholder="密码 (admin123)" />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
                        登录
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default Login;
