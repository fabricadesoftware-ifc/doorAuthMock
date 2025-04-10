const fs = require("fs");
const path = require("path");

/**
 * Retorna uma URL aleatória de um arquivo dentro da pasta avatars.
 *
 * @param {string} baseUrl - URL base (ex: https://example.com)
 * @param {string} folder - Subpasta dentro da public (ex: avatars)
 * @returns {string} - URL completa da imagem aleatória
 */
function getRandomImageUrl(baseUrl, folder = "avatar") {
  const folderPath = path.join(__dirname, "../../../public", folder);
  console.log(folderPath);

  if (!fs.existsSync(folderPath)) {
    throw new Error(`A pasta '${folder}' não foi encontrada em public/`);
  }

  const files = fs.readdirSync(folderPath).filter(
    (file) => /\.(png|jpe?g|gif|webp|svg)$/i.test(file) // Só imagens
  );

  if (files.length === 0) {
    throw new Error(`Nenhuma imagem encontrada em public/${folder}`);
  }

  const randomFile = files[Math.floor(Math.random() * files.length)];
  return `${baseUrl.replace(/\/$/, "")}/${folder}/${randomFile}`;
}

module.exports = getRandomImageUrl;
