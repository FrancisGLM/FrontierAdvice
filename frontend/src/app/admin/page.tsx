'use client';

import { useAuth } from '@/lib/AuthContext';
import { useEffect, useState } from 'react';
import { ShieldAlert, Settings2, Plus, Edit2, Trash2, Check, X, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { STRAPI_URL, N8N_WEBHOOK_URL, ADMIN_KEY } from '@/lib/config';

type Tab = 'pasos' | 'incidentes';

export default function AdminPage() {
  const { isAdmin, user, token } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('pasos');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isAdmin || !token) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <ShieldAlert size={64} className="text-red-500 mb-4 opacity-80" />
        <h1 className="text-2xl font-bold mb-2 text-white">Acceso Denegado</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
          Debes iniciar sesión como administrador para ver esta página.
        </p>
        <Link href="/" className="px-6 py-2 rounded-xl text-white font-semibold" style={{ backgroundColor: '#3b82f6' }}>
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-base)', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '1.5rem 2rem 1rem', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-glass)', backdropFilter: 'blur(16px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Settings2 size={20} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Panel de Administración
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Bienvenido, {user?.username || 'Admin'}.
            </p>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('pasos')}
            className={`px-6 py-3 rounded-xl font-bold text-base transition-colors border ${activeTab === 'pasos' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-solid)]'}`}
          >
            Pasos Fronterizos
          </button>
          <button
            onClick={() => setActiveTab('incidentes')}
            className={`px-6 py-3 rounded-xl font-bold text-base transition-colors border ${activeTab === 'incidentes' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-transparent text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-solid)]'}`}
          >
            Reportes de Incidentes
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', paddingBottom: '6rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'pasos' && <PasosTab jwt={token} />}
        {activeTab === 'incidentes' && <IncidentesTab jwt={token} />}
      </div>
    </div>
  );
}

