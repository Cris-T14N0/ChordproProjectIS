const SongModel = require("../models/songs.model");
const path = require("path");
const fs = require("fs").promises;
const multer = require("multer");

// ============================
// Configuração do Multer para múltiplos ficheiros
// ============================

// Configurar armazenamento em disco (igual ao atual)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const userId = req.userId || req.user?.id;
        const userDir = path.join(__dirname, "../../uploads/songs/user_" + userId);
        fs.mkdir(userDir, { recursive: true }).then(() => {
            cb(null, userDir);
        }).catch(err => {
            cb(err);
        });
    },
    filename: (req, file, cb) => {
        // Mantém o nome original
        cb(null, file.originalname);
    }
});

// Filtro de ficheiros
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.chopro', '.chordpro', '.cho', '.crd', '.pro', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de ficheiro não suportado: ${ext}. Extensões permitidas: ${allowedExtensions.join(', ')}`));
    }
};

// Configurar multer para múltiplos ficheiros
const uploadMultiple = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por ficheiro
        files: 100 // Máximo de 100 ficheiros por upload
    },
    fileFilter: fileFilter
});

// Middleware para upload único (mantém compatibilidade)
const uploadSingle = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
}).single("file");

// ============================
// Funções Auxiliares
// ============================

// Cria o diretório do utilizador se não existir
async function ensureUserDirectory(userId) {
    const userDir = path.join(__dirname, "../../uploads/songs/user_" + userId);
    await fs.mkdir(userDir, { recursive: true });
    return userDir;
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

// Parse básico de ChordPro para extrair título e artista
function parseChordPro(content) {
    const lines = content.split('\n');
    let title = '';
    let artist = '';

    lines.forEach(line => {
        // Extrai título
        if (line.startsWith('{title:') || line.startsWith('{t:')) {
            title = line.match(/{(?:title|t):(.*?)}/)?.[1]?.trim() || '';
        }
        // Extrai artista
        else if (line.startsWith('{artist:') || line.startsWith('{a:')) {
            artist = line.match(/{(?:artist|a):(.*?)}/)?.[1]?.trim() || '';
        }
    });

    return {
        title: title,
        artist: artist
    };
}

// ================================================
// Upload de Ficheiro Único (Para Compatibilidade)
// ================================================

async function uploadSong(req, res) {
    try {
        console.log("📤 Upload único iniciado - userId:", req.userId || req.user?.id);

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

        // Tenta extrair informações do ficheiro ChordPro
        let title = req.file.originalname.replace(/\.(chopro|chordpro|cho|crd|pro|txt)$/i, "");
        let artist = null;

        try {
            const content = await fs.readFile(filePath, "utf8");
            const parsed = parseChordPro(content);
            if (parsed.title) title = parsed.title;
            if (parsed.artist) artist = parsed.artist;
        } catch (readError) {
            console.warn("Não foi possível ler o ficheiro para extrair metadados, usando nome do ficheiro:", readError.message);
        }

        // Guarda na base de dados (público por defeito)
        const songId = await SongModel.create(userId, title, artist, filePath, 1);

        console.log("✅ Música criada com ID:", songId);

        res.json({
            success: true,
            message: "Ficheiro carregado com sucesso! 🎵",
            song: {
                id: songId,
                title,
                artist
            }
        });

    } catch (error) {
        console.error("❌ Erro ao fazer upload:", error);
        res.status(500).json({
            success: false,
            message: "Não conseguimos fazer upload do ficheiro"
        });
    }
}

// ============================
// Upload Múltiplo de Ficheiros
// ============================

async function uploadMultipleSongs(req, res) {
    try {
        console.log("📤📤 Upload múltiplo iniciado - userId:", req.userId || req.user?.id);

        // Verifica se foram enviados ficheiros
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Tens de enviar pelo menos um ficheiro"
            });
        }

        const userId = req.userId || req.user?.id;

        if (!userId) {
            console.error("❌ userId não encontrado no request");
            return res.status(401).json({
                success: false,
                message: "Não autenticado"
            });
        }

        const results = [];
        const files = req.files;

        // Processar cada ficheiro
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            try {
                const filePath = file.path;

                // Tenta extrair informações do ficheiro ChordPro
                let title = file.originalname.replace(/\.(chopro|chordpro|cho|crd|pro|txt)$/i, "");
                let artist = null;

                try {
                    const content = await fs.readFile(filePath, "utf8");
                    const parsed = parseChordPro(content);
                    if (parsed.title) title = parsed.title;
                    if (parsed.artist) artist = parsed.artist;
                } catch (readError) {
                    console.warn(`Não foi possível ler o ficheiro "${file.originalname}" para extrair metadados:`, readError.message);
                }

                // Guarda na base de dados (público por defeito)
                const songId = await SongModel.create(userId, title, artist, filePath, 1);

                results.push({
                    fileName: file.originalname,
                    success: true,
                    songId: songId,
                    message: "Ficheiro carregado com sucesso"
                });

                console.log(`✅ Música ${i + 1}/${files.length} criada com ID:`, songId);

            } catch (fileError) {
                console.error(`❌ Erro ao processar ficheiro "${file.originalname}":`, fileError);

                results.push({
                    fileName: file.originalname,
                    success: false,
                    error: fileError.message || "Erro ao processar ficheiro"
                });
            }

            // Pequena pausa para não sobrecarregar
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // Contar sucessos e falhas
        const successfulUploads = results.filter(r => r.success).length;
        const failedUploads = results.filter(r => !r.success).length;

        const response = {
            success: true,
            message: `Upload completado. ${successfulUploads} sucesso(s), ${failedUploads} falha(s)`,
            totalFiles: files.length,
            results: results,
            summary: {
                total: files.length,
                successful: successfulUploads,
                failed: failedUploads
            }
        };

        // Se todos falharam, retorna erro
        if (successfulUploads === 0) {
            return res.status(400).json({
                success: false,
                message: "Não foi possível processar nenhum dos ficheiros",
                results: results
            });
        }

        res.json(response);

    } catch (error) {
        console.error("❌ Erro geral no upload múltiplo:", error);
        res.status(500).json({
            success: false,
            message: "Erro interno do servidor ao processar os ficheiros"
        });
    }
}

