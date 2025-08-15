import { Client } from '@notionhq/client';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { updates } = JSON.parse(event.body);
    const notion = new Client({ auth: process.env.VITE_NOTION_API_KEY });

    if (!updates || !Array.isArray(updates)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid updates array' }) };
    }

    const results = [];
    for (const update of updates) {
      console.log(`Processing update for pageId: ${update.pageId}`);
      try {
        const response = await notion.pages.update({
          page_id: update.pageId,
          properties: update.properties,
        });
        results.push({ success: true, pageId: update.pageId, response });
      } catch (error) {
        console.error(`Error updating Notion page ${update.pageId}:`, error);
        results.push({ success: false, pageId: update.pageId, error: error.message });
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bulk update processed', results }),
    };
  } catch (error) {
    console.error('Error in notion-bulk-update function:', error);
    console.error('Full error object in catch block:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to process bulk update', details: error.message }),
    };
  }
};