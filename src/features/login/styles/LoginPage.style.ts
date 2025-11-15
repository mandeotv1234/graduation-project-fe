import { Button, Card, Form } from 'antd';
import styled from 'styled-components';

export const LoginContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

export const StyledCard = styled(Card)`
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);

  .ant-card-head {
    text-align: center;
    border-bottom: none;
    padding: 20px 24px 0;

    .ant-card-head-title {
      font-size: 24px;
      font-weight: 600;
      color: #1890ff;
    }
  }

  .ant-card-body {
    padding: 24px;
  }
`;

export const FormItem = styled(Form.Item)`
  margin-bottom: 16px;

  .ant-form-item-label {
    padding: 0 0 4px;

    label {
      font-weight: 500;
      color: #444;
    }
  }

  .ant-input-affix-wrapper {
    padding: 10px 15px;
    border-radius: 8px;

    &:hover,
    &:focus,
    &:focus-within {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
`;

export const SubmitButton = styled(Button)`
  width: 100%;
  height: 42px;
  font-weight: 500;
  font-size: 16px;
  border-radius: 8px;
  background: #1890ff;
  border: none;
  margin-top: 8px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;

  &:hover {
    background: #40a9ff;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  &[data-loading='true']::after {
    content: '';
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.6);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    display: inline-block;
    margin-left: 6px;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
