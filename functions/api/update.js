export async function onRequestPost(context) {
  const { env, request } = context;
  const { DB } = env;

  try {
    const data = await request.json();
    const { station_id, item_type, queue_status, photo_url, units_available } = data;

    if (!station_id || !item_type || !queue_status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = crypto.randomUUID();

    await DB.prepare(`
      INSERT INTO updates (id, station_id, item_type, queue_status, units_available, photo_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(id, station_id, item_type, queue_status, units_available || 0, photo_url || null).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
