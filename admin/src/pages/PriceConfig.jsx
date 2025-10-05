import React, { useEffect, useState } from 'react';
import { Table, InputNumber, Button, message, Select } from 'antd';
import apiClient from '../api';

const PriceConfig = () => {
    const [priceConfig, setPriceConfig] = useState([]);
    const [loading, setLoading] = useState(false);
    const [grades, setGrades] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pricesRes, gradesRes, subjectsRes] = await Promise.all([
                apiClient.get('/admin/price-config'),
                apiClient.get('/subjects/grades'), // 假设有此API
                apiClient.get('/subjects'),
            ]);

            if (pricesRes.data.success) setPriceConfig(pricesRes.data.data);
            if (gradesRes.data.success) setGrades(gradesRes.data.data);
            if (subjectsRes.data.success) setSubjects(subjectsRes.data.data);

        } catch (error) {
            message.error('加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePriceChange = (value, record) => {
        const newData = [...priceConfig];
        const index = newData.findIndex((item) => record.id === item.id);
        if (index > -1) {
            newData[index].hourlyPrice = value;
            setPriceConfig(newData);
        }
    };

    const handleSave = async (record) => {
        try {
            const response = await apiClient.put('/admin/price-config', {
                id: record.id,
                hourlyPrice: record.hourlyPrice,
            });
            if (response.data.success) {
                message.success('价格更新成功!');
            } else {
                message.error('价格更新失败');
            }
        } catch (error) {
            message.error('价格更新失败');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        {
            title: '年级',
            dataIndex: 'gradeId',
            key: 'gradeId',
            render: (gradeId) => grades.find(g => g.id === gradeId)?.name || 'N/A',
        },
        {
            title: '科目',
            dataIndex: 'subjectId',
            key: 'subjectId',
            render: (subjectId) => subjects.find(s => s.id === subjectId)?.name || 'N/A',
        },
        {
            title: '价格 (元/小时)',
            dataIndex: 'hourlyPrice',
            key: 'hourlyPrice',
            render: (text, record) => (
                <InputNumber
                    value={Number(text) || 0}
                    min={0}
                    onChange={(value) => handlePriceChange(value, record)}
                />
            ),
        },
        {
            title: '操作',
            key: 'action',
            render: (text, record) => (
                <Button type="primary" onClick={() => handleSave(record)}>
                    保存
                </Button>
            ),
        },
    ];

    return (
        <div>
            <h1>价格配置</h1>
            <Table
                columns={columns}
                dataSource={priceConfig}
                loading={loading}
                rowKey="id"
                pagination={false}
            />
        </div>
    );
};

export default PriceConfig;
