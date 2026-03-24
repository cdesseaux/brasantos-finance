-- Drop unique constraints on name for clients and suppliers.
-- These tables can have multiple entries with the same short name
-- across different companies (e.g. "ADM" for BRASANTOS, JJB SERV, JJB ADM).

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_name_key;
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_name_key;
