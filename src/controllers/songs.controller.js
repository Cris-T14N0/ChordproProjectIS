const pool = require("../models/db");
const path = require("path");
const fs = require("fs").promises;
const ChordSheetJS = require("chordsheetjs");

// Upload and parse ChordPro file
async function uploadSong(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum ficheiro enviado" });
    }

    const userId = req.userId;
    const filePath = req.file.path;

    // Read file content to extract metadata
    const content = await fs.readFile(filePath, "utf8");

    // Parse with ChordSheetJS to extract metadata
    const parser = new ChordSheetJS.ChordProParser();
    let song;
    let title = req.file.originalname.replace(/\.(chopro|chordpro|cho|crd|pro)$/i, "");
    let artist = null;

    try {
      song = parser.parse(content);
      title = song.metadata.title || title;
      artist = song.metadata.artist || null;
    } catch (parseError) {
      console.log("Could not parse ChordPro metadata, using filename");
    }

    // Store only path in database
    const [result] = await pool.query(
      "INSERT INTO songs (user_id, title, artist, file_path) VALUES (?, ?, ?, ?)",
      [userId, title, artist, filePath]
    );

    res.json({
      message: "Ficheiro carregado com sucesso",
      song: {
        id: result.insertId,
        title,
        artist
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
async function getSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId;

    const [songs] = await pool.query(
      "SELECT * FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada" });
    }

    const song = songs[0];

    // Read content from file
    const content = await fs.readFile(song.file_path, "utf8");
    song.content = content;

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
    const { content, title, artist } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Conteúdo não pode estar vazio" });
    }

    // Verify ownership
    const [songs] = await pool.query(
      "SELECT file_path FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada" });
    }

    // Update file on disk
    const filePath = songs[0].file_path;
    await fs.writeFile(filePath, content, "utf8");

    // Update metadata in database
    await pool.query(
      "UPDATE songs SET title = ?, artist = ? WHERE id = ? AND user_id = ?",
      [title || null, artist || null, songId, userId]
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
    const { content, title, artist } = req.body;

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

    // Store in database
    const [result] = await pool.query(
      "INSERT INTO songs (user_id, title, artist, file_path) VALUES (?, ?, ?, ?)",
      [userId, title, artist || null, filePath]
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

    // Get file path
    const [songs] = await pool.query(
      "SELECT file_path FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    if (songs.length === 0) {
      return res.status(404).json({ message: "Música não encontrada" });
    }

    // Delete file
    try {
      await fs.unlink(songs[0].file_path);
    } catch (fileError) {
      console.log("File already deleted or not found");
    }

    // Delete from database
    await pool.query("DELETE FROM songs WHERE id = ? AND user_id = ?", [songId, userId]);

    res.json({ message: "Música eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar música:", error);
    res.status(500).json({ message: "Erro ao eliminar música" });
  }
}

// Renderiza a página de visualização de uma música
async function viewSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId;

    const [songs] = await pool.query(
      "SELECT * FROM songs WHERE id = ? AND user_id = ?",
      [songId, userId]
    );

    // Verificar se a música existe
    if (songs.length === 0) {
      return res.render('viewer', {
        song: null,
        user: req.user
      });
    }

    const song = songs[0];

    // Ler conteúdo do ficheiro
    const content = await fs.readFile(song.file_path, "utf8");

    // Renderizar a página do viewer com os dados da música
    res.render('viewer', {
      song: {
        id: song.id,
        title: song.title,
        artist: song.artist || '',
        content: content
      },
      user: req.user
    });

  } catch (error) {
    console.error('Erro ao visualizar música:', error);
    res.render('viewer', {
      song: null,
      user: req.user
    });
  }
}

module.exports = {
  uploadSong,
  getUserSongs,
  getSong,
  updateSong,
  createSong,
  deleteSong,
  viewSong
};