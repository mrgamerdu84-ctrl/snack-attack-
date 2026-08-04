# Musique de Snack Attack

La musique principale du jeu provient du fichier `three_tiles_left.mp3` fourni par le propriétaire du projet.

Pendant la compilation, elle est reconstruite depuis 13 blocs Base64 vérifiés, puis convertie en MP3 et OGG et intégrée dans l’APK sous le nom `music-loop`.

La reconstruction exige exactement 72 392 octets et l’empreinte SHA-256 `5b5a770e76e6d43895a15b834cbb382b8ca5fffad9e8cb13cbd04776fd130e11`.

Elle est lue en boucle pendant l’aventure et le mode Détente.