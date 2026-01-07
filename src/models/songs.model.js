const pool = require("./db");

const SongModel = {
    // ============================
    // Criar e Upload
    // ============================

    // Cria uma música nova na base de dados
    async create(userId, title, artist, filePath, isPublic = 1) {
        const [result] = await pool.query(
            "INSERT INTO songs (user_id, title, artist, file_path, is_public) VALUES (?, ?, ?, ?, ?)",
            [userId, title, artist, filePath, isPublic]
        );
        return result.insertId;
    },

    // ============================
    // Ler (Read)
    // ============================

    // Busca todas as músicas de um utilizador
    async findByUserId(userId) {
        const [songs] = await pool.query(
            "SELECT id, title, artist, created_at, is_public FROM songs WHERE user_id = ? ORDER BY created_at DESC",
            [userId]
        );
        return songs;
    },

    // Busca uma música pelo ID (com info do dono)
    async findById(songId) {
        const [songs] = await pool.query(
            `SELECT s.*, u.username as owner_username 
       FROM songs s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
            [songId]
        );
        return songs[0]; // Retorna undefined se não existir
    },

    // Busca apenas se o user for o dono (para editar/eliminar)
    async findByIdAndUser(songId, userId) {
        const [songs] = await pool.query(
            "SELECT * FROM songs WHERE id = ? AND user_id = ?",
            [songId, userId]
        );
        return songs[0];
    },

    // ============================
    // Pesquisa
    // ============================

    // Pesquisa apenas músicas públicas de outros utilizadores
    async searchAll(userId, searchTerm) {
        const pattern = `%${searchTerm.trim()}%`;

        const [songs] = await pool.query(
            `SELECT 
            s.id, 
            s.title, 
            s.artist, 
            s.is_public,
            s.created_at,
            u.username as owner_username,
            0 as is_owner
        FROM songs s
        JOIN users u ON s.user_id = u.id
        WHERE (s.title LIKE ? OR s.artist LIKE ?)
          AND s.is_public = 1
          AND s.user_id != ?
        ORDER BY s.created_at DESC
        LIMIT 50`,
            [pattern, pattern, userId]
        );

        return songs;
    },

    // Pesquisa apenas as minhas músicas
    async searchMine(userId, searchTerm) {
        const pattern = `%${searchTerm.trim()}%`;

        const [songs] = await pool.query(
            `SELECT 
            s.id, 
            s.title, 
            s.artist, 
            s.is_public,
            s.created_at,
            u.username as owner_username,
            1 as is_owner
        FROM songs s
        JOIN users u ON s.user_id = u.id
        WHERE (s.title LIKE ? OR s.artist LIKE ?)
          AND s.user_id = ?
        ORDER BY s.created_at DESC
        LIMIT 50`,
            [pattern, pattern, userId]
        );

        return songs;
    },

    // ============================
    // Atualizar
    // ============================

    // Atualiza metadados de uma música (incluindo caminho do ficheiro)
    async update(songId, userId, title, artist, isPublic, filePath) {
        await pool.query(
            "UPDATE songs SET title = ?, artist = ?, is_public = ?, file_path = ? WHERE id = ? AND user_id = ?",
            [title, artist, isPublic ? 1 : 0, filePath, songId, userId]
        );
    },

    // ============================
    // Eliminar
    // ============================

    // Elimina uma música da base de dados
    async delete(songId, userId) {
        await pool.query(
            "DELETE FROM songs WHERE id = ? AND user_id = ?",
            [songId, userId]
        );
    },

    // ============================
    // Verificações
    // ============================

    // Verifica se uma música pertence a um utilizador
    async belongsToUser(songId, userId) {
        const [rows] = await pool.query(
            "SELECT id FROM songs WHERE id = ? AND user_id = ?",
            [songId, userId]
        );
        return rows.length > 0;
    },

    // Verifica se um utilizador pode aceder à música (é dono OU é pública)
    async canAccess(songId, userId) {
        const [rows] = await pool.query(
            "SELECT id, user_id, is_public FROM songs WHERE id = ?",
            [songId]
        );

        if (rows.length === 0) return false;

        const song = rows[0];
        const isOwner = song.user_id === userId;
        const isPublic = song.is_public === 1;

        return isOwner || isPublic;
    },

    // ============================
    // Estatísticas (opcional, para depois)
    // ============================

    // Conta quantas músicas um utilizador tem
    async countByUser(userId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM songs WHERE user_id = ?",
            [userId]
        );
        return rows[0].total;
    },

    // Conta quantas músicas públicas existem no sistema
    async countPublic() {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM songs WHERE is_public = 1"
        );
        return rows[0].total;
    }
};

module.exports = SongModel;