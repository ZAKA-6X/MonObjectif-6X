# MonObjectif – Présentations & Groupes

Un module léger de **gestion des présentations** pour les établissements scolaires et universitaires.  
Les étudiants peuvent déposer leur fichier de présentation pour leur groupe, tandis que les enseignants peuvent **activer/désactiver**, **télécharger**, **évaluer** et **donner un feedback** sur chaque présentation.

---

## ✨ Fonctionnalités

### 👩‍🎓 Étudiant
- Visualiser la liste des **présentations actives** (titre, date, statut).  
- Accéder à son **groupe** et voir la liste des membres.  
- **Téléverser / modifier** un fichier de présentation (PPT, PDF, etc.).  
- Consulter sa **note** et son **feedback** une fois l’évaluation effectuée.  

### 👨‍🏫 Enseignant
- Tableau de bord enseignant listant **tous les groupes** avec leurs présentations.  
- Possibilité **d’activer ou de désactiver** une présentation (contrôle de la visibilité et des dépôts).  
- **Télécharger** les fichiers soumis par les groupes.  
- **Évaluer** une présentation avec une note sur 20 et un commentaire.  
- Consulter les informations du groupe (membres, date, statut, etc.).  

### 🔄 Cycle de vie des statuts
- `ACTIVE` → visible par les étudiants, dépôt autorisé.  
- `INACTIVE` → cachée aux étudiants, dépôt verrouillé.  
- `NON ÉVALUÉ` → statut par défaut avant notation.  
- `ÉVALUÉ` → note affichée et fichier accessible en lecture seule.  

---

## 🖼️ Aperçu visuel  

### Présentations Actives 
<img width="1093" height="542" alt="image" src="https://github.com/user-attachments/assets/3c3a3573-caf7-46f0-8718-05f6c28c51b0" />
### Membres du Groupe
<img width="1460" height="775" alt="image" src="https://github.com/user-attachments/assets/f0028ed7-00e5-44d2-9308-044e7726f821" />
### Présentation réalisée par un groupe d’étudiants 
<img width="1073" height="834" alt="image" src="https://github.com/user-attachments/assets/bfec63a2-73cc-49d5-83a1-5948d29add5d" />


---

## 🧱 Technologies utilisées  
- **Frontend :** HTML / CSS / JavaScript (compatible Tailwind ou Bootstrap).  
- **Backend :** Node.js + Express (ou tout autre framework REST).  
- **Base de données :** PostgreSQL (compatible Supabase).  
- **Stockage :** Supabase Storage / S3.  
- **Authentification :** basée sur votre système existant (session, cookie, JWT, etc.).  

---

