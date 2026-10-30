# Lexiques ISA — zarma & haoussa

Ces fichiers améliorent la reconnaissance vocale et la compréhension des
langues nationales. **Ils sont le point d'entrée principal pour toute personne
qui souhaite améliorer ISA** : aucune compétence en programmation n'est
nécessaire, juste la connaissance de la langue.

## Pourquoi des lexiques ?

Whisper transcrit très bien le haoussa, mais **le zarma ne fait pas partie de
ses langues d'entraînement**. Résultat : Whisper écrit le zarma « à peu près »,
souvent en coupant les mots (`zar ma` au lieu de `zarma`, `baa ni samay` au lieu
de `baani samay`). Le lexique répare ces coupures **avant** la détection
d'intention, ce qui rend la phrase compréhensible par le moteur.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `zarma-fr.csv` | Corrections orthographiques zarma + vocabulaire zarma → français |
| `hausa-fr.csv` | Corrections orthographiques haoussa + vocabulaire haoussa → français |
| `corrections.csv` | Corrections valables pour toutes les langues (noms de lieux, marques) |

## Format

Deux colonnes séparées par une virgule, **sans en-tête** :

```
variante_entendue_par_whisper,forme_correcte
```

Les lignes commençant par `#` sont des commentaires. Le fichier est encodé en
UTF-8 (les caractères ɓ ɗ ƙ ʼ du haoussa et ŋ ʒ du zarma sont conservés).

### Exemples

```csv
zar ma,zarma
baa ni samay,baani samay
ma te ni go,mate ni go
```

Règles appliquées par `app/stt.py` :
1. les expressions multi-mots sont corrigées d'abord (`zar ma` → `zarma`) ;
2. puis chaque mot restant est corrigé individuellement ;
3. la comparaison est insensible aux accents et à la casse.

## Vocabulaire utile à ajouter

Plus vous ajoutez de mots, plus l'assistant comprend de phrases. Priorités :

- **lieux** : quartiers de Niamey, marchés, hôpitaux, écoles, mosquées ;
- **ordres** : « va », « appelle », « montre », « ouvre », « cherche » ;
- **temps** : jours, mois, « matin », « soir », « demain » ;
- **nombres** : de 1 à 100 (utilisés pour les minuteurs et les heures) ;
- **transports** : taxi, moto, bus, « à pied ».

## Où ces mots sont-ils utilisés ?

| Endroit | Usage |
| --- | --- |
| `voice-ai/app/stt.py` | correction de la transcription Whisper |
| `voice-ai/app/knowledge.py` | recherche de lieux et de faits hors-ligne |
| `src/lib/voice/languages.ts` | détection d'intention côté site web |
| `src/lib/voice/nigerKnowledge.ts` | lieux et faits côté site web |

Un mot ajouté ici **et** dans `languages.ts` est compris à la fois par le site
web (règles instantanées) et par le serveur local (Whisper corrigé).

## Contribuer avec un locuteur natif

Procédure recommandée, testable en une demi-journée :

1. Ouvrez `/assistant-vocal` sur un téléphone, choisissez **Zarma**.
2. Prononcez 20 commandes du quotidien (« amène-moi au marché », « quelle heure
   est-il », « appelle ma mère »…).
3. Notez, pour chaque commande, ce que l'écran a affiché comme transcription.
4. Ajoutez dans `zarma-fr.csv` une ligne par écart constaté.
5. Redémarrez le serveur et refaites le test : la transcription doit s'améliorer.

C'est exactement ainsi qu'on construit un assistant vocal pour une langue peu
dotée : par itérations courtes avec des locuteurs, pas par un gros modèle.
