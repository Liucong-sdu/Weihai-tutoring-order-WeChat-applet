import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic } from 'antd';
import apiClient from '../api';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalDemands: 0,
        pendingDemands: 0,
        matchedDemands: 0,
        totalUsers: 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 假设后端有这样一个API，您需要自行实现
                const response = await apiClient.get('/admin/stats');
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch stats:", error);
            }
        };
        fetchStats();
    }, []);

    return (
        <div>
            <h1>仪表盘</h1>
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic title="总需求数" value={stats.totalDemands} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="待处理需求" value={stats.pendingDemands} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="已匹配需求" value={stats.matchedDemands} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="总用户数" value={stats.totalUsers} />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
