const pool = require("../models/db");
const path = require("path");
const fs = require("fs").promises;

// Upload and parse ChordPro file
async function uploadSong(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum ficheiro enviado" });
    }

    const userId = req.userId;
    const filePath = req.file.path;

    // Extract title from filename
    const title = req.file.originalname.replace(/\.(chopro|chordpro|cho|crd|pro)$/i, "");

    // Store in database with is_public default to 1 (public)
    const [result] = await pool.query(
      "INSERT INTO songs (user_id, title, artist, file_path, is_public) VALUES (?, ?, ?, ?, ?)",
      [userId, title, null, filePath, 1]
    );

    res.json({
      message: "Ficheiro carregado com sucesso",
      song: {
        id: result.insertId,
        title,
        artist: null
      }
    });
  } catch (error) {
    console.error("Erro ao fazer upload:", error);
    res.status(500).json({ message: "Erro ao fazer upload do ficheiro" });
  }
}

// Get all songs for user
async function getUserSongs(req, res) {
  try {
    const userId = req.userId;

    const [songs] = await pool.query(
      "SELECT id, title, artist, created_at, is_public FROM songs WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.json(songs);
  } catch (error) {
    console.error("Erro ao buscar músicas:", error);
    res.status(500).json({ message: "Erro ao buscar músicas" });
  }
}

// Get single song with content from file
// ⭐ MODIFICADO: Agora permite acesso a músicas públicas de outros users
async function getSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId;

    // Buscar música com informações do dono
    const [songs] = await pool.query(
      `SELECT s.*, u.username as owner_username 
       FROM songs s 
       JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [songId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada" });
    }

    const song = songs[0];

    // ⭐ VERIFICAÇÃO DE ACESSO:
    // Pode aceder se: é o dono OU a música é pública
    const isOwner = song.user_id === userId;
    const isPublic = song.is_public === 1;

    if (!isOwner && !isPublic) {
      return res.status(403).json({ message: "Sem permissão para visualizar esta música" });
    }

    // Read content from file
    try {
      const content = await fs.readFile(song.file_path, "utf8");
      song.content = content;
    } catch (fileError) {
      console.error("Erro ao ler ficheiro:", fileError);
      return res.status(500).json({ message: "Erro ao ler conteúdo da música" });
    }
    
    // ⭐ Adicionar flag para saber se é o dono
    song.is_owner = isOwner;

    res.json(song);
  } catch (error) {
    console.error("Erro ao buscar música:", error);
    res.status(500).json({ message: "Erro ao buscar música" });
  }
}

// Update song content
async function updateSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId;
    const { content, title, artist, is_public } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Conteúdo não pode estar vazio" });
    }

    // Verify ownership - só o dono pode editar
    const [songs] = await pool.query(
      "SELECT file_path, title FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada ou sem permissão para editar" });
    }

    const oldFilePath = songs[0].file_path;
    const oldTitle = songs[0].title;
    let newFilePath = oldFilePath;

    // Check if title has changed
    if (title && title !== oldTitle) {
      // Generate new filename based on new title
      const newFilename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".chopro";
      const dirPath = path.dirname(oldFilePath);
      newFilePath = path.join(dirPath, newFilename);

      // Rename the file if the new path is different
      if (oldFilePath !== newFilePath) {
        try {
          await fs.rename(oldFilePath, newFilePath);
          console.log(`File renamed from ${oldFilePath} to ${newFilePath}`);
        } catch (renameError) {
          console.error("Failed to rename file:", renameError);
          // If rename fails, keep the old path
          newFilePath = oldFilePath;
        }
      }
    }

    // Update file content on disk
    await fs.writeFile(newFilePath, content, "utf8");

    // Update metadata in database including is_public and new file path
    await pool.query(
      "UPDATE songs SET title = ?, artist = ?, is_public = ?, file_path = ? WHERE id = ? AND user_id = ?",
      [title || null, artist || null, is_public ? 1 : 0, newFilePath, songId, userId]
    );

    res.json({ message: "Música atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar música:", error);
    res.status(500).json({ message: "Erro ao atualizar música" });
  }
}

// Create new song from editor
async function createSong(req, res) {
  try {
    const userId = req.userId;
    const { content, title, artist, is_public } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Conteúdo não pode estar vazio" });
    }

    if (!title) {
      return res.status(400).json({ message: "Título é obrigatório" });
    }

    // Create user directory if it doesn't exist
    const userDir = path.join(__dirname, "../../uploads/songs/user_" + userId);
    await fs.mkdir(userDir, { recursive: true });

    // Generate filename
    const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".chopro";
    const filePath = path.join(userDir, filename);

    // Write file
    await fs.writeFile(filePath, content, "utf8");

    // Store in database with is_public
    const [result] = await pool.query(
      "INSERT INTO songs (user_id, title, artist, file_path, is_public) VALUES (?, ?, ?, ?, ?)",
      [userId, title, artist || null, filePath, is_public ? 1 : 0]
    );

    res.json({
      message: "Música criada com sucesso",
      song: {
        id: result.insertId,
        title,
        artist
      }
    });
  } catch (error) {
    console.error("Erro ao criar música:", error);
    res.status(500).json({ message: "Erro ao criar música" });
  }
}

// Delete song
async function deleteSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId;

    // Get file path - só o dono pode eliminar
    const [songs] = await pool.query(
      "SELECT file_path FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada ou sem permissão para eliminar" });
    }

    const filePath = songs[0].file_path;

    // Delete from database first
    await pool.query("DELETE FROM songs WHERE id = ? AND user_id = ?", [songId, userId]);

    // Then delete file from disk
    try {
      await fs.unlink(filePath);
      console.log(`File deleted: ${filePath}`);
    } catch (fileError) {
      console.error(`Failed to delete file: ${filePath}`, fileError);
      // Don't fail the request if file deletion fails
      // The database record is already deleted
    }

    res.json({ message: "Música eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar música:", error);
    res.status(500).json({ message: "Erro ao eliminar música" });
  }
}

module.exports = {
  uploadSong,
  getUserSongs,
  getSong,
  updateSong,
  createSong,
  deleteSong
};