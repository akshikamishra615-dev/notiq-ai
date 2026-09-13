import serverless from 'serverless-http';
import app from '../../server/index';

const serverlessHandler = serverless(app);

export const handler = async (event: any, context: any) => {
  try {
    const result = await serverlessHandler(event, context);
    return result;
  } catch (err: any) {
    console.error('[Netlify Function Handler Execution Error]:', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
      body: JSON.stringify({
        error: 'Internal Serverless Execution Error',
        details: err?.message || String(err),
      }),
    };
  }
};
