CREATE TABLE IF NOT EXISTS tour_products (
  id SERIAL PRIMARY KEY,
  route_name VARCHAR(200) NOT NULL,
  days INTEGER NOT NULL,
  departure_city VARCHAR(100) NOT NULL,
  destination VARCHAR(200) NOT NULL,
  max_group_size INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_itineraries (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES tour_products(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  attractions TEXT,
  meals TEXT,
  accommodation VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_prices (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES tour_products(id) ON DELETE CASCADE,
  room_type VARCHAR(50) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, room_type)
);

CREATE TABLE IF NOT EXISTS tour_groups (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES tour_products(id) ON DELETE CASCADE,
  group_code VARCHAR(50) NOT NULL UNIQUE,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  max_group_size INTEGER NOT NULL DEFAULT 30,
  current_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tourists (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES tour_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  id_card VARCHAR(18) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  special_requirements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS flight_bookings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES tour_groups(id) ON DELETE CASCADE,
  flight_no VARCHAR(50) NOT NULL,
  seat_count INTEGER NOT NULL,
  seat_price DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hotel_bookings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES tour_groups(id) ON DELETE CASCADE,
  hotel_name VARCHAR(200) NOT NULL,
  room_type VARCHAR(50) NOT NULL,
  room_count INTEGER NOT NULL,
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  room_price DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS local_agency_bookings (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES tour_groups(id) ON DELETE CASCADE,
  agency_name VARCHAR(200) NOT NULL,
  guide_name VARCHAR(100),
  vehicle_info TEXT,
  meal_info TEXT,
  total_cost DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_itineraries_product ON daily_itineraries(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_product ON product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_groups_product ON tour_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_tourists_group ON tourists(group_id);
CREATE INDEX IF NOT EXISTS idx_flights_group ON flight_bookings(group_id);
CREATE INDEX IF NOT EXISTS idx_hotels_group ON hotel_bookings(group_id);
CREATE INDEX IF NOT EXISTS idx_local_agency_group ON local_agency_bookings(group_id);
