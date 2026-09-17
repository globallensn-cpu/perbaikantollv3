import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  Link as LinkIcon,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { 
  TrendVideo, 
  TREND_CATEGORIES, 
  subscribeTrendVideos, 
  addTrendVideo, 
  updateTrendVideo, 
  softDeleteTrendVideo,
  fetchTikTokMeta
} from '../../lib/trendVideos';

export default function TrendVideoManagementPanel() {
  const [videos, setVideos] = useState<TrendVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    tiktokUrl: '',
    category: TREND_CATEGORIES[0]
  });

  useEffect(() => {
    const unsubscribe = subscribeTrendVideos((data) => {
      setVideos(data);
      setLoading(false);
    }, false); // false = ambil semua termasuk non-aktif

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setForm({
      tiktokUrl: '',
      category: TREND_CATEGORIES[0]
    });
    setEditingId(null);
  };

  const validLinks = form.tiktokUrl
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.includes('tiktok.com'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const singleLink = form.tiktokUrl.trim();
      if (!singleLink) {
        alert('Link TikTok wajib diisi');
        return;
      }
      setSaving(true);
      try {
        const meta = await fetchTikTokMeta(singleLink);
        await updateTrendVideo(editingId, {
          tiktokUrl: singleLink,
          title: meta?.title || singleLink,
          category: form.category,
          thumbnailUrl: meta?.thumbnailUrl || '',
          viewCount: meta?.viewCount || '',
          likeCount: meta?.likeCount || ''
        });
        resetForm();
      } catch (err) {
        console.error(err);
        alert('Gagal mengupdate data video');
      } finally {
        setSaving(false);
      }
      return;
    }

    // Mode Bulk Insert
    const links = form.tiktokUrl
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.includes('tiktok.com'));

    if (links.length === 0) {
      alert('Masukkan minimal 1 link TikTok yang valid');
      return;
    }

    setSaving(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const link of links) {
        try {
          const meta = await fetchTikTokMeta(link);

          await addTrendVideo({
            tiktokUrl: link,
            title: meta?.title || link,
            category: form.category,
            thumbnailUrl: meta?.thumbnailUrl || '',
            viewCount: meta?.viewCount || '',
            likeCount: meta?.likeCount || ''
          });
          successCount++;
        } catch (err) {
          console.error('Gagal proses link:', link, err);
          failCount++;
        }
      }

      alert(`Berhasil menambahkan ${successCount} video${failCount > 0 ? `, gagal ${failCount}` : ''}`);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (video: TrendVideo) => {
    setEditingId(video.id);
    setForm({
      tiktokUrl: video.tiktokUrl || '',
      category: video.category || TREND_CATEGORIES[0]
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSoftDelete = async (id: string) => {
    if (!confirm('Nonaktifkan video ini? User tidak akan melihatnya lagi.')) return;
    try {
      await softDeleteTrendVideo(id);
    } catch (err) {
      console.error(err);
      alert('Gagal menonaktifkan');
    }
  };

  const handleToggleActive = async (video: TrendVideo) => {
    try {
      await updateTrendVideo(video.id, { isActive: !video.isActive });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Manajemen Trend Video Viral</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tambahkan link video TikTok viral. User akan melihatnya secara realtime di tab Trend.
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-700">
            {editingId ? 'Edit Video' : 'Tambah Video Baru'}
          </h3>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Batal Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Link TikTok <span className="text-red-500">*</span>
            </label>
            {editingId ? (
              <input
                type="url"
                required
                value={form.tiktokUrl}
                onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
              />
            ) : (
              <div>
                <textarea
                  rows={5}
                  required
                  value={form.tiktokUrl}
                  onChange={(e) => setForm({ ...form, tiktokUrl: e.target.value })}
                  placeholder="Paste banyak link TikTok di sini (satu link per baris)&#10;Contoh:&#10;https://www.tiktok.com/@user/video/123&#10;https://www.tiktok.com/@user/video/456"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono resize-y"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Satu link per baris. Semua link akan masuk ke kategori yang dipilih.
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">
              Kategori Produk <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white cursor-pointer"
            >
              {TREND_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {editingId 
                    ? 'Update Video' 
                    : validLinks.length > 1 
                      ? `Tambah ${validLinks.length} Video` 
                      : 'Tambah Video'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-medium text-slate-700">
            Daftar Video ({videos.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400">
            <Loader2 className="mx-auto animate-spin mb-2" size={24} />
            Memuat data...
          </div>
        ) : videos.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            Belum ada video. Tambahkan video pertama di form atas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Link TikTok</th>
                  <th className="text-left px-4 py-3 font-medium">Kategori</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 line-clamp-1 max-w-[320px]">
                        {video.title || video.tiktokUrl}
                      </div>
                      <a 
                        href={video.tiktokUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-violet-600 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <LinkIcon size={11} />
                        Buka link
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
                        {video.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {video.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Eye size={12} /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <EyeOff size={12} /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(video)}
                          className="p-1.5 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(video)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                          title={video.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {video.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => handleSoftDelete(video.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Hapus (soft)"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
