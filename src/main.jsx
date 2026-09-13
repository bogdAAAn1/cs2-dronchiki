import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { ArrowLeft, Check, ChevronRight, CircleDot, ExternalLink, Flame, Pencil, Plus, Shield, Trash2, Video, Wind, X, Zap } from 'lucide-react';
import './styles.css';

const maps = [
  ['mirage', 'Mirage', 'de_mirage'], ['dust2', 'Dust II', 'de_dust2'], ['inferno', 'Inferno', 'de_inferno'],
  ['ancient', 'Ancient', 'de_ancient'], ['anubis', 'Anubis', 'de_anubis'], ['nuke', 'Nuke', 'de_nuke'],
  ['overpass', 'Overpass', 'de_overpass'], ['vertigo', 'Vertigo', 'de_vertigo'], ['train', 'Train', 'de_train'],
].map(([id, name, code]) => ({ id, name, code }));
const grenadeMeta = { smoke: ['Дим', Wind], flash: ['Флешка', Zap], molotov: ['Молотов', Flame], he: ['Осколкова', CircleDot] };
const seed = {
  tactics: [
    { id: 'seed-1', map: 'mirage', side: 'CT', title: 'Дефолт-сетап на A', site: 'A', summary: 'Контроль Window, Palace і Ramp із вільним гравцем під ротацію.', steps: ['Гравець на CT споуні тримає Window / Short', 'AWP контролює Palace–Ramp', 'П’ятий гравець чекає інфо з мід'] },
    { id: 'seed-2', map: 'mirage', side: 'T', title: 'Execute на A через Window', site: 'A', summary: 'Дими на CT і Window, флешки в Palace, синхронний вхід Ramp + Palace.', steps: ['Дим на CT', 'Дим Window', 'Дві флешки через Palace', 'Синхронний вхід'] },
    { id: 'seed-3', map: 'dust2', side: 'T', title: 'Long A execute', site: 'A', summary: 'Контроль Long, дими Xbox і CT, повний стек заходить на сайт.', steps: ['Контроль Long doors', 'Дим CT + Xbox', 'Флеш на плато'] },
  ],
  grenades: [
    { id: 'seed-4', map: 'mirage', side: 'CT', name: 'Дим Window', types: ['smoke'], from_position: 'CT-споун', target: 'Window / A short', summary: 'Блокує огляд під час виходу на A.' },
    { id: 'seed-5', map: 'mirage', side: 'T', name: 'Дим CT', types: ['smoke'], from_position: 'Ramp', target: 'CT', summary: 'Базовий дим для execute на A.' },
    { id: 'seed-6', map: 'dust2', side: 'T', name: 'Молотов дефолт-плант B', types: ['molotov'], from_position: 'Tunnels', target: 'B site', summary: 'Виганяє з дефолтної позиції.' },
  ],
  links: [
    { id: 'seed-7', title: 'Mirage — execute на A з димом CT', url: 'https://youtu.be/', map: 'mirage', side: 'T', type: 'grenades', nade_types: ['smoke'], note: 'Класичний дим CT з Ramp.' },
    { id: 'seed-8', title: 'Dust2 — ретейк A через Goose', url: 'https://youtu.be/', map: 'dust2', side: 'CT', type: 'tactics', nade_types: [], note: 'Розбір таймінгів ретейку.' },
  ],
};

