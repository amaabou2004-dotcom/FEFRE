import React, { useState } from 'react';
import { AlertCircle, Check, Edit2, Image as ImageIcon, Plus, Save, Trash2, Upload, X } from 'lucide-react';
import { isSupabaseConfigured, uploadSiteMedia } from '../../lib/supabase';
import { compressAndEncodeImage } from '../../lib/imageUploader';

/**
 * CRUD générique pour l'espace admin Supabase.
 * Une même interface (liste + formulaire + suppression confirmée) sert pour
 * les services, secteurs, témoignages, FAQ, projets, articles, pages et
 * médias : seuls les champs décrits dans `fields` changent.
 */

export interface EntityField {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'select' | 'list' | 'image' | 'checkbox';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  rows?: number;
}

interface EntityManagerProps<T extends { id: string }> {
  title: string;
  description?: string;
  items: T[];
  fields: EntityField[];
  onSave: (item: Partial<T>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  defaults?: Partial<T>;
  addLabel?: string;
}

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export function EntityManager<T extends { id: string }>({
  title,
  description,
  items,
  fields,
  onSave,
  onDelete,
  getTitle,
  getSubtitle,
  defaults = {},
  addLabel = 'Nouvel élément',
}: EntityManagerProps<T>) {
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const startCreate = () => {
    const init: Record<string, any> = { ...defaults };
    for (const f of fields) {
      if (init[f.key] === undefined) init[f.key] = f.type === 'checkbox' ? false : '';
      if (Array.isArray(init[f.key])) init[f.key] = init[f.key].join('\n');
    }
    setEditing(init);
    setFeedback(null);
  };

  const startEdit = (item: T) => {
    const init: Record<string, any> = { id: item.id };
    for (const f of fields) {
      const v = (item as any)[f.key];
      init[f.key] = Array.isArray(v) ? v.join('\n') : v ?? (f.type === 'checkbox' ? false : '');
    }
    setEditing(init);
    setFeedback(null);
  };

  const handleImageFile = async (fieldKey: string, file: File) => {
    setUploadingKey(fieldKey);
    try {
      let url: string;
      if (isSupabaseConfigured) {
        url = await uploadSiteMedia(file);
        setFeedback({ type: 'success', message: 'Image téléversée dans Supabase Storage (bucket site-media).' });
      } else {
        const res = await compressAndEncodeImage(file);
        url = res.dataUrl;
        setFeedback({ type: 'success', message: 'Image intégrée (mode local : configurez Supabase pour le stockage cloud).' });
      }
      setEditing((prev) => (prev ? { ...prev, [fieldKey]: url } : prev));
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Échec du téléversement : ${err?.message || 'erreur inconnue'}` });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload: Record<string, any> = {};
    if (editing.id) payload.id = editing.id;
    for (const f of fields) {
      const raw = editing[f.key];
      if (f.type === 'list') {
        payload[f.key] = String(raw ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
      } else if (f.type === 'number') {
        payload[f.key] = raw === '' || raw === undefined ? undefined : Number(raw);
      } else if (f.type === 'checkbox') {
        payload[f.key] = Boolean(raw);
      } else {
        payload[f.key] = typeof raw === 'string' ? raw.trim() : raw;
      }
    }
    if (payload.slug === '' && (payload.title || payload.name)) {
      payload.slug = slugify(String(payload.title || payload.name));
    }
    setSaving(true);
    try {
      await onSave(payload as Partial<T>);
      setFeedback({ type: 'success', message: editing.id ? 'Modifications enregistrées dans Supabase.' : 'Élément ajouté dans Supabase.' });
      setEditing(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Enregistrement impossible : ${err?.message || 'erreur inconnue'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDelete) return;
    try {
      await onDelete(id);
      setFeedback({ type: 'success', message: 'Élément supprimé de Supabase.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: `Suppression impossible : ${err?.message || 'erreur inconnue'}` });
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const inputCls =
    'w-full px-3.5 py-2.5 rounded-xl bg-[#01184C] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]';
  const labelCls = 'block text-[11px] uppercase font-bold tracking-wider text-slate-300 mb-1.5';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{addLabel}</span>
          </button>
        )}
      </div>

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
          <button onClick={() => setFeedback(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {editing && (
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-[#0A2254]/60 border border-[#D4AF37]/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h4 className="text-sm font-bold">{editing.id ? 'Modifier l’élément' : addLabel}</h4>
            <button type="button" onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f.key} className={f.type === 'textarea' || f.type === 'list' ? 'sm:col-span-2' : ''}>
                <label className={labelCls}>
                  {f.label}
                  {f.required && <span className="text-[#D4AF37]"> *</span>}
                </label>
                {f.type === 'textarea' || f.type === 'list' ? (
                  <textarea
                    value={editing[f.key] ?? ''}
                    rows={f.rows ?? (f.type === 'list' ? 5 : 4)}
                    required={f.required}
                    placeholder={f.type === 'list' ? 'Un élément par ligne' : f.placeholder}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className={inputCls}
                  />
                ) : f.type === 'select' ? (
                  <select
                    value={editing[f.key] ?? ''}
                    required={f.required}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className={inputCls}
                  >
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value} className="bg-[#01184C]">
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(editing[f.key])}
                      onChange={(e) => setEditing({ ...editing, [f.key]: e.target.checked })}
                      className="accent-[#D4AF37] w-4 h-4"
                    />
                    Oui
                  </label>
                ) : f.type === 'image' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editing[f.key] ?? ''}
                        placeholder="URL de l’image (ou téléversez un fichier)"
                        onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                        className={inputCls}
                      />
                      <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-[11px] font-semibold cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#D4AF37]" />
                        {uploadingKey === f.key ? 'Envoi…' : 'Fichier'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleImageFile(f.key, file);
                          }}
                        />
                      </label>
                    </div>
                    {editing[f.key] && (
                      <img src={editing[f.key]} alt="" className="h-20 rounded-lg object-cover border border-white/10" />
                    )}
                  </div>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={editing[f.key] ?? ''}
                    required={f.required}
                    placeholder={f.placeholder}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-xs font-bold disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Enregistrement…' : 'Enregistrer dans Supabase'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold cursor-pointer"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {items.length === 0 && <p className="text-xs text-gray-400">Aucun élément pour le moment.</p>}
        {items.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl bg-[#0A2254]/40 border border-white/10 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{getTitle(item) || item.id}</p>
              {getSubtitle && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{getSubtitle(item)}</p>}
              <p className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3 opacity-0" />
                {item.id}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-[#D4AF37]">
                {(item as any).status || '—'}
              </span>
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] text-[11px] font-bold cursor-pointer"
              >
                <Edit2 className="w-3 h-3" /> Modifier
              </button>
              {onDelete &&
                (confirmDeleteId === item.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Confirmer la suppression
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-[11px] cursor-pointer"
                    >
                      Non
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/20 cursor-pointer"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
