const UserModel = require("../models/users.model");
const SongModel = require("../models/songs.model");

// ============================
// Perfil do Utilizador Autenticado
// ============================

async function getMyProfile(req, res) {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        message: "Utilizador não encontrado" 
      });
    }

    res.json(user);

  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ 
      message: "Não conseguimos carregar o teu perfil" 
    });
  }
}

// ============================
// Perfil Público de Outro Utilizador
// ============================

async function getUserProfile(req, res) {
  try {
    const username = req.params.username;

    // Busca o utilizador
    const user = await UserModel.findByUsername(username);

    if (!user) {
      return res.status(404).json({ 
        message: "Utilizador não encontrado" 
      });
    }

    // Busca apenas as músicas públicas dele
    const publicSongs = await UserModel.getPublicSongs(user.id);

    res.json({ 
      user, 
      songs: publicSongs 
    });

  } catch (error) {
    console.error('Erro ao buscar perfil público:', error);
    res.status(500).json({ 
      message: "Erro ao carregar o perfil" 
    });
  }
}

module.exports = { 
  getMyProfile,
  getUserProfile 
};