const pool = require("./db");

const SetlistModel = {
  // Create a new setlist
  async create(userId, name, isPublic = 0) {
    const [result] = await pool.query(
      "INSERT INTO setlists (user_id, name, is_public) VALUES (?, ?, ?)",
      [userId, name, isPublic]
    );
    return result.insertId;
  },

  // Get all setlists for a user
  async findByUserId(userId) {
    const [rows] = await pool.query(
      "SELECT * FROM setlists WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  },

  // Get a single setlist by ID
  async findById(setlistId) {
    const [rows] = await pool.query(
      "SELECT * FROM setlists WHERE id = ?",
      [setlistId]
    );
    return rows[0];
  },

  // Update setlist
  async update(setlistId, name, isPublic) {
    await pool.query(
      "UPDATE setlists SET name = ?, is_public = ? WHERE id = ?",
      [name, isPublic, setlistId]
    );
  },

  // Delete setlist
  async delete(setlistId) {
    // Delete all songs first (if not cascading)
    await pool.query("DELETE FROM setlist_songs WHERE setlist_id = ?", [setlistId]);
    await pool.query("DELETE FROM setlists WHERE id = ?", [setlistId]);
  },

  // Add song to setlist
  async addSong(setlistId, cifraId, position) {
    const [result] = await pool.query(
      "INSERT INTO setlist_songs (setlist_id, cifra_id, position) VALUES (?, ?, ?)",
      [setlistId, cifraId, position]
    );
    return result.insertId;
  },

  // Get all songs in a setlist
  async getSongs(setlistId) {
    const [rows] = await pool.query(
      `SELECT ss.id as item_id, ss.position, s.id as song_id, s.title, s.artist, s.file_path
       FROM setlist_songs ss
       JOIN songs s ON ss.cifra_id = s.id
       WHERE ss.setlist_id = ?
       ORDER BY ss.position ASC`,
      [setlistId]
    );
    return rows;
  },

  // Remove song from setlist
  async removeSong(itemId) {
    await pool.query("DELETE FROM setlist_songs WHERE id = ?", [itemId]);
  },

  // Update song position in setlist
  async updatePosition(itemId, newPosition) {
    await pool.query(
      "UPDATE setlist_songs SET position = ? WHERE id = ?",
      [newPosition, itemId]
    );
  },

  // Check if setlist belongs to user
  async belongsToUser(setlistId, userId) {
    const [rows] = await pool.query(
      "SELECT id FROM setlists WHERE id = ? AND user_id = ?",
      [setlistId, userId]
    );
    return rows.length > 0;
  },

  // NEW: Check if a setlist item belongs to a specific setlist
  async itemBelongsToSetlist(itemId, setlistId) {
    const [rows] = await pool.query(
      "SELECT id FROM setlist_songs WHERE id = ? AND setlist_id = ?",
      [itemId, setlistId]
    );
    return rows.length > 0;
  },

  // NEW: Get the next available position for a setlist
  async getNextPosition(setlistId) {
    const [rows] = await pool.query(
      "SELECT MAX(position) as max_pos FROM setlist_songs WHERE setlist_id = ?",
      [setlistId]
    );
    return (rows[0].max_pos ?? -1) + 1;
  },

  // NEW: Batch update positions (more efficient)
  async batchUpdatePositions(updates) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      for (const { itemId, position } of updates) {
        await connection.query(
          "UPDATE setlist_songs SET position = ? WHERE id = ?",
          [position, itemId]
        );
      }
      
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = SetlistModel;