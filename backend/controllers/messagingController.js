const pool = require('../db/index');

// ==============================
//  CREATE OR GET 1-on-1 CHAT
// ==============================
exports.getOrCreateConversation = async (req, res) => {
  const { user1_id, user2_id } = req.body;

  try {
    // 1. Check if conversation exists with both participants
    const result = await pool.query(
      `
      SELECT c.id
      FROM conversations c
      JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = $1
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = $2
      LIMIT 1;
      `,
      [user1_id, user2_id]
    );

    if (result.rows.length > 0) {
      return res.json({ conversation_id: result.rows[0].id, message: "Existing conversation found" });
    }

    // 2. Create new conversation
    const newConv = await pool.query(
      `INSERT INTO conversations DEFAULT VALUES RETURNING id;`
    );

    const conversation_id = newConv.rows[0].id;

    // 3. Insert participants
    await pool.query(
      `
      INSERT INTO conversation_participants (conversation_id, user_id)
      VALUES ($1, $2), ($1, $3);
      `,
      [conversation_id, user1_id, user2_id]
    );

    return res.status(201).json({
      conversation_id,
      message: "New conversation created"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==============================
//  SEND MESSAGE
// ==============================
exports.sendMessage = async (req, res) => {
  const { conversation_id, sender_id, message } = req.body;

  try {
    const saveMessage = await pool.query(
      `
      INSERT INTO messages (conversation_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING *;
      `,
      [conversation_id, sender_id, message]
    );

    res.status(201).json(saveMessage.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==============================
//  GET ALL MESSAGES IN A CHAT
// ==============================
exports.getMessages = async (req, res) => {
  const { conversation_id } = req.params;

  try {
    const msgs = await pool.query(
      `
      SELECT m.*, u.name, u.surname
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.conversation_id = $1
      ORDER BY m.created_at ASC;
      `,
      [conversation_id]
    );

    res.json(msgs.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==============================
//  LIST USER'S CONVERSATIONS
// ==============================
exports.getUserConversations = async (req, res) => {
  const { user_id } = req.params;

  try {
    const convs = await pool.query(
      `
      SELECT c.id AS conversation_id,
             array_agg(u.name || ' ' || u.surname) AS participants
      FROM conversation_participants cp
      JOIN conversations c ON c.id = cp.conversation_id
      JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
      JOIN users u ON u.id = cp2.user_id
      WHERE cp.user_id = $1
      GROUP BY c.id;
      `,
      [user_id]
    );

    res.json(convs.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ==============================
//  MARK MESSAGE AS READ
// ==============================
exports.markMessageRead = async (req, res) => {
  const { message_id } = req.params;

  try {
    await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1;`,
      [message_id]
    );

    res.json({ message: "Message marked as read" });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
