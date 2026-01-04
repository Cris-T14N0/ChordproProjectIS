const SongModel = require("../models/songs.model");
const path = require("path");
const fs = require("fs").promises;

// ============================
// Funções Auxiliares
// ============================

// Cria o diretório do utilizador se não existir
async function ensureUserDirectory(userId) {
  const userDir = path.join(__dirname, "../../uploads/songs/user_" + userId);
  await fs.mkdir(userDir, { recursive: true });
  return userDir;
}

// Gera nome de ficheiro seguro a partir do título
function generateFilename(title) {
  return title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".chopro";
}

// Lê o conteúdo de um ficheiro ChordPro
async function readSongFile(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error("Erro ao ler ficheiro:", error);
    throw new Error("Não conseguimos ler o conteúdo da música");
  }
}

// ============================
// Upload de Ficheiro
// ============================

async function uploadSong(req, res) {
  try {
    console.log("📤 Upload iniciado - userId:", req.userId, "- user:", req.user);
    
    // Verifica se foi enviado um ficheiro
    if (!req.file) {
      return res.status(400).json({ 
        message: "Tens de enviar um ficheiro" 
      });
    }

    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      console.error("❌ userId não encontrado no request");
      return res.status(401).json({ message: "Não autenticado" });
    }

    const filePath = req.file.path;

    // Extrai o título do nome do ficheiro
    const title = req.file.originalname.replace(
      /\.(chopro|chordpro|cho|crd|pro)$/i, 
      ""
    );

    // Guarda na base de dados (público por defeito)
    const songId = await SongModel.create(userId, title, null, filePath, 1);

    console.log("✅ Música criada com ID:", songId);

    res.json({
      message: "Ficheiro carregado com sucesso! 🎵",
      song: {
        id: songId,
        title,
        artist: null
      }
    });

  } catch (error) {
    console.error("❌ Erro ao fazer upload:", error);
    res.status(500).json({ 
      message: "Não conseguimos fazer upload do ficheiro" 
    });
  }
}

// ============================
// Listar Músicas
// ============================

async function getUserSongs(req, res) {
  try {
    // IMPORTANTE: Suporta tanto req.userId quanto req.user.id
    const userId = req.userId || req.user?.id;
    
    console.log("🎵 getUserSongs chamado");
    console.log("   - req.userId:", req.userId);
    console.log("   - req.user:", req.user);
    console.log("   - userId final:", userId);

    if (!userId) {
      console.error("❌ userId não encontrado no request");
      return res.status(401).json({ 
        message: "Não autenticado" 
      });
    }

    const songs = await SongModel.findByUserId(userId);
    
    console.log(`✅ Encontradas ${songs.length} músicas para o utilizador ${userId}`);
    
    res.json(songs);
    
  } catch (error) {
    console.error("❌ Erro ao buscar músicas:", error);
    console.error("   Stack:", error.stack);
    res.status(500).json({ 
      message: "Não conseguimos carregar as tuas músicas" 
    });
  }
}

// ============================
// Ver Música Individual
// ============================

async function getSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Busca a música
    const song = await SongModel.findById(songId);

    if (!song) {
      return res.status(404).json({ 
        message: "Música não encontrada" 
      });
    }

    // Verifica permissões (dono OU pública)
    const isOwner = song.user_id === userId;
    const isPublic = song.is_public === 1;

    if (!isOwner && !isPublic) {
      return res.status(403).json({ 
        message: "Não tens permissão para ver esta música" 
      });
    }

    // Lê o conteúdo do ficheiro
    try {
      song.content = await readSongFile(song.file_path);
    } catch (error) {
      return res.status(500).json({ 
        message: error.message 
      });
    }

    // Adiciona flag para saber se é o dono
    song.is_owner = isOwner;

    res.json(song);

  } catch (error) {
    console.error("Erro ao buscar música:", error);
    res.status(500).json({ 
      message: "Erro ao carregar a música" 
    });
  }
}

// ============================
// Criar Nova Música
// ============================

