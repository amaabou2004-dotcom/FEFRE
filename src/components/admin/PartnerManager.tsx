import React, { useState, useRef } from 'react';
import {
  Handshake,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  X,
  Building2,
  Globe,
  Tag,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';
import { useSiteData } from '../../lib/DataContext';
import { PartnerItem } from '../../types';

const CATEGORY_PRESETS = [
  'Tech & Expérience Digitale',
  'Infrastructures & Systèmes IT',
  'Paiements & Digitalisation',
  'Télécommunications & Voix',
  'Transport & Messagerie',
  'Banque & Microfinance',
  'Conseil & Stratégie',
  'Institutionnel & Écosystème',
];

export const PartnerManager: React.FC = () => {
  const { partners, savePartner, deletePartner } = useSiteData();

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<Partial<PartnerItem>>({
    name: '',
    category: CATEGORY_PRESETS[0],
    logoUrl: '',
    website: '',
    description: '',
    status: 'active',
    displayOrder: partners.length + 1,
  });

  // Optimize and compress uploaded image into a lightweight data URL
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFeedback({
        type: 'error',
        message: 'Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP...).',
      });
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setUploadingImage(false);
        return;
      }

      // If it's an SVG, keep it as is
      if (file.type === 'image/svg+xml') {
        setFormData((prev) => ({ ...prev, logoUrl: result }));
        setUploadingImage(false);
        setFeedback({
          type: 'success',
          message: 'Logo vectoriel importé avec succès.',
        });
        return;
      }

      // For standard images, resize and compress using HTML Canvas to keep payload small
      const img = new Image();
      img.src = result;
      img.onload = () => {
        const maxWidth = 500;
        const maxHeight = 500;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let targetFormat = 'image/webp';
          let compressedDataUrl = canvas.toDataURL(targetFormat, 0.85);
          if (!compressedDataUrl.startsWith('data:image/webp')) {
            targetFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            compressedDataUrl = canvas.toDataURL(targetFormat, 0.88);
          }
          setFormData((prev) => ({ ...prev, logoUrl: compressedDataUrl }));
          setFeedback({
            type: 'success',
            message: `Image importée et optimisée en format WebP (${Math.round(compressedDataUrl.length / 1024)} Ko).`,
          });
        } else {
          setFormData((prev) => ({ ...prev, logoUrl: result }));
        }
        setUploadingImage(false);
      };

      img.onerror = () => {
        setUploadingImage(false);
        setFeedback({
          type: 'error',
          message: "Impossible de charger l'image sélectionnée.",
        });
      };
    };

    reader.onerror = () => {
      setUploadingImage(false);
      setFeedback({
        type: 'error',
        message: 'Erreur lors de la lecture du fichier image.',
      });
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: CATEGORY_PRESETS[0],
      logoUrl: '',
      website: '',
      description: '',
      status: 'active',
      displayOrder: partners.length + 1,
    });
    setEditingId(null);
    setIsEditing(false);
    setLogoInputMode('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartCreate = () => {
    setFormData({
      name: '',
      category: CATEGORY_PRESETS[0],
      logoUrl: '',
      website: '',
      description: '',
      status: 'active',
      displayOrder: partners.length + 1,
    });
    setEditingId(null);
    setIsEditing(true);
    setFeedback(null);
  };

  const handleStartEdit = (partner: PartnerItem) => {
    setFormData({
      name: partner.name,
      category: partner.category || CATEGORY_PRESETS[0],
      logoUrl: partner.logoUrl || '',
      website: partner.website || '',
      description: partner.description || '',
      status: partner.status || 'active',
      displayOrder: partner.displayOrder || 1,
    });
    setEditingId(partner.id);
    setIsEditing(true);
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setFeedback({ type: 'error', message: 'Le nom du partenaire est obligatoire.' });
      return;
    }

    setSaving(true);
    try {
      await savePartner({
        ...(editingId ? { id: editingId } : {}),
        name: formData.name.trim(),
        category: formData.category || 'Partenaire',
        logoUrl: formData.logoUrl?.trim() || undefined,
        website: formData.website?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        status: formData.status || 'active',
        displayOrder: Number(formData.displayOrder) || 1,
      });

      setFeedback({
        type: 'success',
        message: editingId
          ? `Le partenaire « ${formData.name} » a été mis à jour.`
          : `Le nouveau partenaire « ${formData.name} » a été ajouté avec succès.`,
      });
      resetForm();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Erreur lors de l'enregistrement : ${err?.message || 'Erreur inconnue'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      await deletePartner(id);
      setDeleteConfirmId(null);
      setFeedback({ type: 'success', message: `Le partenaire « ${name} » a été supprimé.` });
      if (editingId === id) {
        resetForm();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Erreur lors de la suppression : ${err?.message || 'Erreur inconnue'}`,
      });
    }
  };

  const handleToggleStatus = async (partner: PartnerItem) => {
    const nextStatus = partner.status === 'active' ? 'former' : 'active';
    try {
      await savePartner({
        id: partner.id,
        status: nextStatus,
      });
      setFeedback({
        type: 'success',
        message: `Statut de « ${partner.name} » modifié en ${nextStatus === 'active' ? 'Actif (visible sur le site)' : 'Inactif'}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Erreur de modification du statut : ${err?.message || 'Erreur inconnue'}`,
      });
    }
  };

  return (
    <div id="admin-partner-manager" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="text-xl font-bold text-white">Gestion des Partenaires</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ajoutez, modifiez ou retirez les partenaires et alliances stratégiques affichés sur le site.
          </p>
        </div>

        {!isEditing && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Partenaire</span>
          </button>
        )}
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/50 border-red-500/40 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Edit / Create Form Modal or Inline Card */}
      {isEditing && (
        <div className="p-6 rounded-2xl bg-[#0A2254]/60 border border-[#D4AF37]/30 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <span>{editingId ? 'Modifier le partenaire' : 'Ajouter un nouveau partenaire'}</span>
            </h4>
            <button
              type="button"
              onClick={resetForm}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                  Nom du partenaire / entreprise <span className="text-[#D4AF37]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex : Loyal Themes, Sahel Telecom..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                  Secteur / Catégorie
                </label>
                <input
                  type="text"
                  list="partner-category-suggestions"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Sélectionnez ou saisissez une catégorie"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
                <datalist id="partner-category-suggestions">
                  {CATEGORY_PRESETS.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Logo du partenaire : Importation depuis la galerie ou lien URL */}
            <div className="p-4 rounded-xl bg-[#01184C]/80 border border-white/10 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300">
                  Logo / Image du partenaire
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#0A2254] border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('upload')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      logoInputMode === 'upload'
                        ? 'bg-[#D4AF37] text-[#01184C] shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Depuis la Galerie / Fichier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoInputMode('url')}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      logoInputMode === 'url'
                        ? 'bg-[#D4AF37] text-[#01184C] shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Lien URL externe</span>
                  </button>
                </div>
              </div>

              {logoInputMode === 'upload' ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="partner-gallery-upload"
                  />

                  {formData.logoUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl bg-[#0A2254]/50 border border-white/10">
                      <div className="w-20 h-20 rounded-xl bg-[#01184C] border border-white/10 p-2 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={formData.logoUrl}
                          alt="Aperçu logo"
                          width={64}
                          height={64}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="space-y-1 text-center sm:text-left flex-1">
                        <p className="text-xs font-bold text-white">Image importée avec succès</p>
                        <p className="text-[11px] text-slate-400">
                          L'image est prête et sera affichée sur le site web.
                        </p>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#01184C] hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-[#D4AF37] transition-colors cursor-pointer"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Changer l'image</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, logoUrl: '' });
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-[11px] font-semibold text-red-300 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-white/20 hover:border-[#D4AF37] hover:bg-[#0A2254]/40 transition-all rounded-2xl p-6 text-center cursor-pointer group flex flex-col items-center justify-center space-y-2"
                    >
                      <div className="w-12 h-12 rounded-xl bg-[#0A2254] group-hover:bg-[#D4AF37]/20 border border-white/10 flex items-center justify-center transition-colors">
                        {uploadingImage ? (
                          <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                          Sélectionner une photo depuis votre galerie ou appareil
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Cliquez pour parcourir vos dossiers / photos ou glissez-déposez le fichier
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Formats acceptés : PNG, JPG, JPEG, SVG, WebP (redimensionnement automatique)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://exemple.com/logo-partenaire.png"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  />
                  {formData.logoUrl && (
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#0A2254]/40 border border-white/10">
                      <div className="w-10 h-10 rounded-lg bg-[#01184C] p-1 flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={formData.logoUrl}
                          alt="Aperçu"
                          width={32}
                          height={32}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-300 truncate">
                        Aperçu du logo distant
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                  Site Web officiel (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://partenaire.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.displayOrder || 1}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                Description / Synergie partenariale
              </label>
              <textarea
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez brièvement la nature du partenariat ou les expertises mutualisées..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5">
                  Statut de publication
                </label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'pending' | 'former' })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="active">Actif (affiché sur le site web)</option>
                  <option value="former">Inactif / Masqué</option>
                  <option value="pending">En attente de validation</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-transparent transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[#01184C] border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#01184C]" />
                    <span>{editingId ? 'Enregistrer les modifications' : 'Ajouter le partenaire'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Partners List Table / Cards */}
      <div className="rounded-2xl bg-[#0A2254]/30 border border-white/10 overflow-hidden shadow-lg">
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D4AF37]">
              Partenaires Répertoriés ({partners.length})
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {partners.filter((p) => p.status === 'active').length} actifs en ligne
          </span>
        </div>

        {partners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold text-white">Aucun partenaire enregistré</p>
            <p className="text-xs text-slate-400">
              Cliquez sur « Nouveau Partenaire » ci-dessus pour ajouter votre premier partenaire.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {partners.map((partner) => {
              const isActive = partner.status === 'active';
              return (
                <div
                  key={partner.id}
                  className="p-4 sm:p-5 hover:bg-[#0A2254]/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Logo thumbnail or fallback icon */}
                    <div className="w-14 h-14 rounded-xl bg-[#01184C] border border-white/10 flex items-center justify-center p-2 shrink-0 overflow-hidden">
                      {partner.logoUrl ? (
                        <img
                          src={partner.logoUrl}
                          alt={partner.name}
                          width={48}
                          height={48}
                          loading="lazy"
                          decoding="async"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Building2 className="w-6 h-6 text-[#D4AF37]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{partner.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                          }`}
                        >
                          {isActive ? 'Actif' : 'Inactif'}
                        </span>
                        {partner.displayOrder !== undefined && (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{partner.displayOrder}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {partner.category && (
                          <span className="text-[#D4AF37] font-semibold">{partner.category}</span>
                        )}
                        {partner.website && (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-white transition-colors underline-offset-2 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{partner.website.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {partner.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 pt-0.5">
                          {partner.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(partner)}
                      title={isActive ? 'Désactiver (masquer du site)' : 'Activer (afficher sur le site)'}
                      className={`p-2 rounded-lg border text-xs font-semibold transition-colors ${
                        isActive
                          ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10'
                          : 'border-slate-500/30 text-slate-400 hover:bg-slate-500/10'
                      }`}
                    >
                      {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(partner)}
                      title="Modifier les informations"
                      className="p-2 rounded-lg bg-[#01184C] hover:bg-white/10 text-[#D4AF37] border border-white/10 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {deleteConfirmId === partner.id ? (
                      <div className="flex items-center gap-1.5 bg-red-950/80 p-1 rounded-lg border border-red-500/40">
                        <button
                          type="button"
                          onClick={() => handleDelete(partner.id, partner.name)}
                          className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="p-1 text-slate-300 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(partner.id)}
                        title="Supprimer ce partenaire"
                        className="p-2 rounded-lg bg-[#01184C] hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
