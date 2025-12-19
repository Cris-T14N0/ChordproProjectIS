const SetlistModel = require("../models/setlists.model");

// Create setlist
async function createSetlist(req, res) {
  try {
    const { name, is_public } = req.body;
    
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nome da setlist é obrigatório" });
    }

    const setlistId = await SetlistModel.create(req.user.id, name.trim(), is_public || 0);
    res.status(201).json({ 
      message: "Setlist criada com sucesso", 
      setlistId 
    });
  } catch (error) {
    console.error("Erro ao criar setlist:", error);
    res.status(500).json({ error: "Erro ao criar setlist" });
  }
}

// Get all user's setlists
async function getUserSetlists(req, res) {
  try {
    const setlists = await SetlistModel.findByUserId(req.user.id);
    res.json(setlists);
  } catch (error) {
    console.error("Erro ao buscar setlists:", error);
    res.status(500).json({ error: "Erro ao buscar setlists" });
  }
}

// Get single setlist with songs
async function getSetlist(req, res) {
  try {
    const setlistId = req.params.id;
    
    // Check if setlist belongs to user
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const setlist = await SetlistModel.findById(setlistId);
    if (!setlist) {
      return res.status(404).json({ error: "Setlist não encontrada" });
    }
    
    const songs = await SetlistModel.getSongs(setlistId);
    
    res.json({ ...setlist, songs });
  } catch (error) {
    console.error("Erro ao buscar setlist:", error);
    res.status(500).json({ error: "Erro ao buscar setlist" });
  }
}

// Update setlist
async function updateSetlist(req, res) {
  try {
    const setlistId = req.params.id;
    const { name, is_public } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "Nome da setlist é obrigatório" });
    }

    // Check if setlist belongs to user
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    await SetlistModel.update(setlistId, name.trim(), is_public);
    res.json({ message: "Setlist atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar setlist:", error);
    res.status(500).json({ error: "Erro ao atualizar setlist" });
  }
}

// Delete setlist
async function deleteSetlist(req, res) {
  try {
    const setlistId = req.params.id;

    // Check if setlist belongs to user
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    await SetlistModel.delete(setlistId);
    res.json({ message: "Setlist eliminada com sucesso" });
  } catch (error) {
    console.error("Erro ao eliminar setlist:", error);
    res.status(500).json({ error: "Erro ao eliminar setlist" });
  }
}

// Add song to setlist
async function addItemToSetlist(req, res) {
  try {
    const setlistId = req.params.id;
    const { cifra_id, position } = req.body;

    if (!cifra_id) {
      return res.status(400).json({ error: "ID da música é obrigatório" });
    }

    // Check if setlist belongs to user
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Get current max position if not provided
    let finalPosition = position;
    if (finalPosition === undefined || finalPosition === null) {
      const songs = await SetlistModel.getSongs(setlistId);
      finalPosition = songs.length;
    }

    const itemId = await SetlistModel.addSong(setlistId, cifra_id, finalPosition);
    res.status(201).json({ 
      message: "Música adicionada à setlist", 
      itemId 
    });
  } catch (error) {
    console.error("Erro ao adicionar música:", error);
    res.status(500).json({ error: "Erro ao adicionar música" });
  }
}

// Get setlist items (songs)
async function getSetlistItems(req, res) {
  try {
    const setlistId = req.params.id;

    // Check if setlist belongs to user
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const songs = await SetlistModel.getSongs(setlistId);
    res.json(songs);
  } catch (error) {
    console.error("Erro ao buscar músicas da setlist:", error);
    res.status(500).json({ error: "Erro ao buscar músicas" });
  }
}

// Remove song from setlist - SECURITY FIX
async function removeItemFromSetlist(req, res) {
  try {
    const setlistId = req.params.id;
    const itemId = req.params.itemId;

    // Verify ownership through setlist
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Verify the item belongs to this setlist
    const songs = await SetlistModel.getSongs(setlistId);
    const itemExists = songs.some(song => song.item_id == itemId);
    
    if (!itemExists) {
      return res.status(404).json({ error: "Item não encontrado nesta setlist" });
    }

    await SetlistModel.removeSong(itemId);
    res.json({ message: "Música removida da setlist" });
  } catch (error) {
    console.error("Erro ao remover música:", error);
    res.status(500).json({ error: "Erro ao remover música" });
  }
}

// Reorder songs in setlist - SECURITY FIX
async function reorderItems(req, res) {
  try {
    const setlistId = req.params.id;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items deve ser um array não vazio" });
    }

    // Verify ownership
    const belongsToUser = await SetlistModel.belongsToUser(setlistId, req.user.id);
    if (!belongsToUser) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    // Verify all items belong to this setlist
    const existingSongs = await SetlistModel.getSongs(setlistId);
    const validItemIds = new Set(existingSongs.map(song => song.item_id));
    
    const allItemsValid = items.every(item => 
      validItemIds.has(item.itemId) && 
      typeof item.position === 'number' &&
      item.position >= 0
    );

    if (!allItemsValid) {
      return res.status(400).json({ 
        error: "Dados inválidos: verifique os IDs e posições" 
      });
    }

    // Update positions
    for (const item of items) {
      await SetlistModel.updatePosition(item.itemId, item.position);
    }

    res.json({ message: "Ordem atualizada com sucesso" });
  } catch (error) {
    console.error("Erro ao reordenar músicas:", error);
    res.status(500).json({ error: "Erro ao reordenar músicas" });
  }
}

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