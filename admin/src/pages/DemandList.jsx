import React, { useEffect, useState } from 'react';
import { Table, Tag, Select, message } from 'antd';
import apiClient from '../api';

const { Option } = Select;

const DemandList = () => {
    const [demands, setDemands] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchDemands = async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/demands');
            if (response.data.success) {
                setDemands(response.data.data);
            }
        } catch (error) {
            message.error('加载需求列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDemands();
    }, []);

    const handleStatusChange = async (demandId, newStatus) => {
        try {
            const response = await apiClient.put(`/admin/demands/${demandId}/status`, { status: newStatus });
            if (response.data.success) {
                message.success('状态更新成功!');
                fetchDemands(); // 重新加载数据
            } else {
                message.error('状态更新失败');
            }
        } catch (error) {
            message.error('状态更新失败');
        }
    };

    const statusOptions = {
        PENDING: { text: '待处理', color: 'gold' },
        PROCESSING: { text: '跟进中', color: 'processing' },
        MATCHED: { text: '已匹配', color: 'success' },
        CLOSED: { text: '已关闭', color: 'default' },
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: '用户昵称', dataIndex: ['user', 'nickname'], key: 'nickname', width: 120 },
        {
            title: '联系电话',
            dataIndex: ['user', 'phone'],
            key: 'phone',
            width: 130,
            render: (phone) => phone ? <Tag color="blue">{phone}</Tag> : <Tag>未填写</Tag>
        },
        { title: '地址', dataIndex: 'locationAddress', key: 'locationAddress', ellipsis: true },
        { title: '年级', dataIndex: ['grade', 'name'], key: 'grade', width: 80 },
        { title: '科目', dataIndex: ['subject', 'name'], key: 'subject', width: 80 },
        { title: '课时费', dataIndex: 'hourlyPrice', key: 'hourlyPrice', width: 120, render: (price) => `¥${Number(price) || 0}/小时` },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status, record) => (
                <Select
                    defaultValue={status}
                    style={{ width: 120 }}
                    onChange={(value) => handleStatusChange(record.id, value)}
                >
                    {Object.entries(statusOptions).map(([key, { text }]) => (
                        <Option key={key} value={key}>{text}</Option>
                    ))}
                </Select>
            ),
        },
        {
            title: '当前状态',
            dataIndex: 'status',
            key: 'tag_status',
            width: 100,
            render: (status) => (
                <Tag color={statusOptions[status]?.color}>{statusOptions[status]?.text}</Tag>
            )
        },
        { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (text) => new Date(text).toLocaleString() },
    ];

    return (
        <div>
            <h1>需求列表</h1>
            <Table
                columns={columns}
                dataSource={demands}
                loading={loading}
                rowKey="id"
            />
        </div>
    );
};

export default DemandList;
