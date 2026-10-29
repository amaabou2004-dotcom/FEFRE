<?php
// Test de configuration pour cPanel LWS — Excellence Services SARL
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Diagnostic Hébergement cPanel LWS — Excellence Services SARL</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #01184C; color: #fff; padding: 40px 20px; line-height: 1.6; }
    .card { max-width: 650px; margin: 0 auto; background: #0A2254; border-radius: 16px; border: 1px solid #D4AF37; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h1 { color: #D4AF37; margin-top: 0; font-size: 22px; }
    .status { padding: 12px 16px; border-radius: 10px; margin: 15px 0; font-weight: bold; }
    .ok { background: rgba(34, 197, 94, 0.2); border: 1px solid #22c55e; color: #4ade80; }
    .warn { background: rgba(234, 179, 8, 0.2); border: 1px solid #eab308; color: #facc15; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .btn { display: inline-block; background: #D4AF37; color: #01184C; font-weight: bold; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Diagnostic Hébergement cPanel LWS</h1>
    <div class="status ok">
      ✅ Votre domaine pointe correctement vers ce dossier sur cPanel LWS !
    </div>
    <p>Vérification de l'installation d'Excellence Services SARL :</p>
    <ul>
      <li><strong>Fichier index.html :</strong> <?php echo file_exists(__DIR__ . '/index.html') ? '✅ Présent (' . round(filesize(__DIR__ . '/index.html')/1024, 1) . ' Ko)' : '❌ Absent (veillez à extraire le ZIP à la racine de public_html)'; ?></li>
      <li><strong>Fichier .htaccess :</strong> <?php echo file_exists(__DIR__ . '/.htaccess') ? '✅ Présent et actif' : '⚠️ Absent (activez l’affichage des fichiers masqués dans cPanel)'; ?></li>
      <li><strong>Dossier assets/ :</strong> <?php echo is_dir(__DIR__ . '/assets') ? '✅ Présent (' . count(glob(__DIR__ . '/assets/*')) . ' fichiers compilés)' : '❌ Absent'; ?></li>
      <li><strong>Version PHP du serveur :</strong> <?php echo PHP_VERSION; ?></li>
      <li><strong>Dossier racine actuel :</strong> <?php echo htmlspecialchars(__DIR__); ?></li>
    </ul>
    <?php if (file_exists(__DIR__ . '/index.html')): ?>
      <a href="./" class="btn">🚀 Ouvrir le site web</a>
    <?php else: ?>
      <p style="color: #f87171;">Attention : index.html n'a pas été trouvé à la racine de ce dossier. Si vous avez extrait le ZIP dans un sous-dossier, déplacez son contenu directement dans public_html.</p>
    <?php endif; ?>
  </div>
</body>
</html>
