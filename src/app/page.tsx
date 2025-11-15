'use client';
import { App, Button } from 'antd';

export default function Home() {
  const { notification } = App.useApp();
  return (
    <Button
      type='primary'
      onClick={() =>
        notification.success({
          message: 'Success',
          description: 'This is a success notification.',
        })
      }
    >
      Ant Design Button
    </Button>
  );
}

