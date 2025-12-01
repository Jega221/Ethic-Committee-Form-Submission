-- this is a dummy seed file for setting up the database schema --- IGNORE ---

INSERT INTO faculty (name, dean_name)
VALUES 
('Engineering', 'Dr. Adams'),
('Science', 'Dr. Grace');

INSERT INTO researchers (name, email, department, faculty_id)
VALUES
('John Doe', 'john@uni.edu', 'Computer Science', 1),
('Jane Smith', 'jane@uni.edu', 'Biology', 2);

INSERT INTO ethic_committee (name, email, role)
VALUES
('Dr. Maxwell', 'maxwell@uni.edu', 'Reviewer'),
('Dr. Fiona', 'fiona@uni.edu', 'Chair');

INSERT INTO admin (name, email)
VALUES
('Admin One', 'admin1@uni.edu');

INSERT INTO super_admin (name, email)
VALUES
('Super Admin', 'superadmin@uni.edu');
