-- Структура финансовой базы Appina (data/finance.db). Только схема, без данных.
-- Снято 2026-09-11

CREATE TABLE admin_requests (
	id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	username VARCHAR(200) NOT NULL, 
	status VARCHAR(20), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE audit_logs (
	id INTEGER NOT NULL, 
	user_id INTEGER, 
	username VARCHAR(50), 
	action VARCHAR(50) NOT NULL, 
	resource VARCHAR(50), 
	resource_id INTEGER, 
	details TEXT, 
	ip_address VARCHAR(45), 
	timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE capex_projects (
	id INTEGER NOT NULL, 
	customer_name VARCHAR(200) NOT NULL, 
	project_name VARCHAR(200) NOT NULL, 
	total_amount FLOAT, 
	advance_percentage FLOAT, 
	advance_amount FLOAT, 
	advance_payment_date VARCHAR(10), 
	remaining_amount_1 FLOAT, 
	remaining_payment_date_1 VARCHAR(10), 
	remaining_amount_2 FLOAT, 
	remaining_payment_date_2 VARCHAR(10), 
	status VARCHAR(30), 
	notes TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_conversations (
	id INTEGER NOT NULL, 
	kind VARCHAR(10), 
	title VARCHAR(120), 
	accent VARCHAR(20), 
	created_by_id INTEGER, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_events (
	id INTEGER NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	kind VARCHAR(24) NOT NULL, 
	data TEXT NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_messages (
	id INTEGER NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	sender_id INTEGER NOT NULL, 
	kind VARCHAR(12), 
	text TEXT, 
	attachment_url VARCHAR(300), 
	attachment_name VARCHAR(200), 
	file_size INTEGER, 
	media_duration FLOAT, 
	reply_to_id INTEGER, 
	is_edited BOOLEAN, 
	is_deleted BOOLEAN, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_participants (
	id INTEGER NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	is_admin BOOLEAN, 
	last_read_at DATETIME, 
	joined_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE chat_reactions (
	id INTEGER NOT NULL, 
	message_id INTEGER NOT NULL, 
	user_id INTEGER NOT NULL, 
	emoji VARCHAR(16) NOT NULL, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE company_numbers (
	id INTEGER NOT NULL, 
	date_range VARCHAR(50) NOT NULL, 
	gsm_number VARCHAR(20) NOT NULL, 
	employee_name VARCHAR(100) NOT NULL, 
	total_amount FLOAT, 
	tariff_plan VARCHAR(100), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE contracts (
	id INTEGER NOT NULL, 
	contract_no VARCHAR(100) NOT NULL, 
	customer VARCHAR(200) NOT NULL, 
	validity VARCHAR(200) NOT NULL, 
	classification VARCHAR(100), 
	link VARCHAR(500), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE equipment_services (
	id INTEGER NOT NULL, 
	customer_name VARCHAR(200) NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	status VARCHAR(20), 
	amount FLOAT, 
	description TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE invite_codes (
	id INTEGER NOT NULL, 
	code VARCHAR(20) NOT NULL, 
	created_by_id INTEGER NOT NULL, 
	is_used BOOLEAN, 
	used_by_id INTEGER, 
	expires_at DATETIME, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE license_payments (
	id INTEGER NOT NULL, 
	customer_name VARCHAR(200) NOT NULL, 
	month VARCHAR(7) NOT NULL, 
	amount FLOAT, 
	status VARCHAR(50), 
	notes TEXT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE nagd_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      category TEXT,
      source TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

CREATE TABLE omid_alis (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	total_amount FLOAT, 
	total_with_vat FLOAT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE omid_alis_items (
	id INTEGER NOT NULL, 
	omid_alis_id INTEGER NOT NULL, 
	row_number INTEGER NOT NULL, 
	product_name VARCHAR(500) NOT NULL, 
	quantity FLOAT, 
	unit VARCHAR(20), 
	unit_price FLOAT, 
	amount FLOAT, 
	amount_with_vat FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(omid_alis_id) REFERENCES omid_alis (id) ON DELETE CASCADE
);

CREATE TABLE omid_balance_income (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	amount FLOAT, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE users (
	id INTEGER NOT NULL, 
	username VARCHAR(50) NOT NULL, 
	email VARCHAR(120) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(100), 
	role VARCHAR(20), 
	is_active BOOLEAN, 
	is_superuser BOOLEAN, 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	last_login DATETIME, can_edit BOOLEAN DEFAULT 0, 
	PRIMARY KEY (id)
);

CREATE TABLE yango_reports (
	id INTEGER NOT NULL, 
	date VARCHAR(10) NOT NULL, 
	user VARCHAR(100) NOT NULL, 
	pickup VARCHAR(500) NOT NULL, 
	destination VARCHAR(500) NOT NULL, 
	fare FLOAT, 
	trip_type VARCHAR(50), 
	purpose VARCHAR(500), 
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
	PRIMARY KEY (id)
);

CREATE INDEX ix_admin_requests_id ON admin_requests (id);

CREATE INDEX ix_audit_logs_id ON audit_logs (id);

CREATE INDEX ix_capex_projects_customer_name ON capex_projects (customer_name);

CREATE INDEX ix_capex_projects_id ON capex_projects (id);

CREATE INDEX ix_chat_conversations_created_by_id ON chat_conversations (created_by_id);

CREATE INDEX ix_chat_conversations_id ON chat_conversations (id);

CREATE INDEX ix_chat_events_conversation_id ON chat_events (conversation_id);

CREATE INDEX ix_chat_events_id ON chat_events (id);

CREATE INDEX ix_chat_messages_conversation_id ON chat_messages (conversation_id);

CREATE INDEX ix_chat_messages_id ON chat_messages (id);

CREATE INDEX ix_chat_messages_sender_id ON chat_messages (sender_id);

CREATE INDEX ix_chat_participants_conversation_id ON chat_participants (conversation_id);

CREATE INDEX ix_chat_participants_id ON chat_participants (id);

CREATE INDEX ix_chat_participants_user_id ON chat_participants (user_id);

CREATE INDEX ix_chat_reactions_id ON chat_reactions (id);

CREATE INDEX ix_chat_reactions_message_id ON chat_reactions (message_id);

CREATE INDEX ix_chat_reactions_user_id ON chat_reactions (user_id);

CREATE INDEX ix_company_numbers_date_range ON company_numbers (date_range);

CREATE INDEX ix_company_numbers_id ON company_numbers (id);

CREATE INDEX ix_contracts_contract_no ON contracts (contract_no);

CREATE INDEX ix_contracts_id ON contracts (id);

CREATE INDEX ix_equipment_services_customer_name ON equipment_services (customer_name);

CREATE INDEX ix_equipment_services_id ON equipment_services (id);

CREATE UNIQUE INDEX ix_invite_codes_code ON invite_codes (code);

CREATE INDEX ix_invite_codes_id ON invite_codes (id);

CREATE INDEX ix_license_payments_customer_name ON license_payments (customer_name);

CREATE INDEX ix_license_payments_id ON license_payments (id);

CREATE INDEX ix_omid_alis_date ON omid_alis (date);

CREATE INDEX ix_omid_alis_id ON omid_alis (id);

CREATE INDEX ix_omid_alis_items_id ON omid_alis_items (id);

CREATE INDEX ix_omid_alis_items_omid_alis_id ON omid_alis_items (omid_alis_id);

CREATE INDEX ix_omid_balance_income_date ON omid_balance_income (date);

CREATE INDEX ix_omid_balance_income_id ON omid_balance_income (id);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX ix_users_id ON users (id);

CREATE UNIQUE INDEX ix_users_username ON users (username);

CREATE INDEX ix_yango_reports_date ON yango_reports (date);

CREATE INDEX ix_yango_reports_id ON yango_reports (id);