function PasosTab({ jwt }: { jwt: string }) {
  const [pasos, setPasos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPasos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/paso-fronterizos?pagination[limit]=100&sort=nombre_oficial:asc`);
      const data = await res.json();
      setPasos(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasos();
  }, []);

  const handleAction = async (accion: string, payload: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${N8N_WEBHOOK_URL}/admin/complejo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
          'X-ADMIN-KEY': ADMIN_KEY
        },
        body: JSON.stringify({ accion, ...payload })
      });
      if (res.ok) {
        setEditingId(null);
        fetchPasos();
      } else {
        const errorData = await res.json();
        alert('Error: ' + JSON.stringify(errorData.detalle || errorData));
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Gestión de Pasos</h2>
        <button
          onClick={() => {
            setEditingId('new');
            setEditForm({ nombre_oficial: '', region: '', latitud: '', longitud: '' });
          }}
          className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-base transition-colors"
        >
          <Plus size={20} /> Nuevo Paso
        </button>
      </div>

      <div style={{ backgroundColor: 'var(--bg-solid)', borderRadius: '1rem', border: '1px solid var(--border-subtle)', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '600px', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-glass)', borderBottom: '1px solid var(--border-subtle)' }}>
              <th style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Nombre Oficial</th>
              <th style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Región</th>
              <th style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Lat/Lng</th>
              <th style={{ padding: '1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {editingId === 'new' && (
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
                <td style={{ padding: '1rem' }}><input placeholder="Nombre" value={editForm.nombre_oficial} onChange={e => setEditForm({...editForm, nombre_oficial: e.target.value})} style={{ width: '100%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} /></td>
                <td style={{ padding: '1rem' }}><input placeholder="Región" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} style={{ width: '100%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} /></td>
                <td style={{ padding: '1rem' }}>
                  <input placeholder="Latitud" value={editForm.latitud} onChange={e => setEditForm({...editForm, latitud: e.target.value})} style={{ width: '45%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                  <input placeholder="Longitud" value={editForm.longitud} onChange={e => setEditForm({...editForm, longitud: e.target.value})} style={{ width: '45%', marginLeft: '5%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                </td>
                <td style={{ padding: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <button disabled={actionLoading} onClick={() => handleAction('crear', editForm)} className="text-emerald-500 hover:text-emerald-600 transition-colors p-2"><Check size={20} /></button>
                  <button disabled={actionLoading} onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600 transition-colors p-2"><X size={20} /></button>
                </td>
              </tr>
            )}

            {loading ? (
              <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando...</td></tr>
            ) : pasos.map(p => {
              const isEditing = editingId === p.documentId;
              return (
                <tr key={p.documentId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '1rem' }}>
                    {isEditing ? <input value={editForm.nombre_oficial} onChange={e => setEditForm({...editForm, nombre_oficial: e.target.value})} style={{ width: '100%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} /> : <span style={{ color: 'var(--text-primary)' }}>{p.nombre_oficial}</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {isEditing ? <input value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} style={{ width: '100%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} /> : <span style={{ color: 'var(--text-secondary)' }}>{p.region}</span>}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {isEditing ? (
                      <>
                        <input value={editForm.latitud} onChange={e => setEditForm({...editForm, latitud: e.target.value})} style={{ width: '45%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                        <input value={editForm.longitud} onChange={e => setEditForm({...editForm, longitud: e.target.value})} style={{ width: '45%', marginLeft: '5%', padding: '0.25rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }} />
                      </>
                    ) : <span style={{ color: 'var(--text-secondary)' }}>{p.latitud}, {p.longitud}</span>}
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.75rem' }}>
                    {isEditing ? (
                      <>
                        <button disabled={actionLoading} onClick={() => handleAction('actualizar', { paso_documentId: p.documentId, ...editForm })} className="text-blue-500 hover:text-blue-600 transition-colors p-2"><Check size={20} /></button>
                        <button disabled={actionLoading} onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600 transition-colors p-2"><X size={20} /></button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditingId(p.documentId); setEditForm(p); }} className="text-indigo-400 hover:text-indigo-300 transition-colors p-2"><Edit2 size={20} /></button>
                        <button disabled={actionLoading} onClick={() => { if(confirm('¿Desactivar este paso?')) handleAction('softdelete', { paso_documentId: p.documentId, motivo: 'Desactivado desde admin' }) }} className="text-red-500 hover:text-red-400 transition-colors p-2"><Trash2 size={20} /></button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IncidentesTab({ jwt }: { jwt: string }) {
  const [incidentes, setIncidentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [subTab, setSubTab] = useState<'pendientes' | 'historial'>('pendientes');
  const [searchPaso, setSearchPaso] = useState('');
  const [searchFecha, setSearchFecha] = useState('');

  const fetchIncidentes = async () => {
    setLoading(true);
    try {
      const url = subTab === 'pendientes' 
        ? `${N8N_WEBHOOK_URL}/admin/listar-incidentes?estado_revision=pendiente`
        : `${N8N_WEBHOOK_URL}/admin/listar-incidentes`;
        
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'X-ADMIN-KEY': ADMIN_KEY
        }
      });
      const data = await res.json();
      if (data.ok) setIncidentes(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentes();
  }, [subTab]);

  const handleRevisar = async (id: string, estado: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${N8N_WEBHOOK_URL}/admin/revisar-incidente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`,
          'X-ADMIN-KEY': ADMIN_KEY
        },
        body: JSON.stringify({ reporte_documentId: id, estado_revision: estado })
      });
      if (res.ok) {
        fetchIncidentes();
      } else {
        alert('Error al actualizar incidente');
      }
    } catch (e) {
      alert('Error de conexión');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredIncidentes = incidentes.filter(inc => {
    if (subTab === 'pendientes') return true;
    const pasoMatch = (inc.id_paso?.nombre_oficial || '').toLowerCase().includes(searchPaso.toLowerCase());
    // Convert fecha_reporte to YYYY-MM-DD for comparison if searchFecha is set
    const fechaMatch = searchFecha ? new Date(inc.fecha_reporte).toISOString().startsWith(searchFecha) : true;
    return pasoMatch && fechaMatch;
  });

  return (
    <div>
      <div className="flex gap-6 mb-6 border-b border-white/10 pb-2">
        <span 
          onClick={() => setSubTab('pendientes')} 
          className={`cursor-pointer font-bold text-[1.25rem] transition-colors ${subTab === 'pendientes' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Incidentes Pendientes
        </span>
        <span 
          onClick={() => setSubTab('historial')} 
          className={`cursor-pointer font-bold text-[1.25rem] transition-colors ${subTab === 'historial' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Historial de incidentes
        </span>
      </div>

      {subTab === 'historial' && (
        <div className="flex gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Filtrar por paso fronterizo..." 
            value={searchPaso} 
            onChange={e => setSearchPaso(e.target.value)} 
            className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-lg text-white text-sm min-w-[250px]"
          />
          <input 
            type="date" 
            value={searchFecha} 
            onChange={e => setSearchFecha(e.target.value)} 
            className="px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-strong)] rounded-lg text-gray-300 text-sm"
          />
        </div>
      )}
      
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      ) : filteredIncidentes.length === 0 ? (
        <div style={{ backgroundColor: 'var(--bg-solid)', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-secondary)' }}>
            {subTab === 'pendientes' ? 'No hay incidentes pendientes de revisión.' : 'No se encontraron incidentes en el historial.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <style>{`
            .incidente-card {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 1rem;
            }
            .incidente-actions {
              display: flex;
              flex-direction: column;
              gap: 0.5rem;
            }
            @media (max-width: 768px) {
              .incidente-card {
                flex-direction: column;
              }
              .incidente-actions {
                flex-direction: row;
                flex-wrap: wrap;
                width: 100%;
              }
              .incidente-actions button {
                flex: 1;
                justify-content: center;
              }
            }
          `}</style>
          {filteredIncidentes.map((inc) => (
            <div key={inc.documentId} className="incidente-card" style={{ backgroundColor: 'var(--bg-solid)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.125rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    {inc.tipo_incidente}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(inc.fecha_reporte).toLocaleString()}
                  </span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Paso: {inc.id_paso?.nombre_oficial || 'Desconocido'}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  "{inc.descripcion}"
                </p>
                {inc.email_contacto && (
                  <p style={{ fontSize: '0.75rem', color: '#8b5cf6', marginTop: '0.5rem' }}>Contacto: {inc.email_contacto}</p>
                )}
              </div>
              
              {subTab === 'pendientes' ? (
                <div className="incidente-actions">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleRevisar(inc.documentId, 'resuelto')}
                    className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-base font-bold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={20} /> Resuelto
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleRevisar(inc.documentId, 'descartado')}
                    className="flex items-center gap-3 px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-base font-bold hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={20} /> Descartar
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${
                    inc.estado_revision === 'resuelto' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    inc.estado_revision === 'descartado' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {inc.estado_revision ? inc.estado_revision.toUpperCase() : 'PENDIENTE'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
