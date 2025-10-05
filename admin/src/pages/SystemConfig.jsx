import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, message, Spin } from 'antd';
import { PhoneOutlined, ClockCircleOutlined, HomeOutlined } from '@ant-design/icons';
import apiClient from '../api';

const SystemConfig = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/system-config');
            if (response.data.success) {
                const configs = response.data.data;

                // 转换为表单数据
                const formData = {};
                configs.forEach(config => {
                    formData[config.key] = config.value;
                });

                form.setFieldsValue(formData);
            }
        } catch (error) {
            message.error('加载配置失败');
            console.error('加载配置失败:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values) => {
        setSaving(true);
        try {
            // 更新每个配置项
            const promises = Object.entries(values).map(([key, value]) => {
                return apiClient.put(`/admin/system-config/${key}`, {
                    value,
                    description: getDescription(key)
                });
            });

            await Promise.all(promises);

            message.success('保存成功！配置已更新');

            // 重新加载配置以确保显示最新数据
            await loadConfig();
        } catch (error) {
            message.error('保存失败：' + (error.response?.data?.error || error.message));
            console.error('保存失败:', error);
        } finally {
            setSaving(false);
        }
    };

    const getDescription = (key) => {
        const descriptions = {
            'customer_hotline': '客服热线电话',
            'work_hours': '工作时间',
            'platform_name': '平台名称'
        };
        return descriptions[key] || '';
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div>
            <h1>系统配置</h1>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{
                        customer_hotline: '400-123-4567',
                        work_hours: '9:00-18:00',
                        platform_name: '家教平台'
                    }}
                >
                    <Form.Item
                        label="客服热线"
                        name="customer_hotline"
                        rules={[
                            { required: true, message: '请输入客服热线' },
                            { pattern: /^[\d-]+$/, message: '请输入正确的电话号码格式' }
                        ]}
                    >
                        <Input
                            prefix={<PhoneOutlined />}
                            placeholder="400-123-4567"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="工作时间"
                        name="work_hours"
                        rules={[{ required: true, message: '请输入工作时间' }]}
                    >
                        <Input
                            prefix={<ClockCircleOutlined />}
                            placeholder="9:00-18:00"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item
                        label="平台名称"
                        name="platform_name"
                        rules={[{ required: true, message: '请输入平台名称' }]}
                    >
                        <Input
                            prefix={<HomeOutlined />}
                            placeholder="家教平台"
                            size="large"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            loading={saving}
                            style={{ width: '200px' }}
                        >
                            保存配置
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ marginTop: 30, padding: 20, backgroundColor: '#f0f2f5', borderRadius: 8 }}>
                    <h3>💡 配置说明</h3>
                    <ul style={{ lineHeight: 2 }}>
                        <li><strong>客服热线：</strong>显示在小程序首页"联系客服"功能中，用户可以直接拨打</li>
                        <li><strong>工作时间：</strong>显示在联系方式对话框中</li>
                        <li><strong>平台名称：</strong>可用于小程序标题和品牌展示（目前暂未使用）</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
};

export default SystemConfig;