function App() {
  const [view, setView] = useState('maps');
  const [activeMap, setActiveMap] = useState(null);
  const [category, setCategory] = useState(null);
  const [side, setSide] = useState('CT');
  const [data, setData] = useState(seed);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ map: 'all', side: 'all', type: 'all' });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;
    Promise.all(['tactics', 'grenades', 'links'].map((table) => supabase.from(table).select('*').order('created_at', { ascending: false })))
      .then((results) => {
        const next = { tactics: results[0].data || [], grenades: results[1].data || [], links: results[2].data || [] };
        if (results.every(({ error }) => !error && (dataForTable(results, error)))) setData(next);
      })
      .finally(() => setLoading(false));
  }, []);

  const currentItems = useMemo(() => !activeMap || !category ? [] : data[category].filter((item) => item.map === activeMap && item.side === side), [data, activeMap, category, side]);
  const filteredLinks = useMemo(() => data.links.filter((item) => (filters.map === 'all' || item.map === filters.map) && (filters.side === 'all' || item.side === filters.side) && (filters.type === 'all' || item.type === filters.type)), [data.links, filters]);
  const update = (kind, next) => setData((old) => ({ ...old, [kind]: typeof next === 'function' ? next(old[kind]) : next }));

  async function save(kind, item, isEdit) {
    const tableItem = kind === 'grenades' ? { ...item, from_position: item.from_position } : item;
    if (supabase) {
      const { id, ...payload } = tableItem;
      const result = isEdit ? await supabase.from(kind).update(payload).eq('id', id) : await supabase.from(kind).insert(payload).select().single();
      if (result.error) return alert(result.error.message);
      if (!isEdit) tableItem.id = result.data.id;
    } else tableItem.id ||= `${kind}-${Date.now()}`;
    update(kind, (old) => isEdit ? old.map((x) => x.id === tableItem.id ? tableItem : x) : [tableItem, ...old]);
    setModal(null); setEditing(null);
  }
  async function remove(kind, id) {
    if (!confirm('Видалити цей запис?')) return;
    if (supabase) { const { error } = await supabase.from(kind).delete().eq('id', id); if (error) return alert(error.message); }
    update(kind, (old) => old.filter((x) => x.id !== id));
  }
  const openLinks = (map = 'all', linkSide = 'all', linkType = 'all') => {
    setFilters({ map, side: linkSide, type: linkType });
    setView('links');
    setActiveMap(null);
    setCategory(null);
  };

  return <div className="app-shell">
    <header className="topbar"><button className="brand" onClick={() => { setView('maps'); setActiveMap(null); setCategory(null); }}><strong>Розвідка</strong><span>тактичний довідник CS2</span></button><nav><button className={view === 'maps' ? 'nav-active' : ''} onClick={() => setView('maps')}>Карти</button><button className={view === 'links' ? 'nav-active' : ''} onClick={openLinks}>База посилань</button></nav></header>
    {loading && <div className="sync-status">Синхронізація з Supabase...</div>}
    {view === 'maps' && !activeMap && <MapGrid onOpen={(id) => setActiveMap(id)} />}
    {view === 'maps' && activeMap && <MapDetail map={maps.find((m) => m.id === activeMap)} category={category} setCategory={setCategory} side={side} setSide={setSide} items={currentItems} links={data.links.filter((l) => l.map === activeMap && l.side === side && l.type === category)} onBack={() => { setActiveMap(null); setCategory(null); }} onAdd={() => setModal(category)} onEdit={(item) => { setEditing(item); setModal(category); }} onDelete={(id) => remove(category, id)} onLinkEdit={(item) => { setEditing(item); setModal('links'); }} onLinkDelete={(id) => remove('links', id)} onLinks={() => openLinks(activeMap, side, category)} />}
    {view === 'links' && <LinksView links={filteredLinks} filters={filters} setFilters={setFilters} onAdd={() => setModal('links')} onEdit={(item) => { setEditing(item); setModal('links'); }} onDelete={(id) => remove('links', id)} />}
    {modal && <EntryModal kind={modal} initial={editing} defaultMap={activeMap || (filters.map !== 'all' ? filters.map : 'mirage')} defaultSide={side} defaultType={filters.type !== 'all' ? filters.type : 'tactics'} onClose={() => { setModal(null); setEditing(null); }} onSave={(item) => save(modal, item, Boolean(editing))} />}
  </div>;
}
function dataForTable(results) { return results.length > 0; }

function MapGrid({ onOpen }) { return <main><div className="intro"><p className="eyebrow">ПІДГОТОВКА ДО РАУНДУ</p><h1>Обери карту</h1><p>Тримай сетапи, execute-и, ретейки та гранати в одному місці.</p></div><div className="map-grid">{maps.map((map, index) => <button className="map-card" key={map.id} onClick={() => onOpen(map.id)}><div className="map-sketch" style={{ transform: `rotate(${index % 2 ? 3 : -3}deg)` }}><i /><i /><i /></div><div className="map-card-footer"><span>{map.name}</span><ChevronRight size={16} /></div><small>{map.code}</small></button>)}<button className="map-card add-card" onClick={() => alert('Кастомні карти можна додати через Supabase або окрему форму.') }><Plus size={20} /><span>Додати свою карту</span></button></div></main>; }

