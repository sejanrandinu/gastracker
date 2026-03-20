-- Cloudflare D1 Schema for Gas/Fuel Tracker

CREATE TABLE IF NOT EXISTS stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('shed', 'dealer')) NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS updates (
  id TEXT PRIMARY KEY,
  station_id TEXT NOT NULL,
  item_type TEXT CHECK(item_type IN ('litro', 'laugfs', 'petrol', 'diesel', 'kerosene')) NOT NULL,
  queue_status TEXT CHECK(queue_status IN ('very_long', 'normal', 'short', 'no_queue')) NOT NULL,
  units_available INTEGER DEFAULT 0, -- Specific for Gas
  photo_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Initial Mock Data
INSERT INTO stations (id, name, type, lat, lng, address) VALUES 
('s1', 'Colombo Gas Center', 'dealer', 6.9271, 79.8612, '123 Main St, Colombo'),
('s2', 'Lanka Fuel Shed - Cinnamon Gardens', 'shed', 6.9126, 79.8646, 'Gregorys Rd, Colombo 7'),
('s3', 'Petrol Shed - Kollupitiya', 'shed', 6.9100, 79.8510, 'Galle Road, Colombo 3');

INSERT INTO updates (id, station_id, item_type, queue_status, photo_url) VALUES
('u1', 's1', 'litro', 'normal', 'https://placeholder.com/photo1'),
('u2', 's2', 'petrol', 'very_long', 'https://placeholder.com/photo2');
