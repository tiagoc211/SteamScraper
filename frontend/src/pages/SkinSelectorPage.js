// frontend/src/pages/SkinDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import pLimit from 'p-limit';
import { getSkinDetails, getSkinPage, inspectSkin } from '../api/api';
import TiltSkinCard from '../components/skin/TiltSkinCard/TiltSkinCard';
import FilterSidebar from '../components/skin/FilterSidebar/FilterSidebar';
import PaginationControls from '../components/ui/PaginationControls/PaginationControls';
import './SkinDetailPage.css';
// Componentes e Dados
import { rifles, smgs, heavy, pistols, knives } from '../data/Weapons';
import RadialMenu from '../components/ui/RadialMenu/RadialMenu';
import * as rifleSkins from '../data/Rifles';
import * as smgSkins from '../data/Smgs';
import * as heavySkins from '../data/Heavy';
import * as pistolSkins from '../data/Pistols';
import * as knifeSkins from '../data/Knives';

// --- Constantes e Funções Auxiliares ---
const allSkinsData = { ...rifleSkins, ...smgSkins, ...heavySkins, ...pistolSkins, ...knifeSkins };
const weaponTypes = { rifles, smgs, heavy, pistols, knives };
const wearConditions = ["Factory New", "Minimal Wear", "Field-Tested", "Well-Worn", "Battle-Scarred"];
const formatForUrl = (name) => name ? name.replace(/ /g, '_').replace(/[™|]/g, '') : '';

const getWeaponImageUrl = (weaponName) => {
    if (!weaponName) return null;
    const formattedName = formatForUrl(weaponName);
    return `https://www.csgodatabase.com/images/weapons/webp/${formattedName}.webp`;
};

const getSkinImageUrl = (weapon, skin) => {
    if (!weapon || !skin) return getWeaponImageUrl(weapon);
    const formattedWeapon = formatForUrl(weapon);
    const formattedSkin = formatForUrl(skin);
    const isKnife = knives.includes(weapon);
    if (isKnife) return `https://www.csgodatabase.com/images/knives/webp/${formattedWeapon}_${formattedSkin}.webp`;
    return `https://www.csgodatabase.com/images/skins/webp/${formattedWeapon}_${formattedSkin}.webp`;
};

const glowColorMap = {
    rifles: '#ff4d4d',
    pistols: '#4da6ff',
    smgs: '#ffff4d',
    heavy: '#ff944d',
    knives: '#bf4dff',
};

const weaponToDataKeyMap = {
    "AK-47": "ak47Skins", "AUG": "augSkins", "AWP": "awpSkins", "FAMAS": "famasSkins", "G3SG1": "g3sg1Skins", "Galil AR": "galilARSkins", "M4A1-S": "m4a1sSkins", "M4A4": "m4a4Skins", "SCAR-20": "scar20Skins", "SG 553": "sg553Skins", "SSG 08": "ssg08Skins", "MAC-10": "mac10Skins", "MP5-SD": "mp5sdSkins", "MP7": "mp7Skins", "MP9": "mp9Skins", "PP-Bizon": "ppBizonSkins", "P90": "p90Skins", "UMP-45": "ump45Skins", "MAG-7": "mag7Skins", "Nova": "novaSkins", "Sawed-Off": "sawedOffSkins", "XM1014": "xm1014Skins", "M249": "m249Skins", "Negev": "negevSkins", "USP-S": "uspSkins", "Glock-18": "glock18Skins", "Desert Eagle": "desertEagleSkins", "P250": "p250Skins", "Five-SeveN": "fiveSevenSkins", "CZ75-Auto": "cz75Skins", "P2000": "p2000Skins", "Tec-9": "tec9Skins", "R8 Revolver": "r8Skins", "Dual Berettas": "dualBerettasSkins", "Bayonet": "bayonetSkins", "Bowie Knife": "bowieKnifeSkins", "Butterfly Knife": "butterflyKnifeSkins", "Classic Knife": "classicKnifeSkins", "Falchion Knife": "falchionKnifeSkins", "Flip Knife": "flipKnifeSkins", "Gut Knife": "gutKnifeSkins", "Huntsman Knife": "huntsmanKnifeSkins", "Karambit": "karambitSkins", "Kukri Knife": "kukriKnifeSkins", "M9 Bayonet": "m9BayonetSkins", "Navaja Knife": "navajaKnifeSkins", "Nomad Knife": "nomadKnifeSkins", "Paracord Knife": "paracordKnifeSkins", "Shadow Daggers": "shadowDaggersSkins", "Skeleton Knife": "skeletonKnifeSkins", "Stiletto Knife": "stilettoKnifeSkins", "Survival Knife": "survivalKnifeSkins", "Talon Knife": "talonKnifeSkins", "Ursus Knife": "ursusKnifeSkins",
};