async function createSong(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    const { content, title, artist, is_public } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Validações
    if (!content || content.trim() === "") {
      return res.status(400).json({ 
        message: "O conteúdo não pode estar vazio" 
      });
    }

    if (!title || title.trim() === "") {
      return res.status(400).json({ 
        message: "O título é obrigatório" 
      });
    }

    // Cria diretório do utilizador
    const userDir = await ensureUserDirectory(userId);

    // Gera nome de ficheiro
    const filename = generateFilename(title);
    const filePath = path.join(userDir, filename);

    // Escreve o ficheiro
    await fs.writeFile(filePath, content, "utf8");

    // Guarda na base de dados
    const songId = await SongModel.create(
      userId, 
      title.trim(), 
      artist?.trim() || null, 
      filePath, 
      is_public ? 1 : 0
    );

    res.json({
      message: "Música criada com sucesso! 🎉",
      song: {
        id: songId,
        title: title.trim(),
        artist: artist?.trim() || null
      }
    });

  } catch (error) {
    console.error("Erro ao criar música:", error);
    res.status(500).json({ 
      message: "Não conseguimos criar a música" 
    });
  }
}

// ============================
// Atualizar Música
// ============================

async function updateSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId || req.user?.id;
    const { content, title, artist, is_public } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Validação
    if (!content || content.trim() === "") {
      return res.status(400).json({ 
        message: "O conteúdo não pode estar vazio" 
      });
    }

    // Verifica se é o dono (só o dono pode editar)
    const song = await SongModel.findByIdAndUser(songId, userId);

    if (!song) {
      return res.status(404).json({ 
        message: "Música não encontrada ou não tens permissão para editar" 
      });
    }

    let newFilePath = song.file_path;

    // Se o título mudou, renomeia o ficheiro
    if (title && title.trim() !== song.title) {
      const newFilename = generateFilename(title);
      const dirPath = path.dirname(song.file_path);
      const potentialNewPath = path.join(dirPath, newFilename);

      // Só renomeia se o caminho for diferente
      if (song.file_path !== potentialNewPath) {
        try {
          await fs.rename(song.file_path, potentialNewPath);
          newFilePath = potentialNewPath;
          console.log(`Ficheiro renomeado: ${song.file_path} → ${newFilePath}`);
        }
        catch (renameError)
        {
          console.error("Erro ao renomear ficheiro:", renameError);
          // Se falhar, mantém o caminho antigo
        }
      }
    }

    // Atualiza o conteúdo do ficheiro
    await fs.writeFile(newFilePath, content, "utf8");

    // Atualiza os metadados na base de dados
    await SongModel.update(
      songId,
      userId,
      title?.trim() || song.title,
      artist?.trim() || null,
      is_public,
      newFilePath
    );

    res.json({ 
      message: "Música atualizada com sucesso! ✓" 
    });

  } catch (error) {
    console.error("Erro ao atualizar música:", error);
    res.status(500).json({ 
      message: "Não conseguimos atualizar a música" 
    });
  }
}

// ============================
// Eliminar Música
// ============================

async function deleteSong(req, res) {
  try {
    const songId = req.params.id;
    const userId = req.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Busca a música (só se for o dono)
    const song = await SongModel.findByIdAndUser(songId, userId);

    if (!song) {
      return res.status(404).json({ 
        message: "Música não encontrada ou não tens permissão para eliminar" 
      });
    }

    // Elimina da base de dados primeiro
    await SongModel.delete(songId, userId);

    // Depois tenta eliminar o ficheiro
    try {
      await fs.unlink(song.file_path);
      console.log(`Ficheiro eliminado: ${song.file_path}`);
    } catch (fileError) {
      console.error(`Erro ao eliminar ficheiro: ${song.file_path}`, fileError);
      // Não falha o pedido se não conseguir eliminar o ficheiro
      // O registo na base de dados já foi removido
    }

    res.json({ 
      message: "Música eliminada com sucesso" 
    });

  } catch (error) {
    console.error("Erro ao eliminar música:", error);
    res.status(500).json({ 
      message: "Não conseguimos eliminar a música" 
    });
  }
}

// ============================
// Pesquisar Músicas
// ============================

async function searchSongs(req, res) {
  try {
    const userId = req.userId || req.user?.id;
    const { q } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    // Se não houver query, retorna vazio
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    // Pesquisa músicas (próprias + públicas de outros)
    const songs = await SongModel.search(userId, q);

    res.json(songs);

  } catch (error) {
    console.error("Erro ao pesquisar músicas:", error);
    res.status(500).json({ 
      message: "Erro ao pesquisar músicas" 
    });
  }
}

// ============================
// Exporta todas as funções
// ============================

module.exports = {
  uploadSong,
  getUserSongs,
  getSong,
  updateSong,
  createSong,
  deleteSong,
  searchSongs
};