import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    route_name: '',
    days: 5,
    departure_city: '',
    destination: '',
    max_group_size: 30,
    description: ''
  });
  const [itineraries, setItineraries] = useState([]);
  const [prices, setPrices] = useState([
    { room_type: '双人房', price: '' },
    { room_type: '三人房', price: '' },
    { room_type: '儿童不占床', price: '' }
  ]);

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    } else {
      initItineraries(5);
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await api.get(`/products/${id}`);
      setForm({
        route_name: data.route_name,
        days: data.days,
        departure_city: data.departure_city,
        destination: data.destination,
        max_group_size: data.max_group_size,
        description: data.description || ''
      });
      setItineraries(data.itineraries || []);
      if (data.prices && data.prices.length > 0) {
        setPrices(data.prices.map(p => ({ room_type: p.room_type, price: p.price })));
      }
    } catch (err) {}
  };

  const initItineraries = (days) => {
    const list = [];
    for (let i = 1; i <= days; i++) {
      list.push({ day_number: i, title: `第${i}天`, attractions: '', meals: '', accommodation: '', notes: '' });
    }
    setItineraries(list);
  };

  const handleDaysChange = (e) => {
    const newDays = parseInt(e.target.value) || 1;
    setForm({ ...form, days: newDays });
    setItineraries(prev => {
      if (newDays > prev.length) {
        const appended = [...prev];
        for (let i = prev.length + 1; i <= newDays; i++) {
          appended.push({ day_number: i, title: `第${i}天`, attractions: '', meals: '', accommodation: '', notes: '' });
        }
        return appended;
      } else if (newDays < prev.length) {
        return prev.slice(0, newDays);
      }
      return prev;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.route_name || !form.departure_city || !form.destination) {
      alert('请填写线路名称、出发城市和目的地');
      return;
    }

    const mergedPrices = [];
    const seen = new Map();
    for (let i = prices.length - 1; i >= 0; i--) {
      const pr = prices[i];
      if (!seen.has(pr.room_type)) {
        seen.set(pr.room_type, true);
        mergedPrices.unshift(pr);
      }
    }
    if (mergedPrices.length !== prices.length) {
      alert('检测到重复房型，已自动保留最后填写的价格条目');
    }

    try {
      if (isEdit) {
        await api.put(`/products/${id}`, { ...form, itineraries, prices: mergedPrices });
        alert('产品更新成功');
      } else {
        await api.post('/products', { ...form, itineraries, prices: mergedPrices });
        alert('产品创建成功');
      }
      navigate('/products');
    } catch (err) {}
  };

  return (
    <div>
      <div className="page-header">
        <h1>{isEdit ? '编辑旅游产品' : '新建旅游产品'}</h1>
        <button className="btn btn-default" onClick={() => navigate('/products')}>返回</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>基本信息</h3>
          <div className="form-row">
            <div className="form-group">
              <label>线路名称 *</label>
              <input type="text" value={form.route_name}
                onChange={e => setForm({ ...form, route_name: e.target.value })}
                placeholder="如：北京-海南三亚5日游" />
            </div>
            <div className="form-group">
              <label>行程天数 *</label>
              <input type="number" min="1" value={form.days} onChange={handleDaysChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>出发城市 *</label>
              <input type="text" value={form.departure_city}
                onChange={e => setForm({ ...form, departure_city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>目的地 *</label>
              <input type="text" value={form.destination}
                onChange={e => setForm({ ...form, destination: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>最大成团人数</label>
              <input type="number" min="1" value={form.max_group_size}
                onChange={e => setForm({ ...form, max_group_size: parseInt(e.target.value) || 30 })} />
            </div>
            <div className="form-group">
              <label>产品描述</label>
              <input type="text" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>各日行程安排</h3>
          {itineraries.map((it, idx) => (
            <div key={idx} className="itinerary-day">
              <div className="form-row">
                <div className="form-group">
                  <label>第{it.day_number}天 - 标题</label>
                  <input type="text" value={it.title}
                    onChange={e => {
                      const list = [...itineraries];
                      list[idx].title = e.target.value;
                      setItineraries(list);
                    }} />
                </div>
                <div className="form-group">
                  <label>住宿</label>
                  <input type="text" value={it.accommodation}
                    onChange={e => {
                      const list = [...itineraries];
                      list[idx].accommodation = e.target.value;
                      setItineraries(list);
                    }} />
                </div>
              </div>
              <div className="form-group">
                <label>景点安排</label>
                <textarea rows="2" value={it.attractions}
                  onChange={e => {
                    const list = [...itineraries];
                    list[idx].attractions = e.target.value;
                    setItineraries(list);
                  }} />
              </div>
              <div className="form-group">
                <label>用餐安排</label>
                <input type="text" value={it.meals}
                  onChange={e => {
                    const list = [...itineraries];
                    list[idx].meals = e.target.value;
                    setItineraries(list);
                  }} placeholder="如：早中晚" />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>价格设置</h3>
          {prices.map((pr, idx) => (
            <div key={idx} className="price-row">
              <div className="form-group">
                <label>房型</label>
                <select value={pr.room_type}
                  onChange={e => {
                    const list = [...prices];
                    list[idx].room_type = e.target.value;
                    setPrices(list);
                  }}>
                  <option value="双人房">双人房</option>
                  <option value="三人房">三人房</option>
                  <option value="儿童不占床">儿童不占床</option>
                </select>
              </div>
              <div className="form-group">
                <label>价格 (¥)</label>
                <input type="number" min="0" step="0.01" value={pr.price}
                  onChange={e => {
                    const list = [...prices];
                    list[idx].price = e.target.value;
                    setPrices(list);
                  }} />
              </div>
              {prices.length > 1 && (
                <button type="button" className="btn btn-sm btn-danger"
                  onClick={() => setPrices(prices.filter((_, i) => i !== idx))}>
                  删除
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-sm btn-default"
            onClick={() => setPrices([...prices, { room_type: '双人房', price: '' }])}>
            + 添加价格
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-default" onClick={() => navigate('/products')}>取消</button>
          <button type="submit" className="btn btn-primary">{isEdit ? '保存修改' : '创建产品'}</button>
        </div>
      </form>
    </div>
  );
}

export default ProductForm;
