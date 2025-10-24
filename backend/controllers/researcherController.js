import pool from "../db/index.js";

export const getResearchers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM researcher");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createResearcher = async (req, res) => {
  const { first_name, last_name, email, password, age } = req.body;

  try {
    const query = `
      INSERT INTO researcher (first_name, last_name, email, password, age)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const result = await pool.query(query, [first_name, last_name, email, password, age]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
