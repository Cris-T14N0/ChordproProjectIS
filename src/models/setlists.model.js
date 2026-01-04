const pool = require("./db");

const SetlistModel = {
    // ============================
    // Operações CRUD Básicas
    // ============================

    // Cria uma setlist nova
    async create(userId, name, isPublic = 0) {
        const [result] = await pool.query(
            "INSERT INTO setlists (user_id, name, is_public) VALUES (?, ?, ?)",
            [userId, name, isPublic]
        );
        return result.insertId;
    },

    // Busca todas as setlists de um utilizador
    async findByUserId(userId) {
        const [rows] = await pool.query(
            "SELECT * FROM setlists WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        return rows;
    },

    // Busca uma setlist pelo ID
    async findById(setlistId) {
        const [rows] = await pool.query(
            "SELECT * FROM setlists WHERE id = ?",
            [setlistId]
        );
        return rows[0];
    },

    // Atualiza nome e visibilidade de uma setlist
    async update(setlistId, name, isPublic) {
        await pool.query(
            "UPDATE setlists SET name = ?, is_public = ? WHERE id = ?",
            [name, isPublic, setlistId]
        );
    },

    // Elimina uma setlist (e todas as músicas dentro dela)
    async delete(setlistId) {
        // Primeiro remove todas as músicas
        await pool.query(
            "DELETE FROM setlist_songs WHERE setlist_id = ?",
            [setlistId]
        );

        // Depois remove a setlist
        await pool.query(
            "DELETE FROM setlists WHERE id = ?",
            [setlistId]
        );
    },

    // ============================
    // Gestão de Músicas na Setlist
    // ============================

    // Adiciona uma música à setlist numa posição específica
    async addSong(setlistId, cifraId, position) {
        const [result] = await pool.query(
            "INSERT INTO setlist_songs (setlist_id, cifra_id, position) VALUES (?, ?, ?)",
            [setlistId, cifraId, position]
        );
        return result.insertId;
    },

    // Busca todas as músicas de uma setlist (ordenadas por posição)
    async getSongs(setlistId) {
        const [rows] = await pool.query(
            `SELECT 
        ss.id as item_id,
        ss.position,
        s.id as song_id,
        s.title,
        s.artist,
        s.file_path
      FROM setlist_songs ss
      JOIN songs s ON ss.cifra_id = s.id
      WHERE ss.setlist_id = ?
      ORDER BY ss.position ASC`,
            [setlistId]
        );
        return rows;
    },

    // Remove uma música da setlist
    async removeSong(itemId) {
        await pool.query(
            "DELETE FROM setlist_songs WHERE id = ?",
            [itemId]
        );
    },

    // Atualiza a posição de uma música
    async updatePosition(itemId, newPosition) {
        await pool.query(
            "UPDATE setlist_songs SET position = ? WHERE id = ?",
            [newPosition, itemId]
        );
    },

    // ============================
    // Verificações de Segurança
    // ============================

    // Verifica se uma setlist pertence a um utilizador
    async belongsToUser(setlistId, userId) {
        const [rows] = await pool.query(
            "SELECT id FROM setlists WHERE id = ? AND user_id = ?",
            [setlistId, userId]
        );
        return rows.length > 0;
    },

    // Verifica se um item pertence a uma setlist específica
    async itemBelongsToSetlist(itemId, setlistId) {
        const [rows] = await pool.query(
            "SELECT id FROM setlist_songs WHERE id = ? AND setlist_id = ?",
            [itemId, setlistId]
        );
        return rows.length > 0;
    },

    // ============================
    // Funções Auxiliares
    // ============================

    // Descobre qual é a próxima posição disponível na setlist
    async getNextPosition(setlistId) {
        const [rows] = await pool.query(
            "SELECT MAX(position) as max_pos FROM setlist_songs WHERE setlist_id = ?",
            [setlistId]
        );

        // Se não houver músicas, começa em 0
        // Senão, pega o máximo e soma 1
        return (rows[0].max_pos ?? -1) + 1;
    },

    // Atualiza várias posições de uma vez (mais rápido que uma por uma)
    async batchUpdatePositions(updates) {
        const connection = await pool.getConnection();

        try {
            // Começa uma transação (tudo ou nada)
            await connection.beginTransaction();

            // Atualiza cada item
            for (const { itemId, position } of updates) {
                await connection.query(
                    "UPDATE setlist_songs SET position = ? WHERE id = ?",
                    [position, itemId]
                );
            }

            // Confirma todas as mudanças
            await connection.commit();

        } catch (error) {
            // Se algo correr mal, reverte tudo
            await connection.rollback();
            throw error;

        } finally {
            // Liberta a conexão de volta para o pool
            connection.release();
        }
    }
};

module.exports = SetlistModel;