-- ─────────────────────────────────────────────────────────────────────────────
--  Step 1: Add role + service_scope columns if they don't exist yet
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'patient',
  ADD COLUMN IF NOT EXISTS service_scope VARCHAR(100) DEFAULT '';

-- ─────────────────────────────────────────────────────────────────────────────
--  Step 2: Insert all admin accounts
--  Passwords:  Admin123!  (all service admins)
--              SuperAdmin123!  (super admin)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO users (fullName, email, phone, city, password, role, service_scope) VALUES
('Super Admin',               'superadmin@urgentflow.com',              '20000000', 'Tunis', '$2b$10$4/q6OJd3sxSFCbuzgBAk6.AiVutqavKGkpPXKAbvYgTa7l3YY.jdS', 'super_admin', ''),
('Emergency Admin',           'admin.emergency@urgentflow.com',         '20000001', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Emergency'),
('Cardiology Admin',          'admin.cardiology@urgentflow.com',        '20000002', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Cardiology'),
('Endocrinology Admin',       'admin.endocrinology@urgentflow.com',     '20000003', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Endocrinology'),
('Gastroenterology Admin',    'admin.gastro@urgentflow.com',            '20000004', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Gastroenterology'),
('Pulmonology Admin',         'admin.pulmonology@urgentflow.com',       '20000005', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Pulmonology'),
('Nephrology Admin',          'admin.nephrology@urgentflow.com',        '20000006', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Nephrology'),
('Rheumatology Admin',        'admin.rheumatology@urgentflow.com',      '20000007', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Rheumatology'),
('Hematology Admin',          'admin.hematology@urgentflow.com',        '20000008', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Hematology'),
('Infectious Diseases Admin', 'admin.infectious@urgentflow.com',        '20000009', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Infectious Diseases'),
('General Medicine Admin',    'admin.generalmedicine@urgentflow.com',   '20000010', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'General Medicine'),
('Family Medicine Admin',     'admin.familymedicine@urgentflow.com',    '20000011', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Family Medicine'),
('Pediatrics Admin',          'admin.pediatrics@urgentflow.com',        '20000012', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Pediatrics'),
('General Surgery Admin',     'admin.surgery@urgentflow.com',           '20000013', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'General Surgery'),
('Orthopedic Surgery Admin',  'admin.orthopedics@urgentflow.com',       '20000014', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Orthopedic Surgery'),
('Neurosurgery Admin',        'admin.neurosurgery@urgentflow.com',      '20000015', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Neurosurgery'),
('Cardiothoracic Admin',      'admin.cardiothoracic@urgentflow.com',    '20000016', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Cardiothoracic Surgery'),
('Plastic Surgery Admin',     'admin.plasticsurgery@urgentflow.com',    '20000017', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Plastic Surgery'),
('Vascular Surgery Admin',    'admin.vascular@urgentflow.com',          '20000018', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Vascular Surgery'),
('Urology Admin',             'admin.urology@urgentflow.com',           '20000019', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Urology'),
('ENT Admin',                 'admin.ent@urgentflow.com',               '20000020', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'ENT'),
('Dentistry Admin',           'admin.dentistry@urgentflow.com',         '20000021', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Dentistry'),
('Dermatology Admin',         'admin.dermatology@urgentflow.com',       '20000022', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Dermatology'),
('Radiology Admin',           'admin.radiology@urgentflow.com',         '20000023', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Radiology'),
('Anesthesiology Admin',      'admin.anesthesiology@urgentflow.com',    '20000024', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Anesthesiology'),
('Oncology Admin',            'admin.oncology@urgentflow.com',          '20000025', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Oncology'),
('Pathology Admin',           'admin.pathology@urgentflow.com',         '20000026', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Pathology'),
('Nutrition Admin',           'admin.nutrition@urgentflow.com',         '20000027', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Nutrition'),
('Pharmacy Admin',            'admin.pharmacy@urgentflow.com',          '20000028', 'Tunis', '$2b$10$mmuDXyrp9j38NplJxJDhg.2Q2ioggn2GFm..RpsuTuyBd4Q8XReUW', 'admin',       'Pharmacy')
ON DUPLICATE KEY UPDATE
  role = VALUES(role),
  service_scope = VALUES(service_scope),
  password = VALUES(password);

-- ─────────────────────────────────────────────────────────────────────────────
--  Step 3: Fix any old accounts that have role='user' instead of 'patient'
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE users SET role = 'patient' WHERE role = 'user';

-- Verify
SELECT email, role, service_scope FROM users WHERE role != 'patient';
