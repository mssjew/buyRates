export default async (req) => {
  const API_KEY = process.env.MASSIVE_API_KEY;
  
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol') || 'XAU';
  
  // Only allow XAU and XAG
  if (!['XAU', 'XAG'].includes(symbol)) {
    return new Response(JSON.stringify({ error: 'Invalid symbol' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const res = await fetch(
      `https://api.massive.com/v1/last_quote/currencies/${symbol}/USD?apiKey=${API_KEY}`
    );
    const data = await res.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'max-age=5'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
