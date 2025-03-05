CREATE DATABASE IF NOT EXISTS graphic_solutions_db; --created a database

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'server_admin';
FLUSH PRIVILEGES; --to reset the password


USE graphic_solutions_db;

--created a table for user accounts
CREATE TABLE user_account_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--created a table for admin accounts
CREATE TABLE admin_account_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    contact_number VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);