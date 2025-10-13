-- this is a dummy schema file for setting up the database schema --- IGNORE ---

CREATE TABLE researchers (
    researcher_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100),
    faculty_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faculty (
    faculty_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dean_name VARCHAR(100)
);

CREATE TABLE ethics_forms (
    form_id SERIAL PRIMARY KEY,
    researcher_id INT REFERENCES researchers(researcher_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'Pending',
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INT REFERENCES ethic_committee(committee_id),
    faculty_id INT REFERENCES faculty(faculty_id)
);

CREATE TABLE ethic_committee (
    committee_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Reviewer'
);

CREATE TABLE admin (
    admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'Admin'
);

CREATE TABLE super_admin (
    super_admin_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'SuperAdmin'
);

-- RELATIONSHIP TABLES

CREATE TABLE form_reviews (
    review_id SERIAL PRIMARY KEY,
    form_id INT REFERENCES ethics_forms(form_id) ON DELETE CASCADE,
    committee_id INT REFERENCES ethic_committee(committee_id) ON DELETE CASCADE,
    comments TEXT,
    decision VARCHAR(50) CHECK (decision IN ('Approved', 'Rejected', 'Pending')),
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_email VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);