function MapDetail({ map, category, setCategory, side, setSide, items, links, onBack, onAdd, onEdit, onDelete, onLinkEdit, onLinkDelete, onLinks }) { return <main><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Усі карти</button><div className="title-row"><div><p className="eyebrow">ТАКТИЧНА КАРТА</p><h1>{map.name}</h1><span className="muted">{map.code}</span></div></div>{!category ? <div className="category-grid"><button onClick={() => setCategory('tactics')}><span>Тактики</span><small>Сетапи, execute-и й ретейки для CT і T.</small></button><button onClick={() => setCategory('grenades')}><span>Гранати</span><small>Дими, флешки, молотови та осколкові.</small></button></div> : <><div className="section-toolbar"><button className="back-link" onClick={() => setCategory(null)}><ArrowLeft size={15} /> {category === 'tactics' ? 'Тактики' : 'Гранати'}</button><div className="toolbar-actions"><div className="segmented"><button className={side === 'CT' ? 'selected ct' : ''} onClick={() => setSide('CT')}><Shield size={14} /> CT</button><button className={side === 'T' ? 'selected t' : ''} onClick={() => setSide('T')}>◈ T</button></div><button className="primary" onClick={onAdd}><Plus size={15} /> Додати {category === 'tactics' ? 'тактику' : 'гранату'}</button></div></div><div className="items">{items.length ? items.map((item) => category === 'tactics' ? <TacticCard key={item.id} item={item} side={side} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} /> : <GrenadeCard key={item.id} item={item} side={side} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />) : <Empty text={`Тут поки порожньо для ${map.name} · ${side}.`} />}</div><div className="related"><div className="related-heading"><Video size={15} /> Пов’язані відео ({links.length})</div>{links.map((link) => <LinkCard key={link.id} link={link} onEdit={() => onLinkEdit(link)} onDelete={() => onLinkDelete(link.id)} />)}<button className="secondary" onClick={onLinks}><Plus size={14} /> Перейти до бази посилань</button></div></>}</main>; }
function TacticCard({ item, onEdit, onDelete, side }) { return <article className="content-card"><div className="card-heading"><div><h3>{item.title}</h3><span className={`pill ${side.toLowerCase()}`}>{item.site} сайт</span></div><Actions onEdit={onEdit} onDelete={onDelete} /></div><p>{item.summary}</p><ol>{(item.steps || []).map((step, i) => <li key={i}>{step}</li>)}</ol></article>; }
function GrenadeCard({ item, onEdit, onDelete, side }) { return <article className="content-card grenade-card"><div className={`grenade-icon ${side.toLowerCase()}`}>{(item.types || []).map((type) => { const Icon = grenadeMeta[type]?.[1] || CircleDot; return <Icon key={type} size={16} />; })}</div><div className="card-body"><div className="card-heading"><div><h3>{item.name}</h3><span className="pill">{(item.types || []).map((x) => grenadeMeta[x]?.[0]).join(' · ')}</span></div><Actions onEdit={onEdit} onDelete={onDelete} /></div><small>{item.from_position} → {item.target}</small><p>{item.summary}</p></div></article>; }
function Actions({ onEdit, onDelete }) { return <div className="actions"><button title="Редагувати" onClick={onEdit}><Pencil size={15} /></button><button title="Видалити" onClick={onDelete}><Trash2 size={15} /></button></div>; }
function Empty({ text }) { return <div className="empty">{text} Додай перший запис кнопкою вище.</div>; }