const getSkinsForWeapon = (weaponName) => {
    const dataKey = weaponToDataKeyMap[weaponName];
    if (!dataKey || !allSkinsData[dataKey]) return [];
    const weaponData = Object.values(allSkinsData[dataKey]).flat();
    const skinNames = weaponData.map(skin => skin.name.split(' | ')[1]);
    return [...new Set(skinNames)].filter(Boolean).sort();
};

const categoryItems = [
    { key: 'pistols', label: 'Pistol' }, { key: 'heavy', label: 'Heavy' },
    { key: 'smgs', label: 'SMG' }, { key: 'rifles', label: 'Rifle' }, { key: 'knives', label: 'Knives' },
];

const SkinSelectorPage = () => {
    const navigate = useNavigate();
    const [searchMode, setSearchMode] = useState('simple');

    // Estados da Pesquisa Simples
    const [simpleStep, setSimpleStep] = useState('category');
    const [simpleType, setSimpleType] = useState(null);
    const [simpleWeapon, setSimpleWeapon] = useState('');
    const [simpleSkin, setSimpleSkin] = useState('');
    const [simpleWear, setSimpleWear] = useState('');
    const [isSkinDropdownOpen, setSkinDropdownOpen] = useState(false);
    const [isWearDropdownOpen, setWearDropdownOpen] = useState(false);

    // Estados da Pesquisa Avançada
    const [advCategory, setAdvCategory] = useState('');
    const [advWeapon, setAdvWeapon] = useState('');
    const [advSkin, setAdvSkin] = useState('');
    const [advWear, setAdvWear] = useState('');
    const [minFloat, setMinFloat] = useState('');
    const [maxFloat, setMaxFloat] = useState('');
    const [pattern, setPattern] = useState('');

    const [glowImageUrl, setGlowImageUrl] = useState(null);
    const [glowColor, setGlowColor] = useState('transparent');

    const updateGlow = (imageUrl, color) => { setGlowImageUrl(imageUrl); setGlowColor(color || 'transparent'); };
    const resetAllFields = () => {
        setSimpleStep('category'); setSimpleType(null); setSimpleWeapon(''); setSimpleSkin(''); setSimpleWear('');
        setAdvCategory(''); setAdvWeapon(''); setAdvSkin(''); setAdvWear(''); setMinFloat(''); setMaxFloat(''); setPattern('');
        updateGlow(null);
    };
    useEffect(() => { resetAllFields(); }, [searchMode]);

    const handleSimpleCategorySelect = (categoryKey) => { setSimpleType(categoryKey); setSimpleStep('weapon'); updateGlow(getWeaponImageUrl(weaponTypes[categoryKey]?.[0]), glowColorMap[categoryKey]); };
    const handleSimpleWeaponSelect = (weaponName) => { setSimpleWeapon(weaponName); setSimpleStep('skin'); updateGlow(getWeaponImageUrl(weaponName), glowColorMap[simpleType]); };
    const handleSimpleSkinSelect = (skinName) => { setSimpleSkin(skinName); setSkinDropdownOpen(false); updateGlow(getSkinImageUrl(simpleWeapon, skinName), glowColorMap[simpleType]); };
    const handleSimpleWearSelect = (wear) => { setSimpleWear(wear); setWearDropdownOpen(false); };
    const handleSimpleSkinHover = (skinName) => { updateGlow(getSkinImageUrl(simpleWeapon, skinName), glowColorMap[simpleType]); };
    const handleSimpleSearch = () => { if (!simpleWeapon || !simpleSkin || !simpleWear) { alert("Por favor, selecione todos os campos."); return; } const marketHashName = `${simpleWeapon} | ${simpleSkin} (${simpleWear})`; navigate(`/skin/${encodeURIComponent(marketHashName)}`); };
    const handleSimpleBack = () => { if (simpleStep === 'skin') { setSimpleStep('weapon'); setSimpleSkin(''); setSimpleWear(''); updateGlow(getWeaponImageUrl(simpleWeapon), glowColorMap[simpleType]); } else if (simpleStep === 'weapon') { setSimpleStep('category'); setSimpleType(null); updateGlow(null); } };

    const handleAdvancedSearch = () => {
        if (!advWeapon || !advSkin || !advWear) { alert("Por favor, selecione Categoria, Arma, Skin e Condição."); return; }
        const marketHashName = `${advWeapon} | ${advSkin} (${advWear})`;
        const queryParams = new URLSearchParams();
        if (minFloat) queryParams.set('minFloat', minFloat);
        if (maxFloat) queryParams.set('maxFloat', maxFloat);
        if (pattern) queryParams.set('pattern', pattern);
        navigate(`/skin/${encodeURIComponent(marketHashName)}?${queryParams.toString()}`);
    };

    const simpleWeaponItems = useMemo(() => simpleType ? weaponTypes[simpleType].map(w => ({ key: w, label: w.replace(/ (Knife|Revolver)/g, '') })) : [], [simpleType]);
    const availableSkins = useMemo(() => simpleWeapon ? getSkinsForWeapon(simpleWeapon) : [], [simpleWeapon]);
    const advAvailableSkins = useMemo(() => advWeapon ? getSkinsForWeapon(advWeapon) : [], [advWeapon]);

    return (
        <div className="skinselectorpage">
            <div className="page-content-wrapper">
                <section className="interactive-selection-area">
                    <div className="search-mode-toggles">
                        <button className={`mode-toggle-button ${searchMode === 'simple' ? 'active' : ''}`} onClick={() => setSearchMode('simple')}>Pesquisa Simples</button>
                        <button className={`mode-toggle-button ${searchMode === 'advanced' ? 'active' : ''}`} onClick={() => setSearchMode('advanced')}>Pesquisa Avançada</button>
                    </div>

                    <AnimatePresence mode="wait">
                        {searchMode === 'simple' ? (
                            <motion.div key="simple" className="selection-content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                <div className="content-half left-half">
                                    {glowImageUrl && <img src={glowImageUrl} alt="Preview" className="weapon-glow-image" style={{ '--glow-color': glowColor }} />}
                                </div>
                                <div className="content-half right-half">
                                    <AnimatePresence mode="wait">
                                        {simpleStep === 'category' && (
                                            <motion.div key="cat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <RadialMenu title="Categoria" items={categoryItems} onSelect={handleSimpleCategorySelect} onHover={(key) => updateGlow(getWeaponImageUrl(weaponTypes[key]?.[0]), glowColorMap[key])} />
                                            </motion.div>
                                        )}
                                        {simpleStep === 'weapon' && (
                                            <motion.div key="wep" className="radial-menu-with-controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                <RadialMenu title={simpleType} items={simpleWeaponItems} onSelect={handleSimpleWeaponSelect} onHover={(key) => updateGlow(getWeaponImageUrl(key), glowColorMap[simpleType])} />
                                                <div className="simple-controls-area">
                                                    <button onClick={handleSimpleBack} className="control-button back-button"><FaArrowLeft /> Voltar</button>
                                                </div>
                                            </motion.div>
                                        )}
                                        {simpleStep === 'skin' && (
                                            <motion.div key="skin" className="simple-selection-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                                <div className="simple-selection-header"><h2>{simpleWeapon}</h2><p>Selecione a Skin e Condição</p></div>
                                                <div className="custom-dropdown-wrapper">
                                                    <button className={`custom-dropdown-toggle ${isSkinDropdownOpen ? 'open' : ''}`} onClick={() => setSkinDropdownOpen(!isSkinDropdownOpen)}>{simpleSkin || 'Selecione a Skin'}</button>
                                                    {isSkinDropdownOpen && (
                                                        <ul className="custom-dropdown-list" onMouseLeave={() => handleSimpleSkinHover(simpleSkin)}>
                                                            {availableSkins.map(s => <li key={s} onMouseEnter={() => handleSimpleSkinHover(s)} onClick={() => handleSimpleSkinSelect(s)}>{s}</li>)}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="custom-dropdown-wrapper">
                                                    <button className={`custom-dropdown-toggle ${isWearDropdownOpen ? 'open' : ''}`} onClick={() => setWearDropdownOpen(!isWearDropdownOpen)} disabled={!simpleSkin}>{simpleWear || 'Selecione a Condição'}</button>
                                                    {isWearDropdownOpen && (
                                                        <ul className="custom-dropdown-list">
                                                            {wearConditions.map(w => <li key={w} onClick={() => handleSimpleWearSelect(w)}>{w}</li>)}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div className="simple-form-actions">
                                                    <button onClick={handleSimpleBack} className="control-button back-button"><FaArrowLeft /> Voltar</button>
                                                    <button className="control-button search-button" onClick={handleSimpleSearch} disabled={!simpleWear}><FaSearch /> Pesquisar</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="advanced" className="selection-content advanced-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                                {/* CORREÇÃO: O código do formulário avançado foi restaurado aqui */}
                                <div className="advanced-search-form">
                                    <h3>Pesquisa Avançada</h3>
                                    <div className="form-column">
                                        <select className="custom-dropdown" value={advCategory} onChange={(e) => { setAdvCategory(e.target.value); setAdvWeapon(''); setAdvSkin(''); setAdvWear(''); }}>
                                            <option value="">Selecione a Categoria</option>
                                            {Object.keys(weaponTypes).map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
                                        </select>
                                        <select className="custom-dropdown" value={advWeapon} onChange={(e) => setAdvWeapon(e.target.value)} disabled={!advCategory}>
                                            <option value="">Selecione a Arma</option>
                                            {advCategory && weaponTypes[advCategory].map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                        <input type="number" placeholder="Min Float" value={minFloat} onChange={e => setMinFloat(e.target.value)} />
                                        <input type="number" placeholder="Max Float" value={maxFloat} onChange={e => setMaxFloat(e.target.value)} />
                                    </div>
                                    <div className="form-column">
                                        <select className="custom-dropdown" value={advSkin} onChange={(e) => setAdvSkin(e.target.value)} disabled={!advWeapon}>
                                            <option value="">Selecione a Skin</option>
                                            {advAvailableSkins.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                        <select className="custom-dropdown" value={advWear} onChange={(e) => setAdvWear(e.target.value)} disabled={!advSkin}>
                                            <option value="">Selecione a Condição</option>
                                            {wearConditions.map(w => <option key={w} value={w}>{w}</option>)}
                                        </select>
                                        <input type="number" placeholder="Pattern ID" value={pattern} onChange={e => setPattern(e.target.value)} />
                                        <button className="control-button search-button" onClick={handleAdvancedSearch} disabled={!advWeapon || !advSkin || !advWear}>
                                            <FaSearch /> Pesquisar
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </div>
        </div>
    );
};

export default SkinSelectorPage;