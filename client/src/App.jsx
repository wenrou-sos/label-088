import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ProductList from './pages/ProductList.jsx';
import ProductForm from './pages/ProductForm.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import GroupList from './pages/GroupList.jsx';
import GroupDetail from './pages/GroupDetail.jsx';
import OperationPage from './pages/OperationPage.jsx';
import FinancePage from './pages/FinancePage.jsx';
import NoticePage from './pages/NoticePage.jsx';

function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>旅行社操作平台</h2>
        <nav>
          <ul>
            <li>
              <NavLink to="/products" className={({ isActive }) => isActive ? 'active' : ''}>
                旅游产品管理
              </NavLink>
            </li>
            <li>
              <NavLink to="/groups" className={({ isActive }) => isActive ? 'active' : ''}>
                团队收客管理
              </NavLink>
            </li>
            <li>
              <NavLink to="/operations" className={({ isActive }) => isActive ? 'active' : ''}>
                计调操作
              </NavLink>
            </li>
            <li>
              <NavLink to="/finance" className={({ isActive }) => isActive ? 'active' : ''}>
                收入成本分析
              </NavLink>
            </li>
            <li>
              <NavLink to="/notices" className={({ isActive }) => isActive ? 'active' : ''}>
                出团通知书
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          <Route path="/groups" element={<GroupList />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/operations" element={<OperationPage />} />
          <Route path="/operations/:groupId" element={<OperationPage />} />
          <Route path="/finance" element={<FinancePage />} />
          <Route path="/finance/:groupId" element={<FinancePage />} />
          <Route path="/notices" element={<NoticePage />} />
          <Route path="/notices/:groupId" element={<NoticePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
