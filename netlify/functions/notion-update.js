import { Client } from '@notionhq/client';

export const handler = async (event) => {
  // 處理 CORS 預檢請求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  // 只允許 POST 請求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { pageId, properties } = JSON.parse(event.body);

    if (!pageId || !properties) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing pageId or properties' })
      };
    }

    const notion = new Client({ auth: process.env.VITE_NOTION_API_KEY });

    const response = await notion.pages.update({
      page_id: pageId,
      properties: properties,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Notion API Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to update Notion page', details: JSON.stringify(error) })
    };
  }
};
