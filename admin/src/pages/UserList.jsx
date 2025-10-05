import React, { useEffect, useState } from 'react';
import { Table, Input, Avatar, Tag, Modal, Descriptions, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import apiClient from '../api';

const { Search } = Input;

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
    const [searchText, setSearchText] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchUsers = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const response = await apiClient.get('/admin/users', {
                params: { page, limit: pagination.pageSize, search }
            });
            if (response.data.success) {
                setUsers(response.data.data);
                setPagination({
                    ...pagination,
                    current: response.data.pagination.page,
                    total: response.data.pagination.total
                });
            }
        } catch (error) {
            message.error('加载用户列表失败');
            console.error('加载用户列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleSearch = (value) => {
        setSearchText(value);
        fetchUsers(1, value);
    };

    const handleTableChange = (newPagination) => {
        fetchUsers(newPagination.current, searchText);
    };

    const showUserDetail = async (userId) => {
        try {
            const response = await apiClient.get(`/admin/users/${userId}`);
            if (response.data.success) {
                setSelectedUser(response.data.data);
                setModalVisible(true);
            }
        } catch (error) {
            message.error('获取用户详情失败');
            console.error('获取用户详情失败:', error);
        }
    };

    const columns = [
        {
            title: '头像',
            dataIndex: 'avatarUrl',
            key: 'avatarUrl',
            width: 80,
            render: (url) => (
                <Avatar src={url} icon={<UserOutlined />} size={40} />
            )
        },
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 150 },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 130,
            render: (phone) => phone ? <Tag color="blue">{phone}</Tag> : <Tag>未填写</Tag>
        },
        {
            title: '需求数',
            dataIndex: ['_count', 'demands'],
            key: 'demandCount',
            width: 100,
            render: (count) => <Tag color={count > 0 ? 'green' : 'default'}>{count}</Tag>
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (text) => new Date(text).toLocaleString()
        },
        {
            title: '操作',
            key: 'action',
            width: 100,
            render: (text, record) => (
                <a onClick={() => showUserDetail(record.id)}>查看详情</a>
            )
        }
    ];

    return (
        <div>
            <h1>用户管理</h1>
            <Search
                placeholder="搜索用户昵称或手机号"
                onSearch={handleSearch}
                style={{ width: 300, marginBottom: 16 }}
                allowClear
            />
            <Table
                columns={columns}
                dataSource={users}
                loading={loading}
                rowKey="id"
                pagination={pagination}
                onChange={handleTableChange}
            />

            <Modal
                title="用户详情"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedUser && (
                    <>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="用户ID">{selectedUser.id}</Descriptions.Item>
                            <Descriptions.Item label="昵称">{selectedUser.nickname}</Descriptions.Item>
                            <Descriptions.Item label="手机号" span={2}>
                                {selectedUser.phone ? <Tag color="blue">{selectedUser.phone}</Tag> : '未填写'}
                            </Descriptions.Item>
                            <Descriptions.Item label="注册时间" span={2}>
                                {new Date(selectedUser.createdAt).toLocaleString()}
                            </Descriptions.Item>
                        </Descriptions>
                        <h3 style={{ marginTop: 20, marginBottom: 12 }}>历史需求 ({selectedUser.demands?.length || 0})</h3>
                        {selectedUser.demands && selectedUser.demands.length > 0 ? (
                            <Table
                                dataSource={selectedUser.demands}
                                rowKey="id"
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
                                    { title: '年级', dataIndex: ['grade', 'name'], key: 'grade', width: 80 },
                                    { title: '科目', dataIndex: ['subject', 'name'], key: 'subject', width: 80 },
                                    { title: '地址', dataIndex: 'locationAddress', key: 'locationAddress', ellipsis: true },
                                    { title: '价格', dataIndex: 'hourlyPrice', key: 'price', width: 100, render: (p) => `¥${p}/h` },
                                    {
                                        title: '状态',
                                        dataIndex: 'status',
                                        key: 'status',
                                        width: 100,
                                        render: (status) => {
                                            const statusMap = {
                                                PENDING: { text: '待处理', color: 'gold' },
                                                PROCESSING: { text: '跟进中', color: 'processing' },
                                                MATCHED: { text: '已匹配', color: 'success' },
                                                CLOSED: { text: '已关闭', color: 'default' },
                                            };
                                            return <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>;
                                        }
                                    },
                                    {
                                        title: '创建时间',
                                        dataIndex: 'createdAt',
                                        key: 'createdAt',
                                        width: 160,
                                        render: (text) => new Date(text).toLocaleString()
                                    },
                                ]}
                            />
                        ) : (
                            <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无需求记录</p>
                        )}
                    </>
                )}
            </Modal>
        </div>
    );
};

export default UserList;
