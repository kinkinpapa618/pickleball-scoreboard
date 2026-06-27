// Override global fetch for tests to mock API endpoints
global.fetch = (async (url: any, options: any) => {
  if (typeof url === 'string' && url.includes('/api/notifications')) {
    // Return mock notifications list
    return {
      ok: true,
      json: async () => [
        {
          id: 1,
          userId: 1,
          type: 'chat',
          title: 'Test',
          message: 'Message',
          read: false,
          link: null,
          data: null,
          createdAt: new Date().toISOString(),
        },
      ],
    };
  }
  // Default mock response
  return { ok: true, json: async () => ({}) };
}) as any;
