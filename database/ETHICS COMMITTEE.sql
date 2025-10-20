CREATE TABLE super_admin(
super_admin_id SERIAL primary key,
password TEXT,
first_name VARCHAR(25),
last_name VARCHAR(25),
email VARCHAR(255) UNIQUE,
notification_interval INT
);



CREATE TABLE researcher(
researcher_id SERIAL primary key,
password TEXT,
first_name VARCHAR(25),
last_name VARCHAR(25),
age INT,
email VARCHAR(255) UNIQUE,
department INT REFERENCES department(department_id),
acc_create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
;



CREATE TABLE faculty(
faculty_id SERIAL primary key,
name VARCHAR(150),
email VARCHAR(255) UNIQUE
);



CREATE TABLE documents(
documents_id SERIAL primary key,
application_id INT REFERENCES application(application_id),
file_name varchar(255),
file_type varchar(150),
file_url TEXT,
submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE department(
department_id SERIAL primary key,
email varchar(255),
faculty_id INT REFERENCES faculty(faculty_id)
);



CREATE TABLE committee(
committee_id SERIAL primary key,
password TEXT,
f_name VARCHAR(25),
l_name VARCHAR(25)
);



CREATE TABLE application(
application_id SERIAL primary key,
researcher_id INT REFERENCES researcher(researcher_id),
department_id INT REFERENCES department(department_id),
committee_id INT REFERENCES committee(committee_id),
title VARCHAR(255),
description TEXT,
status BOOLEAN,
submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



CREATE TABLE admins(
    admin_id SERIAL PRIMARY KEY,
    password TEXT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    notification_interval INT,
    super_admin_id INT REFERENCES super_admin(super_admin_id)  -- link to super_admin
);