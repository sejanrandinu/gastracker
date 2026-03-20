export async function onRequestGet(context) {
  const { env } = context;
  const { DB } = env;

  try {
    // Join stations with their most recent update for each item_type
    const query = `
      SELECT 
        s.*,
        u.item_type,
        u.queue_status,
        u.units_available,
        u.photo_url,
        u.created_at as last_update
      FROM stations s
      LEFT JOIN (
        SELECT * FROM updates 
        WHERE id IN (
          SELECT id FROM (
            SELECT id, station_id, item_type, ROW_NUMBER() OVER(PARTITION BY station_id, item_type ORDER BY created_at DESC) as rn
            FROM updates
          ) WHERE rn = 1
        )
      ) u ON s.id = u.station_id
    `;

    const result = await DB.prepare(query).all();
    
    // Group by station
    const stations = {};
    result.results.forEach(row => {
      if (!stations[row.id]) {
        stations[row.id] = {
          id: row.id,
          name: row.name,
          type: row.type,
          lat: row.lat,
          lng: row.lng,
          address: row.address,
          items: {}
        };
      }
      if (row.item_type) {
        stations[row.id].items[row.item_type] = {
          status: row.queue_status,
          units: row.units_available,
          photo: row.photo_url,
          updated: row.last_update
        };
      }
    });

    return new Response(JSON.stringify(Object.values(stations)), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
