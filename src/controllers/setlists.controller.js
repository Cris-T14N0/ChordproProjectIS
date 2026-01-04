const SetlistModel = require("../models/setlists.model");

// ============================
// Validação Comum
// ============================

// Verifica se o utilizador é dono da setlist
async function verifyOwnership(setlistId, userId, res) {
    const isOwner = await SetlistModel.belongsToUser(setlistId, userId);
    if (!isOwner) {
        res.status(403).json({ error: "Não tens permissão para aceder a esta setlist" });
        return false;
    }
    return true;
}

// ============================
// Criar Setlist
// ============================

async function createSetlist(req, res) {
    try {
        const { name, is_public } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                error: "O nome da setlist é obrigatório"
            });
        }

        const setlistId = await SetlistModel.create(
            req.user.id,
            name.trim(),
            is_public || 0
        );

        res.status(201).json({
            message: "Setlist criada com sucesso! 🎉",
            setlistId
        });
    } catch (error) {
        console.error("Erro ao criar setlist:", error);
        res.status(500).json({
            error: "Erro ao criar a setlist. Tenta novamente."
        });
    }
}

// ============================
// Listar Setlists do Utilizador
// ============================

async function getUserSetlists(req, res) {
    try {
        const setlists = await SetlistModel.findByUserId(req.user.id);
        res.json(setlists);
    } catch (error) {
        console.error("Erro ao buscar setlists:", error);
        res.status(500).json({
            error: "Não conseguimos carregar as tuas setlists"
        });
    }
}

// ============================
// Obter Setlist Específica (com músicas)
// ============================

async function getSetlist(req, res) {
    try {
        const setlistId = req.params.id;

        // Verifica se é o dono
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return; // verifyOwnership já enviou a resposta
        }

        // Busca dados da setlist
        const setlist = await SetlistModel.findById(setlistId);
        if (!setlist) {
            return res.status(404).json({
                error: "Setlist não encontrada"
            });
        }

        // Busca as músicas
        const songs = await SetlistModel.getSongs(setlistId);

        // Retorna tudo junto
        res.json({ ...setlist, songs });

    } catch (error) {
        console.error("Erro ao carregar setlist:", error);
        res.status(500).json({
            error: "Erro ao carregar a setlist"
        });
    }
}

// ============================
// Atualizar Setlist (nome/visibilidade)
// ============================

async function updateSetlist(req, res) {
    try {
        const setlistId = req.params.id;
        const { name, is_public } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json({
                error: "O nome da setlist não pode estar vazio"
            });
        }

        // Verifica permissões
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        await SetlistModel.update(setlistId, name.trim(), is_public);
        res.json({ message: "Setlist atualizada!" });

    } catch (error) {
        console.error("Erro ao atualizar setlist:", error);
        res.status(500).json({
            error: "Não conseguimos atualizar a setlist"
        });
    }
}

// ============================
// Eliminar Setlist
// ============================

async function deleteSetlist(req, res) {
    try {
        const setlistId = req.params.id;

        // Verifica permissões
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        await SetlistModel.delete(setlistId);
        res.json({ message: "Setlist eliminada com sucesso" });

    } catch (error) {
        console.error("Erro ao eliminar setlist:", error);
        res.status(500).json({
            error: "Não conseguimos eliminar a setlist"
        });
    }
}

// ============================
// Adicionar Música à Setlist
// ============================

async function addItemToSetlist(req, res) {
    try {
        const setlistId = req.params.id;
        const { cifra_id } = req.body;

        if (!cifra_id) {
            return res.status(400).json({
                error: "ID da música é obrigatório"
            });
        }

        // Verifica permissões
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        // Adiciona no fim da lista
        const nextPosition = await SetlistModel.getNextPosition(setlistId);
        const itemId = await SetlistModel.addSong(setlistId, cifra_id, nextPosition);

        res.status(201).json({
            message: "Música adicionada à setlist! 🎵",
            itemId
        });

    } catch (error) {
        console.error("Erro ao adicionar música:", error);
        res.status(500).json({
            error: "Não conseguimos adicionar a música"
        });
    }
}

// ============================
// Listar Músicas da Setlist
// ============================

async function getSetlistItems(req, res) {
    try {
        const setlistId = req.params.id;

        // Verifica permissões
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        const songs = await SetlistModel.getSongs(setlistId);
        res.json(songs);

    } catch (error) {
        console.error("Erro ao buscar músicas da setlist:", error);
        res.status(500).json({
            error: "Não conseguimos carregar as músicas"
        });
    }
}

// ============================
// Remover Música da Setlist
// ============================

async function removeItemFromSetlist(req, res) {
    try {
        const setlistId = req.params.id;
        const itemId = req.params.itemId;

        // Verifica se é dono da setlist
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        // Verifica se o item pertence mesmo a esta setlist
        const belongsToSetlist = await SetlistModel.itemBelongsToSetlist(itemId, setlistId);
        if (!belongsToSetlist) {
            return res.status(404).json({
                error: "Essa música não está nesta setlist"
            });
        }

        await SetlistModel.removeSong(itemId);
        res.json({ message: "Música removida da setlist" });

    } catch (error) {
        console.error("Erro ao remover música:", error);
        res.status(500).json({
            error: "Não conseguimos remover a música"
        });
    }
}

// ============================
// Reordenar Músicas
// ============================

async function reorderItems(req, res) {
    try {
        const setlistId = req.params.id;
        const { items } = req.body;

        // Valida input
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                error: "É preciso enviar uma lista de items"
            });
        }

        // Verifica permissões
        if (!await verifyOwnership(setlistId, req.user.id, res)) {
            return;
        }

        // Verifica se todos os items pertencem a esta setlist
        const existingSongs = await SetlistModel.getSongs(setlistId);
        const validItemIds = new Set(existingSongs.map(song => song.item_id));

        // Valida cada item
        const allValid = items.every(item =>
            validItemIds.has(item.itemId) &&
            typeof item.position === 'number' &&
            item.position >= 0
        );

        if (!allValid) {
            return res.status(400).json({
                error: "Alguns items são inválidos ou não pertencem a esta setlist"
            });
        }

        // Atualiza as posições (usa batch para ser mais rápido)
        await SetlistModel.batchUpdatePositions(items);

        res.json({ message: "Ordem atualizada!" });

    } catch (error) {
        console.error("Erro ao reordenar músicas:", error);
        res.status(500).json({
            error: "Não conseguimos guardar a nova ordem"
        });
    }
}

// ============================
// Exporta todas as funções
// ============================

module.exports = {
    createSetlist,
    getUserSetlists,
    getSetlist,
    updateSetlist,
    deleteSetlist,
    addItemToSetlist,
    getSetlistItems,
    removeItemFromSetlist,
    reorderItems
};