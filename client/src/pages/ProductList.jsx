import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await api.get('/products');
      setProducts(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('确定要删除这个产品吗？相关行程和价格将一并删除。')) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (err) {}
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>旅游产品管理</h1>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>
          + 新建产品
        </button>
      </div>

      <div className="card">
        {products.length === 0 ? (
          <div className="empty-state">暂无产品，请点击"新建产品"添加</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>线路名称</th>
                <th>行程天数</th>
                <th>出发城市</th>
                <th>目的地</th>
                <th>成团人数</th>
                <th>价格</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/products/${p.id}`)}>
                  <td><strong>{p.route_name}</strong></td>
                  <td>{p.days}天</td>
                  <td>{p.departure_city}</td>
                  <td>{p.destination}</td>
                  <td>最多{p.max_group_size}人</td>
                  <td>
                    {p.prices && p.prices.length > 0 ? (
                      p.prices.filter(pr => pr).map(pr => (
                        <span key={pr.id} style={{ marginRight: 8 }}>
                          {pr.room_type}: ¥{pr.price}
                        </span>
                      ))
                    ) : '未设置'}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-default" style={{ marginRight: 8 }}
                      onClick={() => navigate(`/products/${p.id}/edit`)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(p.id, e)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProductList;