// ============================
// Upload Múltiplo com Progresso (Streaming)
// ============================

async function uploadMultipleWithProgress(req, res) {
    // Configurar resposta como streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
        const userId = req.userId || req.user?.id;

        if (!userId) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: "Não autenticado" })}\n\n`);
            res.end();
            return;
        }

        if (!req.files || req.files.length === 0) {
            res.write(`event: error\ndata: ${JSON.stringify({ message: "Nenhum ficheiro enviado" })}\n\n`);
            res.end();
            return;
        }

        const files = req.files;
        const results = [];

        // Enviar progresso inicial
        res.write(`event: progress\ndata: ${JSON.stringify({
            total: files.length,
            processed: 0,
            current: null
        })}\n\n`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Enviar progresso atual
            res.write(`event: progress\ndata: ${JSON.stringify({
                total: files.length,
                processed: i,
                current: file.originalname
            })}\n\n`);

            try {
                const filePath = file.path;
                let title = file.originalname.replace(/\.(chopro|chordpro|cho|crd|pro|txt)$/i, "");
                let artist = null;

                try {
                    const content = await fs.readFile(filePath, "utf8");
                    const parsed = parseChordPro(content);
                    if (parsed.title) title = parsed.title;
                    if (parsed.artist) artist = parsed.artist;
                } catch (readError) {
                    // Continua com nome do ficheiro
                }

                const songId = await SongModel.create(userId, title, artist, filePath, 1);

                results.push({
                    fileName: file.originalname,
                    success: true,
                    songId: songId
                });

            } catch (fileError) {
                results.push({
                    fileName: file.originalname,
                    success: false,
                    error: fileError.message
                });
            }

            // Pequena pausa
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }

        // Enviar resultado final
        res.write(`event: complete\ndata: ${JSON.stringify({ results })}\n\n`);
        res.end();

    } catch (error) {
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
}

// ============================
// Restante do controlador
// ============================

async function getUserSongs(req, res) {
    try {
        const userId = req.userId || req.user?.id;

        console.log("🎵 getUserSongs chamado");
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
        res.status(500).json({
            message: "Não conseguimos carregar as tuas músicas"
        });
    }
}

async function getSong(req, res) {
    try {
        const songId = req.params.id;
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }

        const song = await SongModel.findById(songId);

        if (!song) {
            return res.status(404).json({
                message: "Música não encontrada"
            });
        }

        const isOwner = song.user_id === userId;
        const isPublic = song.is_public === 1;

        if (!isOwner && !isPublic) {
            return res.status(403).json({
                message: "Não tens permissão para ver esta música"
            });
        }

        try {
            song.content = await readSongFile(song.file_path);
        } catch (error) {
            return res.status(500).json({
                message: error.message
            });
        }

        song.is_owner = isOwner;

        res.json(song);

    } catch (error) {
        console.error("Erro ao buscar música:", error);
        res.status(500).json({
            message: "Erro ao carregar a música"
        });
    }
}

async function createSong(req, res) {
    try {
        const userId = req.userId || req.user?.id;
        const { content, title, artist, is_public } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }

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

        const userDir = await ensureUserDirectory(userId);
        const filename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".chopro";
        const filePath = path.join(userDir, filename);

        await fs.writeFile(filePath, content, "utf8");

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

async function updateSong(req, res) {
    try {
        const songId = req.params.id;
        const userId = req.userId || req.user?.id;
        const { content, title, artist, is_public } = req.body;

        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }

        if (!content || content.trim() === "") {
            return res.status(400).json({
                message: "O conteúdo não pode estar vazio"
            });
        }

        const song = await SongModel.findByIdAndUser(songId, userId);

        if (!song) {
            return res.status(404).json({
                message: "Música não encontrada ou não tens permissão para editar"
            });
        }

        let newFilePath = song.file_path;

        if (title && title.trim() !== song.title) {
            const newFilename = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".chopro";
            const dirPath = path.dirname(song.file_path);
            const potentialNewPath = path.join(dirPath, newFilename);

            if (song.file_path !== potentialNewPath) {
                try {
                    await fs.rename(song.file_path, potentialNewPath);
                    newFilePath = potentialNewPath;
                    console.log(`Ficheiro renomeado: ${song.file_path} → ${newFilePath}`);
                }
                catch (renameError) {
                    console.error("Erro ao renomear ficheiro:", renameError);
                }
            }
        }

        await fs.writeFile(newFilePath, content, "utf8");

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

async function deleteSong(req, res) {
    try {
        const songId = req.params.id;
        const userId = req.userId || req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }

        const song = await SongModel.findByIdAndUser(songId, userId);

        if (!song) {
            return res.status(404).json({
                message: "Música não encontrada ou não tens permissão para eliminar"
            });
        }

        await SongModel.delete(songId, userId);

        try {
            await fs.unlink(song.file_path);
            console.log(`Ficheiro eliminado: ${song.file_path}`);
        } catch (fileError) {
            console.error(`Erro ao eliminar ficheiro: ${song.file_path}`, fileError);
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

async function searchSongs(req, res) {
    try {
        const userId = req.userId || req.user?.id;
        const { q } = req.query;

        if (!userId) {
            return res.status(401).json({ message: "Não autenticado" });
        }

        if (!q || q.trim().length === 0) {
            return res.json([]);
        }

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
    uploadSong,                     // Upload único (compatibilidade)
    uploadMultipleSongs,            // Upload múltiplo (novo)
    uploadMultipleWithProgress,     // Upload com progresso streaming (novo)
    getUserSongs,
    getSong,
    updateSong,
    createSong,
    deleteSong,
    searchSongs,
    uploadMultiple,                 // Middleware para upload múltiplo
    uploadSingle                    // Middleware para upload único
};