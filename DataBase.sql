CREATE DATABASE urgentflow;
USE urgentflow;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (email, password)
VALUES ('test@gmail.com', '123456');
CREATE TABLE hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  services TEXT
);
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  hospital_id INT,
  service VARCHAR(255),
  appointment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  city VARCHAR(100),
  address VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_type VARCHAR(5),
  diseases TEXT,
  allergies TEXT,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users 
ADD reset_code VARCHAR(10),
ADD reset_code_expiry DATETIME;
CREATE TABLE password_resets (
  email VARCHAR(255),
  code INT,
  expires_at BIGINT
);
ALTER TABLE users 
DROP COLUMN reset_code,
DROP COLUMN reset_code_expiry;

CREATE DATABASE urgentflow;
USE urgentflow;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO users (email, password)
VALUES ('test@gmail.com', '123456');
CREATE TABLE hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  location VARCHAR(255),
  services TEXT
);
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE users;
SET FOREIGN_KEY_CHECKS = 1;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  city VARCHAR(100),
  address VARCHAR(255),
  date_of_birth DATE,
  gender VARCHAR(10),
  blood_type VARCHAR(5),
  diseases TEXT,
  allergies TEXT,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users 
ADD reset_code VARCHAR(10),
ADD reset_code_expiry DATETIME;
CREATE TABLE password_resets (
  email VARCHAR(255),
  code INT,
  expires_at BIGINT
);
DROP TABLE appointments;
DROP TABLE hospitals;

CREATE TABLE hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  type ENUM('hospital','clinic','pharmacy'),
  city VARCHAR(100),
  address VARCHAR(255),
  lat DECIMAL(10,8),
  lng DECIMAL(11,8),
  services TEXT,
  isOpenNow BOOLEAN DEFAULT false,
  is24_7 BOOLEAN DEFAULT false,
  hasEmergency BOOLEAN DEFAULT false
);
INSERT INTO hospitals 
(name, type, city, address, lat, lng, services, isOpenNow, is24_7, hasEmergency)
VALUES
('Central Hospital', 'hospital', 'Sousse', 'Main Street', 35.8256, 10.6084, 'Cardiology,Emergency', false, false, false),
('City Clinic', 'clinic', 'Sousse', 'Rue 2', 35.8300, 10.6400, 'Dermatology', true, false, false),
('fuck Hospital', 'clinic', 'Tunis', 'Main Street', 35.8256, 10.6084, 'Cardiology,Emergency', false, true, true),
('PharmaPlus', 'pharmacy', 'Sousse', 'Avenue 5', 35.8200, 10.6200, 'Medicine', true, true, false);
CREATE TABLE appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  hospital_id INT,
  service VARCHAR(255),
  appointment_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

SELECT * FROM users;

ALTER TABLE appointments 
ADD status ENUM('waiting','in_progress','done','cancelled') DEFAULT 'waiting',
ADD turn_number INT,
ADD estimated_time INT; 

ALTER TABLE appointments DROP FOREIGN KEY appointments_ibfk_2;
ALTER TABLE hospitals MODIFY id VARCHAR(255);
ALTER TABLE appointments MODIFY hospital_id VARCHAR(255);
ALTER TABLE appointments 
ADD CONSTRAINT appointments_ibfk_2 
FOREIGN KEY (hospital_id) REFERENCES hospitals(id);


USE urgentflow;

CREATE TABLE IF NOT EXISTS appointment_followups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  related_appointment_id VARCHAR(255) NULL,
  user_id INT NOT NULL,
  hospital_id VARCHAR(255) NULL,
  hospital_name VARCHAR(255) NULL,
  service VARCHAR(255) NOT NULL,
  appointment_date DATE NOT NULL,
  slot_time VARCHAR(20) NULL,
  status VARCHAR(40) DEFAULT 'upcoming',
  turn_number INT DEFAULT 0,
  estimated_time INT DEFAULT 0,
  source_type VARCHAR(60) DEFAULT 'admin-follow-up',
  scheduled_by VARCHAR(60) DEFAULT 'admin',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  language VARCHAR(10) DEFAULT 'en',
  sms_alerts TINYINT(1) DEFAULT 1,
  email_alerts TINYINT(1) DEFAULT 1,
  reminder_window VARCHAR(10) DEFAULT '10',
  privacy_mode TINYINT(1) DEFAULT 0,
  marketing_updates TINYINT(1) DEFAULT 0,
  dark_mode TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  appointment_id VARCHAR(255) NULL,
  channel VARCHAR(30) DEFAULT 'in_app',
  kind VARCHAR(50) DEFAULT 'appointment',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  delivery_status VARCHAR(30) DEFAULT 'delivered',
  trigger_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  hospital_id VARCHAR(255) NULL,
  hospital_name VARCHAR(255) NULL,
  city VARCHAR(100) NULL,
  patient_name VARCHAR(255) NULL,
  patient_phone VARCHAR(50) NULL,
  patient_email VARCHAR(255) NULL,
  status VARCHAR(40) DEFAULT 'new',
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE appointments
  MODIFY hospital_id VARCHAR(255);

ALTER TABLE appointments
  MODIFY status ENUM('waiting','in_progress','done','cancelled') DEFAULT 'waiting';
  
  INSERT INTO users (fullName, email, password, city)
VALUES ('System Admin', 'admin@urgentflow.com', 'admin123', 'Sousse');

ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';

-- Update your admin user to have the admin role
UPDATE users SET role = 'admin' WHERE email = 'admin@urgentflow.com';
  INSERT INTO users (fullName, email, password, city)
VALUES ('System Admin', 'admin+emergency@urgentflow.com', 'adminEmergency123', 'Tunis');

USE urgentflow;

CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
ALTER TABLE hospitals MODIFY id VARCHAR(255) COLLATE utf8mb4_unicode_ci;
ALTER TABLE appointments MODIFY hospital_id VARCHAR(255) COLLATE utf8mb4_unicode_ci;
ALTER TABLE appointment_followups MODIFY hospital_id VARCHAR(255) COLLATE utf8mb4_unicode_ci;
ALTER TABLE hospitals MODIFY city VARCHAR(100) COLLATE utf8mb4_unicode_ci;
ALTER TABLE users MODIFY city VARCHAR(100) COLLATE utf8mb4_unicode_ci;
SELECT * FROM feedback;
SELECT * FROM users;

