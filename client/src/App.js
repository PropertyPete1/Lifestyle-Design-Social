import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AutoPost from './pages/AutoPost';
import Posts from './pages/Posts';
import Videos from './pages/Videos';
import Analytics from './pages/Analytics';
import InstagramLearning from './pages/InstagramLearning';
import Settings from './pages/Settings';
import CartoonGallery from './pages/CartoonGallery';

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <ErrorBoundary>
                  <Dashboard />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/auto-post"
            element={
              <Layout>
                <ErrorBoundary>
                  <AutoPost />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/posts"
            element={
              <Layout>
                <ErrorBoundary>
                  <Posts />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/videos"
            element={
              <Layout>
                <ErrorBoundary>
                  <Videos />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/analytics"
            element={
              <Layout>
                <ErrorBoundary>
                  <Analytics />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/instagram-learning"
            element={
              <Layout>
                <ErrorBoundary>
                  <InstagramLearning />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <ErrorBoundary>
                  <Settings />
                </ErrorBoundary>
              </Layout>
            }
          />
          <Route
            path="/cartoons"
            element={
              <Layout>
                <ErrorBoundary>
                  <CartoonGallery />
                </ErrorBoundary>
              </Layout>
            }
          />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App; 