function LinksView({ links, filters, setFilters, onAdd, onEdit, onDelete }) { return <main><div className="page-heading"><div><p className="eyebrow">СПІЛЬНА БІБЛІОТЕКА</p><h1>База посилань</h1><p>Відео з тегами по карті, стороні й типу.</p></div><button className="primary" onClick={onAdd}><Plus size={15} /> Додати посилання</button></div><div className="filters"><select value={filters.map} onChange={(e) => setFilters({ ...filters, map: e.target.value })}><option value="all">Усі карти</option>{maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select><select value={filters.side} onChange={(e) => setFilters({ ...filters, side: e.target.value })}><option value="all">Обидві сторони</option><option value="CT">CT</option><option value="T">T</option></select><select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="all">Тактики + гранати</option><option value="tactics">Тактики</option><option value="grenades">Гранати</option></select></div><div className="items">{links.length ? links.map((link) => <LinkCard key={link.id} link={link} detailed onEdit={() => onEdit(link)} onDelete={() => onDelete(link.id)} />) : <Empty text="Нічого не знайдено." />}</div></main>; }
function LinkCard({ link, detailed, onEdit, onDelete }) { return <article className="link-card"><div className="link-icon"><Video size={16} /></div><a href={link.url} target="_blank" rel="noreferrer"><h3>{link.title}</h3><div className="pills"><span className="pill">{maps.find((m) => m.id === link.map)?.name || link.map}</span><span className={`pill ${link.side.toLowerCase()}`}>{link.side}</span><span className="pill">{link.type === 'tactics' ? 'Тактика' : 'Гранати'}</span></div>{detailed && link.note && <p>{link.note}</p>}</a><div className="actions"><Actions onEdit={onEdit} onDelete={onDelete} /><a title="Відкрити" href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={15} /></a></div></article>; }

function EntryModal({ kind, initial, defaultMap, defaultSide, defaultType = 'tactics', onClose, onSave }) {
  const [form, setForm] = useState(initial || (kind === 'tactics' ? { map: defaultMap, side: defaultSide, title: '', site: 'A', summary: '', steps: [] } : kind === 'grenades' ? { map: defaultMap, side: defaultSide, name: '', types: ['smoke'], from_position: '', target: '', summary: '' } : { title: '', url: '', map: defaultMap, side: defaultSide, type: defaultType, nade_types: [], note: '' }));
  const set = (key, value) => setForm({ ...form, [key]: value });
  const title = kind === 'tactics' ? 'тактику' : kind === 'grenades' ? 'гранату' : 'посилання';
  const valid = kind === 'tactics' ? form.title && form.summary : kind === 'grenades' ? form.name && form.from_position && form.target && form.types.length : form.title && form.url;
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="modal-title"><h2>{initial ? 'Редагувати' : 'Додати'} {title}</h2><button onClick={onClose}><X size={18} /></button></div><div className="form-grid">{kind === 'links' && <><Field label="Назва"><input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Mirage — execute A" /></Field><Field label="Посилання"><input value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://..." /></Field></>}{kind !== 'links' && <Field label="Назва"><input value={form[kind === 'tactics' ? 'title' : 'name']} onChange={(e) => set(kind === 'tactics' ? 'title' : 'name', e.target.value)} /></Field>}<div className="two-col"><Field label="Карта"><select value={form.map} onChange={(e) => set('map', e.target.value)}>{maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field><Field label="Сторона"><select value={form.side} onChange={(e) => set('side', e.target.value)}><option>CT</option><option>T</option></select></Field></div>{kind === 'links' && <Field label="Тип"><select value={form.type} onChange={(e) => set('type', e.target.value)}><option value="tactics">Тактика</option><option value="grenades">Гранати</option></select></Field>}{kind === 'tactics' && <><Field label="Сайт / напрямок"><input value={form.site} onChange={(e) => set('site', e.target.value)} placeholder="A, B, Мід" /></Field><Field label="Короткий опис"><textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} /></Field><Field label="Кроки, по одному на рядок"><textarea value={(form.steps || []).join('\n')} onChange={(e) => set('steps', e.target.value.split('\n'))} /></Field></>}{kind === 'grenades' && <><Field label="Тип гранати"><div className="type-picker">{Object.entries(grenadeMeta).map(([key, [label]]) => <button type="button" className={form.types.includes(key) ? 'active' : ''} key={key} onClick={() => set('types', form.types.includes(key) ? form.types.filter((x) => x !== key) : [...form.types, key])}>{label}</button>)}</div></Field><div className="two-col"><Field label="Звідки кидати"><input value={form.from_position} onChange={(e) => set('from_position', e.target.value)} /></Field><Field label="Куди летить"><input value={form.target} onChange={(e) => set('target', e.target.value)} /></Field></div><Field label="Короткий опис"><textarea value={form.summary} onChange={(e) => set('summary', e.target.value)} /></Field></>}{kind === 'links' && <Field label="Опис"><textarea value={form.note} onChange={(e) => set('note', e.target.value)} /></Field>}<button className="primary submit" disabled={!valid} onClick={() => onSave(form)}><Check size={15} /> Зберегти</button></div></div></div>;
}
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }

createRoot(document.getElementById('root')).render(<App />);
